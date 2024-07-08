import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ChangeDetectionStrategy, signal, viewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrandService } from 'src/app/core/services/brand.service';
import { DeleteService } from 'src/app/core/services/utility-services/delete.service';
import { BrandParams } from 'src/app/shared/models/BrandParams';
import { IBrand } from 'src/app/shared/models/brand';

@Component({
  selector: 'app-brands',
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrandsComponent implements OnInit, AfterViewInit {
  paginator   = viewChild.required<MatPaginator>(MatPaginator);
  brands      = signal<IBrand[]>([]);
  totalCount  = signal<number>(0);
  brandParams = signal<BrandParams>(this.brandService.getBrandParams());
  
  columnsToDisplay: string[] = ['id', 'name', 'isActive', 'Action'];

  private unsubscribe$ = new Subject<void>();

  constructor(private brandService: BrandService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private deleteService: DeleteService
  ) {
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
        this.brandParams.update(params => (
          {
            ...params,
            pageNumber: pageEvent.pageIndex + 1,
            pageSize: pageEvent.pageSize
          }));
        this.loadData();
      });
  }

  loadData() {
    this.brandService.getBrands(this.brandParams()).subscribe((response) => {
      this.brands.set(response.data);
      this.totalCount.set(response.count);
      this.changeDetectorRef.markForCheck();
    });
  }

  deleteBrand(id: number) {
    this.deleteService.deleteObject(id, () => this.brandService.deleteBrand(id), () => this.loadData());
  }

  editBrand(id: number) {
    this.router.navigateByUrl(`/admin/brands/edit/${id}`);
  }

  createBrand() {
    this.router.navigateByUrl(`/admin/brands/edit/${-1}`);
  }
}
