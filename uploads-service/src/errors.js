export class HttpError extends Error {
  constructor(status, code, detail = null) {
    super(code);
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

export const notFound = (code = 'not_found') => new HttpError(404, code);

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file_too_large' });
  }

  const status = Number(err?.status || err?.statusCode || 500);
  const code = err?.code || (status === 500 ? 'internal_error' : 'request_error');
  const payload = { error: code };
  if (err?.detail) payload.detail = err.detail;

  if (status >= 500) {
    console.error('[uploads-service]', err);
  }

  return res.status(status).json(payload);
};

