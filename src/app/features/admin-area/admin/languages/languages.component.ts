import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { LocalizationAdminService } from 'src/app/core/services/localization-admin.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import { ILanguageAdmin, ILanguageUpsert } from 'src/app/shared/models/localization';

const EMPTY_FORM: ILanguageUpsert = {
  code: '',
  nativeName: '',
  englishName: '',
  direction: 'ltr',
  isActive: true,
  isDefault: false,
  displayOrder: 0,
};

/**
 * Language manager: activating a language here makes it live immediately — the backend
 * refreshes its request-culture pipeline and the switcher picks it up on the next load.
 * Pair a new language with translations (Translations page) and per-product content.
 */
@Component({
  selector: 'app-languages',
  templateUrl: './languages.component.html',
  styleUrls: ['./languages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
  ],
})
export class LanguagesComponent implements OnInit {
  private adminService = inject(LocalizationAdminService);
  private notificationService = inject(NotificationService);

  readonly displayedColumns = ['code', 'nativeName', 'englishName', 'direction', 'displayOrder', 'isDefault', 'isActive', 'actions'] as const;

  readonly languages = signal<ILanguageAdmin[]>([]);
  readonly saving = signal(false);

  form: ILanguageUpsert = { ...EMPTY_FORM };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.adminService.getAllLanguages().subscribe(languages => this.languages.set(languages ?? []));
  }

  edit(language: ILanguageAdmin): void {
    this.form = { ...language };
  }

  resetForm(): void {
    this.form = { ...EMPTY_FORM };
  }

  toggleActive(language: ILanguageAdmin): void {
    this.save({ ...language, isActive: !language.isActive });
  }

  submit(): void {
    if (!this.form.code.trim() || !this.form.nativeName.trim() || !this.form.englishName.trim()) {
      return;
    }
    this.save(this.form);
  }

  private save(language: ILanguageUpsert): void {
    this.saving.set(true);
    this.adminService.upsertLanguage(language).subscribe({
      next: saved => {
        this.notificationService.showSuccess(`Language '${saved.code}' saved and live.`);
        this.saving.set(false);
        this.resetForm();
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
