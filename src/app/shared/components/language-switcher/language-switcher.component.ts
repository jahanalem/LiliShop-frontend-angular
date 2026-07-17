import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { LanguageService } from 'src/app/core/services/language.service';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe]
})
export class LanguageSwitcherComponent {
  protected readonly TranslationKeys = TranslationKeys;
  protected languageService = inject(LanguageService);

  /**
   * The native name of the active language, shown beside the globe icon so users can see
   * the current selection at a glance. Falls back to the uppercased code until the language
   * list has loaded from the API.
   */
  protected readonly currentLanguageName = computed(() => {
    const current = this.languageService.languages()
      .find(language => language.code === this.languageService.currentCode());
    return current?.nativeName ?? this.languageService.currentCode().toUpperCase();
  });
}
