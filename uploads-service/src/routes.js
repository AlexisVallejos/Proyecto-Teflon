import express from 'express';
import fs from 'node:fs/promises';
import { authenticate, signExampleToken } from './auth.js';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { createPublicFileToken, verifyPublicFileToken } from './publicLinks.js';
import { getFileMetadata, listUserFiles, resolveUserFilePath } from './storage.js';
import { uploadSingleFile } from './upload.js';

export const router = express.Router();

const ensureOwnFolder = (req, requestedUsername) => {
  if (req.user.username !== requestedUsername) {
    throw new HttpError(403, 'forbidden_folder');
  }
};

const sendFile = async (res, metadata, { attachment = false } = {}) => {
  res.setHeader('Content-Type', metadata.mimeType);
  res.setHeader('Content-Length', metadata.stat.size);
  res.setHeader('Cache-Control', 'private, max-age=0, must-revalidate');
  if (attachment) {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(metadata.filePath.split(/[\\/]/).pop())}"`);
  }
  return res.sendFile(metadata.filePath);
};

router.get('/health', (req, res) => {
  res.json({ ok: true, service: 'vase-uploads-service' });
});

router.get('/auth/example-token', (req, res) => {
  if (config.env === 'production') {
    return res.status(404).json({ error: 'not_found' });
  }
  return res.json({
    token: signExampleToken(),
    header: 'Authorization: Bearer TOKEN',
  });
});

router.post('/upload', authenticate, (req, res, next) => {
  uploadSingleFile(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(new HttpError(400, 'file_required'));

    return res.status(201).json({
      ok: true,
      user: req.user.username,
      filename: req.file.filename,
      size: req.file.size,
      mime_type: req.file.mimetype,
      private_url: `${config.publicBaseUrl}/files/${encodeURIComponent(req.user.username)}/${encodeURIComponent(req.file.filename)}`,
    });
  });
});

router.get('/files', authenticate, async (req, res, next) => {
  try {
    const files = await listUserFiles(req.user.username);
    return res.json({ ok: true, user: req.user.username, files });
  } catch (err) {
    return next(err);
  }
});

router.get('/files/:user/:filename', authenticate, async (req, res, next) => {
  try {
    ensureOwnFolder(req, req.params.user);
    const metadata = await getFileMetadata(req.params.user, req.params.filename);
    return sendFile(res, metadata, { attachment: req.query.download === '1' });
  } catch (err) {
    return next(err);
  }
});

router.delete('/files/:user/:filename', authenticate, async (req, res, next) => {
  try {
    ensureOwnFolder(req, req.params.user);
    const filePath = resolveUserFilePath(req.params.user, req.params.filename);
    await fs.unlink(filePath);
    return res.json({ ok: true, deleted: req.params.filename });
  } catch (err) {
    if (err?.code === 'ENOENT') return next(new HttpError(404, 'file_not_found'));
    return next(err);
  }
});

router.post('/files/:filename/public-url', authenticate, express.json({ limit: '8kb' }), async (req, res, next) => {
  try {
    await getFileMetadata(req.user.username, req.params.filename);
    const ttlSeconds = Number(req.body?.ttl_seconds || config.publicLinkTtlSeconds);
    const token = createPublicFileToken({
      username: req.user.username,
      filename: req.params.filename,
      ttlSeconds,
    });
    return res.json({
      ok: true,
      public_url: `${config.publicBaseUrl}/public/${encodeURIComponent(token)}`,
      expires_in_seconds: ttlSeconds,
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/public/:token', async (req, res, next) => {
  try {
    const payload = verifyPublicFileToken(req.params.token);
    const metadata = await getFileMetadata(payload.username, payload.filename);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return sendFile(res, metadata);
  } catch (err) {
    return next(err);
  }
});

