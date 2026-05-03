import { TestBed } from '@angular/core/testing';

import { ProductSeederService } from './product-seeder.service';

describe('ProductSeederService', () => {
  let service: ProductSeederService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductSeederService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
