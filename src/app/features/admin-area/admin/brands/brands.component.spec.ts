import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { BrandsComponent } from './brands.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrandService } from 'src/app/core/services/brand.service';
import { of } from 'rxjs';
import { IBrand } from 'src/app/shared/models/brand';
import { DeleteResponse } from 'src/app/shared/models/delete-response.model';
import { Router } from '@angular/router';
import { BrandParams } from 'src/app/shared/models/BrandParams';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';


describe('BrandsComponent', () => {
  let component: BrandsComponent;
  let fixture: ComponentFixture<BrandsComponent>;

  const mockPaginator = {
    page: of({}) // create an Observable for page
  };

  const mockBrands: IBrand[] = [
    { id: 1, name: 'name A', isActive: true },
    { id: 2, name: 'name B', isActive: true },
    { id: 3, name: 'name C', isActive: true },
    { id: 4, name: 'name D', isActive: true },
    { id: 5, name: 'name E', isActive: false },
    { id: 6, name: 'name F', isActive: false },
  ];

  const mockDeleteResponse: DeleteResponse = {
    success: true,
    message: "The item removed successfully."
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BrandsComponent],
      imports: [HttpClientTestingModule, MatDialogModule, MatPaginatorModule, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        {
          provide: BrandService,
          useValue: {
            getBrands: jasmine.createSpy('getBrands').and.returnValue(of({ data: mockBrands, count: mockBrands.length })),
            deleteBrand: jasmine.createSpy('deleteBrand').and.returnValue(of(mockDeleteResponse)),
            getBrandParams: jasmine.createSpy('getBrandParams').and.returnValue(new BrandParams()) // Mock getBrandParams() here
          }
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: jasmine.createSpy('navigateByUrl')
          }
        },
        {
          provide: MatDialog,
          useValue: {
            open: jasmine.createSpy('open').and.returnValue({ afterClosed: () => of(true) })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BrandsComponent);
    component = fixture.componentInstance;
    component.paginator = mockPaginator as any; // assign the mockPaginator to component's paginator

    fixture.detectChanges();
  });

  it('should create', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load data when initialized', fakeAsync( () => {
    component.ngAfterViewInit();

    fixture.detectChanges();

    expect(component.brands.length).toBe(mockBrands.length);
    expect(component.totalCount).toBe(mockBrands.length);
  }));

  it('should delete brand correctly', fakeAsync( () => {
    const brandId = 1;
    const initialCount = component.brands.length;

    component.deleteBrand(brandId);

    fixture.detectChanges();

    expect(component.brands.length).toBe(initialCount - 1);
    expect(component.totalCount).toBe(initialCount - 1);
    expect(TestBed.inject(BrandService).deleteBrand).toHaveBeenCalledWith(brandId);
  }));
});
