import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { AccountService } from 'src/app/core/services/account.service';
import { environment } from 'src/environments/environment';
import { ProductTypesComponent } from './product-types.component';

describe('ProductTypesComponent', () => {
    let component: ProductTypesComponent;
    let fixture: ComponentFixture<ProductTypesComponent>;
    let http: HttpTestingController;
    const url = `${environment.apiUrl}producttype/types`;
    const types = [{ id: 17, name: 'Synthetic clothing', isActive: true }, { id: 18, name: 'Synthetic accessories', isActive: false }, { id: 19, name: 'Synthetic shoes', isActive: true }, { id: 20, name: 'Synthetic bags', isActive: true }, { id: 21, name: 'Synthetic scarves', isActive: true }];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ProductTypesComponent],
            providers: [provideHttpClient(), provideHttpClientTesting(),
                { provide: AccountService, useValue: { currentUser$: of(null) } }]
        }).compileComponents();
        http = TestBed.inject(HttpTestingController);
        fixture = TestBed.createComponent(ProductTypesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        const request = http.expectOne(r => r.url === url);
        expect(request.request.method).toBe('GET');
        expect(request.request.params.get('pageIndex')).toBe('1');
        expect(request.request.params.get('pageSize')).toBe('5');
        request.flush({ pageIndex: 1, pageSize: 5, count: 12, data: types });
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
        http.verify();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
        expect(component.types()).toEqual(types);
        expect(component.totalCount()).toBe(12);
        expect(fixture.nativeElement.textContent).toContain('Synthetic clothing');
        expect(fixture.nativeElement.textContent).toContain('Synthetic accessories');
    });

    it('loads the requested page and removes paginator subscriptions on destruction', () => {
        const paginator = component.paginator();
        paginator.page.emit({ pageIndex: 1, pageSize: 10, length: 12 });
        const request = http.expectOne(r => r.url === url);
        expect(request.request.params.get('pageIndex')).toBe('2');
        expect(request.request.params.get('pageSize')).toBe('10');
        const tail = [{ id: 27, name: 'Synthetic page-two clothing', isActive: true }, { id: 28, name: 'Synthetic page-two accessories', isActive: true }];
        request.flush({ pageIndex: 2, pageSize: 10, count: 12, data: tail });
        expect(component.types()).toEqual(tail);
        fixture.destroy();
        paginator.page.emit({ pageIndex: 2, pageSize: 10, length: 12 });
        http.expectNone(r => r.url === url);
    });
});
