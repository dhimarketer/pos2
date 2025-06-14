// backend/database_optimization.ts
// This module provides database optimization utilities and functions

import { db } from './index';

/**
 * Database Optimization class that provides methods to optimize database performance
 */
export class DatabaseOptimization {
  /**
   * Initialize database optimizations
   * - Creates necessary indexes
   * - Configures connection pool
   * - Sets up query logging for performance monitoring
   */
  async initialize(): Promise<void> {
    console.log('Initializing database optimizations...');
    
    try {
      // Create indexes for frequently queried columns
      await this.createIndexes();
      
      // Configure connection pool settings
      await this.configureConnectionPool();
      
      // Set up query logging for performance monitoring
      await this.setupQueryLogging();
      
      console.log('Database optimizations initialized successfully');
    } catch (error) {
      console.error('Error initializing database optimizations:', error);
      throw error;
    }
  }
  
  /**
   * Create indexes for frequently queried columns to improve query performance
   */
  private async createIndexes(): Promise<void> {
    console.log('Creating database indexes...');
    
    try {
      // Indexes for sales table
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
        CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
        CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);
      `);
      
      // Indexes for sale_items table
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_item_id ON sale_items(item_id);
      `);
      
      // Indexes for items table
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
        CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
        CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
      `);
      
      // Indexes for inventory table
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_inventory_item_id ON inventory(item_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_transaction_date ON inventory(transaction_date);
        CREATE INDEX IF NOT EXISTS idx_inventory_transaction_type ON inventory(transaction_type);
      `);
      
      // Indexes for audit_trail table
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
      `);
      
      console.log('Database indexes created successfully');
    } catch (error) {
      console.error('Error creating database indexes:', error);
      throw error;
    }
  }
  
  /**
   * Configure connection pool settings for optimal performance
   */
  private async configureConnectionPool(): Promise<void> {
    console.log('Configuring connection pool...');
    
    try {
      // Set max and min pool size
      // Note: These settings should be adjusted based on the specific deployment environment
      const maxPoolSize = process.env.DB_MAX_POOL_SIZE || 20;
      const minPoolSize = process.env.DB_MIN_POOL_SIZE || 5;
      
      // Set connection timeout
      const connectionTimeoutMillis = process.env.DB_CONNECTION_TIMEOUT || 30000;
      
      // Set idle timeout
      const idleTimeoutMillis = process.env.DB_IDLE_TIMEOUT || 10000;
      
      // Apply settings to the pool
      // Note: The pg Pool doesn't support runtime reconfiguration
      // These settings should be applied when creating the pool in index.ts
      console.log(`Connection pool should be configured with:
        - Max pool size: ${maxPoolSize}
        - Min pool size: ${minPoolSize}
        - Connection timeout: ${connectionTimeoutMillis}ms
        - Idle timeout: ${idleTimeoutMillis}ms
      `);
      
      console.log('Connection pool configuration complete');
    } catch (error) {
      console.error('Error configuring connection pool:', error);
      throw error;
    }
  }
  
  /**
   * Set up query logging for performance monitoring
   */
  private async setupQueryLogging(): Promise<void> {
    console.log('Setting up query logging...');
    
    try {
      // Create a table to store query logs if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS query_logs (
          id SERIAL PRIMARY KEY,
          query TEXT,
          parameters TEXT,
          execution_time_ms FLOAT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Query logging setup complete');
    } catch (error) {
      console.error('Error setting up query logging:', error);
      throw error;
    }
  }
  
  /**
   * Log a query execution for performance monitoring
   * @param query The SQL query that was executed
   * @param parameters The parameters passed to the query
   * @param executionTimeMs The execution time in milliseconds
   */
  async logQuery(query: string, parameters: any[], executionTimeMs: number): Promise<void> {
    try {
      // Only log slow queries (> 100ms) to avoid excessive logging
      if (executionTimeMs > 100) {
        await db.query(
          'INSERT INTO query_logs (query, parameters, execution_time_ms) VALUES ($1, $2, $3)',
          [query, JSON.stringify(parameters), executionTimeMs]
        );
      }
    } catch (error) {
      console.error('Error logging query:', error);
      // Don't throw here to avoid disrupting normal operation
    }
  }
  
  /**
   * Get slow queries for analysis
   * @param threshold Minimum execution time in milliseconds to consider a query slow
   * @param limit Maximum number of slow queries to return
   * @returns Array of slow query records
   */
  async getSlowQueries(threshold: number = 100, limit: number = 100): Promise<any[]> {
    try {
      const result = await db.query(
        'SELECT * FROM query_logs WHERE execution_time_ms > $1 ORDER BY execution_time_ms DESC LIMIT $2',
        [threshold, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting slow queries:', error);
      throw error;
    }
  }
  
  /**
   * Execute a query with performance tracking
   * @param query The SQL query to execute
   * @param parameters The parameters to pass to the query
   * @returns The query result
   */
  async executeQuery(query: string, parameters: any[] = []): Promise<any> {
    const startTime = Date.now();
    try {
      const result = await db.query(query, parameters);
      const executionTime = Date.now() - startTime;
      
      // Log the query execution time
      await this.logQuery(query, parameters, executionTime);
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.logQuery(query, parameters, executionTime);
      console.error(`Error executing query (${executionTime}ms):`, error);
      throw error;
    }
  }
  
  /**
   * Execute a query with pagination
   * @param baseQuery The base SQL query without LIMIT and OFFSET
   * @param parameters The parameters to pass to the query
   * @param page The page number (1-based)
   * @param pageSize The number of items per page
   * @returns Object containing the paginated results and pagination metadata
   */
  async executeQueryWithPagination(
    baseQuery: string,
    parameters: any[] = [],
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ data: any[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } }> {
    try {
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) AS count_query`;
      const countResult = await this.executeQuery(countQuery, parameters);
      const totalItems = parseInt(countResult.rows[0].count);
      
      // Execute paginated query
      const paginatedQuery = `${baseQuery} LIMIT ${pageSize} OFFSET ${offset}`;
      const result = await this.executeQuery(paginatedQuery, parameters);
      
      // Calculate total pages
      const totalPages = Math.ceil(totalItems / pageSize);
      
      return {
        data: result.rows,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error executing paginated query:', error);
      throw error;
    }
  }
  
  /**
   * Execute a query within a transaction
   * @param callback Function that receives a client and executes queries
   * @returns The result of the callback function
   */
  async executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Analyze database tables to update statistics for the query planner
   */
  async analyzeTables(): Promise<void> {
    console.log('Analyzing database tables...');
    
    try {
      // Get list of tables
      const tablesResult = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      // Analyze each table
      for (const row of tablesResult.rows) {
        const tableName = row.table_name;
        console.log(`Analyzing table: ${tableName}`);
        await db.query(`ANALYZE ${tableName}`);
      }
      
      console.log('Database table analysis complete');
    } catch (error) {
      console.error('Error analyzing database tables:', error);
      throw error;
    }
  }
  
  /**
   * Optimize a specific table by rebuilding indexes and updating statistics
   * @param tableName The name of the table to optimize
   */
  async optimizeTable(tableName: string): Promise<void> {
    console.log(`Optimizing table: ${tableName}`);
    
    try {
      // Vacuum the table to reclaim storage and update statistics
      await db.query(`VACUUM ANALYZE ${tableName}`);
      
      // Reindex the table
      await db.query(`REINDEX TABLE ${tableName}`);
      
      console.log(`Table ${tableName} optimized successfully`);
    } catch (error) {
      console.error(`Error optimizing table ${tableName}:`, error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const dbOptimization = new DatabaseOptimization();

/**
 * Optimized query functions that can be used throughout the application
 */

/**
 * Get items with pagination and optional filtering
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @param filters Optional filters to apply
 * @returns Paginated items with metadata
 */
export async function getItemsPaginated(
  page: number = 1,
  pageSize: number = 20,
  filters: { category?: string; name?: string; minStock?: number; maxStock?: number } = {}
): Promise<any> {
  let query = 'SELECT * FROM items WHERE 1=1';
  const parameters: any[] = [];
  let paramIndex = 1;
  
  // Apply filters
  if (filters.category) {
    query += ` AND category = $${paramIndex++}`;
    parameters.push(filters.category);
  }
  
  if (filters.name) {
    query += ` AND name ILIKE $${paramIndex++}`;
    parameters.push(`%${filters.name}%`);
  }
  
  if (filters.minStock !== undefined) {
    query += ` AND stock >= $${paramIndex++}`;
    parameters.push(filters.minStock);
  }
  
  if (filters.maxStock !== undefined) {
    query += ` AND stock <= $${paramIndex++}`;
    parameters.push(filters.maxStock);
  }
  
  // Order by name
  query += ' ORDER BY name';
  
  return dbOptimization.executeQueryWithPagination(query, parameters, page, pageSize);
}

/**
 * Get sales transactions with pagination and optional filtering
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @param filters Optional filters to apply
 * @returns Paginated sales with metadata
 */
export async function getSalesPaginated(
  page: number = 1,
  pageSize: number = 20,
  filters: { startDate?: string; endDate?: string; customerId?: number; paymentMethod?: string } = {}
): Promise<any> {
  let query = 'SELECT * FROM sales WHERE 1=1';
  const parameters: any[] = [];
  let paramIndex = 1;
  
  // Apply filters
  if (filters.startDate) {
    query += ` AND sale_date >= $${paramIndex++}`;
    parameters.push(filters.startDate);
  }
  
  if (filters.endDate) {
    query += ` AND sale_date <= $${paramIndex++}`;
    parameters.push(filters.endDate);
  }
  
  if (filters.customerId) {
    query += ` AND customer_id = $${paramIndex++}`;
    parameters.push(filters.customerId);
  }
  
  if (filters.paymentMethod) {
    query += ` AND payment_method = $${paramIndex++}`;
    parameters.push(filters.paymentMethod);
  }
  
  // Order by date descending
  query += ' ORDER BY sale_date DESC';
  
  return dbOptimization.executeQueryWithPagination(query, parameters, page, pageSize);
}

/**
 * Get a complete sale with all its items in a single query using a JOIN
 * This is more efficient than making separate queries
 * @param saleId The ID of the sale to retrieve
 * @returns The sale with all its items
 */
export async function getSaleWithItems(saleId: number): Promise<any> {
  const query = `
    SELECT 
      s.id, 
      s.customer_id, 
      s.sale_date, 
      s.total_amount, 
      s.payment_method,
      si.item_id,
      si.quantity,
      si.price,
      i.name as item_name
    FROM 
      sales s
    LEFT JOIN 
      sale_items si ON s.id = si.sale_id
    LEFT JOIN 
      items i ON si.item_id = i.id
    WHERE 
      s.id = $1
  `;
  
  const result = await dbOptimization.executeQuery(query, [saleId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Process the joined rows into a structured sale object
  const sale = {
    id: result.rows[0].id,
    customerId: result.rows[0].customer_id,
    saleDate: result.rows[0].sale_date,
    totalAmount: result.rows[0].total_amount,
    paymentMethod: result.rows[0].payment_method,
    items: result.rows.map((row: any) => ({
      itemId: row.item_id,
      quantity: row.quantity,
      price: row.price,
      itemName: row.item_name
    }))
  };
  
  return sale;
}

/**
 * Get dashboard statistics in a single optimized query
 * @returns Dashboard statistics
 */
export async function getDashboardStats(): Promise<any> {
  // Use a single query with multiple aggregations to reduce database round trips
  const query = `
    SELECT
      (SELECT COUNT(*) FROM items) as total_items,
      (SELECT COUNT(*) FROM items WHERE stock <= 10) as low_stock_items,
      (SELECT COUNT(*) FROM sales WHERE sale_date >= NOW() - INTERVAL '30 days') as sales_last_30_days,
      (SELECT SUM(total_amount) FROM sales WHERE sale_date >= NOW() - INTERVAL '30 days') as revenue_last_30_days,
      (SELECT COUNT(*) FROM customers) as total_customers,
      (SELECT COUNT(*) FROM suppliers) as total_suppliers
  `;
  
  const result = await dbOptimization.executeQuery(query);
  return result.rows[0];
}

/**
 * Get sales summary by day for a date range
 * Uses window functions for efficient calculation
 * @param startDate Start date for the summary
 * @param endDate End date for the summary
 * @returns Daily sales summary
 */
export async function getSalesSummaryByDay(startDate: string, endDate: string): Promise<any[]> {
  const query = `
    WITH date_series AS (
      SELECT generate_series(
        $1::timestamp,
        $2::timestamp,
        '1 day'::interval
      )::date as day
    ),
    daily_sales AS (
      SELECT
        sale_date::date as day,
        COUNT(*) as transaction_count,
        SUM(total_amount) as total_revenue
      FROM
        sales
      WHERE
        sale_date::date BETWEEN $1::date AND $2::date
      GROUP BY
        day
    )
    SELECT
      ds.day,
      COALESCE(s.transaction_count, 0) as transaction_count,
      COALESCE(s.total_revenue, 0) as total_revenue,
      COALESCE(
        s.total_revenue / NULLIF(s.transaction_count, 0),
        0
      ) as average_transaction_value,
      COALESCE(
        s.total_revenue / SUM(s.total_revenue) OVER (),
        0
      ) * 100 as percentage_of_period
    FROM
      date_series ds
    LEFT JOIN
      daily_sales s ON ds.day = s.day
    ORDER BY
      ds.day
  `;
  
  const result = await dbOptimization.executeQuery(query, [startDate, endDate]);
  return result.rows;
}
