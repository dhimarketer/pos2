// backend/user.ts

import { Role } from './permissions';
import { db } from './index'; // Import the database pool

export interface User {
  id: number;
  username: string;
  role: Role;
}

export async function createUser(username: string, passwordHash: string, role: Role): Promise<User> {
  const result = await db.query(
    'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
    [username, passwordHash, role]
  );
  return result.rows[0];
}

export async function getUser(id: number): Promise<User | undefined> {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0];
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
  const fields = Object.keys(updates).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
  const values = Object.values(updates);
  const result = await db.query(
    `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  return result.rows[0];
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
  return result.rowCount > 0;
}
