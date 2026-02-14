import dotenv from 'dotenv';
dotenv.config();

import { pool } from './db.js';
import app from './app.js';

// Verify DB connection on startup
const dbHost = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'NOT SET';
console.log(`Checking DB connection to: ${dbHost}`);
pool.query('SELECT 1').then(() => console.log('DB Connection OK')).catch(e => console.error('DB Connection FAILED:', e.message));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
