import { mockLookup } from './mockProvider.mjs';
import { anthropicLookup } from './anthropicProvider.mjs';

// Единый интерфейс: { kind, lookup(model) -> Promise<Attributes> }.
// Выбор реализации по env LLM_PROVIDER (по умолчанию mock).
export function getProvider() {
  const kind = process.env.LLM_PROVIDER || 'mock';
  if (kind === 'anthropic') {
    return { kind: 'anthropic', lookup: anthropicLookup };
  }
  return { kind: 'mock', lookup: async (model) => mockLookup(model) };
}
