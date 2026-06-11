import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ConfirmEmailComponent } from './confirm-email.component';

describe('ConfirmEmailComponent', () => {
    let component: ConfirmEmailComponent;
    let fixture: ComponentFixture<ConfirmEmailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConfirmEmailComponent],
            providers: [provideRouter([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(ConfirmEmailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
