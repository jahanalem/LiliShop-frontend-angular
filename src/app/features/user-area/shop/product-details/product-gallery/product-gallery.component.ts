import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  linkedSignal,
  signal,
  viewChildren
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IProductPhoto } from 'src/app/shared/models/productPhoto';

/**
 * A single, de-duplicated image the gallery can display. This is derived state built from
 * the raw `photos` input plus the product-level fallback; the original `IProductPhoto`
 * collection is never mutated.
 */
export interface GalleryImage {
  /** Stable identity for `@for` tracking — the Cloudinary public id when present, else the URL. */
  readonly key: string;
  /**
   * The originating `IProductPhoto.id`, or `null` for the product-level `pictureUrl` fallback.
   * Reserved as the hook a future variant-aware parent can target (e.g. "Blue" -> that photo).
   */
  readonly photoId: number | null;
  /** Cloudinary public id — preferred source for `NgOptimizedImage` + the Cloudinary loader. */
  readonly publicId: string | null;
  /** Full image URL — the fallback path for the rare photo that carries no public id. */
  readonly url: string;
  /** Position within the normalized collection (0-based). */
  readonly index: number;
}

/**
 * Reusable, dependency-free product image gallery: a large active stage, a thumbnail strip,
 * previous/next controls, keyboard + swipe navigation, and graceful handling of missing,
 * empty, duplicate or broken images. Built on Angular signals with OnPush change detection.
 */
@Component({
  selector: 'app-product-gallery',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, MatIconModule],
  templateUrl: './product-gallery.component.html',
  styleUrls: ['./product-gallery.component.scss']
})
export class ProductGalleryComponent {
  /** Raw photos from the backend. Null/undefined/empty are all handled. */
  readonly photos = input<IProductPhoto[] | null | undefined>();
  /** The product's default image URL — used as a fallback and never dropped. */
  readonly fallbackUrl = input<string>('');
  /** Public id matching `fallbackUrl`, so the fallback is optimized like every other image. */
  readonly fallbackPublicId = input<string>('');
  /** Product name, used to build meaningful alt text and ARIA labels. */
  readonly productName = input<string>('');
  /**
   * Optional programmatic selection. When set to a photo id present in the gallery, that image
   * becomes active. Left `null` for now — this is the seam that lets a future variant-aware
   * parent drive the gallery without any rewrite.
   */
  readonly activePhotoId = input<number | null>(null);

  /** Threshold (px) a horizontal touch drag must pass to count as a swipe. */
  private static readonly SWIPE_THRESHOLD = 40;

  /**
   * The single, normalized gallery collection. Ordering: a valid `isMain` photo first, then the
   * remaining unique photos in their original order, then the product-level fallback if it is not
   * already represented. Duplicates (by public id, else URL) are removed. Never mutates the input.
   */
  readonly images = computed<GalleryImage[]>(() => {
    const photos = this.photos() ?? [];
    const seen = new Set<string>();
    const collected: Array<Pick<GalleryImage, 'photoId' | 'publicId' | 'url'>> = [];

    const keyOf = (publicId: string | null, url: string): string =>
      (publicId || url).trim().toLowerCase();

    const add = (photoId: number | null, rawPublicId?: string | null, rawUrl?: string | null): void => {
      const publicId = rawPublicId?.trim() || null;
      const url = rawUrl?.trim() || '';
      if (!publicId && !url) {
        return; // nothing usable to show
      }
      const key = keyOf(publicId, url);
      if (seen.has(key)) {
        return; // duplicate image
      }
      seen.add(key);
      collected.push({ photoId, publicId, url });
    };

    const valid = photos.filter(p => !!p && (!!p.publicId?.trim() || !!p.url?.trim()));

    // 1) A valid main photo leads.
    const main = valid.find(p => p.isMain === true);
    if (main) {
      add(main.id, main.publicId, main.url);
    }

    // 2) The remaining unique photos, in their original order.
    for (const photo of valid) {
      if (photo === main) {
        continue;
      }
      add(photo.id, photo.publicId, photo.url);
    }

    // 3) The product-level fallback — appended only if not already present (also the sole
    //    image when `productPhotos` is empty).
    add(null, this.fallbackPublicId(), this.fallbackUrl());

    return collected.map((image, index) => ({
      ...image,
      index,
      key: keyOf(image.publicId, image.url)
    }));
  });

