import { beforeEach, describe, expect, it } from "vitest";
import { ElementRef, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CheckPolicyDirective } from './check-policy.directive';
import { AuthorizationService } from 'src/app/core/services/authorization.service';
import { AccountService } from 'src/app/core/services/account.service';

describe('CheckPolicyDirective', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                { provide: ElementRef, useValue: { nativeElement: document.createElement('div') } },
                { provide: Renderer2, useValue: {} },
                { provide: AuthorizationService, useValue: {} },
                { provide: AccountService, useValue: {} },
            ]
        });
    });

    it('should create an instance', () => {
        const directive = TestBed.runInInjectionContext(() => new CheckPolicyDirective());
        expect(directive).toBeTruthy();
    });
});
