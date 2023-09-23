import { AfterViewInit, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ProductTypeService } from 'src/app/core/services/product-type.service';
import { ConfirmationDialogComponent } from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { DeleteResponse } from 'src/app/shared/models/delete-response.model';
import { IProductType } from 'src/app/shared/models/productType';
import { ProductTypeParams } from 'src/app/shared/models/productTypeParams';

@Component({
  selector: 'app-product-types',
  templateUrl: './product-types.component.html',
  styleUrls: ['./product-types.component.scss']
})
export class ProductTypesComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  columnsToDisplay: string[] = ['id', 'name', 'isActive', 'Action'];
  types: IProductType[] = [];
  totalCount: number = 0;
  typeParams: ProductTypeParams = this.typeService.getTypeParams();

  private unsubscribe$ = new Subject<void>();

  constructor(private typeService: ProductTypeService,
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
        this.typeParams.pageNumber = pageEvent.pageIndex + 1;
        this.typeParams.pageSize = pageEvent.pageSize;
        this.loadData();
      });
  }

  loadData() {
    this.typeService.gettypes(this.typeParams).subscribe((response) => {
      this.types = response.data;
      this.totalCount = response.count;
      this.changeDetectorRef.detectChanges();
    });
  }

  deleteProductType(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent);
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.typeService.deleteType(id).subscribe((response: DeleteResponse) => {
          if (response.success) {
            // Handle successful deletion
            this.types = this.types.filter(c => c.id !== id);
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

  editProductType(id: number) {
    this.router.navigateByUrl(`/admin/product-types/edit/${id}`);
  }

  createProductType() {
    this.router.navigateByUrl(`/admin/product-types/edit/${-1}`);
  }
}
