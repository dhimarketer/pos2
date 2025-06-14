const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: parseInt(process.env.DB_MAX_POOL_SIZE || '20'), // Maximum number of clients in the pool
  min: parseInt(process.env.DB_MIN_POOL_SIZE || '5'),  // Minimum number of clients in the pool
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'), // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'), // How long to wait for a connection
});

export { pool as db };

// Placeholder function for database setup
async function setupDatabase() {
  console.log('Setting up the database...');
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      sku TEXT UNIQUE,
      name TEXT UNIQUE,
      description TEXT,
      category TEXT,
      costPrice REAL,
      packagingUnit TEXT,
      stock INTEGER,
      multiLevelPricing TEXT,
      status TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT,
      contactInfo TEXT,
      address TEXT,
      purchaseHistory TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      companyName TEXT,
      contactPerson TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      paymentTerms TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS purchase_orders (
      id SERIAL PRIMARY KEY,
      supplierId INTEGER,
      itemId INTEGER,
      quantity INTEGER,
      cost REAL,
      orderDate TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS sales_transactions (
      id SERIAL PRIMARY KEY,
      itemId INTEGER,
      customerId INTEGER,
      quantity INTEGER,
      price REAL,
      saleDate TEXT,
      paymentType TEXT
    );`);

    await pool.query(`CREATE TABLE IF NOT EXISTS audit_trail (
      id SERIAL PRIMARY KEY,
      userId INTEGER,
      action TEXT,
      description TEXT,
      timestamp TEXT
    );`);

    console.log('Database setup complete.');
  } catch (err) {
    console.error("Error setting up database:", err);
  }
}

export { setupDatabase };
