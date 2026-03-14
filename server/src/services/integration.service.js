import { pool } from '../db.js';

let productSyncSchemaReady = false;
let productSyncSchemaPromise = null;

const DEFAULT_SOURCE_SYSTEM = 'erp';

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toTextOrNull = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const readNumeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const hasOwn = (source, key) => Object.prototype.hasOwnProperty.call(source || {}, key);

const normalizeImageCollection = (images, fallbackAlt) => {
  if (!Array.isArray(images) || !images.length) return null;

  const normalized = images
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const url = entry.trim();
        if (!url) return null;
        return { url, alt: fallbackAlt || 'Producto', primary: index === 0 };
      }

      if (!isPlainObject(entry)) return null;
      const url = String(entry.url || entry.src || '').trim();
      if (!url) return null;
      return {
        url,
        alt: String(entry.alt || fallbackAlt || 'Producto').trim() || 'Producto',
        primary: entry.primary === true || index === 0,
      };
    })
    .filter(Boolean);

  if (!normalized.length) return null;
  if (!normalized.some((item) => item.primary)) {
    normalized[0] = { ...normalized[0], primary: true };
  }

  return normalized;
};

const normalizeSyncItem = (rawItem, fallbackSourceSystem = DEFAULT_SOURCE_SYSTEM) => {
  const raw = isPlainObject(rawItem) ? rawItem : {};
  const externalId = toTextOrNull(raw.external_id ?? raw.externalId ?? raw.id);
  const sourceSystem =
    toTextOrNull(raw.source_system ?? raw.sourceSystem ?? raw.origin ?? fallbackSourceSystem) || DEFAULT_SOURCE_SYSTEM;
  const name = toTextOrNull(raw.name) || toTextOrNull(raw.title) || toTextOrNull(raw.sku) || externalId || 'Producto sincronizado';
  const sku = toTextOrNull(raw.sku) || externalId;
  const description = hasOwn(raw, 'description') ? toTextOrNull(raw.description) : null;
  const brand = hasOwn(raw, 'brand') ? toTextOrNull(raw.brand) : null;
  const priceRetail = readNumeric(raw.price_retail ?? raw.priceRetail ?? raw.price);
  const priceWholesale = readNumeric(raw.price_wholesale ?? raw.priceWholesale);
  const stock = readNumeric(raw.stock ?? raw.inventory ?? raw.quantity);

  const rawIsActive = hasOwn(raw, 'is_active')
    ? raw.is_active
    : hasOwn(raw, 'isActive')
      ? raw.isActive
      : hasOwn(raw, 'active')
        ? raw.active
        : undefined;
  const hasIsActive = rawIsActive !== undefined;
  const isActiveSource = hasIsActive ? rawIsActive !== false : true;

  const rawDeletedAt = raw.deleted_at ?? raw.deletedAt ?? null;
  const explicitDeleted = raw.deleted === true || raw.is_deleted === true;
  const parsedDeletedAt = rawDeletedAt ? new Date(rawDeletedAt) : null;
  const deletedAt = explicitDeleted
    ? new Date()
    : parsedDeletedAt instanceof Date && !Number.isNaN(parsedDeletedAt.getTime())
      ? parsedDeletedAt
      : null;

  return {
    externalId,
    sourceSystem,
    sku,
    name,
    description,
    brand,
    hasDescription: hasOwn(raw, 'description'),
    hasBrand: hasOwn(raw, 'brand'),
    hasPriceRetail: priceRetail != null,
    hasPriceWholesale: priceWholesale != null,
    hasStock: stock != null,
    hasIsActive,
    priceRetail,
    priceWholesale,
    stock,
    isActiveSource,
    images: normalizeImageCollection(raw.images, name),
    hasImages: hasOwn(raw, 'images'),
    deletedAt,
    rawPayload: raw,
  };
};

const buildProductDataFromSync = ({ existingData, item, allowEditorialSync }) => {
  const next = isPlainObject(existingData) ? { ...existingData } : {};

  if (allowEditorialSync && item.hasImages) {
    next.images = item.images || [];
  }

  return next;
};

const dedupeItemsByExternalId = (items) => {
  const byExternalId = new Map();
  for (const rawItem of Array.isArray(items) ? items : []) {
    const normalized = normalizeSyncItem(rawItem);
    if (!normalized.externalId) continue;
    byExternalId.set(normalized.externalId, normalized);
  }
  return [...byExternalId.values()];
};

