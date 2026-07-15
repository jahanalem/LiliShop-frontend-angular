import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { NotificationService } from '../notification.service';
import { TranslationService } from '../../i18n/translation.service';
import { TranslationKeys } from '../../i18n/translation-keys';

@Injectable({
  providedIn: 'root'
})
export class DeleteService {
  private notificationService = inject(NotificationService);
  private translationService  = inject(TranslationService);
  private dialog              = inject(MatDialog);

  deleteObject(
    id         : number,
    deleteFn   : (id: number) => Observable<any>,
    fetchMethod: () => void,
  ) {

    const dialogData: IDialogData = {
      title                  : this.translationService.translate(TranslationKeys.Admin.Common.DeleteTitle),
      content                : this.translationService.translate(TranslationKeys.Admin.Common.DeleteContent),
      showConfirmationButtons: true
    };

    const dialogRef = this.dialog.open<DialogComponent, IDialogData>(DialogComponent, { data: dialogData });

    dialogRef.afterClosed().subscribe({
      next: (result?: boolean | undefined) => {
        if (!result) {
          return;
        }

        deleteFn.call(null, id).subscribe({
          next: () => {
            this.notificationService.showSuccess(this.translationService.translate(TranslationKeys.Admin.Common.Deleted));
            fetchMethod();
          },
          error: (error: any) => {
            console.error(error);
            this.notificationService.showError(this.translationService.translate(TranslationKeys.Admin.Common.DeleteFailed));
          }
        })
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError(this.translationService.translate(TranslationKeys.ClientError.Unexpected));
      }
    })
  }
}
