import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, viewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductTypeService } from 'src/app/core/services/product-type.service';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { IProductType } from 'src/app/shared/models/productType';
import { ProductTypeParams } from 'src/app/shared/models/productTypeParams';

@Component({
  selector: 'app-product-types',
  templateUrl: './product-types.component.html',
  styleUrls: ['./product-types.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductTypesComponent implements OnInit, AfterViewInit {
  paginator = viewChild.required<MatPaginator>(MatPaginator);
  sort = viewChild.required<MatSort>(MatSort);

  types = signal<IProductType[]>([]);
  totalCount = signal<number>(0);
  typeParams = signal<ProductTypeParams>(this.typeService.getTypeParams());

  columnsToDisplay: string[] = ['id', 'name', 'isActive', 'Action'];

  private unsubscribe$ = new Subject<void>();

  constructor(private typeService: ProductTypeService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private deleteService: DeleteService) {
  }

  ngOnDestroy() {
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.loadData();

    this.paginator().page.pipe(takeUntil(this.unsubscribe$))
      .subscribe((pageEvent: PageEvent) => {
        this.typeParams.update(params => (
          {
            ...params,
            pageNumber: pageEvent.pageIndex + 1,
            pageSize: pageEvent.pageSize
          }));

        this.loadData();
      });

    this.sort().sortChange.pipe(takeUntil(this.unsubscribe$))
      .subscribe((sort: Sort) => {
        this.typeParams.update(params => ({
          ...params,
          sort: sort.active,
          sortDirection: sort.direction
        }));
        this.loadData();
      });
  }

  loadData() {
    this.typeService.gettypes(this.typeParams()).subscribe((response) => {
      this.types.set(response.data);
      this.totalCount.set(response.count);
      this.changeDetectorRef.markForCheck();
    });
  }

  deleteProductType(id: number) {
    this.deleteService.deleteObject(
      id,
      () => this.typeService.deleteType(id),
      () => this.loadData()
    );
  }

  editProductType(id: number) {
    this.router.navigateByUrl(`/admin/product-types/edit/${id}`);
  }

  createProductType() {
    this.router.navigateByUrl(`/admin/product-types/edit/${-1}`);
  }
}
