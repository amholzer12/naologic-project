import { Injectable, signal } from '@angular/core';
import { WorkCenterDocument, WorkOrderDocument } from '../models/work-order.models';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {

  // Sample work centers
  readonly workCenters: WorkCenterDocument[] = [
    { docId: 'wc-1', docType: 'workCenter', data: { name: 'Genesis Hardware' } },
    { docId: 'wc-2', docType: 'workCenter', data: { name: 'Rodriques Electrics' } },
    { docId: 'wc-3', docType: 'workCenter', data: { name: 'Konsulting Inc' } },
    { docId: 'wc-4', docType: 'workCenter', data: { name: 'McMorrow Distribution' } },
    { docId: 'wc-5', docType: 'workCenter', data: { name: 'Spartan Manufacturing' } },
  ];

  // Work orders as a signal so components reactively update when data changes
  workOrders = signal<WorkOrderDocument[]>([
    {
      docId: 'wo-1', docType: 'workOrder',
      data: { name: 'Centrix Ltd', workCenterId: 'wc-1', status: 'complete', startDate: '2025-10-01', endDate: '2025-12-15' }
    },
    {
      docId: 'wo-2', docType: 'workOrder',
      data: { name: 'Rodriques Electrics', workCenterId: 'wc-2', status: 'in-progress', startDate: '2025-11-01', endDate: '2026-02-10' }
    },
    {
      docId: 'wo-3', docType: 'workOrder',
      data: { name: 'Konsulting Inc', workCenterId: 'wc-3', status: 'in-progress', startDate: '2025-10-15', endDate: '2026-01-20' }
    },
    {
      docId: 'wo-4', docType: 'workOrder',
      data: { name: 'Compleks Systems', workCenterId: 'wc-3', status: 'in-progress', startDate: '2026-02-01', endDate: '2026-04-30' }
    },
    {
      docId: 'wo-5', docType: 'workOrder',
      data: { name: 'McMorrow Distribution', workCenterId: 'wc-4', status: 'blocked', startDate: '2025-11-10', endDate: '2026-03-20' }
    },
    {
      docId: 'wo-6', docType: 'workOrder',
      data: { name: 'Spartan Run A', workCenterId: 'wc-5', status: 'open', startDate: '2025-09-01', endDate: '2025-11-30' }
    },
    {
      docId: 'wo-7', docType: 'workOrder',
      data: { name: 'Spartan Run B', workCenterId: 'wc-5', status: 'open', startDate: '2026-01-01', endDate: '2026-03-15' }
    },
    {
      docId: 'wo-8', docType: 'workOrder',
      data: { name: 'Hardware Refresh', workCenterId: 'wc-1', status: 'open', startDate: '2026-01-15', endDate: '2026-04-01' }
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
}
