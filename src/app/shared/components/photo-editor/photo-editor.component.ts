import { ShopService } from 'src/app/core/services/shop.service';
import { AccountService } from './../../../core/services/account.service';
import { environment } from './../../../../environments/environment';
import { FileUploader } from 'ng2-file-upload';
import { IProduct } from './../../models/product';
import { Component, Input, OnInit } from '@angular/core';
import { IUser } from '../../models/user';
import { take } from 'rxjs';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IProductPhoto } from '../../models/productPhoto';

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    multi: true,
    useExisting: PhotoEditorComponent
  }]
})
export class PhotoEditorComponent implements OnInit, ControlValueAccessor {
  @Input() product: IProduct | undefined;
  uploader: FileUploader | undefined;
  hasBaseDropZoneOver: boolean = false;
  baseUrl = environment.apiUrl;
  user: IUser | undefined;

  disabled: boolean = false;
  uploadedPhotos: IProductPhoto[] = [];

  onChange = (_photo: IProductPhoto[]) => { };
  onTouched = () => { };

  constructor(private accountService: AccountService, private shopService: ShopService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) {
          this.user = user;
        }
      }
    })
  }
  writeValue(value: any): void {
    if (value !== null) {
      this.uploadedPhotos.push(value);
    }
  }
  registerOnChange(onChange: any) {
    this.onChange = onChange;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
  ngOnInit(): void {
    this.initializeUploader();
  }

  fileOverBase(e: any) {
    this.hasBaseDropZoneOver = e;
  }

  initializeUploader() {
    this.uploader = new FileUploader({
      url: this.baseUrl + 'products/add-photo/' + this.product?.id,
      authToken: 'Bearer ' + this.user?.token,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024
    });

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;  // If we don't do this, we'd need to adjust our course configuration and we don't really want to do that
    };

    this.uploader.onSuccessItem = (_item, response, _status, _headers) => {
      if (response) {
        const photo = JSON.parse(response);
        this.product?.productPhotos.push(photo);

        this.uploadedPhotos.push(photo);
        this.onChange(this.uploadedPhotos);
      }
    }
  }

  setMainPhoto(productPhoto: IProductPhoto) {
    this.shopService.setMainPhoto(productPhoto.id).subscribe({
      next: () => {
        if (this.product) {
          this.product.pictureUrl = productPhoto.url;
          this.product.productPhotos.forEach(p => {
            if (p.isMain) {
              p.isMain = false;
            }
            if (p.id === productPhoto.id) {
              p.isMain = true;
            }
          });
        }
      }
    });
  }

  deletePhoto(photoId: number) {
    this.shopService.deletePhoto(photoId).subscribe({
      next: _ => {
        if (this.product) {
          this.product.productPhotos = this.product.productPhotos.filter(p => p.id !== photoId);
        }
      }
    })
  };
}
