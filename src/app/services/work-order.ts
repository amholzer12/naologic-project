import { Injectable, signal } from '@angular/core';
import { WorkCenterDocument, WorkOrderDocument } from '../models/work-order.models';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {

  // Sample work centers
  readonly workCenters: WorkCenterDocument[] = [
    { docId: 'wc-1', docType: 'workCenter', data: { name: 'Apex Fabrication' } },
    { docId: 'wc-2', docType: 'workCenter', data: { name: 'Volt Systems' } },
    { docId: 'wc-3', docType: 'workCenter', data: { name: 'Meridian Assembly' } },
    { docId: 'wc-4', docType: 'workCenter', data: { name: 'Harwick Logistics' } },
    { docId: 'wc-5', docType: 'workCenter', data: { name: 'Blackstone Precision' } },
  ];

  // Work orders as a signal so components reactively update when data changes
  workOrders = signal<WorkOrderDocument[]>([
    {
      docId: 'wo-1', docType: 'workOrder',
      data: { name: 'Bracket Assembly – Lot 22', workCenterId: 'wc-1', status: 'complete', startDate: '2025-10-01', endDate: '2025-12-15' }
    },
    {
      docId: 'wo-2', docType: 'workOrder',
      data: { name: 'PCB Rework – Batch 7', workCenterId: 'wc-2', status: 'in-progress', startDate: '2025-11-01', endDate: '2026-02-10' }
    },
    {
      docId: 'wo-3', docType: 'workOrder',
      data: { name: 'Drive Housing – Q4 Run', workCenterId: 'wc-3', status: 'in-progress', startDate: '2025-10-15', endDate: '2026-01-20' }
    },
    {
      docId: 'wo-4', docType: 'workOrder',
      data: { name: 'Gearbox Rebuild – Series B', workCenterId: 'wc-3', status: 'in-progress', startDate: '2026-02-01', endDate: '2026-04-30' }
    },
    {
      docId: 'wo-5', docType: 'workOrder',
      data: { name: 'Outbound Pallet Prep', workCenterId: 'wc-4', status: 'blocked', startDate: '2025-11-10', endDate: '2026-03-20' }
    },
    {
      docId: 'wo-6', docType: 'workOrder',
      data: { name: 'Shaft Turning – Run A', workCenterId: 'wc-5', status: 'open', startDate: '2025-09-01', endDate: '2025-11-30' }
    },
    {
      docId: 'wo-7', docType: 'workOrder',
      data: { name: 'Shaft Turning – Run B', workCenterId: 'wc-5', status: 'open', startDate: '2026-01-01', endDate: '2026-03-15' }
    },
    {
      docId: 'wo-8', docType: 'workOrder',
      data: { name: 'Fastener Restock Run', workCenterId: 'wc-1', status: 'open', startDate: '2026-04-01', endDate: '2026-06-15' }
    },
  ]);

  addWorkOrder(order: WorkOrderDocument): void {
    this.workOrders.update(orders => [...orders, order]);
  }

  updateWorkOrder(updated: WorkOrderDocument): void {
    this.workOrders.update(orders =>
      orders.map(o => o.docId === updated.docId ? updated : o)
    );
  }

  deleteWorkOrder(docId: string): void {
    this.workOrders.update(orders => orders.filter(o => o.docId !== docId));
  }

  // Check if a work order's dates overlap with any existing orders on the same work center.
  // excludeId is used during editing so we don't flag the order against itself.
  hasOverlap(order: WorkOrderDocument, excludeId?: string): boolean {
    const others = this.workOrders().filter(o =>
      o.data.workCenterId === order.data.workCenterId && o.docId !== excludeId
    );
    const s = new Date(order.data.startDate).getTime();
    const e = new Date(order.data.endDate).getTime();
    return others.some(o => {
      const os = new Date(o.data.startDate).getTime();
      const oe = new Date(o.data.endDate).getTime();
      return s < oe && e > os;
    });
  }

  generateId(): string {
    return 'wo-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
}
