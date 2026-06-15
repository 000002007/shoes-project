// Каноничный ключ модели: trim, схлопывание пробелов, нижний регистр.
export function normalizeModelName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}
