import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isPiquimTenantIdentity,
  resolveTenantBrandName,
  resolveTenantDesignPreset,
} from './tenantBranding.js';

test('does not classify Teflon as PIQUIM when stale settings contain the PIQUIM preset', () => {
  const tenant = {
    name: 'Sanitarios El Teflon',
    external_tenant_slug: 'teflon',
  };
  const settings = {
    branding: {
      name: 'Sanitarios El Teflon',
      design_preset: 'piquim',
    },
  };

  assert.equal(isPiquimTenantIdentity({ tenant, settings }), false);
  assert.equal(resolveTenantDesignPreset({ tenant, settings }), 'sanitarios_industrial');
  assert.equal(resolveTenantBrandName({ tenant, settings }), 'Sanitarios El Teflon');
});

test('classifies the PIQUIM tenant as PIQUIM without requiring an explicit preset', () => {
  const tenant = {
    name: 'PIQUIM',
    external_tenant_slug: 'piquim',
  };
  const settings = {
    branding: {
      name: 'PIQUIM',
    },
  };

  assert.equal(isPiquimTenantIdentity({ tenant, settings }), true);
  assert.equal(resolveTenantDesignPreset({ tenant, settings }), 'piquim');
});

test('classifies PIQUIN typo as PIQUIM brand tenant', () => {
  const tenant = {
    name: 'Piquin',
    external_tenant_slug: 'piquin',
  };

  assert.equal(isPiquimTenantIdentity({ tenant, settings: {} }), true);
  assert.equal(resolveTenantDesignPreset({ tenant, settings: {} }), 'piquim');
});

test('keeps an explicit non-PIQUIM preset for non-PIQUIM tenants', () => {
  const tenant = {
    name: 'Sanitarios El Teflon',
    external_tenant_slug: 'teflon',
  };
  const settings = {
    branding: {
      name: 'Sanitarios El Teflon',
      design_preset: 'home_decor',
    },
  };

  assert.equal(resolveTenantDesignPreset({ tenant, settings }), 'home_decor');
});

test('uses tenant identity before stale branding name', () => {
  const tenant = {
    name: 'Sanitarios El Teflon',
    external_tenant_slug: 'teflon',
  };
  const settings = {
    branding: {
      name: 'PIQUIM',
      design_preset: 'piquim',
    },
  };

  assert.equal(isPiquimTenantIdentity({ tenant, settings }), false);
  assert.equal(resolveTenantDesignPreset({ tenant, settings }), 'sanitarios_industrial');
  assert.equal(resolveTenantBrandName({ tenant, settings }), 'Sanitarios El Teflon');
});
