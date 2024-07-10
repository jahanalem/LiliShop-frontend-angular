import { AccountService } from './../../../core/services/account.service';
import { environment } from './../../../../environments/environment';
import { FileUploader } from 'ng2-file-upload';
import { IProduct } from './../../models/product';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { IUser } from '../../models/user';
import { take } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IProductPhoto } from '../../models/productPhoto';
import { ProductService } from 'src/app/core/services/product.service';

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: PhotoEditorComponent
  }],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PhotoEditorComponent implements OnInit, ControlValueAccessor {
  product             = input.required<IProduct | undefined>();

  uploader            = signal<FileUploader | undefined>(undefined);
  hasBaseDropZoneOver = signal<boolean>(false);
  user                = signal<IUser | undefined>(undefined);
  disabled            = signal<boolean>(false);
  uploadedPhotos      = signal<IProductPhoto[]>([]);

  baseUrl             = environment.apiUrl;

  onChange  = (_photo: IProductPhoto[]) => { };
  onTouched = () => { };

  private cdr = inject(ChangeDetectorRef);

  constructor(private accountService: AccountService, private productService: ProductService) {
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
  }

  ngOnInit(): void {
    this.initializeUploader();
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
          const photo = JSON.parse(response);
          this.product()?.productPhotos.push(photo);

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
          this.cdr.markForCheck();
        }
      }
    })
  };
}