async function upsertSyncMetadata(client, { tenantId, productId, externalId, sourceSystem, lastSyncAt, rawPayload }) {
  await client.query(
    [
      'insert into product_sync_metadata (tenant_id, product_id, external_id, source_system, last_sync_at, raw_payload, updated_at)',
      'values ($1, $2, $3, $4, $5, $6::jsonb, now())',
      'on conflict (tenant_id, external_id)',
      'do update set',
      'product_id = excluded.product_id,',
      'source_system = excluded.source_system,',
      'last_sync_at = excluded.last_sync_at,',
      'raw_payload = excluded.raw_payload,',
      'updated_at = now()',
    ].join(' '),
    [tenantId, productId, externalId, sourceSystem, lastSyncAt, JSON.stringify(rawPayload || {})]
  );
}

export async function ensureProductSyncSchema() {
  if (productSyncSchemaReady) return;

  if (!productSyncSchemaPromise) {
    productSyncSchemaPromise = (async () => {
      const client = await pool.connect();
      try {
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS external_id varchar');
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS source_system varchar');
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS is_active_source boolean NOT NULL DEFAULT true');
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS is_visible_web boolean NOT NULL DEFAULT true');
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS admin_locked boolean NOT NULL DEFAULT false');
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS deleted_at timestamptz');
        await client.query('ALTER TABLE product_cache ADD COLUMN IF NOT EXISTS last_sync_at timestamptz');

        await client.query(
          [
            'CREATE TABLE IF NOT EXISTS product_sync_metadata (',
            'id uuid PRIMARY KEY DEFAULT gen_random_uuid(),',
            'product_id uuid NOT NULL REFERENCES product_cache(id) ON DELETE CASCADE,',
            'tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,',
            'external_id varchar NOT NULL,',
            'source_system varchar NOT NULL,',
            'last_sync_at timestamptz NULL,',
            "raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,",
            'created_at timestamptz NOT NULL DEFAULT now(),',
            'updated_at timestamptz NOT NULL DEFAULT now()',
            ')',
          ].join(' ')
        );

        await client.query(
          [
            'CREATE UNIQUE INDEX IF NOT EXISTS product_sync_metadata_tenant_external_id_uidx',
            'ON product_sync_metadata(tenant_id, external_id)',
          ].join(' ')
        );

        await client.query(
          [
            'CREATE UNIQUE INDEX IF NOT EXISTS product_cache_tenant_external_id_uidx',
            'ON product_cache(tenant_id, external_id)',
            'WHERE external_id IS NOT NULL',
          ].join(' ')
        );

        await client.query(
          [
            'CREATE INDEX IF NOT EXISTS product_cache_tenant_visibility_sync_idx',
            'ON product_cache(tenant_id, status, is_active_source, is_visible_web, deleted_at)',
          ].join(' ')
        );

        await client.query(
          [
            'CREATE INDEX IF NOT EXISTS product_sync_metadata_tenant_last_sync_idx',
            'ON product_sync_metadata(tenant_id, last_sync_at DESC)',
          ].join(' ')
        );

        productSyncSchemaReady = true;
      } finally {
        client.release();
      }
    })().catch((err) => {
      productSyncSchemaPromise = null;
      throw err;
    });
  }

  await productSyncSchemaPromise;
}

