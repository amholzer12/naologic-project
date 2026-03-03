import { TestBed } from '@angular/core/testing';

import { WorkOrder } from './work-order';

describe('WorkOrder', () => {
  let service: WorkOrder;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkOrder);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
