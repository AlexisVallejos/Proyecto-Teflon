import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { HttpError } from './errors.js';

export const createPublicFileToken = ({ username, filename, ttlSeconds = config.publicLinkTtlSeconds }) =>
  jwt.sign(
    {
      typ: 'public-file',
      username,
      filename,
    },
    config.publicUrlSecret,
    { expiresIn: Number(ttlSeconds) || config.publicLinkTtlSeconds }
  );

export const verifyPublicFileToken = (token) => {
  try {
    const payload = jwt.verify(token, config.publicUrlSecret);
    if (payload?.typ !== 'public-file' || !payload?.username || !payload?.filename) {
      throw new Error('invalid_payload');
    }
    return payload;
  } catch {
    throw new HttpError(401, 'invalid_public_token');
  }
};

