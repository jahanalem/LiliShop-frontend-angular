import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { forkJoin, of, switchMap } from 'rxjs';
import { IProduct } from 'src/app/shared/models/product';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BasketService } from 'src/app/core/services/basket.service';
import { ProductService } from 'src/app/core/services/product.service';
import { ProductVariantService } from 'src/app/core/services/product-variant.service';
import { INotificationSubscription } from 'src/app/shared/models/notificationSubscription';
import { AccountService } from 'src/app/core/services/account.service';
import { IProductVariant } from 'src/app/shared/models/productVariant';

import { NgOptimizedImage } from '@angular/common';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

/** One defining axis of the product (e.g. Size) with its selectable values across all variants. */
interface SelectorAxis {
  attributeId: number;
  name: string;
  displayOrder: number;
  swatchType: string;
  values: SelectorValue[];
}

interface SelectorValue {
  valueId: number;
  name: string;
  colorHex: string | null;
  sortOrder: number;
}

@Component({
    selector: 'app-product-details',
    templateUrl: './product-details.component.html',
    styleUrls: ['./product-details.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [TranslatePipe, CommonModule, RouterModule, NgOptimizedImage, MatButtonModule, MatIconModule]
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  product                   = signal<IProduct>({} as IProduct);
  variants                  = signal<IProductVariant[]>([]);
  quantity                  = signal<number>(1);
  isSubscribed              = signal<boolean>(false);
  currentUserId             = signal<number>(0);
  currentUserEmailConfirmed = signal<boolean>(false);
  imagePublicId             = signal<string>('');

  /** attributeId → chosen valueId for the defining axes. */
  readonly selection = signal<ReadonlyMap<number, number>>(new Map());

  readonly isDiscountActive = computed(() => {
    const variant = this.selectedVariant();
    if (variant) {
      return variant.previousPrice != null;
    }
    return !!this.product().previousPrice;
  });

  discountTimeLeft = signal<string>('');

  /** The defining axes across all active variants, in attribute display order. */
  readonly axes = computed<SelectorAxis[]>(() => {
    const byAttribute = new Map<number, SelectorAxis>();
    for (const variant of this.activeVariants()) {
      for (const link of variant.attributeValues.filter(l => l.isDefining)) {
        const axis = byAttribute.get(link.productAttributeId) ?? {
          attributeId: link.productAttributeId,
          name: link.productAttribute?.name ?? '',
          displayOrder: link.productAttribute?.displayOrder ?? 0,
          swatchType: link.productAttribute?.swatchType ?? 'None',
          values: []
        };
        if (!axis.values.some(v => v.valueId === link.productAttributeValueId)) {
          axis.values.push({
            valueId: link.productAttributeValueId,
            name: link.productAttributeValue?.name ?? '',
            colorHex: link.productAttributeValue?.colorHex ?? null,
            sortOrder: link.productAttributeValue?.sortOrder ?? 0
          });
        }
        byAttribute.set(link.productAttributeId, axis);
      }
    }
    const axes = [...byAttribute.values()];
    axes.forEach(a => a.values.sort((x, y) => x.sortOrder - y.sortOrder));
    return axes.sort((a, b) => a.displayOrder - b.displayOrder);
  });

  /** The variant matching the full selection (or the single axis-less default variant). */
  readonly selectedVariant = computed<IProductVariant | null>(() => {
    const active = this.activeVariants();
    const axes = this.axes();
    if (axes.length === 0) {
      return active.length === 1 ? active[0] : null;
    }

    const selection = this.selection();
    if (selection.size !== axes.length) {
      return null;
    }

    return active.find(v => {
      const defining = v.attributeValues.filter(l => l.isDefining);
      return defining.length === selection.size
        && defining.every(l => selection.get(l.productAttributeId) === l.productAttributeValueId);
    }) ?? null;
  });

  readonly availableQuantity = computed<number | null>(() => {
    const variant = this.selectedVariant();
    if (!variant) {
      return null;
    }
    return Math.max(0, (variant.inventory?.quantityOnHand ?? 0) - (variant.inventory?.quantityReserved ?? 0));
  });

  readonly isOutOfStock = computed(() => this.availableQuantity() === 0);

  /** Units of the selected variant the customer already holds in their basket. */
  readonly basketQuantityForSelectedVariant = computed<number>(() => {
    const variant = this.selectedVariant();
    const productId = this.product()?.id;
    if (!variant || !productId) {
      return 0;
    }
    return this.basketItems()
      .filter(i => i.id === productId && i.productVariantId === variant.id)
      .reduce((sum, i) => sum + i.quantity, 0);
  });

  /**
   * How many MORE units may still be added: available stock minus what is already in the basket.
   * The quantity stepper and the add button are bound to this, so the customer can never queue up
   * more than exists (the server enforces the same cap as the final authority).
   */
  readonly remainingQuantity = computed<number | null>(() => {
    const stock = this.availableQuantity();
    if (stock === null) {
      return null;
    }
    return Math.max(0, stock - this.basketQuantityForSelectedVariant());
  });

  readonly displayPrice = computed(() => this.selectedVariant()?.price ?? this.product().price);
  readonly displayPreviousPrice = computed(() => {
    const variant = this.selectedVariant();
    return variant ? variant.previousPrice ?? null : this.product().previousPrice ?? null;
  });

  /** Descriptive values of the selected variant, grouped per attribute ("Color: Yellow, Black"). */
  readonly descriptiveInfo = computed<{ name: string; values: string }[]>(() => {
    const variant = this.selectedVariant();
    if (!variant) {
      return [];
    }
    const groups = new Map<number, { name: string; order: number; values: string[] }>();
    const links = variant.attributeValues
      .filter(l => !l.isDefining)
      .sort((a, b) => (a.productAttributeValue?.sortOrder ?? 0) - (b.productAttributeValue?.sortOrder ?? 0));
    for (const link of links) {
      const group = groups.get(link.productAttributeId) ?? {
        name: link.productAttribute?.name ?? '',
        order: link.productAttribute?.displayOrder ?? 0,
        values: []
      };
      group.values.push(link.productAttributeValue?.name ?? '');
      groups.set(link.productAttributeId, group);
    }
    return [...groups.values()]
      .sort((a, b) => a.order - b.order)
      .map(g => ({ name: g.name, values: g.values.join(', ') }));
  });

  readonly canAddToBasket = computed(() => {
    const variant = this.selectedVariant();
    if (this.axes().length === 0 && this.activeVariants().length <= 1) {
      // product-level fallback when no variants exist: block only when a variant exists and nothing
      // is left to add (stock exhausted or already fully in the basket).
      return variant ? (this.remainingQuantity() ?? 1) > 0 : true;
    }
    return variant !== null && (this.remainingQuantity() ?? 0) > 0;
  });

  private activatedRoute      = inject(ActivatedRoute);
  private basketService       = inject(BasketService);
  private productService      = inject(ProductService);

  /** The live basket lines, so the quantity cap can account for units already added. */
  private readonly basketItems = toSignal(
    this.basketService.basket$.pipe(map(basket => basket?.items ?? [])),
    { initialValue: [] });
  private variantService      = inject(ProductVariantService);
  private subscriptionService = inject(SubscriptionService);
  private accountService      = inject(AccountService);
  private cdRef               = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.accountService.currentUser$.subscribe({
      next: (user) => {
        if (user && user.id) {
          this.currentUserId.set(user.id);
          this.currentUserEmailConfirmed.set(user.emailConfirmed);
        }
      },
      error:(err)=>{console.log("err = ", err);}
    });
    this.loadProduct();
  }

  ngOnDestroy(): void {

  }

  loadProduct() {
    this.activatedRoute.paramMap.pipe(
      switchMap((params: ParamMap) => {
        const id = params.get('id');
        return id
          ? forkJoin({
              product: this.productService.getProduct(+id),
              variants: this.variantService.getVariants(+id)
            })
          : of();
      })
    ).subscribe({
      next: ({ product, variants }) => {
        this.product.set(product);
        this.variants.set(variants);
        this.preselectSingleOptions();
        this.quantity.set(1);
        if (product.picturePublicId) {
          this.imagePublicId.set(product.picturePublicId);
        }

        this.checkSubscriptionStatus();
        this.cdRef.detectChanges();
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  private activeVariants(): IProductVariant[] {
    return this.variants().filter(v => v.isActive);
  }

  /** Axes with exactly one value need no click — preselect them. */
  private preselectSingleOptions(): void {
    const preselected = new Map<number, number>();
    for (const axis of this.axes()) {
      if (axis.values.length === 1) {
        preselected.set(axis.attributeId, axis.values[0].valueId);
      }
    }
    this.selection.set(preselected);
  }

  selectValue(attributeId: number, valueId: number): void {
    const next = new Map(this.selection());
    if (next.get(attributeId) === valueId) {
      next.delete(attributeId); // clicking the selected chip deselects it
    } else {
      next.set(attributeId, valueId);
    }
    this.selection.set(next);
    this.quantity.set(1);
  }

  isValueSelected(attributeId: number, valueId: number): boolean {
    return this.selection().get(attributeId) === valueId;
  }

  /** A value is unavailable when no in-stock active variant carries it alongside the OTHER selected axes. */
  isValueUnavailable(attributeId: number, valueId: number): boolean {
    return !this.activeVariants().some(variant => {
      const defining = variant.attributeValues.filter(l => l.isDefining);
      if (!defining.some(l => l.productAttributeId === attributeId && l.productAttributeValueId === valueId)) {
        return false;
      }
      for (const [otherAttributeId, otherValueId] of this.selection()) {
        if (otherAttributeId === attributeId) {
          continue;
        }
        if (!defining.some(l => l.productAttributeId === otherAttributeId && l.productAttributeValueId === otherValueId)) {
          return false;
        }
      }
      const available = (variant.inventory?.quantityOnHand ?? 0) - (variant.inventory?.quantityReserved ?? 0);
      return available > 0;
    });
  }

  incrementQuantity() {
    const cap = this.remainingQuantity();
    this.quantity.update((value: number) => (cap !== null && value >= cap) ? value : value + 1);
  }

  decrementQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(value => value - 1);
    }
  }

  addItemToBasket() {
    if (!this.canAddToBasket()) {
      return;
    }

    const variant = this.selectedVariant();
    if (variant) {
      // Never send more than is still available (server enforces the same cap authoritatively).
      const remaining = this.remainingQuantity();
      const quantity = remaining === null ? this.quantity() : Math.min(this.quantity(), remaining);
      if (quantity <= 0) {
        return;
      }
      this.basketService.addItemToBasket(this.product(), quantity, {
        id: variant.id,
        sku: variant.sku,
        price: variant.price,
        description: this.buildVariantDescription(variant)
      });
    } else {
      this.basketService.addItemToBasket(this.product(), this.quantity());
    }
  }

  /** "Size: M · Color: Yellow, Black" — display text for the basket line (server re-renders for the order). */
  private buildVariantDescription(variant: IProductVariant): string | null {
    const groups = new Map<number, { name: string; order: number; values: string[] }>();
    const sortedLinks = [...variant.attributeValues]
      .sort((a, b) => (a.productAttributeValue?.sortOrder ?? 0) - (b.productAttributeValue?.sortOrder ?? 0));
    for (const link of sortedLinks) {
      const group = groups.get(link.productAttributeId) ?? {
        name: link.productAttribute?.name ?? '',
        order: link.productAttribute?.displayOrder ?? 0,
        values: []
      };
      group.values.push(link.productAttributeValue?.name ?? '');
      groups.set(link.productAttributeId, group);
    }
    if (groups.size === 0) {
      return null;
    }
    return [...groups.values()]
      .sort((a, b) => a.order - b.order)
      .map(g => `${g.name}: ${g.values.join(', ')}`)
      .join(' · ');
  }

  checkSubscriptionStatus() {
    if (this.currentUserId() > 0) {
      this.subscriptionService.checkSubscription(this.product().id, this.currentUserId()).subscribe({
        next: (data: boolean) => {
          this.isSubscribed.set(data);
        },
        error: (error: any) => {
            this.isSubscribed.set(false);
            console.error(error);
          }
        }
      );
    }
    else {
      this.isSubscribed.set(false);
    }
  }

  toggleSubscription() {
    const subscription: INotificationSubscription = {
      productId: this.product().id,
      userId: this.currentUserId(),
      alertType: 'PriceDrop',
      isActive: true
    };

    if (this.isSubscribed()) {
      this.subscriptionService.removeSubscription(subscription).subscribe({
        next: () => {
          this.isSubscribed.set(false);
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    } else {
      this.subscriptionService.addSubscription(subscription).subscribe({
        next: () => {
          this.isSubscribed.set(true);
        },
        error: (error: any) => {
          console.error(error);
        }
      });
    }
  }

  subscribeToPriceDrop() {
    const subscription: INotificationSubscription = {
      productId: this.product().id,
      userId: this.currentUserId(),
      alertType: 'PriceDrop',
      isActive: true
    }
    this.subscriptionService.addSubscription(subscription).subscribe({
      next: () => { alert('You have successfully subscribed to price drop notifications!'); },
      error: (error: any) => {
        console.error(error);
        alert('There was an error subscribing to notifications.');
      }
    });
  }
}
