import express from 'express';
import { errorHandler, notFound } from './errors.js';
import { router } from './routes.js';
import { securityMiddleware } from './security.js';

export const app = express();

app.set('trust proxy', true);
app.disable('x-powered-by');

app.use(securityMiddleware);
app.use(router);
app.use((req, res, next) => next(notFound()));
app.use(errorHandler);

