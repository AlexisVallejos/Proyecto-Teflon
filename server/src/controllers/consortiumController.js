import {
  approveConsortiumQuota,
  createConsortiumClub,
  createConsortiumError,
  generateMonthlyQuotas,
  getClubPortalPayload,
  getConsortiumConfig,
  getConsortiumDrawByMonth,
  listClubQuotas,
  listClubWinningDrawsForUser,
  listConsortiumClubs,
  listConsortiumDraws,
  listConsortiumQuotas,
  runConsortiumDraw,
  updateConsortiumClub,
  updateConsortiumClubStatus,
  updateConsortiumConfig,
  uploadQuotaProof,
} from '../services/consortiumService.js';

export function handleConsortiumError(err, res, next) {
  if (err?.status || err?.code) {
    return res.status(err.status || 400).json({ error: err.code || err.message || 'consortium_error' });
  }
  return next(err);
}

function requireTenant(req) {
  if (!req.tenant?.id) {
    throw createConsortiumError('tenant_required', 400);
  }
  return req.tenant.id;
}

export async function getClubMeHandler(req, res, next) {
  try {
    const tenantId = requireTenant(req);
    const payload = await getClubPortalPayload(tenantId, req.user.id);
    return res.json(payload);
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function getClubQuotasHandler(req, res, next) {
  try {
    const tenantId = requireTenant(req);
    const items = await listClubQuotas(tenantId, req.user.id);
    return res.json({ items });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function uploadClubQuotaProofHandler(req, res, next) {
  try {
    const tenantId = requireTenant(req);
    if (!req.file) {
      return res.status(400).json({ error: 'proof_required' });
    }
    const protocol = req.get('x-forwarded-proto') || req.protocol;
    const host = req.get('host');
    const proofUrl = `${protocol}://${host}/uploads/comprobantes/${req.file.filename}`;
    const quota = await uploadQuotaProof({
      tenantId,
      userId: req.user.id,
      quotaId: req.params.id || req.params.quotaId,
      proofUrl,
    });
    return res.json({ ok: true, proof_url: proofUrl, quota });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function getClubDrawsHandler(req, res, next) {
  try {
    const tenantId = requireTenant(req);
    const items = await listClubWinningDrawsForUser(tenantId, req.user.id);
    return res.json({ items });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function listAdminClubsHandler(req, res, next) {
  try {
    const items = await listConsortiumClubs(requireTenant(req), req.query);
    return res.json({ items });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function createAdminClubHandler(req, res, next) {
  try {
    const club = await createConsortiumClub(requireTenant(req), req.body || {});
    return res.status(201).json({ item: club });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function updateAdminClubHandler(req, res, next) {
  try {
    const club = await updateConsortiumClub(requireTenant(req), req.params.id, req.body || {});
    return res.json({ item: club });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function updateAdminClubStatusHandler(req, res, next) {
  try {
    const club = await updateConsortiumClubStatus(
      requireTenant(req),
      req.params.id,
      req.body?.estado || req.body?.status
    );
    return res.json({ item: club });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function listAdminQuotasHandler(req, res, next) {
  try {
    const tenantId = requireTenant(req);
    if (req.query.generate === 'true') {
      await generateMonthlyQuotas(tenantId, req.query.mes || req.query.month);
    }
    const items = await listConsortiumQuotas(tenantId, req.query);
    return res.json({ items });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function generateAdminQuotasHandler(req, res, next) {
  try {
    const result = await generateMonthlyQuotas(requireTenant(req), req.body?.mes || req.body?.month);
    return res.json(result);
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function approveAdminQuotaHandler(req, res, next) {
  try {
    const quota = await approveConsortiumQuota(requireTenant(req), req.params.id);
    return res.json({ item: quota });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function runAdminDrawHandler(req, res, next) {
  try {
    const result = await runConsortiumDraw({
      tenantId: requireTenant(req),
      month: req.body?.mes || req.body?.month,
      userId: req.user?.id || null,
    });
    return res.status(201).json(result);
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function listAdminDrawsHandler(req, res, next) {
  try {
    const items = await listConsortiumDraws(requireTenant(req));
    return res.json({ items });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function getAdminDrawByMonthHandler(req, res, next) {
  try {
    const draw = await getConsortiumDrawByMonth(requireTenant(req), req.params.mes || req.params.month);
    return res.json({ item: draw });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function getAdminConfigHandler(req, res, next) {
  try {
    const config = await getConsortiumConfig(requireTenant(req));
    return res.json({ config });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}

export async function updateAdminConfigHandler(req, res, next) {
  try {
    const config = await updateConsortiumConfig(requireTenant(req), req.body || {});
    return res.json({ config });
  } catch (err) {
    return handleConsortiumError(err, res, next);
  }
}
