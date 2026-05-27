export const PIQUIM_DESIGN_PRESET = 'piquim';
export const DEFAULT_NON_PIQUIM_DESIGN_PRESET = 'sanitarios_industrial';

const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const tenantIdentityValues = (tenant = {}) => [
  tenant?.name,
  tenant?.slug,
  tenant?.external_tenant_slug,
  tenant?.externalTenantSlug,
].filter((value) => String(value || '').trim());

const brandingIdentityValues = (settings = {}) => {
  const branding = settings?.branding || {};
  return [
    branding?.tenant_slug,
    branding?.external_tenant_slug,
    branding?.name,
  ].filter((value) => String(value || '').trim());
};

export const isPiquimTenantIdentity = ({ tenant = {}, settings = {} } = {}) =>
  (tenantIdentityValues(tenant).length ? tenantIdentityValues(tenant) : brandingIdentityValues(settings)).some((value) => {
    const normalized = normalizeText(value);
    return normalized === 'piquim' || normalized.includes('piquim');
  });

export const resolveTenantBrandName = ({ tenant = {}, settings = {}, fallback = 'Sanitarios El Teflon' } = {}) => {
  const tenantName = String(tenant?.name || '').trim();
  const brandingName = String(settings?.branding?.name || '').trim();
  const piquim = isPiquimTenantIdentity({ tenant, settings });

  if (!piquim && tenantIdentityValues(tenant).length && normalizeText(brandingName).includes('piquim')) {
    return tenantName || fallback;
  }

  return brandingName || tenantName || fallback;
};

export const resolveTenantDesignPreset = ({ tenant = {}, settings = {} } = {}) => {
  if (isPiquimTenantIdentity({ tenant, settings })) {
    return PIQUIM_DESIGN_PRESET;
  }

  const rawPreset = normalizeText(settings?.branding?.design_preset);
  if (rawPreset && rawPreset !== PIQUIM_DESIGN_PRESET) {
    return rawPreset;
  }

  return DEFAULT_NON_PIQUIM_DESIGN_PRESET;
};
