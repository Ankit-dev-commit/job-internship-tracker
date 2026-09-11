import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isRemoteDb =
  process.env.DB_HOST &&
  process.env.DB_HOST !== 'localhost' &&
  process.env.DB_HOST !== '127.0.0.1';

const enableSsl =
  process.env.DB_SSL === 'true' ||
  (isRemoteDb && process.env.DB_SSL !== 'false');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  ssl: enableSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export default pool;
