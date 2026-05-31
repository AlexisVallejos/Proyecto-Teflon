import { pool } from './src/db.js';

async function cleanDatabase() {
    console.log('--- INICIANDO LIMPIEZA TOTAL DE BASE DE DATOS (PROYECTO TEFLON) ---');

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Eliminar todos los tenants (Borra páginas, dominios, ajustes, categorías, productos, etc en cascada)
        const deleteTenantsRes = await client.query(`
            DELETE FROM tenants 
            RETURNING id
        `);

        console.log(`✅ Se eliminaron todos los tenants (${deleteTenantsRes.rowCount}) y sus datos en cascada.`);

        // 2. Eliminar todos los usuarios
        const deleteUsersRes = await client.query(`
            DELETE FROM users 
        `);

        console.log(`✅ Se eliminaron todos los usuarios (${deleteUsersRes.rowCount}).`);

        await client.query('COMMIT');
        console.log('--- LIMPIEZA TOTAL COMPLETADA CON ÉXITO ---');
        console.log('Ahora la base de datos está completamente vacía (sin tenants ni usuarios).');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error durante la limpieza:', e);
    } finally {
        client.release();
        pool.end();
    }
}

cleanDatabase();