export async function syncIntegrationProducts({
  tenantId,
  items,
  sourceSystem = DEFAULT_SOURCE_SYSTEM,
}) {
  await ensureProductSyncSchema();

  const normalizedItems = dedupeItemsByExternalId(
    (Array.isArray(items) ? items : []).map((item) => ({
      ...(isPlainObject(item) ? item : {}),
      source_system: item?.source_system ?? item?.sourceSystem ?? sourceSystem,
    }))
  );

  if (!normalizedItems.length) {
    return {
      ok: true,
      tenant_id: tenantId,
      source_system: sourceSystem,
      total: 0,
      created: 0,
      updated: 0,
    };
  }

  const externalIds = normalizedItems.map((item) => item.externalId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existingRes = await client.query(
      [
        'select p.id, p.erp_id, p.external_id, p.sku, p.name, p.description, p.price, p.price_wholesale, p.stock, p.brand,',
        'p.data, p.status, p.admin_locked, p.deleted_at, p.is_active_source,',
        'm.external_id as metadata_external_id',
        'from product_cache p',
        'left join product_sync_metadata m on m.product_id = p.id and m.tenant_id = p.tenant_id',
        'where p.tenant_id = $1',
        'and (p.external_id = any($2::varchar[]) or p.erp_id = any($2::varchar[]) or m.external_id = any($2::varchar[]))',
      ].join(' '),
      [tenantId, externalIds]
    );

    const existingByExternalId = new Map();
    for (const row of existingRes.rows) {
      [row.external_id, row.erp_id, row.metadata_external_id]
        .map((value) => toTextOrNull(value))
        .filter(Boolean)
        .forEach((key) => {
          if (!existingByExternalId.has(key)) {
            existingByExternalId.set(key, row);
          }
        });
    }

    let created = 0;
    let updated = 0;
    const syncedAt = new Date();

    for (const item of normalizedItems) {
      const existing = existingByExternalId.get(item.externalId);
      if (!existing) {
        const productData = buildProductDataFromSync({
          existingData: {},
          item,
          allowEditorialSync: true,
        });
        const insertRes = await client.query(
          [
            'insert into product_cache (',
            'tenant_id, erp_id, external_id, source_system, sku, name, description, price, price_wholesale, stock, brand, data,',
            'is_active_source, is_visible_web, admin_locked, deleted_at, last_sync_at',
            ') values (',
            '$1, $2, $3, $4, $5, $6, $7, $8, $9, greatest($10, 0), $11, $12::jsonb, $13, $14, $15, $16, $17',
            ') returning id',
          ].join(' '),
          [
            tenantId,
            item.externalId,
            item.externalId,
            item.sourceSystem,
            item.sku,
            item.name,
            item.description,
            item.hasPriceRetail ? item.priceRetail : 0,
            item.hasPriceWholesale ? item.priceWholesale : (item.hasPriceRetail ? item.priceRetail : 0),
            item.hasStock ? item.stock : 0,
            item.brand,
            JSON.stringify(productData),
            item.hasIsActive ? item.isActiveSource : true,
            true,
            false,
            item.deletedAt,
            syncedAt,
          ]
        );

        const productId = insertRes.rows[0].id;
        await upsertSyncMetadata(client, {
          tenantId,
          productId,
          externalId: item.externalId,
          sourceSystem: item.sourceSystem,
          lastSyncAt: syncedAt,
          rawPayload: item.rawPayload,
        });

        created += 1;
        continue;
      }

      const allowEditorialSync = existing.admin_locked !== true;
      const nextPrice = item.hasPriceRetail ? item.priceRetail : Number(existing.price || 0);
      const nextPriceWholesale = item.hasPriceWholesale
        ? item.priceWholesale
        : Number(existing.price_wholesale ?? nextPrice ?? 0);
      const nextStock = item.hasStock ? item.stock : Number(existing.stock || 0);
      const nextIsActiveSource = item.hasIsActive ? item.isActiveSource : existing.is_active_source !== false;
      const nextName = allowEditorialSync ? item.name : existing.name;
      const nextSku = allowEditorialSync ? item.sku : existing.sku;
      const nextDescription = allowEditorialSync
        ? (item.hasDescription ? item.description : existing.description)
        : existing.description;
      const nextBrand = allowEditorialSync
        ? (item.hasBrand ? item.brand : existing.brand)
        : existing.brand;
      const nextDeletedAt = allowEditorialSync && !existing.deleted_at && item.deletedAt
        ? item.deletedAt
        : existing.deleted_at;
      const nextData = buildProductDataFromSync({
        existingData: existing.data,
        item,
        allowEditorialSync,
      });

      await client.query(
        [
          'update product_cache',
          'set erp_id = $3,',
          'external_id = $4,',
          'source_system = $5,',
          'sku = $6,',
          'name = $7,',
          'description = $8,',
          'price = $9,',
          'price_wholesale = $10,',
          'stock = greatest($11, 0),',
          'brand = $12,',
          'data = $13::jsonb,',
          'is_active_source = $14,',
          'deleted_at = $15,',
          'last_sync_at = $16,',
          'updated_at = now()',
          'where tenant_id = $1 and id = $2',
        ].join(' '),
        [
          tenantId,
          existing.id,
          item.externalId,
          item.externalId,
          item.sourceSystem,
          nextSku,
          nextName,
          nextDescription,
          nextPrice,
          nextPriceWholesale,
          nextStock,
          nextBrand,
          JSON.stringify(nextData),
          nextIsActiveSource,
          nextDeletedAt,
          syncedAt,
        ]
      );

      await upsertSyncMetadata(client, {
        tenantId,
        productId: existing.id,
        externalId: item.externalId,
        sourceSystem: item.sourceSystem,
        lastSyncAt: syncedAt,
        rawPayload: item.rawPayload,
      });

      updated += 1;
    }

    await client.query('COMMIT');
    return {
      ok: true,
      tenant_id: tenantId,
      source_system: sourceSystem,
      total: normalizedItems.length,
      created,
      updated,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
