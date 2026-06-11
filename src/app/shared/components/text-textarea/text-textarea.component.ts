
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

import { RouterModule } from '@angular/router';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { Component, OnInit, ElementRef, Self, viewChild, input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-text-textarea',
    templateUrl: './text-textarea.component.html',
    styleUrls: ['./text-textarea.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatListModule,
    MatSidenavModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatPaginatorModule,
    MatCardModule,
    MatTableModule,
    ReactiveFormsModule
]

})
export class TextTextareaComponent implements OnInit, ControlValueAccessor {
  textarea = viewChild.required<ElementRef>('textarea');

  label = input<string>('');
  rows  = input<number>(4);

  protected onChanged!: Function;
  protected onTouched!: Function;

  constructor(@Self() public controlDir: NgControl) {
    this.controlDir.valueAccessor = this;
  }

  ngOnInit(): void {
    const control = this.controlDir.control;
    const validators = control?.validator ? [control.validator] : [];
    const asyncValidators = control?.asyncValidator ? [control.asyncValidator] : [];

    control?.setValidators(validators);
    control?.setAsyncValidators(asyncValidators);
    control?.updateValueAndValidity();
  }
  get formControl(): FormControl {
    return this.controlDir.control as FormControl;
  }

  writeValue(obj: any): void {
    this.textarea().nativeElement.value = obj || '';
  }
  registerOnChange(fn: any): void {
    this.onChanged = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  isThereAnyRequiredErrorType(): boolean | null {
    return this.controlDir.control?.errors ? this.controlDir.control?.errors['required'] ? true : false : null;
  }
}
