import { beforeEach, describe, expect, it, vi } from "vitest";
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AttributesComponent } from './attributes.component';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ProductAttributeService } from 'src/app/core/services/product-attribute.service';
import { of } from 'rxjs';
import { IProductAttribute, ProductAttributeParams } from 'src/app/shared/models/productAttribute';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';


describe('AttributesComponent', () => {
    let component: AttributesComponent;
    let fixture: ComponentFixture<AttributesComponent>;

    const mockPaginator = {
        page: of({})
    };

    const mockAttributes: IProductAttribute[] = [
        {
            id: 1, code: 'color', name: 'Color', inputType: 'MultiSelect', swatchType: 'ColorHex',
            isFilterable: true, displayOrder: 10, isActive: true,
            values: [
                { id: 1, productAttributeId: 1, code: 'yellow', name: 'Yellow', colorHex: '#FBC02D', sortOrder: 10, isActive: true },
                { id: 2, productAttributeId: 1, code: 'black', name: 'Black', colorHex: '#000000', sortOrder: 20, isActive: true }
            ]
        },
        {
            id: 2, code: 'size', name: 'Size', inputType: 'Select', swatchType: 'None',
            isFilterable: true, displayOrder: 20, isActive: true, values: []
        }
    ];

    beforeEach(async () => {
        // Stateful list so deleteAttribute + reload reflects the removal.
        const workingAttributes: IProductAttribute[] = [...mockAttributes];

        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MatPaginatorModule, NoopAnimationsModule, AttributesComponent],
            providers: [
                { provide: MatDialogRef, useValue: {} },
                {
                    provide: ProductAttributeService,
                    useValue: {
                        getAttributes: vi.fn().mockName('getAttributes').mockImplementation(() => of({ data: workingAttributes, count: workingAttributes.length })),
                        deleteAttribute: vi.fn().mockName('deleteAttribute').mockImplementation((id: number) => {
                            const index = workingAttributes.findIndex(a => a.id === id);
                            if (index >= 0) {
                                workingAttributes.splice(index, 1);
                            }
                            return of(undefined);
                        }),
                        getAttributeParams: vi.fn().mockName('getAttributeParams').mockReturnValue(new ProductAttributeParams())
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

        fixture = TestBed.createComponent(AttributesComponent);
        component = fixture.componentInstance;
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

        expect(component.attributes().length).toBe(mockAttributes.length);
        expect(component.totalCount()).toBe(mockAttributes.length);
    });

    it('should count values per attribute', () => {
        expect(component.valueCount(mockAttributes[0])).toBe(2);
        expect(component.valueCount(mockAttributes[1])).toBe(0);
    });

    it('should delete attribute correctly', async () => {
        const attributeId = 1;
        const initialCount = component.attributes().length;

        component.deleteAttribute(attributeId);

        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.attributes().length).toBe(initialCount - 1);
        expect(TestBed.inject(ProductAttributeService).deleteAttribute).toHaveBeenCalledWith(attributeId);
    });

    it('should navigate to edit page', () => {
        component.editAttribute(2);
        expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/admin/attributes/edit/2');
    });
});
