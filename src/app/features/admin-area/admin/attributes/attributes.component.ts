import { FormatValuePipe } from 'src/app/shared/pipes/format-value.pipe';
import { CheckPolicyDirective } from 'src/app/shared/directives/check-policy.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatSortModule } from '@angular/material/sort';

import { RouterModule } from '@angular/router';
import { Component, AfterViewInit, ChangeDetectionStrategy, signal, viewChild, inject, OnDestroy } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { IProductAttribute, ProductAttributeParams } from 'src/app/shared/models/productAttribute';
import { PolicyNames } from 'src/app/shared/models/policy';
import { TranslatePipe } from 'src/app/core/i18n/translate.pipe';
import { TranslationKeys } from 'src/app/core/i18n/translation-keys';

@Component({
    selector: 'app-attributes',
    templateUrl: './attributes.component.html',
    styleUrls: ['./attributes.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
  imports: [
    TranslatePipe, RouterModule, FormatValuePipe, CheckPolicyDirective, MatPaginatorModule, MatButtonModule, MatTableModule, MatIconModule, MatSortModule]
})
export class AttributesComponent implements AfterViewInit, OnDestroy {
  protected readonly TranslationKeys = TranslationKeys;

  paginator = viewChild.required<MatPaginator>(MatPaginator);

  policyNames = PolicyNames;

  attributes      = signal<IProductAttribute[]>([]);
  totalCount      = signal<number>(0);
  attributeParams = signal<ProductAttributeParams>({} as ProductAttributeParams);

  columnsToDisplay: string[] = ['id', 'name', 'code', 'valueCount', 'isActive', 'Action'];

  private unsubscribe$ = new Subject<void>();

  private attributeService = inject(ProductAttributeService);
  private router           = inject(Router);
  private deleteService    = inject(DeleteService);

  constructor() {
    this.attributeParams.set(this.attributeService.getAttributeParams());
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  ngAfterViewInit() {
    this.loadData();

    this.paginator().page.pipe(takeUntil(this.unsubscribe$))
      .subscribe((pageEvent: PageEvent) => {
        this.attributeParams.update(params => (
          {
            ...params,
            pageNumber: pageEvent.pageIndex + 1,
            pageSize: pageEvent.pageSize
          }));
        this.loadData();
      });
  }

  loadData() {
    this.attributeService.getAttributes(this.attributeParams()).subscribe((response) => {
      this.attributes.set(response.data);
      this.totalCount.set(response.count);
    });
  }

  valueCount(attribute: IProductAttribute): number {
    return attribute.values?.length ?? 0;
  }

  deleteAttribute(id: number) {
    this.deleteService.deleteObject(id, () => this.attributeService.deleteAttribute(id), () => this.loadData());
  }

  editAttribute(id: number) {
    this.router.navigateByUrl(`/admin/attributes/edit/${id}`);
  }

  createAttribute() {
    this.router.navigateByUrl(`/admin/attributes/edit/${-1}`);
  }

  /** Maps a raw column id onto its translation key for the header row. */
  protected columnLabel(column: string): string {
    const labels: Record<string, string> = {
      id: TranslationKeys.Admin.Common.Id,
      name: TranslationKeys.Admin.Common.Name,
      code: TranslationKeys.Admin.Attributes.CodeLabel,
      valueCount: TranslationKeys.Admin.Attributes.Values,
      isActive: TranslationKeys.Admin.Common.Active,
      Action: TranslationKeys.Admin.Common.Actions
    };
    return labels[column] ?? column;
  }
}
