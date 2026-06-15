import type { FootMeasurement } from './types'

// Ориентир есть, если известна длина ИЛИ размер. Только ширина — не ориентир.
export function hasReference(m: FootMeasurement): boolean {
  return typeof m.lengthMm === 'number' || typeof m.sizeValue === 'number'
}

// Честные предупреждения о недостоверности/неполноте.
export function referenceWarnings(m: FootMeasurement): string[] {
  const w: string[] = []
  if (!hasReference(m)) {
    w.push('Без длины стопы или размера оценка недостоверна — укажите хотя бы одно.')
  }
  if (typeof m.widthMm !== 'number' && !m.widthCategory) {
    w.push('Ширина не указана — оценка по ширине будет грубой.')
  }
  if (typeof m.lengthMm === 'number' && (m.lengthMm < 150 || m.lengthMm > 400)) {
    w.push('Длина выглядит нетипичной — проверьте, что это длина стопы в мм.')
  }
  return w
}
