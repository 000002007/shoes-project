import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProvider } from '../provider.mjs';

test('по умолчанию провайдер mock и отдаёт валидный бренд', async () => {
  delete process.env.LLM_PROVIDER;
  const p = getProvider();
  assert.equal(p.kind, 'mock');
  const a = await p.lookup('Nike Pegasus 40');
  assert.equal(a.brand, 'Nike');
});

test('LLM_PROVIDER=anthropic → kind anthropic, lookup бросает NOT_CONFIGURED', async () => {
  process.env.LLM_PROVIDER = 'anthropic';
  const p = getProvider();
  assert.equal(p.kind, 'anthropic');
  await assert.rejects(() => p.lookup('Nike Pegasus 40'), /NOT_CONFIGURED/);
  delete process.env.LLM_PROVIDER;
});
