import { pool } from '../db.js';

export const validateApiKey = async (req, res, next) => {
    const apiKey = req.get('x-api-key') || req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({ error: 'api_key_required' });
    }

    try {
        const result = await pool.query(
            'select id, tenant_id, scope from api_tokens where token_hash = $1',
            [apiKey] // In a real app, this would be hashed
        );

        if (!result.rowCount) {
            return res.status(403).json({ error: 'invalid_api_key' });
        }

        req.apiKey = result.rows[0];
        req.tenantId = req.apiKey.tenant_id;
        next();
    } catch (err) {
        next(err);
    }
};
