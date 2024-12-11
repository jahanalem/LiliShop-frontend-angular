import { TestBed } from '@angular/core/testing';

import { loadingInterceptor } from './loading.interceptor';

describe('LoadingInterceptor', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [
      loadingInterceptor
      ]
  }));

  it('should be created', () => {
    const interceptor = TestBed.inject(loadingInterceptor);
    expect(interceptor).toBeTruthy();
  });
});
