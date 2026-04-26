import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../db.js';
import {
  getEmailCompanyName,
  normalizeDisplayName,
  normalizeEmailInput,
  sendSmtpEmail,
} from './mailer.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLUB_STATUSES = new Set(['pending', 'active', 'suspended']);
const QUOTA_STATUSES = new Set(['pendiente', 'en_revision', 'pagada', 'vencida']);

export function createConsortiumError(code, status = 400) {
  const error = new Error(code);
  error.code = code;
  error.status = status;
  return error;
}

export function isUuid(value) {
  return UUID_REGEX.test(String(value || ''));
}

export function normalizeMonth(value = '') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}$/.test(raw)) return raw;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function validateMonth(value = '') {
  const month = normalizeMonth(value);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw createConsortiumError('invalid_month');
  }
  return month;
}

function toMoney(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : fallback;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeClubPayload(payload = {}) {
  const nombre = String(payload.nombre || payload.name || '').trim();
  const responsable = String(payload.responsable || payload.manager || '').trim();
  const email = normalizeEmailInput(payload.email || payload.contact_email);
  if (!nombre) throw createConsortiumError('club_name_required');
  if (!responsable) throw createConsortiumError('club_responsable_required');
  if (!email) throw createConsortiumError('club_email_required');

  const estado = String(payload.estado || payload.status || 'pending').trim().toLowerCase();
  return {
    nombre,
    responsable,
    email,
    telefono: String(payload.telefono || payload.phone || '').trim(),
    cuit: String(payload.cuit || payload.tax_id || '').trim(),
    direccion: String(payload.direccion || payload.address || '').trim(),
    estado: CLUB_STATUSES.has(estado) ? estado : 'pending',
    password: String(payload.password || '').trim(),
  };
}

function normalizeConfigPayload(payload = {}) {
  const bankTransfer = payload.bank_transfer && typeof payload.bank_transfer === 'object'
    ? payload.bank_transfer
    : {};
  return {
    monthly_fee: toMoney(payload.monthly_fee ?? payload.monthlyFee, 1),
    max_active_clubs: Math.max(1, toInt(payload.max_active_clubs ?? payload.maxActiveClubs, 200)),
    reminder_days: Math.max(1, toInt(payload.reminder_days ?? payload.reminderDays, 5)),
    quota_due_day: Math.max(1, Math.min(28, toInt(payload.quota_due_day ?? payload.quotaDueDay, 10))),
    bank_transfer: {
      cbu: String(bankTransfer.cbu || '').trim(),
      alias: String(bankTransfer.alias || '').trim(),
      bank: String(bankTransfer.bank || '').trim(),
      holder: String(bankTransfer.holder || '').trim(),
    },
  };
}

function generatePassword() {
  return crypto.randomBytes(6).toString('base64url');
}

function buildPortalUrl() {
  const direct = String(process.env.PUBLIC_CLUB_PORTAL_URL || '').trim();
  if (direct) return direct;

  const base = String(
    process.env.PUBLIC_WEB_URL ||
      process.env.PUBLIC_ADMIN_URL ||
      process.env.PUBLIC_API_URL ||
      ''
  ).trim().replace(/\/+$/, '');

  return base ? `${base}/consorcio` : '/consorcio';
}

async function getTenantMailContext(tenantId) {
  const fallbackEmail = normalizeEmailInput(process.env.ADMIN_EMAIL || process.env.SMTP_USER || '');
  const result = await pool.query(
    [
      'select t.name, ts.branding, ts.commerce',
      'from tenants t',
      'left join tenant_settings ts on ts.tenant_id = t.id',
      'where t.id = $1',
      'limit 1',
    ].join(' '),
    [tenantId]
  );

  const row = result.rows[0] || {};
  const branding = row.branding || {};
  const commerce = row.commerce || {};
  return {
    companyName: getEmailCompanyName(branding.name || row.name || ''),
    adminEmail: normalizeEmailInput(commerce.order_notification_email || commerce.email || fallbackEmail),
    whatsappNumber: String(commerce.whatsapp_number || '').replace(/\D/g, ''),
  };
}

async function sendConsortiumEmail({ to, subject, lines = [], htmlLines = [], logPrefix = 'consortium' }) {
  const text = lines.filter(Boolean).join('\n');
  const html = htmlLines.length
    ? htmlLines.filter(Boolean).join('')
    : lines.filter(Boolean).map((line) => `<p>${line}</p>`).join('');
  return sendSmtpEmail({ to, subject, text, html, logPrefix });
}

async function sendClubCredentialsEmail({ tenantId, club, password = '' }) {
  const { companyName } = await getTenantMailContext(tenantId);
  const portalUrl = buildPortalUrl();
  const subject = `Acceso al Consorcio de Clubes - ${companyName}`;
  const lines = [
    `Hola ${club.responsable || club.nombre},`,
    '',
    `Tu club "${club.nombre}" fue habilitado en el Consorcio de Clubes.`,
    `Portal: ${portalUrl}`,
    `Usuario: ${club.email}`,
    password ? `Clave temporal: ${password}` : 'Usa la clave que ya tenias asociada a este email.',
    '',
    'Desde el portal podes consultar cuotas, subir comprobantes y ver sorteos.',
    '',
    `Equipo de ${companyName}`,
  ];
  return sendConsortiumEmail({
    to: club.email,
    subject,
    lines,
    logPrefix: 'consortium-club-credentials',
  });
}

async function sendQuotaProofReceivedEmail({ tenantId, club, quota }) {
  const { companyName } = await getTenantMailContext(tenantId);
  return sendConsortiumEmail({
    to: club.email,
    subject: `Comprobante recibido - ${companyName}`,
    lines: [
      `Hola ${club.responsable || club.nombre},`,
      '',
      `Recibimos el comprobante de la cuota ${quota.mes}.`,
      'El pago quedo en revision hasta que administracion lo apruebe manualmente.',
      '',
      `Portal: ${buildPortalUrl()}`,
    ],
    logPrefix: 'consortium-proof-received',
  });
}

async function sendQuotaApprovedEmail({ tenantId, club, quota }) {
  const { companyName } = await getTenantMailContext(tenantId);
  return sendConsortiumEmail({
    to: club.email,
    subject: `Cuota aprobada - ${companyName}`,
    lines: [
      `Hola ${club.responsable || club.nombre},`,
      '',
      `Tu cuota ${quota.mes} fue marcada como pagada.`,
      'Ya estas habilitado para participar del sorteo correspondiente si aplica.',
      '',
      `Portal: ${buildPortalUrl()}`,
    ],
    logPrefix: 'consortium-quota-approved',
  });
}

async function sendQuotaReminderEmail({ tenantId, club, quota, overdue = false }) {
  const { companyName } = await getTenantMailContext(tenantId);
  const subject = overdue
    ? `Cuota vencida del Consorcio - ${companyName}`
    : `Tu cuota del Consorcio esta proxima a vencer - ${companyName}`;
  return sendConsortiumEmail({
    to: club.email,
    subject,
    lines: [
      `Hola ${club.responsable || club.nombre},`,
      '',
      overdue
        ? `La cuota ${quota.mes} figura vencida.`
        : `La cuota ${quota.mes} vence el ${quota.fecha_vencimiento || 'proximo vencimiento'}.`,
      `Monto: $${Number(quota.monto || 0).toFixed(2)}`,
      'Podes ingresar al portal y subir el comprobante de transferencia.',
      '',
      `Portal: ${buildPortalUrl()}`,
    ],
    logPrefix: overdue ? 'consortium-quota-overdue' : 'consortium-quota-reminder',
  });
}

async function sendWinnerEmail({ tenantId, club, month }) {
  const { companyName } = await getTenantMailContext(tenantId);
  return sendConsortiumEmail({
    to: club.email,
    subject: `Resultado del sorteo ${month} - ${companyName}`,
    lines: [
      `Hola ${club.responsable || club.nombre},`,
      '',
      `Tu club "${club.nombre}" resulto seleccionado en el sorteo ${month}.`,
      'Administracion se contactara para coordinar el beneficio/despacho.',
      '',
      `Portal: ${buildPortalUrl()}`,
    ],
    logPrefix: 'consortium-draw-winner',
  });
}

async function sendAdminProofUploadedEmail({ tenantId, club, quota, proofUrl }) {
  const { companyName, adminEmail } = await getTenantMailContext(tenantId);
  if (!adminEmail) return { sent: false, provider: 'missing_admin_email' };

  const result = await sendConsortiumEmail({
    to: adminEmail,
    subject: `Pago en revision - ${club.nombre}`,
    lines: [
      'Hola,',
      '',
      `El club "${club.nombre}" subio un comprobante para la cuota ${quota.mes}.`,
      `Responsable: ${club.responsable}`,
      `Email: ${club.email}`,
      `Monto: $${Number(quota.monto || 0).toFixed(2)}`,
      `Comprobante: ${proofUrl}`,
      '',
      `Revisalo desde el panel de administracion de ${companyName}.`,
    ],
    logPrefix: 'consortium-admin-proof-uploaded',
  });

  // TODO: WhatsApp notification
  return result;
}

export async function getConsortiumConfig(tenantId) {
  await pool.query(
    [
      'insert into consortium_config (tenant_id)',
      'values ($1)',
      'on conflict (tenant_id) do nothing',
    ].join(' '),
    [tenantId]
  );
  const result = await pool.query(
    'select tenant_id, monthly_fee, max_active_clubs, reminder_days, quota_due_day, bank_transfer, updated_at from consortium_config where tenant_id = $1',
    [tenantId]
  );
  return result.rows[0] || null;
}

export async function updateConsortiumConfig(tenantId, payload = {}) {
  const config = normalizeConfigPayload(payload);
  const result = await pool.query(
    [
      'insert into consortium_config',
      '(tenant_id, monthly_fee, max_active_clubs, reminder_days, quota_due_day, bank_transfer, updated_at)',
      'values ($1, $2, $3, $4, $5, $6::jsonb, now())',
      'on conflict (tenant_id) do update set',
      'monthly_fee = excluded.monthly_fee,',
      'max_active_clubs = excluded.max_active_clubs,',
      'reminder_days = excluded.reminder_days,',
      'quota_due_day = excluded.quota_due_day,',
      'bank_transfer = excluded.bank_transfer,',
      'updated_at = now()',
      'returning tenant_id, monthly_fee, max_active_clubs, reminder_days, quota_due_day, bank_transfer, updated_at',
    ].join(' '),
    [
      tenantId,
      config.monthly_fee,
      config.max_active_clubs,
      config.reminder_days,
      config.quota_due_day,
      config.bank_transfer,
    ]
  );
  return result.rows[0];
}

async function assertCanActivateClub(client, tenantId, excludeClubId = null) {
  const config = await getConsortiumConfig(tenantId);
  const params = [tenantId];
  let where = "tenant_id = $1 and estado = 'active'";
  if (excludeClubId) {
    params.push(excludeClubId);
    where += ` and id <> $${params.length}`;
  }
  const activeRes = await client.query(`select count(*)::int as total from consortium_clubs where ${where}`, params);
  if (Number(activeRes.rows[0]?.total || 0) >= Number(config.max_active_clubs || 200)) {
    throw createConsortiumError('max_active_clubs_reached', 409);
  }
}

async function ensureClubUser(client, tenantId, club, forceNewPassword = false) {
  const existingRes = await client.query(
    'select id, email, role from users where lower(email) = lower($1) limit 1',
    [club.email]
  );
  const password = forceNewPassword || !existingRes.rowCount
    ? (club.password || generatePassword())
    : '';
  let user;

  if (existingRes.rowCount) {
    user = existingRes.rows[0];
    if (['master_admin', 'tenant_admin'].includes(user.role)) {
      throw createConsortiumError('admin_email_cannot_be_club', 409);
    }
    const updates = [];
    const params = [user.id];
    if (forceNewPassword) {
      params.push(await bcrypt.hash(password, 10));
      updates.push(`password_hash = $${params.length}`);
    }
    if (user.role !== 'club') {
      params.push('club');
      updates.push(`role = $${params.length}`);
    }
    if (updates.length) {
      await client.query(`update users set ${updates.join(', ')} where id = $1`, params);
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      [
        'insert into users (email, password_hash, role, status)',
        'values ($1, $2, $3, $4)',
        'returning id, email, role',
      ].join(' '),
      [club.email, passwordHash, 'club', 'active']
    );
    user = userRes.rows[0];
  }

  const membershipStatus = club.estado === 'active'
    ? 'active'
    : club.estado === 'suspended'
      ? 'inactive'
      : 'pending';
  await client.query(
    [
      'insert into user_tenants (user_id, tenant_id, role, status)',
      'values ($1, $2, $3, $4)',
      'on conflict (user_id, tenant_id) do update set',
      "role = 'club',",
      'status = excluded.status',
    ].join(' '),
    [user.id, tenantId, 'club', membershipStatus]
  );

  return { user, password };
}

export async function listConsortiumClubs(tenantId, filters = {}) {
  const params = [tenantId];
  const where = ['c.tenant_id = $1'];
  const status = String(filters.estado || filters.status || '').trim().toLowerCase();
  const search = String(filters.q || filters.search || '').trim();

  if (status && CLUB_STATUSES.has(status)) {
    params.push(status);
    where.push(`c.estado = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    where.push(`(c.nombre ilike $${params.length} or c.email ilike $${params.length} or c.responsable ilike $${params.length})`);
  }

  const result = await pool.query(
    [
      'select c.*,',
      "coalesce((select count(*)::int from consortium_quotas q where q.tenant_id = c.tenant_id and q.club_id = c.id), 0) as quotas_count,",
      "coalesce((select count(*)::int from consortium_quotas q where q.tenant_id = c.tenant_id and q.club_id = c.id and q.estado = 'pagada'), 0) as paid_quotas_count",
      'from consortium_clubs c',
      `where ${where.join(' and ')}`,
      'order by c.created_at desc',
    ].join(' '),
    params
  );
  return result.rows;
}

export async function createConsortiumClub(tenantId, payload = {}) {
  const club = normalizeClubPayload(payload);
  const client = await pool.connect();
  let createdClub;
  let password = '';

  try {
    await client.query('BEGIN');
    if (club.estado === 'active') {
      await assertCanActivateClub(client, tenantId);
    }
    const userResult = await ensureClubUser(client, tenantId, club);
    password = userResult.password;

    const result = await client.query(
      [
        'insert into consortium_clubs',
        '(tenant_id, user_id, nombre, responsable, email, telefono, cuit, direccion, estado)',
        'values ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        'returning *',
      ].join(' '),
      [
        tenantId,
        userResult.user.id,
        club.nombre,
        club.responsable,
        club.email,
        club.telefono,
        club.cuit,
        club.direccion,
        club.estado,
      ]
    );
    createdClub = result.rows[0];
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err?.code === '23505') throw createConsortiumError('club_email_exists', 409);
    throw err;
  } finally {
    client.release();
  }

  if (createdClub.estado === 'active') {
    await sendClubCredentialsEmail({ tenantId, club: createdClub, password });
  }
  return createdClub;
}

export async function updateConsortiumClub(tenantId, clubId, payload = {}) {
  if (!isUuid(clubId)) throw createConsortiumError('invalid_club_id');
  const club = normalizeClubPayload(payload);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    if (club.estado === 'active') {
      await assertCanActivateClub(client, tenantId, clubId);
    }
    const currentRes = await client.query(
      'select * from consortium_clubs where tenant_id = $1 and id = $2 for update',
      [tenantId, clubId]
    );
    if (!currentRes.rowCount) throw createConsortiumError('club_not_found', 404);
    const current = currentRes.rows[0];

    if (current.user_id && current.email !== club.email) {
      const emailConflict = await client.query(
        'select id from users where lower(email) = lower($1) and id <> $2 limit 1',
        [club.email, current.user_id]
      );
      if (emailConflict.rowCount) throw createConsortiumError('club_email_exists', 409);
      await client.query('update users set email = $1 where id = $2', [club.email, current.user_id]);
    }

    if (current.user_id) {
      const membershipStatus = club.estado === 'active'
        ? 'active'
        : club.estado === 'suspended'
          ? 'inactive'
          : 'pending';
      await client.query(
        [
          'update user_tenants',
          'set role = $3, status = $4',
          'where user_id = $1 and tenant_id = $2',
        ].join(' '),
        [current.user_id, tenantId, 'club', membershipStatus]
      );
    }

    const result = await client.query(
      [
        'update consortium_clubs',
        'set nombre = $3, responsable = $4, email = $5, telefono = $6, cuit = $7, direccion = $8, estado = $9, updated_at = now()',
        'where tenant_id = $1 and id = $2',
        'returning *',
      ].join(' '),
      [
        tenantId,
        clubId,
        club.nombre,
        club.responsable,
        club.email,
        club.telefono,
        club.cuit,
        club.direccion,
        club.estado,
      ]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    if (err?.code === '23505') throw createConsortiumError('club_email_exists', 409);
    throw err;
  } finally {
    client.release();
  }
}

export async function updateConsortiumClubStatus(tenantId, clubId, estado) {
  if (!isUuid(clubId)) throw createConsortiumError('invalid_club_id');
  const nextStatus = String(estado || '').trim().toLowerCase();
  if (!CLUB_STATUSES.has(nextStatus)) throw createConsortiumError('invalid_club_status');

  const client = await pool.connect();
  let updatedClub;
  let password = '';
  let shouldSendCredentials = false;

  try {
    await client.query('BEGIN');
    if (nextStatus === 'active') {
      await assertCanActivateClub(client, tenantId, clubId);
    }
    const currentRes = await client.query(
      'select * from consortium_clubs where tenant_id = $1 and id = $2 for update',
      [tenantId, clubId]
    );
    if (!currentRes.rowCount) throw createConsortiumError('club_not_found', 404);
    const current = currentRes.rows[0];

    if (nextStatus === 'active' && current.estado !== 'active') {
      const userResult = await ensureClubUser(client, tenantId, { ...current, estado: nextStatus }, true);
      password = userResult.password;
      shouldSendCredentials = true;
      await client.query(
        'update consortium_clubs set user_id = $3 where tenant_id = $1 and id = $2',
        [tenantId, clubId, userResult.user.id]
      );
    }

    const membershipStatus = nextStatus === 'active'
      ? 'active'
      : nextStatus === 'suspended'
        ? 'inactive'
        : 'pending';

    if (current.user_id) {
      await client.query(
        'update user_tenants set status = $3, role = $4 where user_id = $1 and tenant_id = $2',
        [current.user_id, tenantId, membershipStatus, 'club']
      );
    }

    const result = await client.query(
      [
        'update consortium_clubs',
        'set estado = $3, updated_at = now()',
        'where tenant_id = $1 and id = $2',
        'returning *',
      ].join(' '),
      [tenantId, clubId, nextStatus]
    );
    updatedClub = result.rows[0];
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }

  if (shouldSendCredentials) {
    await sendClubCredentialsEmail({ tenantId, club: updatedClub, password });
  }
  return updatedClub;
}

function buildQuotaDueDate(month, dueDay) {
  return `${month}-${String(Math.max(1, Math.min(28, dueDay))).padStart(2, '0')}`;
}

export async function generateMonthlyQuotas(tenantId, monthInput = '') {
  const month = validateMonth(monthInput);
  const config = await getConsortiumConfig(tenantId);
  const dueDate = buildQuotaDueDate(month, config.quota_due_day || 10);
  const result = await pool.query(
    [
      'insert into consortium_quotas (tenant_id, club_id, mes, monto, estado, fecha_vencimiento)',
      'select c.tenant_id, c.id, $2, $3, $4, $5::date',
      'from consortium_clubs c',
      "where c.tenant_id = $1 and c.estado = 'active'",
      'on conflict (tenant_id, club_id, mes) do nothing',
      'returning *',
    ].join(' '),
    [tenantId, month, config.monthly_fee || 1, 'pendiente', dueDate]
  );
  return { month, created: result.rowCount, items: result.rows };
}

export async function listConsortiumQuotas(tenantId, filters = {}) {
  const params = [tenantId];
  const where = ['q.tenant_id = $1'];
  const month = String(filters.mes || filters.month || '').trim();
  const status = String(filters.estado || filters.status || '').trim().toLowerCase();
  const clubId = String(filters.club_id || filters.clubId || '').trim();

  if (month) {
    params.push(validateMonth(month));
    where.push(`q.mes = $${params.length}`);
  }
  if (status && QUOTA_STATUSES.has(status)) {
    params.push(status);
    where.push(`q.estado = $${params.length}`);
  }
  if (clubId) {
    if (!isUuid(clubId)) throw createConsortiumError('invalid_club_id');
    params.push(clubId);
    where.push(`q.club_id = $${params.length}`);
  }

  const result = await pool.query(
    [
      'select q.*, c.nombre as club_nombre, c.responsable as club_responsable, c.email as club_email, c.telefono as club_telefono',
      'from consortium_quotas q',
      'join consortium_clubs c on c.tenant_id = q.tenant_id and c.id = q.club_id',
      `where ${where.join(' and ')}`,
      'order by q.mes desc, c.nombre asc',
    ].join(' '),
    params
  );
  return result.rows;
}

export async function getClubForUser(tenantId, userId) {
  const result = await pool.query(
    [
      'select *',
      'from consortium_clubs',
      'where tenant_id = $1 and user_id = $2',
      'limit 1',
    ].join(' '),
    [tenantId, userId]
  );
  return result.rows[0] || null;
}

export async function getClubPortalPayload(tenantId, userId) {
  const club = await getClubForUser(tenantId, userId);
  if (!club) throw createConsortiumError('club_not_found', 404);
  const config = await getConsortiumConfig(tenantId);
  await generateMonthlyQuotas(tenantId, normalizeMonth());
  const quotas = await listConsortiumQuotas(tenantId, { club_id: club.id });
  const currentQuota = quotas.find((item) => item.mes === normalizeMonth()) || null;
  const draws = await listClubWinningDraws(tenantId, club.id);
  return { club, config, current_quota: currentQuota, quotas, draws };
}

export async function listClubQuotas(tenantId, userId) {
  const club = await getClubForUser(tenantId, userId);
  if (!club) throw createConsortiumError('club_not_found', 404);
  await generateMonthlyQuotas(tenantId, normalizeMonth());
  return listConsortiumQuotas(tenantId, { club_id: club.id });
}

export async function uploadQuotaProof({ tenantId, userId, quotaId, proofUrl }) {
  if (!isUuid(quotaId)) throw createConsortiumError('invalid_quota_id');
  const club = await getClubForUser(tenantId, userId);
  if (!club) throw createConsortiumError('club_not_found', 404);

  const quotaRes = await pool.query(
    [
      'update consortium_quotas',
      "set estado = 'en_revision', comprobante_url = $4, updated_at = now()",
      'where tenant_id = $1 and id = $2 and club_id = $3',
      'returning *',
    ].join(' '),
    [tenantId, quotaId, club.id, proofUrl]
  );
  if (!quotaRes.rowCount) throw createConsortiumError('quota_not_found', 404);
  const quota = quotaRes.rows[0];

  await Promise.allSettled([
    sendQuotaProofReceivedEmail({ tenantId, club, quota }),
    sendAdminProofUploadedEmail({ tenantId, club, quota, proofUrl }),
  ]);

  return quota;
}

export async function approveConsortiumQuota(tenantId, quotaId) {
  if (!isUuid(quotaId)) throw createConsortiumError('invalid_quota_id');
  const result = await pool.query(
    [
      'update consortium_quotas q',
      "set estado = 'pagada', fecha_pago = now(), updated_at = now()",
      'from consortium_clubs c',
      'where q.tenant_id = $1 and q.id = $2 and c.tenant_id = q.tenant_id and c.id = q.club_id',
      'returning q.*, c.nombre as club_nombre, c.responsable as club_responsable, c.email as club_email',
    ].join(' '),
    [tenantId, quotaId]
  );
  if (!result.rowCount) throw createConsortiumError('quota_not_found', 404);
  const quota = result.rows[0];
  await sendQuotaApprovedEmail({
    tenantId,
    club: {
      nombre: quota.club_nombre,
      responsable: quota.club_responsable,
      email: quota.club_email,
    },
    quota,
  });
  return quota;
}

function shuffle(items = []) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export async function runConsortiumDraw({ tenantId, month: monthInput, userId }) {
  const month = validateMonth(monthInput);
  await generateMonthlyQuotas(tenantId, month);
  const existing = await pool.query(
    'select id from consortium_draws where tenant_id = $1 and mes = $2 limit 1',
    [tenantId, month]
  );
  if (existing.rowCount) throw createConsortiumError('draw_already_exists', 409);

  const eligibleRes = await pool.query(
    [
      'select distinct c.id, c.nombre, c.responsable, c.email',
      'from consortium_clubs c',
      'join consortium_quotas q on q.tenant_id = c.tenant_id and q.club_id = c.id',
      'where c.tenant_id = $1',
      "and c.estado = 'active'",
      'and q.mes = $2',
      "and q.estado = 'pagada'",
      'order by c.nombre asc',
    ].join(' '),
    [tenantId, month]
  );

  if (!eligibleRes.rowCount) throw createConsortiumError('no_eligible_clubs', 400);
  const winners = shuffle(eligibleRes.rows).slice(0, 12);
  const winnerIds = winners.map((club) => club.id);
  const drawRes = await pool.query(
    [
      'insert into consortium_draws (tenant_id, mes, ejecutado_por, ganadores)',
      'values ($1, $2, $3, $4::jsonb)',
      'returning *',
    ].join(' '),
    [tenantId, month, userId || null, winnerIds]
  );

  await Promise.allSettled(winners.map((club) => sendWinnerEmail({ tenantId, club, month })));
  return {
    draw: drawRes.rows[0],
    winners,
    eligible_count: eligibleRes.rowCount,
  };
}

export async function listConsortiumDraws(tenantId) {
  const drawsRes = await pool.query(
    [
      'select d.*, u.email as ejecutado_por_email',
      'from consortium_draws d',
      'left join users u on u.id = d.ejecutado_por',
      'where d.tenant_id = $1',
      'order by d.mes desc',
    ].join(' '),
    [tenantId]
  );
  return Promise.all(drawsRes.rows.map((draw) => hydrateDrawWinners(tenantId, draw)));
}

export async function getConsortiumDrawByMonth(tenantId, monthInput) {
  const month = validateMonth(monthInput);
  const result = await pool.query(
    'select * from consortium_draws where tenant_id = $1 and mes = $2 limit 1',
    [tenantId, month]
  );
  if (!result.rowCount) throw createConsortiumError('draw_not_found', 404);
  return hydrateDrawWinners(tenantId, result.rows[0]);
}

async function hydrateDrawWinners(tenantId, draw) {
  const winnerIds = Array.isArray(draw.ganadores) ? draw.ganadores : [];
  let winners = [];
  if (winnerIds.length) {
    const winnersRes = await pool.query(
      [
        'select id, nombre, responsable, email, telefono',
        'from consortium_clubs',
        'where tenant_id = $1 and id = any($2::uuid[])',
      ].join(' '),
      [tenantId, winnerIds]
    );
    const byId = new Map(winnersRes.rows.map((club) => [club.id, club]));
    winners = winnerIds.map((id) => byId.get(id)).filter(Boolean);
  }
  return { ...draw, winners };
}

export async function listClubWinningDraws(tenantId, clubId) {
  const result = await pool.query(
    [
      'select id, tenant_id, mes, ganadores, created_at',
      'from consortium_draws',
      'where tenant_id = $1 and ganadores ? $2',
      'order by mes desc',
    ].join(' '),
    [tenantId, clubId]
  );
  return result.rows;
}

export async function listClubWinningDrawsForUser(tenantId, userId) {
  const club = await getClubForUser(tenantId, userId);
  if (!club) throw createConsortiumError('club_not_found', 404);
  return listClubWinningDraws(tenantId, club.id);
}

export async function runConsortiumDailyNotifications() {
  const tenantsRes = await pool.query(
    [
      'select distinct tenant_id from consortium_clubs',
      'union',
      'select tenant_id from consortium_config',
    ].join(' ')
  );

  const summary = { tenants: tenantsRes.rowCount, reminders: 0, overdue: 0, generated: 0 };
  for (const row of tenantsRes.rows) {
    const tenantId = row.tenant_id;
    const config = await getConsortiumConfig(tenantId);
    const generated = await generateMonthlyQuotas(tenantId, normalizeMonth());
    summary.generated += generated.created;

    const reminderRes = await pool.query(
      [
        'select q.*, c.nombre, c.responsable, c.email',
        'from consortium_quotas q',
        'join consortium_clubs c on c.tenant_id = q.tenant_id and c.id = q.club_id',
        'where q.tenant_id = $1',
        "and q.estado = 'pendiente'",
        'and q.fecha_vencimiento >= current_date',
        'and q.fecha_vencimiento <= current_date + ($2::int * interval \'1 day\')',
        "and coalesce(q.notification_flags->>'reminder_sent_at', '') = ''",
      ].join(' '),
      [tenantId, config.reminder_days || 5]
    );

    for (const quota of reminderRes.rows) {
      await sendQuotaReminderEmail({
        tenantId,
        club: quota,
        quota,
        overdue: false,
      });
      await pool.query(
        [
          'update consortium_quotas',
          "set notification_flags = notification_flags || jsonb_build_object('reminder_sent_at', now()::text), updated_at = now()",
          'where tenant_id = $1 and id = $2',
        ].join(' '),
        [tenantId, quota.id]
      );
      summary.reminders += 1;
    }

    const overdueRes = await pool.query(
      [
        'update consortium_quotas q',
        "set estado = 'vencida', updated_at = now()",
        'from consortium_clubs c',
        'where q.tenant_id = $1',
        'and c.tenant_id = q.tenant_id and c.id = q.club_id',
        "and q.estado = 'pendiente'",
        'and q.fecha_vencimiento < current_date',
        'returning q.*, c.nombre, c.responsable, c.email',
      ].join(' '),
      [tenantId]
    );

    for (const quota of overdueRes.rows) {
      if (!quota.notification_flags?.overdue_sent_at) {
        await sendQuotaReminderEmail({
          tenantId,
          club: quota,
          quota,
          overdue: true,
        });
        await pool.query(
          [
            'update consortium_quotas',
            "set notification_flags = notification_flags || jsonb_build_object('overdue_sent_at', now()::text), updated_at = now()",
            'where tenant_id = $1 and id = $2',
          ].join(' '),
          [tenantId, quota.id]
        );
      }
      summary.overdue += 1;
    }
  }

  return summary;
}
