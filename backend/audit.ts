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

let auditLogs: AuditLog[] = [];

export async function logAction(userId: number, action: string, description: string): Promise<AuditLog> {
  const timestamp = new Date().toISOString();
  try {
    const result = await pool.query(
      'INSERT INTO audit_trail (userId, action, description, timestamp) VALUES ($1, $2, $3, $4) RETURNING id',
      [userId, action, description, timestamp]
    );
    const id = result.rows[0].id;
    const newLog: AuditLog = { id, userId, action, description, timestamp };
    auditLogs.push(newLog); // Keep in-memory for now
    return newLog;
  } catch (error) {
    console.error('Error inserting audit log:', error);
    throw error;
  }
}

export function getAuditLogs(): AuditLog[] {
  return auditLogs;
}
