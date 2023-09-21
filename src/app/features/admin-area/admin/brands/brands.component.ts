import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BrandService } from 'src/app/core/services/brand.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { BrandParams } from 'src/app/shared/models/BrandParams';
import { IBrand } from 'src/app/shared/models/brand';
import { DeleteResponse } from 'src/app/shared/models/delete-response.model';

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

  constructor(private brandService: BrandService,
    private router: Router,
    private dialog: MatDialog,
    private changeDetectorRef: ChangeDetectorRef
    ) {
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
      this.changeDetectorRef.detectChanges();
    });
  }

  deleteBrand(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.brandService.deleteBrand(id).subscribe((response: DeleteResponse) => {
          if (response.success) {
            // Handle successful deletion
            this.brands = this.brands.filter(c => c.id !== id);
            --this.totalCount;
            this.changeDetectorRef.detectChanges();
            console.log(response.message);
          } else {
            // Handle failure
            console.error(response.message);
          }
        });
      }
    });
  }

  editBrand(id: number) {
    this.router.navigateByUrl(`/admin/brands/edit/${id}`);
  }

  createBrand() {
    this.router.navigateByUrl(`/admin/brands/edit/${-1}`);
  }
}
