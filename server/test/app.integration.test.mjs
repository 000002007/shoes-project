import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server, createApp } from '../app.mjs';
import { anthropicLookup } from '../anthropicProvider.mjs';

let base;
before(async () => {
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});
after(() => new Promise((r) => server.close(r)));

function post(path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('GET /api/health → { ok: true }', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('POST /api/lookup известная модель → атрибуты + normalized', async () => {
  const res = await post('/api/lookup', { model: 'Nike Pegasus 40' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.normalized, 'nike pegasus 40');
  assert.equal(data.attributes.brand, 'Nike');
  assert.equal(data.attributes.confidence, 'high');
});

test('POST /api/lookup без model → 400', async () => {
  const res = await post('/api/lookup', {});
  assert.equal(res.status, 400);
});

test('POST /api/lookup неизвестная модель → confidence low', async () => {
  const res = await post('/api/lookup', { model: 'Zzz Unknown 999' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.attributes.confidence, 'low');
});

test('POST /api/lookup при anthropic-провайдере без ключа → 503 llm_not_configured', async () => {
  const srv = createApp({ kind: 'anthropic', lookup: anthropicLookup });
  await new Promise((r) => srv.listen(0, r));
  const { port } = srv.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'Nike Pegasus 40' }),
    });
    assert.equal(res.status, 503);
    const data = await res.json();
    assert.equal(data.error, 'llm_not_configured');
    // фронт показывает пользователю именно data.message — фиксируем контракт:
    // непустая строка с подсказкой про ручной ввод (иначе теряется честная инструкция).
    assert.equal(typeof data.message, 'string');
    assert.ok(data.message.length > 0);
    assert.match(data.message, /вручную/i);
  } finally {
    await new Promise((r) => srv.close(r));
  }
});
