import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeModelName } from '../normalize.mjs';

test('обрезает пробелы и схлопывает повторы', () => {
  assert.equal(normalizeModelName('  Nike   Pegasus 40 '), 'nike pegasus 40');
});

test('приводит к нижнему регистру', () => {
  assert.equal(normalizeModelName('AIR Force 1'), 'air force 1');
});

test('пустые/невалидные входы → пустая строка', () => {
  assert.equal(normalizeModelName(''), '');
  assert.equal(normalizeModelName(null), '');
  assert.equal(normalizeModelName(undefined), '');
});
