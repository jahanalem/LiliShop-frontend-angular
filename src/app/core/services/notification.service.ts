// notification.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly defaultDuration = 5000; // 5 seconds
  private readonly horizontalPosition: MatSnackBarHorizontalPosition = 'center';
  private readonly verticalPosition: MatSnackBarVerticalPosition = 'top';
  private readonly actionLabel = 'Dismiss';

  constructor(private snackBar: MatSnackBar) { }

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
