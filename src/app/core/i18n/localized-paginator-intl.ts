import { Injectable, effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslationService } from './translation.service';
import { TranslationKeys } from './translation-keys';

/**
 * Material paginator labels ("Items per page", "Next page", …) fed from the same
 * backend translation catalog as everything else. The dictionary signal is read inside
 * an effect, so labels update as soon as the (cached or fetched) dictionary arrives and
 * `changes` re-renders any paginator already on screen.
 */
@Injectable()
export class LocalizedMatPaginatorIntl extends MatPaginatorIntl {
  private translationService = inject(TranslationService);

  constructor() {
    super();
    effect(() => {
      this.itemsPerPageLabel = this.translationService.translate(TranslationKeys.Paging.ItemsPerPage);
      this.nextPageLabel = this.translationService.translate(TranslationKeys.Paging.NextPage);
      this.previousPageLabel = this.translationService.translate(TranslationKeys.Paging.PrevPage);
      this.firstPageLabel = this.translationService.translate(TranslationKeys.Paging.FirstPage);
      this.lastPageLabel = this.translationService.translate(TranslationKeys.Paging.LastPage);
      this.changes.next();
    });
  }

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return this.translationService.translate(TranslationKeys.Paging.ZeroOf, [length]);
    }
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return this.translationService.translate(TranslationKeys.Paging.RangeOf, [start, end, length]);
  };
}
