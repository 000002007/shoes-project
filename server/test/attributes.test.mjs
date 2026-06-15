import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAttributes } from '../attributes.mjs';

const VALID = {
  brand: 'Nike',
  model: 'Pegasus 40',
  category: 'running',
  upperMaterial: 'engineered mesh',
  stretch: 'moderate',
  sizeReputation: 'true_to_size',
  widthReputation: 'standard',
  toeBox: 'standard',
  confidence: 'high',
  notes: '',
  sources: [],
};

test('пропускает валидный объект атрибутов', () => {
  assert.deepEqual(validateAttributes(VALID), VALID);
});

test('пропускает значения unknown', () => {
  const u = { ...VALID, category: 'unknown', stretch: 'unknown', sizeReputation: 'unknown', widthReputation: 'unknown', toeBox: 'unknown', confidence: 'low' };
  assert.deepEqual(validateAttributes(u), u);
});

test('отвергает неизвестную категорию', () => {
  assert.throws(() => validateAttributes({ ...VALID, category: 'sneakers' }));
});

test('отвергает отсутствующее поле', () => {
  const { confidence, ...missing } = VALID;
  void confidence;
  assert.throws(() => validateAttributes(missing));
});
