import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function debug() {
  try {
    const res = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenant_settings';
    `);
    console.log('--- ESTRUCTURA DE tenant_settings ---');
    console.table(res.rows);
    
    const constraints = await pool.query(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'tenant_settings'::regclass;
    `);
    console.log('--- RESTRICCIONES ---');
    console.table(constraints.rows);
    
  } catch (err) {
    console.error('Error debugging DB:', err);
  } finally {
    await pool.end();
  }
}

debug();
