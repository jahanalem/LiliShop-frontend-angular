import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EditBrandComponent } from './edit-brand.component';

describe('EditBrandComponent', () => {
    let component: EditBrandComponent;
    let fixture: ComponentFixture<EditBrandComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditBrandComponent],
            providers: [provideRouter([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditBrandComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
