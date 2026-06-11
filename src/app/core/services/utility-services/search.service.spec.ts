import { beforeEach, describe, expect, it } from "vitest";
import { TestBed } from '@angular/core/testing';

import { SearchService } from './search.service';

describe('SearchService', () => {
    let service: SearchService<unknown>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SearchService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
