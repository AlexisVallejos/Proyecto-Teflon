import path from 'node:path';

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const firstPartyCorsOrigins = Object.freeze([
  'https://vase.ar',
  'https://app.vase.ar',
  'https://business.vase.ar',
  'https://editor.vase.ar',
]);

export const resolveCorsOrigins = (value = process.env.CORS_ORIGIN) =>
  [...new Set([...firstPartyCorsOrigins, ...splitList(value)])];

export const resolveTrustProxySetting = (value = process.env.TRUST_PROXY) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return 1;

  const normalized = rawValue.toLowerCase();
  if (normalized === 'true') return 1;
  if (normalized === 'false') return false;

  const numericValue = Number.parseInt(rawValue, 10);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  return rawValue;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3010),
  jwtSecret: process.env.UPLOADS_JWT_SECRET || process.env.JWT_SECRET || process.env.AUTH_SECRET || 'dev-secret',
  jwtIssuer: process.env.JWT_ISSUER || undefined,
  jwtAudience: process.env.JWT_AUDIENCE || undefined,
  uploadsRoot: path.resolve(process.env.UPLOADS_ROOT || '/data/uploads'),
  publicBaseUrl: String(process.env.PUBLIC_BASE_URL || 'https://uploads.vase.ar').replace(/\/+$/, ''),
  publicUrlSecret: process.env.PUBLIC_URL_SECRET || process.env.JWT_SECRET || 'dev-public-secret',
  maxFileSizeBytes: toInt(process.env.MAX_FILE_SIZE_MB, 50) * 1024 * 1024,
  publicLinkTtlSeconds: toInt(process.env.PUBLIC_LINK_TTL_SECONDS, 7 * 24 * 60 * 60),
  corsOrigins: resolveCorsOrigins(),
  rateLimitWindowMs: toInt(process.env.RATE_LIMIT_WINDOW_SECONDS, 15 * 60) * 1000,
  rateLimitMax: toInt(process.env.RATE_LIMIT_MAX, 5000),
  publicFolders: splitList(process.env.PUBLIC_FOLDERS || 'vase-business-products'),
  publicFolderPrefixes: splitList(process.env.PUBLIC_FOLDER_PREFIXES || 'products-'),
  trustProxy: resolveTrustProxySetting(),
};

export const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
]);
