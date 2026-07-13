import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { LocalizationAdminService } from 'src/app/core/services/localization-admin.service';
import { NotificationService } from 'src/app/core/services/notification.service';
import {
  ILanguageAdmin,
  ILanguageCompletion,
  ILocalizationEntry,
} from 'src/app/shared/models/localization';

/**
 * Translation management: per-language completion, searchable system-translation table with
 * inline editing, and a missing-keys view. Every save is live for shoppers after their next
 * dictionary load (version bump busts all caches) — no redeploy.
 */
@Component({
  selector: 'app-translations',
  templateUrl: './translations.component.html',
  styleUrls: ['./translations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
  ],
})
export class TranslationsComponent implements OnInit {
  private adminService = inject(LocalizationAdminService);
  private notificationService = inject(NotificationService);

  readonly displayedColumns = ['key', 'culture', 'value', 'updatedBy', 'actions'] as const;

  readonly completion = signal<ILanguageCompletion[]>([]);
  readonly languages = signal<ILanguageAdmin[]>([]);
  readonly entries = signal<ILocalizationEntry[]>([]);
  readonly totalEntries = signal(0);
  readonly loading = signal(false);

  readonly missingCulture = signal<string | null>(null);
  readonly missingKeys = signal<string[]>([]);

  /** Row id currently being edited inline, with its draft value. */
  readonly editingId = signal<number | null>(null);
  editDraft = '';

  // New-entry form model
  newKey = '';
  newCulture = '';
  newValue = '';

  search = '';
  cultureFilter: string | null = null;
  pageIndex = 1;
  pageSize = 20;

  ngOnInit(): void {
    this.loadCompletion();
    this.loadLanguages();
    this.loadEntries();
  }

  loadCompletion(): void {
    this.adminService.getCompletion().subscribe(completion => this.completion.set(completion ?? []));
  }

  loadLanguages(): void {
    this.adminService.getAllLanguages().subscribe(languages => this.languages.set(languages ?? []));
  }

  loadEntries(): void {
    this.loading.set(true);
    this.adminService.getEntries(this.search || null, this.cultureFilter, this.pageIndex, this.pageSize)
      .subscribe({
        next: page => {
          this.entries.set(page?.data ?? []);
          this.totalEntries.set(page?.count ?? 0);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  applyFilter(): void {
    this.pageIndex = 1;
    this.loadEntries();
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadEntries();
  }

  startEdit(entry: ILocalizationEntry): void {
    this.editingId.set(entry.id);
    this.editDraft = entry.value;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(entry: ILocalizationEntry): void {
    const value = this.editDraft.trim();
    if (!value || value === entry.value) {
      this.cancelEdit();
      return;
    }

    this.adminService.upsertEntry({ key: entry.key, culture: entry.culture, value }).subscribe(() => {
      this.notificationService.showSuccess(`Saved ${entry.key} (${entry.culture}).`);
      this.cancelEdit();
      this.afterMutation();
    });
  }

  createEntry(): void {
    const key = this.newKey.trim();
    const culture = this.newCulture.trim();
    const value = this.newValue.trim();
    if (!key || !culture || !value) {
      return;
    }

    this.adminService.upsertEntry({ key, culture, value }).subscribe(() => {
      this.notificationService.showSuccess(`Saved ${key} (${culture}).`);
      this.newKey = '';
      this.newValue = '';
      this.afterMutation();
    });
  }

  deleteEntry(entry: ILocalizationEntry): void {
    this.adminService.deleteEntry(entry.id).subscribe(() => {
      this.notificationService.showSuccess(`Deleted ${entry.key} (${entry.culture}).`);
      this.afterMutation();
    });
  }

  showMissing(culture: string): void {
    this.missingCulture.set(culture);
    this.adminService.getMissingKeys(culture).subscribe(keys => this.missingKeys.set(keys ?? []));
  }

  prefillMissing(key: string): void {
    this.newKey = key;
    this.newCulture = this.missingCulture() ?? '';
    this.newValue = '';
  }

  private afterMutation(): void {
    this.loadEntries();
    this.loadCompletion();
    if (this.missingCulture()) {
      this.showMissing(this.missingCulture()!);
    }
  }
}
