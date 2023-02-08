import { AccountService } from './../../../core/services/account.service';
import { environment } from './../../../../environments/environment';
import { FileUploader } from 'ng2-file-upload';
import { IProduct } from './../../models/product';
import { Component, Input, OnInit } from '@angular/core';
import { IUser } from '../../models/user';
import { take } from 'rxjs';

@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.scss']
})
export class PhotoEditorComponent implements OnInit {
  @Input() product: IProduct | undefined;
  uploader: FileUploader | undefined;
  hasBaseDropZoneOver: boolean = false;
  baseUrl = environment.apiUrl;
  user: IUser | undefined;

  constructor(private accountService: AccountService) {
    this.accountService.currentUser$.pipe(take(1)).subscribe({
      next: user => {
        if (user) {
          this.user = user;
        }
      }
    })
  }
  ngOnInit(): void {
    console.log("p=", this.product);
    this.initializeUploader();
  }



  fileOverBase(e: any) {
    this.hasBaseDropZoneOver = e;
  }

  initializeUploader() {
    this.uploader = new FileUploader({
      url: this.baseUrl + 'products/add-photo',
      authToken: 'Bearer ' + this.user?.token,
      isHTML5: true,
      allowedFileType: ['image'],
      removeAfterUpload: true,
      autoUpload: false,
      maxFileSize: 10 * 1024 * 1024
    });

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false; // If we don't do this, we'd need to adjust our course configuration and we don't really want to do that
    };

    this.uploader.onSuccessItem = (_item, response, _status, _headers) => {
      if (response) {
        const photo = JSON.parse(response);
        this.product?.productPhotos.push(photo);
        console.log("p photos= ", this.product?.productPhotos);
      }
    }
  }
}
