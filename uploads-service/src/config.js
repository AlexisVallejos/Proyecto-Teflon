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

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3010),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtIssuer: process.env.JWT_ISSUER || undefined,
  jwtAudience: process.env.JWT_AUDIENCE || undefined,
  uploadsRoot: path.resolve(process.env.UPLOADS_ROOT || '/data/uploads'),
  publicBaseUrl: String(process.env.PUBLIC_BASE_URL || 'https://uploads.vase.ar').replace(/\/+$/, ''),
  publicUrlSecret: process.env.PUBLIC_URL_SECRET || process.env.JWT_SECRET || 'dev-public-secret',
  maxFileSizeBytes: toInt(process.env.MAX_FILE_SIZE_MB, 50) * 1024 * 1024,
  publicLinkTtlSeconds: toInt(process.env.PUBLIC_LINK_TTL_SECONDS, 7 * 24 * 60 * 60),
  corsOrigins: splitList(process.env.CORS_ORIGIN || 'https://vase.ar,https://editor.vase.ar'),
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

