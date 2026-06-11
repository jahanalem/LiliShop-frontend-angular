import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EditProductTypeComponent } from './edit-product-type.component';

describe('EditProductTypeComponent', () => {
    let component: EditProductTypeComponent;
    let fixture: ComponentFixture<EditProductTypeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditProductTypeComponent],
            providers: [provideRouter([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditProductTypeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
