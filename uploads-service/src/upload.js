import multer from 'multer';
import { allowedMimeTypes, config } from './config.js';
import { HttpError } from './errors.js';
import { ensureUserDir, sanitizeFilename } from './storage.js';

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const dir = await ensureUserDir(req.user.username);
      cb(null, dir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, sanitizeFilename(file.originalname));
  },
});

export const uploadSingleFile = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new HttpError(415, 'unsupported_file_type', file.mimetype));
      return;
    }
    cb(null, true);
  },
}).single('file');

