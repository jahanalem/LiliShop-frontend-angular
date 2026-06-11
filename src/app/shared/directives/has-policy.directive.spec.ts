import { describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';
import { CheckPolicyDirective } from './check-policy.directive';

describe('CheckPolicyDirective', () => {
    it('should create an instance', () => {
        const directive = TestBed.runInInjectionContext(() => new CheckPolicyDirective());
        expect(directive).toBeTruthy();
    });
});
