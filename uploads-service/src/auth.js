import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { HttpError } from './errors.js';
import { sanitizeUsername } from './storage.js';

const verifyOptions = {};
if (config.jwtIssuer) verifyOptions.issuer = config.jwtIssuer;
if (config.jwtAudience) verifyOptions.audience = config.jwtAudience;

const readBearerToken = (req) => {
  const authHeader = String(req.get('authorization') || '').trim();
  if (!/^bearer\s+/i.test(authHeader)) return '';
  return authHeader.replace(/^bearer\s+/i, '').trim();
};

export const normalizeUserFromJwt = (payload = {}) => {
  const id = String(payload.sub || payload.id || payload.user_id || '').trim();
  const email = String(payload.email || '').trim().toLowerCase();
  const preferredUsername = String(
    payload.username ||
    payload.preferred_username ||
    payload.name ||
    ''
  ).trim();

  const usernameSource =
    preferredUsername ||
    (email.includes('@') ? email.split('@')[0] : '') ||
    id;

  const username = sanitizeUsername(usernameSource);
  if (!id || !username) {
    throw new HttpError(401, 'invalid_token_subject');
  }

  return {
    id,
    username,
    email,
    role: payload.role || null,
    tenantId: payload.tenant_id || payload.tenantId || null,
  };
};

export const authenticate = (req, res, next) => {
  const token = readBearerToken(req);
  if (!token) return next(new HttpError(401, 'unauthorized'));

  try {
    const payload = jwt.verify(token, config.jwtSecret, verifyOptions);
    req.user = normalizeUserFromJwt(payload);
    req.jwt = payload;
    return next();
  } catch (err) {
    return next(new HttpError(401, 'invalid_token'));
  }
};

export const signExampleToken = ({ sub = 'demo-user-id', username = 'teflon', email = 'teflon@vase.ar' } = {}) =>
  jwt.sign(
    {
      sub,
      username,
      email,
      role: 'user',
    },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

