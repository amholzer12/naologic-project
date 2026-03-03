import { Component, inject, computed } from '@angular/core';
import { WorkOrderService } from '../services/work-order';
import { WorkOrderDocument } from '../models/work-order.models';

@Component({
  selector: 'app-timeline',
  imports: [],
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
})
export class Timeline {
  protected svc = inject(WorkOrderService);

  // Start and end dates of the entire visible grid
  protected gridStart = computed(() => {
    const months = this.visibleMonths();
    return new Date(months[0].year, months[0].month, 1);
  });

  protected gridEnd = computed(() => {
    const months = this.visibleMonths();
    const last = months[months.length - 1];
    // Last day of the final month
    return new Date(last.year, last.month + 1, 0);
  });

  // 13 months: 6 before today, today's month, 6 after
  protected visibleMonths = computed(() => this.generateMonths());

  // For a given work center, return its work orders with pixel positions
  protected getBarsForWorkCenter(workCenterId: string) {
    return this.svc.workOrders()
      .filter(wo => wo.data.workCenterId === workCenterId)
      .map(wo => ({
        ...wo,
        style: this.calcBarStyle(wo)
      }));
  }

  // Convert a work order's dates into CSS left% and width%
  protected calcBarStyle(wo: WorkOrderDocument): { left: string; width: string } {
    const gridStartMs = this.gridStart().getTime();
    const gridEndMs = this.gridEnd().getTime();
    const totalMs = gridEndMs - gridStartMs;

    const startMs = new Date(wo.data.startDate).getTime();
    const endMs = new Date(wo.data.endDate).getTime();

    // Clamp to visible range so bars don't overflow outside the grid
    const clampedStart = Math.max(startMs, gridStartMs);
    const clampedEnd = Math.min(endMs, gridEndMs);

    const left = ((clampedStart - gridStartMs) / totalMs) * 100;
    const width = ((clampedEnd - clampedStart) / totalMs) * 100;

    return {
      left: `${left}%`,
      width: `${Math.max(width, 0)}%`
    };
  }

  private generateMonths(): { label: string; year: number; month: number }[] {
    const months = [];
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth() - 6, 1);

    for (let i = 0; i < 13; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        year: d.getFullYear(),
        month: d.getMonth(),
      });
    }
    return months;
  }
}
