import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EditUserComponent } from './edit-user.component';

describe('EditUserComponent', () => {
    let component: EditUserComponent;
    let fixture: ComponentFixture<EditUserComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditUserComponent],
            providers: [provideRouter([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditUserComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
