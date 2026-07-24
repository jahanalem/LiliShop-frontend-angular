
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountService } from './../../../core/services/account.service';
import { environment } from './../../../../environments/environment';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { IProduct } from './../../models/product';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { IUser } from '../../models/user';
import { take } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IPhotoAttributeValueOption, IProductPhoto } from '../../models/productPhoto';
import { ProductService } from 'src/app/core/services/product.service';
import { FileUploadModule } from 'ng2-file-upload';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
    selector: 'app-photo-editor',
    templateUrl: './photo-editor.component.html',
    styleUrls: ['./photo-editor.component.scss'],
    providers: [{
            provide: NG_VALUE_ACCESSOR,
            multi: true,
            useExisting: PhotoEditorComponent
        }],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    TranslatePipe,
    CommonModule, RouterModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatListModule,
    MatSidenavModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatCardModule,
    MatTableModule,
    FileUploadModule
  ]

})
export class PhotoEditorComponent implements OnInit, ControlValueAccessor {
  protected readonly TranslationKeys = TranslationKeys;

  private accountService = inject(AccountService);
  private productService = inject(ProductService);

  product             = input.required<IProduct | undefined>();

  uploader            = signal<FileUploader | undefined>(undefined);
  hasBaseDropZoneOver = signal<boolean>(false);
  user                = signal<IUser | undefined>(undefined);
  disabled            = signal<boolean>(false);
  uploadedPhotos      = signal<IProductPhoto[]>([]);

  baseUrl             = environment.apiUrl;

  // ---------------------------------------------------- attribute-value tags (Plan B) ----

  /** Values assignable to this product's photos (those used by its variants), localized. */
  readonly assignableValues = signal<IPhotoAttributeValueOption[]>([]);
  /** photoId → assigned value ids. The single source of truth for the chips. */
  readonly tagsByPhotoId    = signal<ReadonlyMap<number, number[]>>(new Map());
  /** The photo whose "assign values" picker is currently open (null = none). */
  readonly openPickerPhotoId = signal<number | null>(null);
  readonly tagSearch         = signal<string>('');
  readonly tagError          = signal<string>('');
  /** Bumped whenever the photo list is mutated imperatively, so the view model recomputes. */
  private readonly photosVersion = signal<number>(0);

  private readonly valueById = computed(() => {
    const map = new Map<number, IPhotoAttributeValueOption>();
    for (const option of this.assignableValues()) {
      map.set(option.valueId, option);
    }
    return map;
  });

  /** Photos plus their resolved chips — precomputed so the template calls no functions. */
  readonly photoRows = computed(() => {
    this.photosVersion();
    const byId = this.valueById();
    const tags = this.tagsByPhotoId();

    return (this.product()?.productPhotos ?? []).map(photo => ({
      photo,
      tags: (tags.get(photo.id) ?? [])
        .map(id => byId.get(id))
        .filter((option): option is IPhotoAttributeValueOption => !!option)
    }));
  });

  /** Values still assignable to the open photo, narrowed by the search box. */
  readonly pickerOptions = computed(() => {
    const photoId = this.openPickerPhotoId();
    if (photoId === null) {
      return [];
    }
    const assigned = new Set(this.tagsByPhotoId().get(photoId) ?? []);
    const needle = this.tagSearch().trim().toLowerCase();

    return this.assignableValues().filter(option =>
      !assigned.has(option.valueId)
      && (needle === ''
        || option.valueName.toLowerCase().includes(needle)
        || option.attributeName.toLowerCase().includes(needle)));
  });

  onChange  = (_photo: IProductPhoto[]) => { };
  onTouched = () => { };

  private cdr = inject(ChangeDetectorRef);
  private loadedTagsForProductId: number | null = null;

