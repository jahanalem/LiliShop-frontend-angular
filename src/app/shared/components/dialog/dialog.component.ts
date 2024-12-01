import { ChangeDetectionStrategy, Component, Inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IDialogData } from '../../models/dialog-data.interface';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DialogComponent implements OnInit {
  data = signal<IDialogData>(this.dialogData);

  constructor(@Inject(MAT_DIALOG_DATA) private dialogData: IDialogData) { }

  ngOnInit(): void {
  }
}
