import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WorkOrderPanel } from './work-order-panel';
import { WorkOrderService } from '../services/work-order';
import { WorkOrderDocument } from '../models/work-order.models';

const EDIT_ORDER: WorkOrderDocument = {
  docId: 'wo-edit',
  docType: 'workOrder',
  data: {
    name: 'Existing Order',
    workCenterId: 'wc-1',
    status: 'in-progress',
    startDate: '2026-04-01',
    endDate: '2026-05-01',
  }
};

describe('WorkOrderPanel', () => {
  let component: WorkOrderPanel;
  let fixture: ComponentFixture<WorkOrderPanel>;
  let service: WorkOrderService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkOrderPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkOrderPanel);
    component = fixture.componentInstance;
    service = TestBed.inject(WorkOrderService);
    service.workOrders.set([]); // clean state before each test
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- Default / create mode ---

  describe('create mode defaults', () => {
    it('starts with an empty name field', () => {
      expect(component.form.controls.name.value).toBe('');
    });

    it('defaults status to open', () => {
      expect(component.form.controls.status.value).toBe('open');
    });

    it('submitLabel is "Create"', () => {
      expect(component.submitLabel).toBe('Create');
    });

    it('overlapError starts as false', () => {
      expect(component.overlapError).toBe(false);
    });
  });

  // --- Edit mode ---

  describe('edit mode', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('workOrder', EDIT_ORDER);
      fixture.detectChanges();
    });

    it('submitLabel is "Save"', () => {
      expect(component.submitLabel).toBe('Save');
    });

    it('populates the name field from the work order', () => {
      expect(component.form.controls.name.value).toBe('Existing Order');
    });

    it('populates the status from the work order', () => {
      expect(component.form.controls.status.value).toBe('in-progress');
    });

    it('populates the start date from the work order', () => {
      expect(component.form.controls.startDate.value).toEqual({ year: 2026, month: 4, day: 1 });
    });

    it('populates the end date from the work order', () => {
      expect(component.form.controls.endDate.value).toEqual({ year: 2026, month: 5, day: 1 });
    });
  });

  // --- Validation ---

  describe('onSubmit — invalid form', () => {
    it('marks form as touched when submitted empty', () => {
      component.onSubmit();
      expect(component.form.touched).toBe(true);
    });

    it('does not call addWorkOrder when form is invalid', () => {
      const spy = vi.spyOn(service, 'addWorkOrder');
      component.onSubmit();
      expect(spy).not.toHaveBeenCalled();
    });

    it('sets endDate error when end is before start', () => {
      component.form.setValue({
        name: 'Test',
        status: 'open',
        startDate: { year: 2026, month: 5, day: 1 },
        endDate:   { year: 2026, month: 4, day: 1 },
      });
      component.onSubmit();
      expect(component.form.controls.endDate.errors).toEqual({ endBeforeStart: true });
    });

    it('sets endDate error when end equals start', () => {
      component.form.setValue({
        name: 'Test',
        status: 'open',
        startDate: { year: 2026, month: 4, day: 1 },
        endDate:   { year: 2026, month: 4, day: 1 },
      });
      component.onSubmit();
      expect(component.form.controls.endDate.errors).toEqual({ endBeforeStart: true });
    });
  });

  // --- Overlap error ---

  describe('onSubmit — overlap', () => {
    it('sets overlapError and does not save when dates conflict', () => {
      service.addWorkOrder({
        docId: 'wo-blocker', docType: 'workOrder',
        data: { name: 'Blocker', workCenterId: 'wc-1', status: 'open', startDate: '2026-03-01', endDate: '2026-06-30' }
      });
      fixture.componentRef.setInput('workCenterId', 'wc-1');
      fixture.detectChanges();

      component.form.setValue({
        name: 'New Order',
        status: 'open',
        startDate: { year: 2026, month: 4, day: 1 },
        endDate:   { year: 2026, month: 5, day: 1 },
      });

      const spy = vi.spyOn(service, 'addWorkOrder');
      component.onSubmit();

      expect(component.overlapError).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // --- Successful create ---

  describe('onSubmit — successful create', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('workCenterId', 'wc-1');
      fixture.detectChanges();
      component.form.setValue({
        name: 'New Order',
        status: 'open',
        startDate: { year: 2026, month: 4, day: 1 },
        endDate:   { year: 2026, month: 5, day: 1 },
      });
    });

    it('calls addWorkOrder with correct data', () => {
      const spy = vi.spyOn(service, 'addWorkOrder');
      component.onSubmit();
      expect(spy).toHaveBeenCalledOnce();
      const saved = spy.mock.calls[0][0];
      expect(saved.data.name).toBe('New Order');
      expect(saved.data.workCenterId).toBe('wc-1');
    });

    it('emits saved on success', () => {
      let emitted = false;
      component.saved.subscribe(() => { emitted = true; });
      component.onSubmit();
      expect(emitted).toBe(true);
    });

    it('clears overlapError on success', () => {
      component.overlapError = true;
      component.onSubmit();
      expect(component.overlapError).toBe(false);
    });
  });

  // --- Successful edit ---

  describe('onSubmit — successful edit', () => {
    beforeEach(() => {
      service.addWorkOrder(EDIT_ORDER);
      fixture.componentRef.setInput('mode', 'edit');
      fixture.componentRef.setInput('workOrder', EDIT_ORDER);
      fixture.detectChanges();
    });

    it('calls updateWorkOrder instead of addWorkOrder', () => {
      const addSpy    = vi.spyOn(service, 'addWorkOrder');
      const updateSpy = vi.spyOn(service, 'updateWorkOrder');
      component.onSubmit();
      expect(updateSpy).toHaveBeenCalledOnce();
      expect(addSpy).not.toHaveBeenCalled();
    });

    it('emits saved after edit', () => {
      let emitted = false;
      component.saved.subscribe(() => { emitted = true; });
      component.onSubmit();
      expect(emitted).toBe(true);
    });
  });

  // --- Cancel ---

  describe('onCancel', () => {
    it('emits cancelled', () => {
      let emitted = false;
      component.cancelled.subscribe(() => { emitted = true; });
      component.onCancel();
      expect(emitted).toBe(true);
    });
  });
});