  constructor() {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) {
          this.user.set(user);
        }
      }
    });

    effect(() => {
      if (this.uploader()) {
        this.cdr.markForCheck();
      }
    });

    // Tagging needs database ids, so it only becomes available once the product has been saved
    // (staged workflow: create product → add variants → upload photos → tag them).
    effect(() => {
      const product = this.product();
      if (!product?.id || this.loadedTagsForProductId === product.id) {
        return;
      }
      this.loadedTagsForProductId = product.id;

      this.seedTagsFromProduct(product.productPhotos ?? []);

      this.productService.getAssignablePhotoAttributeValues(product.id).subscribe({
        next: options => {
          this.assignableValues.set(options ?? []);
          this.cdr.markForCheck();
        },
        error: () => {
          this.assignableValues.set([]);
          this.cdr.markForCheck();
        }
      });
    });
  }

  private seedTagsFromProduct(photos: IProductPhoto[]): void {
    const seeded = new Map<number, number[]>();
    for (const photo of photos) {
      seeded.set(photo.id, [...(photo.attributeValueIds ?? [])]);
    }
    this.tagsByPhotoId.set(seeded);
  }

  openTagPicker(photoId: number): void {
    this.tagSearch.set('');
    this.tagError.set('');
    this.openPickerPhotoId.update(current => (current === photoId ? null : photoId));
  }

  closeTagPicker(): void {
    this.openPickerPhotoId.set(null);
  }

  onTagSearch(value: string): void {
    this.tagSearch.set(value ?? '');
  }

  addTag(photoId: number, valueId: number): void {
    const current = this.tagsByPhotoId().get(photoId) ?? [];
    if (current.includes(valueId)) {
      return; // the unique (photo, value) pair is also enforced by the database
    }
    this.saveTags(photoId, [...current, valueId]);
  }

  removeTag(photoId: number, valueId: number): void {
    const current = this.tagsByPhotoId().get(photoId) ?? [];
    this.saveTags(photoId, current.filter(id => id !== valueId));
  }

  /** Replacement-style save: the given set becomes the photo's complete tag set. */
  private saveTags(photoId: number, valueIds: number[]): void {
    const product = this.product();
    if (!product?.id) {
      return;
    }

    this.productService.setPhotoAttributeValues(product.id, photoId, valueIds).subscribe({
      next: updated => {
        const applied = updated?.attributeValueIds ?? valueIds;
        const next = new Map(this.tagsByPhotoId());
        next.set(photoId, [...applied]);
        this.tagsByPhotoId.set(next);

        // Keep the product graph in sync so a later reload/save observes the same tags.
        const photo = product.productPhotos?.find(p => p.id === photoId);
        if (photo) {
          photo.attributeValueIds = [...applied];
        }

        this.tagError.set('');
        this.cdr.markForCheck();
      },
      error: () => {
        this.tagError.set('The attribute values could not be saved. Please try again.');
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.initializeUploader();
  }

  get fileQueue(): FileItem[] {
    return this.uploader()?.queue || [];
  }

  get lengthOfFileItem(){
    this.cdr.markForCheck();
    return this.uploader()?.queue?.length;
  }

  writeValue(value: any): void {
    if (value !== null) {
      this.uploadedPhotos.update((photos) => ([...photos, value]));
    }
  }
  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }


  fileOverBase(e: any) {
    this.hasBaseDropZoneOver.set(e);
  }

  initializeUploader() {
    const user = this.user();
    const product = this.product();

    if (user && product) {
      const uploader = new FileUploader({
        url              : `${this.baseUrl}products/add-photo/${product.id}`,
        authToken        : 'Bearer ' + user.token,
        isHTML5          : true,
        allowedFileType  : ['image'],
        removeAfterUpload: true,
        autoUpload       : false,
        maxFileSize      : 10 * 1024 * 1024
      });

      uploader.onAfterAddingFile = (file) => {
        file.withCredentials = false;  // If we don't do this, we'd need to adjust our course configuration and we don't really want to do that
      };
      uploader.onProgressItem = (_fileItem, _progress) => {
        this.cdr.markForCheck();
      };
      uploader.onSuccessItem = (_item, response, _status, _headers) => {
        if (response) {
          const photo = JSON.parse(response) as IProductPhoto;
          this.product()?.productPhotos.push(photo);

          // A freshly uploaded photo starts untagged; register it so its chip row renders.
          const next = new Map(this.tagsByPhotoId());
          next.set(photo.id, [...(photo.attributeValueIds ?? [])]);
          this.tagsByPhotoId.set(next);
          this.photosVersion.update(v => v + 1);

          this.uploadedPhotos.update((photos) => [...photos, photo]);
          this.onChange(this.uploadedPhotos());

          this.cdr.markForCheck();
        }
      }

      this.uploader.set(uploader);
    }
  }

  setMainPhoto(productPhoto: IProductPhoto) {
    this.productService.setMainPhoto(productPhoto.id).subscribe({
      next: () => {
        const product = this.product();
        if (product) {
          product.pictureUrl = productPhoto.url;
          product.productPhotos.forEach(p => {
            if (p.isMain) {
              p.isMain = false;
            }
            if (p.id === productPhoto.id) {
              p.isMain = true;
            }
          });
          this.photosVersion.update(v => v + 1);
          this.cdr.markForCheck();
        }
      }
    }
    );
  }

  deletePhoto(photoId: number) {
    this.productService.deletePhoto(photoId).subscribe({
      next: _ => {
        const product = this.product();
        if (product) {
          product.productPhotos = product.productPhotos.filter(p => p.id !== photoId);

          // The server cascades the photo's tags away; drop the local copy too.
          const next = new Map(this.tagsByPhotoId());
          next.delete(photoId);
          this.tagsByPhotoId.set(next);
          if (this.openPickerPhotoId() === photoId) {
            this.openPickerPhotoId.set(null);
          }
          this.photosVersion.update(v => v + 1);

          this.cdr.markForCheck();
        }
      }
    })
  };
}
