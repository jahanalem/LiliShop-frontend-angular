import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { FormField, type Field } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-text-input',
  templateUrl: './text-input.component.html',
  styleUrls: ['./text-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
})
export class TextInputComponent {
  /** The signal-forms field this input is bound to. */
  field = input.required<Field<string>>();

  label             = input<string>('');
  type              = input<string>('text');
  autocomplete      = input<string>('');
  showPasswordRules = input<boolean>(false);

  // --- Live field state, read straight from the Field signal ---
  protected readonly state   = computed(() => this.field()());
  protected readonly value   = computed(() => this.state().value());
  protected readonly errors  = computed(() => this.state().errors());
  protected readonly valid   = computed(() => this.state().valid());
  protected readonly touched = computed(() => this.state().touched());
  protected readonly pending = computed(() => this.state().pending());

  // --- Real-time password rule checks (purely derived from the value) ---
  protected readonly hasMinLength   = computed(() => this.value().length >= 6);
  protected readonly hasUppercase   = computed(() => /[A-Z]/.test(this.value()));
  protected readonly hasLowercase   = computed(() => /[a-z]/.test(this.value()));
  protected readonly hasNumber      = computed(() => /[0-9]/.test(this.value()));
  protected readonly hasSpecialChar = computed(() =>
    /[#?!@$%^&*-]/.test(this.value()),
  );

  /** True only when there's a `kind` error of the given type after the field was touched. */
  protected hasError(kind: string): boolean {
    return this.touched() && this.errors().some((e) => e.kind === kind);
  }
}
