import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrandService } from 'src/app/core/services/brand.service';
import { BrandParams } from 'src/app/shared/models/BrandParams';
import { IBrand } from 'src/app/shared/models/brand';

@Component({
  selector: 'app-brands',
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.scss']
})
export class BrandsComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  columnsToDisplay: string[] = ['id', 'name', 'isActive', 'Action'];
  brands: IBrand[] = [];
  totalCount: number = 0;
  brandParams: BrandParams = this.brandService.getBrandParams();

  private unsubscribe$ = new Subject<void>();

  constructor(private brandService: BrandService, private router: Router) {
  }

  ngOnDestroy() {
    this.unsubscribe$.complete();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.loadData();

    this.paginator.page.pipe(takeUntil(this.unsubscribe$))
      .subscribe((pageEvent: PageEvent) => {
        this.brandParams.pageNumber = pageEvent.pageIndex + 1;
        this.brandParams.pageSize = pageEvent.pageSize;
        this.loadData();
      });
  }

  loadData() {
    this.brandService.getBrands(this.brandParams).subscribe((response) => {
      this.brands = response.data;
      this.totalCount = response.count;
    });
  }

  editBrand(id: number) {
    this.router.navigateByUrl(`/admin/brands/edit/${id}`);
  }
}
