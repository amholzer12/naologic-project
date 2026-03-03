import { Component, inject, input, output, OnChanges } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { WorkOrderService } from '../services/work-order';
import { WorkOrderDocument, WorkOrderStatus } from '../models/work-order.models';

@Component({
  selector: 'app-work-order-panel',
  imports: [ReactiveFormsModule, NgSelectModule, NgbDatepickerModule],
  templateUrl: './work-order-panel.html',
  styleUrl: './work-order-panel.scss',
})
export class WorkOrderPanel implements OnChanges {
  private svc = inject(WorkOrderService);

  // Inputs passed from the timeline
  mode = input<'create' | 'edit'>('create');
  workOrder = input<WorkOrderDocument | null>(null);  // pre-populated in edit mode
  workCenterId = input<string>('');                   // which row was clicked
  prefillDate = input<string | null>(null);           // date clicked on grid

  // Outputs back to the timeline
  saved = output<void>();
  cancelled = output<void>();

  overlapError = false;

  readonly statusOptions: { label: string; value: WorkOrderStatus }[] = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Complete', value: 'complete' },
    { label: 'Blocked', value: 'blocked' },
  ];

  form = new FormGroup({
    name:      new FormControl('', Validators.required),
    status:    new FormControl<WorkOrderStatus>('open', Validators.required),
    startDate: new FormControl<NgbDateStruct | null>(null, Validators.required),
    endDate:   new FormControl<NgbDateStruct | null>(null, Validators.required),
  });

  // Re-populate the form whenever inputs change (switching between create/edit)
  ngOnChanges() {
    this.overlapError = false;
    const wo = this.workOrder();

    if (this.mode() === 'edit' && wo) {
      this.form.setValue({
        name:      wo.data.name,
        status:    wo.data.status,
        startDate: this.toNgbDate(wo.data.startDate),
        endDate:   this.toNgbDate(wo.data.endDate),
      });
    } else {
      // Create mode — reset form with defaults
      const prefill = this.prefillDate();
      const startStruct = prefill ? this.toNgbDate(prefill) : null;
      const endStruct   = startStruct ? this.addDays(startStruct, 7) : null;
      this.form.setValue({ name: '', status: 'open', startDate: startStruct, endDate: endStruct });
    }
  }

  get title() { return 'Work Order Details'; }
  get submitLabel() { return this.mode() === 'edit' ? 'Save' : 'Create'; }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, status, startDate, endDate } = this.form.value;

    // Guard: end date must be after start date
    if (this.compareNgbDates(startDate!, endDate!) >= 0) {
      this.form.controls.endDate.setErrors({ endBeforeStart: true });
      return;
    }

    const wo = this.workOrder();
    const docId = this.mode() === 'edit' && wo ? wo.docId : this.svc.generateId();

    const order: WorkOrderDocument = {
      docId,
      docType: 'workOrder',
      data: {
        name: name!,
        status: status!,
        workCenterId: this.mode() === 'edit' && wo ? wo.data.workCenterId : this.workCenterId(),
        startDate: this.fromNgbDate(startDate!),
        endDate:   this.fromNgbDate(endDate!),
      }
    };

    if (this.svc.hasOverlap(order, this.mode() === 'edit' ? docId : undefined)) {
      this.overlapError = true;
      return;
    }

    this.overlapError = false;
    if (this.mode() === 'edit') {
      this.svc.updateWorkOrder(order);
    } else {
      this.svc.addWorkOrder(order);
    }
    this.saved.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }

  // Convert ISO string "2025-01-15" → NgbDateStruct {year:2025, month:1, day:15}
  private toNgbDate(iso: string): NgbDateStruct {
    const [y, m, d] = iso.split('-').map(Number);
    return { year: y, month: m, day: d };
  }

  // Convert NgbDateStruct back to ISO string
  private fromNgbDate(d: NgbDateStruct): string {
    return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
  }

  // Add N days to an NgbDateStruct
  private addDays(d: NgbDateStruct, days: number): NgbDateStruct {
    const date = new Date(d.year, d.month - 1, d.day + days);
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }

  // Compare two NgbDateStructs: negative = a before b, 0 = same, positive = a after b
  private compareNgbDates(a: NgbDateStruct, b: NgbDateStruct): number {
    return new Date(a.year, a.month - 1, a.day).getTime() -
           new Date(b.year, b.month - 1, b.day).getTime();
  }
}
