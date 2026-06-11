import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestBed } from '@angular/core/testing';

import { loadingInterceptor } from './loading.interceptor';
import { BusyService } from '../services/busy.service';

describe('LoadingInterceptor', () => {
    beforeEach(() => TestBed.configureTestingModule({
        providers: [
            { provide: BusyService, useValue: { busy: vi.fn(), idle: vi.fn() } }
        ]
    }));

    it('should be created', () => {
        const interceptor = TestBed.runInInjectionContext(() => loadingInterceptor);
        expect(interceptor).toBeTruthy();
    });
});
