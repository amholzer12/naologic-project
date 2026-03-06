import { TestBed } from '@angular/core/testing';
import { WorkOrderService } from './work-order';
import { WorkOrderDocument } from '../models/work-order.models';

// Helper to build a minimal WorkOrderDocument with sensible defaults
function makeOrder(
  docId: string,
  overrides: Partial<WorkOrderDocument['data']> = {}
): WorkOrderDocument {
  return {
    docId,
    docType: 'workOrder',
    data: {
      name: 'Test Order',
      workCenterId: 'wc-1',
      status: 'open',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      ...overrides,
    },
  };
}

describe('WorkOrderService', () => {
  let service: WorkOrderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkOrderService);
    // Start each test with a clean slate
    service.workOrders.set([]);
  });

  // --- addWorkOrder ---

  describe('addWorkOrder', () => {
    it('adds an order to an empty list', () => {
      service.addWorkOrder(makeOrder('wo-a'));
      expect(service.workOrders().length).toBe(1);
      expect(service.workOrders()[0].docId).toBe('wo-a');
    });

    it('appends without removing existing orders', () => {
      service.addWorkOrder(makeOrder('wo-a'));
      service.addWorkOrder(makeOrder('wo-b'));
      expect(service.workOrders().length).toBe(2);
    });
  });

  // --- updateWorkOrder ---

  describe('updateWorkOrder', () => {
    it('replaces the matching order by docId', () => {
      service.addWorkOrder(makeOrder('wo-a', { name: 'Original' }));
      service.updateWorkOrder(makeOrder('wo-a', { name: 'Updated' }));
      expect(service.workOrders()[0].data.name).toBe('Updated');
    });

    it('does not affect other orders', () => {
      service.addWorkOrder(makeOrder('wo-a'));
      service.addWorkOrder(makeOrder('wo-b', { name: 'Untouched' }));
      service.updateWorkOrder(makeOrder('wo-a', { name: 'Changed' }));
      expect(service.workOrders()[1].data.name).toBe('Untouched');
    });

    it('keeps the list the same length', () => {
      service.addWorkOrder(makeOrder('wo-a'));
      service.addWorkOrder(makeOrder('wo-b'));
      service.updateWorkOrder(makeOrder('wo-a', { name: 'Changed' }));
      expect(service.workOrders().length).toBe(2);
    });
  });

  // --- deleteWorkOrder ---

  describe('deleteWorkOrder', () => {
    it('removes the order with the given docId', () => {
      service.addWorkOrder(makeOrder('wo-a'));
      service.addWorkOrder(makeOrder('wo-b'));
      service.deleteWorkOrder('wo-a');
      expect(service.workOrders().length).toBe(1);
      expect(service.workOrders()[0].docId).toBe('wo-b');
    });

    it('does nothing if the docId does not exist', () => {
      service.addWorkOrder(makeOrder('wo-a'));
      service.deleteWorkOrder('wo-nonexistent');
      expect(service.workOrders().length).toBe(1);
    });
  });

  // --- hasOverlap ---

  describe('hasOverlap', () => {
    it('returns true when a new order overlaps an existing one on the same work center', () => {
      service.addWorkOrder(makeOrder('wo-existing', {
        workCenterId: 'wc-1',
        startDate: '2026-02-01',
        endDate: '2026-04-30',
      }));
      const incoming = makeOrder('wo-new', {
        workCenterId: 'wc-1',
        startDate: '2026-03-01',
        endDate: '2026-05-31',
      });
      expect(service.hasOverlap(incoming)).toBe(true);
    });

    it('returns true when a new order is fully contained within an existing one', () => {
      service.addWorkOrder(makeOrder('wo-existing', {
        workCenterId: 'wc-1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }));
      const incoming = makeOrder('wo-new', {
        workCenterId: 'wc-1',
        startDate: '2026-03-01',
        endDate: '2026-05-31',
      });
      expect(service.hasOverlap(incoming)).toBe(true);
    });

    it('returns false when dates are adjacent (end of one = start of next)', () => {
      service.addWorkOrder(makeOrder('wo-existing', {
        workCenterId: 'wc-1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }));
      const incoming = makeOrder('wo-new', {
        workCenterId: 'wc-1',
        startDate: '2026-01-31',
        endDate: '2026-02-28',
      });
      // s < oe && e > os — touching boundaries do not count as overlap
      expect(service.hasOverlap(incoming)).toBe(false);
    });

    it('returns false when dates do not overlap on the same work center', () => {
      service.addWorkOrder(makeOrder('wo-existing', {
        workCenterId: 'wc-1',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      }));
      const incoming = makeOrder('wo-new', {
        workCenterId: 'wc-1',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
      });
      expect(service.hasOverlap(incoming)).toBe(false);
    });

    it('returns false when overlapping dates are on a different work center', () => {
      service.addWorkOrder(makeOrder('wo-existing', {
        workCenterId: 'wc-1',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      }));
      const incoming = makeOrder('wo-new', {
        workCenterId: 'wc-2',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
      });
      expect(service.hasOverlap(incoming)).toBe(false);
    });

    it('excludes the order being edited so it does not flag against itself', () => {
      service.addWorkOrder(makeOrder('wo-a', {
        workCenterId: 'wc-1',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
      }));
      const edited = makeOrder('wo-a', {
        workCenterId: 'wc-1',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
      });
      expect(service.hasOverlap(edited, 'wo-a')).toBe(false);
    });
  });

  // --- generateId ---

  describe('generateId', () => {
    it('returns a string prefixed with "wo-"', () => {
      expect(service.generateId()).toMatch(/^wo-/);
    });

    it('produces unique IDs on successive calls', () => {
      const ids = Array.from({ length: 10 }, () => service.generateId());
      const unique = new Set(ids);
      expect(unique.size).toBe(10);
    });
  });
});
