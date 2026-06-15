import { normalizeModelName } from './normalize.mjs';

// Курируемые примеры. Ключ — нормализованное имя. Значения подобраны вручную
// (это фикстуры для разработки без ключа API, не «правда» о моделях).
const FIXTURES = {
  'nike pegasus 40': {
    brand: 'Nike', model: 'Pegasus 40', category: 'running',
    upperMaterial: 'engineered mesh', stretch: 'moderate',
    sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
    confidence: 'high', notes: 'Универсальная беговая, садится в размер.', sources: [],
  },
  'adidas ultraboost': {
    brand: 'Adidas', model: 'Ultraboost', category: 'running',
    upperMaterial: 'Primeknit (вязаный)', stretch: 'stretchy',
    sizeReputation: 'runs_small', widthReputation: 'narrow', toeBox: 'standard',
    confidence: 'medium', notes: 'Вязаный верх тянется; многие берут на полразмера больше.', sources: [],
  },
  'new balance 990': {
    brand: 'New Balance', model: '990', category: 'lifestyle',
    upperMaterial: 'замша/сетка', stretch: 'rigid',
    sizeReputation: 'true_to_size', widthReputation: 'wide', toeBox: 'roomy',
    confidence: 'medium', notes: 'Просторная колодка, есть варианты ширины.', sources: [],
  },
  'asics gel kayano': {
    brand: 'ASICS', model: 'Gel-Kayano', category: 'running',
    upperMaterial: 'engineered mesh', stretch: 'moderate',
    sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
    confidence: 'medium', notes: 'Стабилизирующая беговая, в размер.', sources: [],
  },
  'nike air force 1': {
    brand: 'Nike', model: 'Air Force 1', category: 'lifestyle',
    upperMaterial: 'кожа', stretch: 'rigid',
    sizeReputation: 'runs_large', widthReputation: 'standard', toeBox: 'standard',
    confidence: 'medium', notes: 'Кожаный верх не тянется; многие берут на полразмера меньше.', sources: [],
  },
  'converse chuck taylor': {
    brand: 'Converse', model: 'Chuck Taylor All Star', category: 'lifestyle',
    upperMaterial: 'текстиль (канвас)', stretch: 'rigid',
    sizeReputation: 'runs_large', widthReputation: 'narrow', toeBox: 'low',
    confidence: 'medium', notes: 'Узкие, обычно берут на полразмера меньше.', sources: [],
  },
};

export function mockLookup(model) {
  const key = normalizeModelName(model);
  const found = FIXTURES[key];
  if (found) return found;
  return {
    brand: '',
    model: String(model ?? '').trim(),
    category: 'unknown',
    upperMaterial: 'unknown',
    stretch: 'unknown',
    sizeReputation: 'unknown',
    widthReputation: 'unknown',
    toeBox: 'unknown',
    confidence: 'low',
    notes: 'Модель не найдена среди примеров — заполните атрибуты вручную.',
    sources: [],
  };
}
