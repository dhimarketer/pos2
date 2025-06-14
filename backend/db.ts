const dotenv = require('dotenv');

dotenv.config();

const { Pool } = require('pg');
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
