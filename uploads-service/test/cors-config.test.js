import assert from 'node:assert/strict';
import test from 'node:test';
import * as configModule from '../src/config.js';
import { app } from '../src/app.js';

test('keeps Vase first-party upload origins when CORS_ORIGIN has the legacy list', () => {
  assert.equal(typeof configModule.resolveCorsOrigins, 'function');

  const origins = configModule.resolveCorsOrigins(
    'https://vase.ar,https://editor.vase.ar'
  );

  assert.ok(origins.includes('https://business.vase.ar'));
  assert.ok(origins.includes('https://app.vase.ar'));
  assert.ok(origins.includes('https://editor.vase.ar'));
  assert.equal(new Set(origins).size, origins.length);
});

test('answers the Business upload preflight with CORS headers', async (t) => {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => server.close());

  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');

  const response = await fetch(`http://127.0.0.1:${address.port}/upload`, {
    method: 'OPTIONS',
    headers: {
      Origin: 'https://business.vase.ar',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(
    response.headers.get('access-control-allow-origin'),
    'https://business.vase.ar'
  );
  assert.match(
    response.headers.get('access-control-allow-headers') || '',
    /Authorization/i
  );
});
