import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from './translation.service';

/**
 * `{{ TranslationKeys.Nav.Shop | translate }}`
 *
 * Marked impure on purpose: a pure pipe memoizes on the key input, so it would keep
 * returning the raw key even after the dictionary signal loads. Reading the signal inside
 * transform() registers it with the template's reactive graph (works with zoneless change
 * detection), and the impure flag makes Angular re-invoke the pipe on that refresh.
 * Cost per check is a dictionary lookup — negligible.
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: Record<string, unknown> | unknown[]): string {
    return this.translationService.translate(key, params);
  }
}
