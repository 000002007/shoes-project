import type { FootMeasurement } from './types'

// Ориентир есть, только если длина ИЛИ размер — положительное число.
// (0, отрицательное и т.п. не считаются ориентиром — иначе пропали бы предупреждения.)
export function hasReference(m: FootMeasurement): boolean {
  return (typeof m.lengthMm === 'number' && m.lengthMm > 0)
    || (typeof m.sizeValue === 'number' && m.sizeValue > 0)
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
  if (typeof m.sizeValue === 'number' && (m.sizeValue < 1 || m.sizeValue > 60)) {
    w.push('Размер выглядит нетипичным — проверьте значение и систему.')
  }
  return w
}
