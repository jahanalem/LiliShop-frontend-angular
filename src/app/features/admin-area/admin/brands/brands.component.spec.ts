import { beforeEach, describe, expect, it, vi } from "vitest";
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BrandsComponent } from './brands.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BrandService } from 'src/app/core/services/brand.service';
import { of } from 'rxjs';
import { IBrand } from 'src/app/shared/models/brand';
import { Router } from '@angular/router';
import { BrandParams } from 'src/app/shared/models/BrandParams';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';


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

    beforeEach(async () => {
        // Stateful brand list so deleteBrand + reload reflects the removal.
        const workingBrands: IBrand[] = [...mockBrands];

        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MatPaginatorModule, NoopAnimationsModule, BrandsComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                {
                    provide: BrandService,
                    useValue: {
                        getBrands: vi.fn().mockName('getBrands').mockImplementation(() => of({ data: workingBrands, count: workingBrands.length })),
                        deleteBrand: vi.fn().mockName('deleteBrand').mockImplementation((id: number) => {
                            const index = workingBrands.findIndex(b => b.id === id);
                            if (index >= 0) {
                                workingBrands.splice(index, 1);
                            }
                            return of(undefined);
                        }),
                        getBrandParams: vi.fn().mockName('getBrandParams').mockReturnValue(new BrandParams()) // Mock getBrandParams() here
                    }
                },
                {
                    provide: Router,
                    useValue: {
                        navigateByUrl: vi.fn().mockName('navigateByUrl')
                    }
                },
                {
                    provide: MatDialog,
                    useValue: {
                        open: vi.fn().mockName('open').mockReturnValue({ afterClosed: () => of(true) })
                    }
                },
                provideHttpClient(withXhr(), withInterceptorsFromDi()),
                provideHttpClientTesting()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BrandsComponent);
        component = fixture.componentInstance;
        // paginator is a required viewChild signal; override it with a signal returning the mock
        Object.defineProperty(component, 'paginator', { value: signal(mockPaginator as any) });

        fixture.detectChanges();
    });

    it('should create', async () => {
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('should load data when initialized', async () => {
        component.ngAfterViewInit();

        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.brands().length).toBe(mockBrands.length);
        expect(component.totalCount()).toBe(mockBrands.length);
    });

    it('should delete brand correctly', async () => {
        const brandId = 1;
        const initialCount = component.brands().length;

        component.deleteBrand(brandId);

        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.brands().length).toBe(initialCount - 1);
        expect(component.totalCount()).toBe(initialCount - 1);
        expect(TestBed.inject(BrandService).deleteBrand).toHaveBeenCalledWith(brandId);
    });
});
