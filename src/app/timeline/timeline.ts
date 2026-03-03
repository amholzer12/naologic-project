import { Component, inject, computed, signal, ElementRef, HostListener } from '@angular/core';
import { WorkOrderService } from '../services/work-order';
import { WorkOrderDocument } from '../models/work-order.models';
import { WorkOrderPanel } from '../work-order-panel/work-order-panel';

export type Timescale = 'Hour' | 'Day' | 'Week' | 'Month';

export interface TimeColumn {
  label: string;
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-timeline',
  imports: [WorkOrderPanel],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class Timeline {
  protected svc = inject(WorkOrderService);
  private el = inject(ElementRef);

  // --- Timescale ---
  readonly timescaleOptions: Timescale[] = ['Hour', 'Day', 'Week', 'Month'];
  timescale = signal<Timescale>('Month');
  timescaleOpen = signal(false);

  protected visibleColumns = computed(() => this.generateColumns(this.timescale()));
  protected gridStart = computed(() => this.visibleColumns()[0].startDate);
  protected gridEnd = computed(() => {
    const cols = this.visibleColumns();
    return cols[cols.length - 1].endDate;
  });

  // --- Bar menu state ---
  openMenuId = signal<string | null>(null);

  toggleBarMenu(docId: string, event: MouseEvent) {
    event.stopPropagation();
    this.openMenuId.update(id => id === docId ? null : docId);
  }

  // --- Panel state ---
  panelOpen = signal(false);
  panelMode = signal<'create' | 'edit'>('create');
  editingWorkOrder = signal<WorkOrderDocument | null>(null);
  panelWorkCenterId = signal('');
  panelPrefillDate = signal<string | null>(null);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.timescaleOpen.set(false);
    }
  }

  toggleTimescale(event: MouseEvent) {
    event.stopPropagation();
    this.timescaleOpen.update(v => !v);
  }

  selectTimescale(option: Timescale) {
    this.timescale.set(option);
    this.timescaleOpen.set(false);
  }

  // Called when user clicks an empty grid row cell
  onGridRowClick(event: MouseEvent, workCenterId: string) {
    // Don't open if they clicked on a bar
    if ((event.target as HTMLElement).closest('.work-order-bar')) return;

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;

    const gridStartMs = this.gridStart().getTime();
    const gridEndMs = this.gridEnd().getTime();
    const clickedMs = gridStartMs + ratio * (gridEndMs - gridStartMs);
    const clickedDate = new Date(clickedMs).toISOString().split('T')[0];

    this.panelMode.set('create');
    this.panelWorkCenterId.set(workCenterId);
    this.panelPrefillDate.set(clickedDate);
    this.editingWorkOrder.set(null);
    this.panelOpen.set(true);
  }

  onEditWorkOrder(wo: WorkOrderDocument, event: MouseEvent) {
    event.stopPropagation();
    this.panelMode.set('edit');
    this.editingWorkOrder.set(wo);
    this.panelWorkCenterId.set(wo.data.workCenterId);
    this.panelPrefillDate.set(null);
    this.panelOpen.set(true);
  }

  onDeleteWorkOrder(docId: string, event: MouseEvent) {
    event.stopPropagation();
    this.svc.deleteWorkOrder(docId);
  }

  onPanelSaved() { this.panelOpen.set(false); }
  onPanelCancelled() { this.panelOpen.set(false); }
  onBackdropClick() { this.panelOpen.set(false); }

  @HostListener('document:click')
  closeBarMenu() { this.openMenuId.set(null); }

  protected getBarsForWorkCenter(workCenterId: string) {
    return this.svc.workOrders()
      .filter(wo => wo.data.workCenterId === workCenterId)
      .map(wo => ({ ...wo, style: this.calcBarStyle(wo) }));
  }

  protected calcBarStyle(wo: WorkOrderDocument): { left: string; width: string } {
    const gridStartMs = this.gridStart().getTime();
    const gridEndMs = this.gridEnd().getTime();
    const totalMs = gridEndMs - gridStartMs;

    const startMs = new Date(wo.data.startDate).getTime();
    const endMs = new Date(wo.data.endDate).getTime();

    const clampedStart = Math.max(startMs, gridStartMs);
    const clampedEnd = Math.min(endMs, gridEndMs);

    const left = ((clampedStart - gridStartMs) / totalMs) * 100;
    const width = ((clampedEnd - clampedStart) / totalMs) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0)}%` };
  }

  private generateColumns(timescale: Timescale): TimeColumn[] {
    const today = new Date();
    const columns: TimeColumn[] = [];

    if (timescale === 'Month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 6, 1);
      for (let i = 0; i < 13; i++) {
        const colStart = new Date(start.getFullYear(), start.getMonth() + i, 1);
        const colEnd = new Date(colStart.getFullYear(), colStart.getMonth() + 1, 0, 23, 59, 59);
        columns.push({
          label: colStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
          startDate: colStart,
          endDate: colEnd
        });
      }
    } else if (timescale === 'Week') {
      const todayDay = today.getDay();
      const mondayOffset = todayDay === 0 ? -6 : 1 - todayDay;
      const currentMonday = new Date(today);
      currentMonday.setDate(today.getDate() + mondayOffset);
      currentMonday.setHours(0, 0, 0, 0);
      const start = new Date(currentMonday);
      start.setDate(currentMonday.getDate() - 8 * 7);

      for (let i = 0; i < 17; i++) {
        const colStart = new Date(start);
        colStart.setDate(start.getDate() + i * 7);
        const colEnd = new Date(colStart);
        colEnd.setDate(colEnd.getDate() + 6);
        colEnd.setHours(23, 59, 59);
        const month = colStart.toLocaleString('default', { month: 'short' });
        columns.push({
          label: `${month} ${colStart.getDate()}–${colEnd.getDate()}`,
          startDate: colStart,
          endDate: colEnd
        });
      }
    } else {
      // @upgrade Hour view: currently maps to Day view. True Hour view would show
      // individual hours as columns and require time-of-day data on work orders.
      const start = new Date(today);
      start.setDate(today.getDate() - 14);
      start.setHours(0, 0, 0, 0);

      for (let i = 0; i < 29; i++) {
        const colStart = new Date(start);
        colStart.setDate(start.getDate() + i);
        const colEnd = new Date(colStart);
        colEnd.setHours(23, 59, 59);
        const weekday = colStart.toLocaleString('default', { weekday: 'short' });
        columns.push({
          label: `${weekday} ${colStart.getDate()}`,
          startDate: colStart,
          endDate: colEnd
        });
      }
    }

    return columns;
  }
}
