import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
    selector: 'app-confirmation-dialog',
    templateUrl: './confirmation-dialog.component.html',
    styleUrls: ['./confirmation-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
      TranslatePipe,
      MatDialogModule,
      MatIconModule,
      MatButtonModule
    ]
})
export class ConfirmationDialogComponent {
  protected readonly TranslationKeys = TranslationKeys;

  dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
}
