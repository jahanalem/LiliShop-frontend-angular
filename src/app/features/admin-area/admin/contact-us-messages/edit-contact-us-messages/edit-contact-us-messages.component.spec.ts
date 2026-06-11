import { beforeEach, describe, expect, it } from "vitest";
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EditContactUsMessagesComponent } from './edit-contact-us-messages.component';

describe('EditContactUsMessagesComponent', () => {
    let component: EditContactUsMessagesComponent;
    let fixture: ComponentFixture<EditContactUsMessagesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EditContactUsMessagesComponent],
            providers: [provideRouter([])]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditContactUsMessagesComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
