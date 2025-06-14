// backend/user.ts

import { Role } from './permissions';
import { db } from './db'; // Import the database pool
import { validateUserRegistration } from './userValidation';
import { errorHandler } from './error-handler';
import { Request, Response, NextFunction } from 'express';

export interface User {
  id: number;
  username: string;
  role: Role;
}

export async function createUser(username: string, passwordHash: string, role: Role): Promise<User> {
  try {
    const result = await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
      [username, passwordHash, role]
    );
    return result.rows[0];
  } catch (error: any) {
    errorHandler(error, {} as Request, {} as Response, {} as NextFunction);
    throw error;
  }
}

export async function getUser(id: number): Promise<User | undefined> {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  } catch (error: any) {
    errorHandler(error, {} as Request, {} as Response, {} as NextFunction);
    throw error;
  }
}

export async function updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
  try {
    const fields = Object.keys(updates).map((field, index) => `"${field}" = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    const result = await db.query(
      `UPDATE users SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  } catch (error: any) {
    errorHandler(error, {} as Request, {} as Response, {} as NextFunction);
    throw error;
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error: any) {
    errorHandler(error, {} as Request, {} as Response, {} as NextFunction);
    throw error;
  }
}
