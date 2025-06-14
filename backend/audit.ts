// backend/audit.ts

import { Pool } from 'pg';

const pool: any = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  description: string;
  timestamp: string;
}

export async function logAction(userId: number, action: string, description: string): Promise<AuditLog> {
  const timestamp = new Date().toISOString();
  try {
    const result = await pool.query(
      'INSERT INTO audit_trail (userId, action, description, timestamp) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, action, description, timestamp]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting audit log:', error);
    throw error;
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const result = await pool.query('SELECT * FROM audit_trail');
    return result.rows;
  } catch (error) {
    console.error('Error retrieving audit logs:', error);
    throw error;
  }
}
