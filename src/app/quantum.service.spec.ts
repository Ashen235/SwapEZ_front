import { TestBed } from '@angular/core/testing';

import { QuantumService } from './quantum.service';

describe('QuantumService', () => {
  let service: QuantumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuantumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
