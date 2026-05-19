import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mime from 'mime-types';
import { config } from './config.js';
import { HttpError, notFound } from './errors.js';

const RESERVED_NAMES = new Set(['.', '..', 'con', 'prn', 'aux', 'nul']);

export const sanitizeUsername = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (!normalized || RESERVED_NAMES.has(normalized)) return '';
  return normalized;
};

export const sanitizeFilename = (value) => {
  const original = path.basename(String(value || 'file'));
  const ext = path.extname(original).toLowerCase();
  const base = path
    .basename(original, ext)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'file';

  return `${Date.now()}-${crypto.randomUUID()}-${base}${ext}`;
};

export const getUserDir = (username) => {
  const safeUsername = sanitizeUsername(username);
  if (!safeUsername) throw new HttpError(400, 'invalid_username');
  return path.join(config.uploadsRoot, safeUsername);
};

export const ensureUserDir = async (username) => {
  const dir = getUserDir(username);
  await fs.mkdir(dir, { recursive: true });
  return dir;
};

export const resolveUserFilePath = (username, filename) => {
  const dir = getUserDir(username);
  const safeName = path.basename(String(filename || ''));
  if (!safeName || safeName !== filename) {
    throw new HttpError(400, 'invalid_filename');
  }

  const filePath = path.resolve(dir, safeName);
  const resolvedDir = path.resolve(dir);
  if (!filePath.startsWith(`${resolvedDir}${path.sep}`)) {
    throw new HttpError(400, 'invalid_path');
  }

  return filePath;
};

export const getFileMetadata = async (username, filename) => {
  const filePath = resolveUserFilePath(username, filename);
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    throw notFound('file_not_found');
  }
  if (!stat.isFile()) throw notFound('file_not_found');

  return {
    filePath,
    stat,
    mimeType: mime.lookup(filePath) || 'application/octet-stream',
  };
};

export const listUserFiles = async (username) => {
  const dir = await ensureUserDir(username);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const filePath = path.join(dir, entry.name);
        const stat = await fs.stat(filePath);
        return {
          filename: entry.name,
          size: stat.size,
          mime_type: mime.lookup(filePath) || 'application/octet-stream',
          updated_at: stat.mtime.toISOString(),
          private_url: `${config.publicBaseUrl}/files/${encodeURIComponent(username)}/${encodeURIComponent(entry.name)}`,
        };
      })
  );

  return files.sort((left, right) => String(right.updated_at).localeCompare(String(left.updated_at)));
};

