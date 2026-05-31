import test from 'node:test';
import assert from 'node:assert/strict';

import { getTenantHeaders } from './api.js';

const originalWindow = globalThis.window;

function setWindowLocation({ host, hostname = host, pathname = '/' }) {
  globalThis.window = {
    location: {
      host,
      hostname,
      pathname,
    },
    localStorage: {
      getItem() {
        return null;
      },
    },
  };
}

test.afterEach(() => {
  globalThis.window = originalWindow;
});

test('getTenantHeaders sends storefront host on public tenant storefronts', () => {
  setWindowLocation({ host: 'teflon.vase.ar', pathname: '/' });

  assert.deepEqual(getTenantHeaders(), {
    'X-Storefront-Host': 'teflon.vase.ar',
  });
});
