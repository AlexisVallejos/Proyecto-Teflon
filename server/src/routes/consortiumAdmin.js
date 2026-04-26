import express from 'express';
import { resolveTenant } from '../middleware/tenant.js';
import {
  approveAdminQuotaHandler,
  createAdminClubHandler,
  generateAdminQuotasHandler,
  getAdminConfigHandler,
  getAdminDrawByMonthHandler,
  listAdminClubsHandler,
  listAdminDrawsHandler,
  listAdminQuotasHandler,
  runAdminDrawHandler,
  updateAdminClubHandler,
  updateAdminClubStatusHandler,
  updateAdminConfigHandler,
} from '../controllers/consortiumController.js';

export const consortiumAdminRouter = express.Router();

consortiumAdminRouter.use(resolveTenant);

consortiumAdminRouter.get('/clubs', listAdminClubsHandler);
consortiumAdminRouter.post('/clubs', createAdminClubHandler);
consortiumAdminRouter.put('/clubs/:id', updateAdminClubHandler);
consortiumAdminRouter.patch('/clubs/:id/status', updateAdminClubStatusHandler);

consortiumAdminRouter.get('/quotas', listAdminQuotasHandler);
consortiumAdminRouter.post('/quotas/generate', generateAdminQuotasHandler);
consortiumAdminRouter.patch('/quotas/:id/approve', approveAdminQuotaHandler);

consortiumAdminRouter.post('/draws', runAdminDrawHandler);
consortiumAdminRouter.get('/draws', listAdminDrawsHandler);
consortiumAdminRouter.get('/draws/:mes', getAdminDrawByMonthHandler);

consortiumAdminRouter.get('/config', getAdminConfigHandler);
consortiumAdminRouter.put('/config', updateAdminConfigHandler);
