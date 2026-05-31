import test from 'node:test';
import assert from 'node:assert/strict';

import { getTenantHeaders } from './api.js';

const originalWindow = globalThis.window;
const originalLocalStorage = globalThis.localStorage;

function setWindowLocation({ host, hostname = host, pathname = '/', storage = {} }) {
  const store = new Map(Object.entries(storage));
  const localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
  };

  globalThis.localStorage = localStorage;
  globalThis.window = {
    location: {
      host,
      hostname,
      pathname,
    },
    localStorage,
  };
}

test.afterEach(() => {
  globalThis.window = originalWindow;
  globalThis.localStorage = originalLocalStorage;
});

test('getTenantHeaders sends storefront host on public tenant storefronts', () => {
  setWindowLocation({ host: 'teflon.vase.ar', pathname: '/' });

  assert.deepEqual(getTenantHeaders(), {
    'X-Storefront-Host': 'teflon.vase.ar',
  });
});

test('getTenantHeaders uses Vase user tenant over cached editor tenant', () => {
  const userTenantId = '11111111-1111-4111-8111-111111111111';
  const cachedTenantId = '22222222-2222-4222-8222-222222222222';
  setWindowLocation({
    host: 'editor.vase.ar',
    pathname: '/admin/evolution',
    storage: {
      teflon_active_tenant: cachedTenantId,
      teflon_user: JSON.stringify({
        id: 'user-1',
        role: 'tenant_admin',
        tenant_id: userTenantId,
      }),
    },
  });

  assert.deepEqual(getTenantHeaders(), {
    'X-Tenant-Id': userTenantId,
  });
});
