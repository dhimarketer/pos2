// backend/purchase_orders.ts

import { db } from './index'; // Import the database pool
import { logAction } from './audit';
import { Supplier } from './suppliers'; // Keep Supplier import if needed for type hinting, but won't be stored directly

export interface PurchaseOrder {
  id: number;
  supplierId: number; // Changed to supplierId to match database schema
  orderDate: string; // Changed to string to match database schema
  itemId: number; // Added itemId to match database schema
  quantity: number; // Added quantity to match database schema
  cost: number; // Added cost to match database schema
  // Removed items, totalAmount, status as they don't directly map to the current table structure
}

export async function createPurchaseOrder(supplierId: number, itemId: number, quantity: number, cost: number): Promise<PurchaseOrder> {
  const orderDate = new Date().toISOString(); // Generate current date
  const result = await db.query(
    'INSERT INTO purchase_orders (supplierId, itemId, quantity, cost, orderDate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [supplierId, itemId, quantity, cost, orderDate]
  );
  const newOrder: PurchaseOrder = result.rows[0];
  await logAction(1, 'Create Purchase Order', `Created purchase order with id ${newOrder.id}`);
  console.log(`Creating purchase order with id ${newOrder.id}`);
  return newOrder;
}

export async function getPurchaseOrder(orderId: number): Promise<PurchaseOrder | undefined> {
  const result = await db.query('SELECT * FROM purchase_orders WHERE id = $1', [orderId]);
  return result.rows[0];
}

export async function updatePurchaseOrder(orderId: number, updates: Partial<PurchaseOrder>): Promise<PurchaseOrder | undefined> {
  const fields = Object.keys(updates).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
  const values = Object.values(updates);
  const result = await db.query(
    `UPDATE purchase_orders SET ${fields} WHERE id = $1 RETURNING *`,
    [orderId, ...values]
  );
  return result.rows[0];
}

export async function deletePurchaseOrder(orderId: number): Promise<boolean> {
  const result = await db.query('DELETE FROM purchase_orders WHERE id = $1', [orderId]);
  return result.rowCount > 0;
}
