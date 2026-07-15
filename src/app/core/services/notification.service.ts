// notification.service.ts
import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { TranslationService } from '../i18n/translation.service';
import { TranslationKeys } from '../i18n/translation-keys';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);
  private translationService = inject(TranslationService);

  private readonly defaultDuration = 5000; // 5 seconds
  private readonly horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  private readonly verticalPosition: MatSnackBarVerticalPosition = 'top';

  /** Resolved per call so the label follows the current language. */
  private get actionLabel(): string {
    return this.translationService.translate(TranslationKeys.Common.Close);
  }

  private getConfig(panelClass: string | string[], duration?: number): MatSnackBarConfig {
    const classes = Array.isArray(panelClass) ? panelClass : [panelClass];
    if (duration && duration > this.defaultDuration) {
      classes.push('long-duration');
    }

    return {
      duration: duration ?? this.defaultDuration,
      panelClass: [...classes, 'global-snackbar'],
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      politeness: 'polite'
    };
  }

  showSuccess(message: string, duration?: number): void {
    this.snackBar.open(
      message,
      this.actionLabel,
      this.getConfig('success-snackbar', duration)
    );
  }

  showError(message: string, duration?: number): void {
    this.snackBar.open(
      message,
      this.actionLabel,
      this.getConfig('error-snackbar', duration)
    );
  }
}
