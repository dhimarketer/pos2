import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

// Setup test database connection
const testPool = new Pool({
  user: process.env.TEST_DB_USER,
  host: process.env.TEST_DB_HOST,
  database: process.env.TEST_DB_NAME,
  password: process.env.TEST_DB_PASSWORD,
  port: parseInt(process.env.TEST_DB_PORT || '5432'),
});

// Mock the database module
jest.mock('../index', () => ({
  db: testPool
}));

// Global test hooks
beforeAll(async () => {
  // Create test database tables
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      role TEXT
    );
    
    CREATE TABLE IF NOT EXISTS items (
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
    );
    
    // Add other test tables as needed
  `);
});

afterEach(async () => {
  // Clear test data after each test
  await testPool.query('TRUNCATE TABLE users, items CASCADE');
});

afterAll(async () => {
  // Close database connection
  await testPool.end();
});
