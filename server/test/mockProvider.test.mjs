import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockLookup } from '../mockProvider.mjs';
import { validateAttributes } from '../attributes.mjs';

test('известная модель → валидные атрибуты с высокой/средней уверенностью', () => {
  const a = mockLookup('Nike Pegasus 40');
  assert.doesNotThrow(() => validateAttributes(a));
  assert.equal(a.brand, 'Nike');
  assert.notEqual(a.confidence, 'low');
});

test('регистр и пробелы не важны (нормализация ключа)', () => {
  const a = mockLookup('  nike   PEGASUS 40 ');
  assert.equal(a.brand, 'Nike');
});

test('неизвестная модель → confidence low и поля unknown', () => {
  const a = mockLookup('Zzz Unknown 999');
  assert.doesNotThrow(() => validateAttributes(a));
  assert.equal(a.confidence, 'low');
  assert.equal(a.category, 'unknown');
  assert.equal(a.model, 'Zzz Unknown 999');
});
