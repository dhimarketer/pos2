// backend/purchase_orders.ts

import { logAction } from './audit';
import { PurchaseManagement } from './purchase_management';
import { Supplier } from './suppliers';

interface PurchaseOrder {
  id: number;
  supplier: Supplier;
  orderDate: Date;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
}

interface PurchaseOrderItem {
  itemId: number;
  quantity: number;
  costPrice: number;
}

const purchaseManagement = new PurchaseManagement();

export async function createPurchaseOrder(supplier: Supplier, items: { itemId: number; quantity: number; costPrice: number }[]): Promise<PurchaseOrder> {
  const newPurchaseOrder = purchaseManagement.createPurchaseOrder(supplier, items as any);
  await logAction(1, 'Create Purchase Order', `Created purchase order with id ${newPurchaseOrder.id}`);
  console.log(`Creating purchase order with id ${newPurchaseOrder.id}`);
  return newPurchaseOrder;
}

export function getPurchaseOrder(orderId: number): PurchaseOrder {
  return purchaseManagement.getPurchaseOrder(orderId);
}

export function updatePurchaseOrder(orderId: number, updates: Partial<PurchaseOrder>): PurchaseOrder {
  return purchaseManagement.updatePurchaseOrder(orderId, updates as any);
}

export function deletePurchaseOrder(orderId: number): void {
  purchaseManagement.cancelPurchaseOrder(orderId);
}
