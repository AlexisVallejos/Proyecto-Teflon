import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const res = await pool.query('SELECT id, name FROM tenants ORDER BY created_at DESC');
    console.log('--- TIENDAS EN LA BASE DE DATOS ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error checking tenants:', err);
  } finally {
    await pool.end();
  }
}

check();
