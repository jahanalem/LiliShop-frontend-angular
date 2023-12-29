import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { IDialogData } from 'src/app/shared/models/dialog-data.interface';


@Injectable({
  providedIn: 'root'
})
export class DeleteService {

  constructor(private dialog: MatDialog) { }

  deleteObject(
    id: number,
    deleteFn: (id: number) => Observable<any>,
    fetchMethod: () => void,
  ) {

    const dialogData: IDialogData = {
      title: 'Delete Dialog',
      content: 'Would you like to delete this item?',
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
            console.log("object deleted!");
            fetchMethod();
          },
          error: (error) => { console.error(error) }
        })
      },
      error: (error) => { console.error(error) }
    })
  }
}
