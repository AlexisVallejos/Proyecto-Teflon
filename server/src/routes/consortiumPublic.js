import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { resolveTenant } from '../middleware/tenant.js';
import { requireClubRole } from '../middleware/requireClubRole.js';
import {
  getClubDrawsHandler,
  getClubMeHandler,
  getClubQuotasHandler,
  uploadClubQuotaProofHandler,
} from '../controllers/consortiumController.js';

export const consortiumPublicRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const proofsDir = path.join(__dirname, '..', '..', 'uploads', 'comprobantes');

if (!fs.existsSync(proofsDir)) {
  fs.mkdirSync(proofsDir, { recursive: true });
}

const proofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, proofsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
      return;
    }
    cb(new Error('Solo se permiten comprobantes (JPG, PNG, WebP, GIF, PDF)'));
  },
});

consortiumPublicRouter.use(resolveTenant);
consortiumPublicRouter.use(requireClubRole);

consortiumPublicRouter.get('/me', getClubMeHandler);
consortiumPublicRouter.get('/quotas', getClubQuotasHandler);
consortiumPublicRouter.post('/quotas/:id/proof', proofUpload.single('proof'), uploadClubQuotaProofHandler);
consortiumPublicRouter.get('/draws', getClubDrawsHandler);
