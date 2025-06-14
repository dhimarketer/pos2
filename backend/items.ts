// backend/items.ts

import { db } from './index'; // Import the database pool

export interface Item {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  costPrice: number;
  packagingUnit: string;
  stock: number; // Changed from stockLevel to stock to match database schema
  multiLevelPricing: string;
  status: string;
}

export async function createItem(
  sku: string,
  name: string,
  description: string,
  category: string,
  costPrice: number,
  packagingUnit: string,
  stock: number, // Changed from stockLevel to stock
  multiLevelPricing: string,
  status: string
): Promise<Item> {
  const result = await db.query(
    'INSERT INTO items (sku, name, description, category, cost_price, packaging_unit, stock, multi_level_pricing, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
    [sku, name, description, category, costPrice, packagingUnit, stock, multiLevelPricing, status]
  );
  return result.rows[0];
}

export async function getItem(id: number): Promise<Item | undefined> {
  const result = await db.query('SELECT * FROM items WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateItem(id: number, updates: Partial<Item>): Promise<Item | undefined> {
  const fields = Object.keys(updates).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
  const values = Object.values(updates);
  const result = await db.query(
    `UPDATE items SET ${fields} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

export async function adjustStockLevel(id: number, quantity: number): Promise<Item | undefined> {
  const result = await db.query(
    'UPDATE items SET stock = stock + $1 WHERE id = $2 RETURNING *',
    [quantity, id]
  );
  return result.rows[0];
}

export async function deleteItem(id: number): Promise<boolean> {
  const result = await db.query('DELETE FROM items WHERE id = $1', [id]);
  return result.rowCount > 0;
}