  readonly count = computed(() => this.images().length);
  readonly hasMultiple = computed(() => this.count() > 1);

  /**
   * The active image index. It resets to the first image whenever the collection changes
   * (e.g. the parent loads a different product) and honors `activePhotoId` when supplied;
   * user interaction overrides it via `set`/`update` until the next reset.
   */
  readonly activeIndex = linkedSignal<{ images: GalleryImage[]; requested: number | null }, number>({
    source: () => ({ images: this.images(), requested: this.activePhotoId() }),
    computation: ({ images, requested }) => {
      if (requested != null) {
        const match = images.findIndex(image => image.photoId === requested);
        if (match >= 0) {
          return match;
        }
      }
      return 0;
    }
  });

  readonly activeImage = computed<GalleryImage | null>(() => this.images()[this.activeIndex()] ?? null);

  /**
   * The active image plus its immediate neighbours — the only full-size images kept in the DOM.
   * This keeps the stage light (never the whole gallery) while pre-warming the previous/next
   * image so navigation crossfades instantly.
   */
  readonly stageWindow = computed<GalleryImage[]>(() => {
    const images = this.images();
    const active = this.activeIndex();
    const window: GalleryImage[] = [];
    for (let i = active - 1; i <= active + 1; i++) {
      if (i >= 0 && i < images.length) {
        window.push(images[i]);
      }
    }
    return window;
  });

  readonly canGoPrev = computed(() => this.activeIndex() > 0);
  readonly canGoNext = computed(() => this.activeIndex() < this.count() - 1);

  /** Keys of images whose URL failed to load, so a placeholder is shown instead. */
  private readonly brokenKeys = signal<ReadonlySet<string>>(new Set());

  /** Thumbnail buttons, used to keep the active one scrolled into view. */
  private readonly thumbButtons = viewChildren<ElementRef<HTMLElement>>('thumb');

  constructor() {
    // Keep the active thumbnail visible as the selection moves (no-op in non-browser/test envs).
    effect(() => {
      const index = this.activeIndex();
      const element = this.thumbButtons()[index]?.nativeElement;
      if (element && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    });
  }

  isBroken(key: string): boolean {
    return this.brokenKeys().has(key);
  }

  /** Alt text scoped to the product; disambiguates position when several images exist. */
  altFor(image: GalleryImage): string {
    const name = this.productName()?.trim() || 'Product';
    return this.count() > 1 ? `${name} — image ${image.index + 1} of ${this.count()}` : name;
  }

  /** Select a specific image by its collection index (clamped to valid bounds). */
  select(index: number): void {
    const last = this.count() - 1;
    if (last < 0) {
      return;
    }
    this.activeIndex.set(Math.min(Math.max(index, 0), last));
  }

  prev(): void {
    if (this.canGoPrev()) {
      this.activeIndex.update(index => index - 1);
    }
  }

  next(): void {
    if (this.canGoNext()) {
      this.activeIndex.update(index => index + 1);
    }
  }

  onImageError(key: string): void {
    if (this.brokenKeys().has(key)) {
      return;
    }
    const next = new Set(this.brokenKeys());
    next.add(key);
    this.brokenKeys.set(next);
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowLeft':
        this.prev();
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.next();
        event.preventDefault();
        break;
      case 'Home':
        this.select(0);
        event.preventDefault();
        break;
      case 'End':
        this.select(this.count() - 1);
        event.preventDefault();
        break;
    }
  }

  private touchStartX = 0;
  private touchStartY = 0;

  onTouchStart(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    // Only treat clearly horizontal drags as swipes, so vertical page scrolling is untouched.
    if (Math.abs(deltaX) > ProductGalleryComponent.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }
}
