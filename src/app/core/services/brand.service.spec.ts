import { TestBed } from '@angular/core/testing';

import { BrandService } from './brand.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('BrandService', () => {
  let service: BrandService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(BrandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
