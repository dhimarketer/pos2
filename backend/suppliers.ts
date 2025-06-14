// backend/suppliers.ts

import { db } from './index'; // Import the database pool

export interface Supplier {
  id: number;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  paymentTerms: string;
}

export async function createSupplier(
  companyName: string,
  contactPerson: string,
  phone: string,
  email: string,
  address: string,
  paymentTerms: string
): Promise<Supplier> {
  const result = await db.query(
    'INSERT INTO suppliers (company_name, contact_person, phone, email, address, payment_terms) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [companyName, contactPerson, phone, email, address, paymentTerms]
  );
  return result.rows[0];
}

export async function getSupplier(id: number): Promise<Supplier | undefined> {
  const result = await db.query('SELECT * FROM suppliers WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateSupplier(id: number, updates: Partial<Supplier>): Promise<Supplier | undefined> {
  const fields = Object.keys(updates).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
  const values = Object.values(updates);
  const result = await db.query(
    `UPDATE suppliers SET ${fields} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

export async function deleteSupplier(id: number): Promise<boolean> {
  const result = await db.query('DELETE FROM suppliers WHERE id = $1', [id]);
  return result.rowCount > 0;
}
