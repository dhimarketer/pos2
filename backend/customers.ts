// backend/customers.ts

import { db } from './index'; // Import the database pool

export interface Customer {
  id: number;
  name: string;
  contactInfo: string;
  address: string;
  purchaseHistory: string;
}

export async function createCustomer(name: string, contactInfo: string, address: string, purchaseHistory: string): Promise<Customer> {
  const result = await db.query(
    'INSERT INTO customers (name, contact_info, address, purchase_history) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, contactInfo, address, purchaseHistory]
  );
  return result.rows[0];
}

export async function getCustomer(id: number): Promise<Customer | undefined> {
  const result = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateCustomer(id: number, updates: Partial<Customer>): Promise<Customer | undefined> {
  const fields = Object.keys(updates).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
  const values = Object.values(updates);
  const result = await db.query(
    `UPDATE customers SET ${fields} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

export async function deleteCustomer(id: number): Promise<boolean> {
  const result = await db.query('DELETE FROM customers WHERE id = $1', [id]);
  return result.rowCount > 0;
}
