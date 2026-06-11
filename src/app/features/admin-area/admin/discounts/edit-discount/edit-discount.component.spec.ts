import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EditDiscountComponent } from './edit-discount.component';

describe('EditDiscountComponent', () => {
    let component: EditDiscountComponent;
    let fixture: ComponentFixture<EditDiscountComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditDiscountComponent],
            providers: [provideRouter([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditDiscountComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
