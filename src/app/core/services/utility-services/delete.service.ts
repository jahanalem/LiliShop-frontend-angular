import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';
import { NotificationService } from '../notification.service';

@Injectable({
  providedIn: 'root'
})
export class DeleteService {
  private notificationService = inject(NotificationService);
  private dialog              = inject(MatDialog);

  constructor() { }

  deleteObject(
    id         : number,
    deleteFn   : (id: number) => Observable<any>,
    fetchMethod: () => void,
  ) {

    const dialogData: IDialogData = {
      title                  : 'Delete Confirmation',
      content                : 'Do you really want to delete this item?',
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
            this.notificationService.showSuccess('Item deleted successfully.');
            fetchMethod();
          },
          error: (error: any) => {
            console.error(error);
            this.notificationService.showError('Failed to delete the item.');
          }
        })
      },
      error: (error) => {
        console.error(error);
        this.notificationService.showError('An error occurred while closing the dialog.');
      }
    })
  }
}
