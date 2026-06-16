import type { SizeSystem } from './types'

// Приблизительно: парижский штих (2/3 см) + типичный припуск колодки ~15 мм.
// Точных таблиц у брендов нет — значения ориентировочные.

export function mmToEu(lengthMm: number): number {
  return Math.round((lengthMm / 10 + 1.5) * 1.5)
}

export function euToMm(eu: number): number {
  return Math.round((eu / 1.5 - 1.5) * 10)
}

// US (муж.) и UK — грубые смещения от EU.
export function mmToSize(lengthMm: number, system: SizeSystem): number {
  const eu = mmToEu(lengthMm)
  switch (system) {
    case 'EU': return eu
    case 'US_M': return eu - 33
    case 'UK': return eu - 34
  }
}

// Задел под шаг 3 (вердикт): когда у пользователя есть только размер без длины,
// переводим размер → внутренние мм. В UI пока не вызывается, но покрыт тестами.
export function sizeToMm(value: number, system: SizeSystem): number {
  let eu: number
  switch (system) {
    case 'EU': eu = value; break
    case 'US_M': eu = value + 33; break
    case 'UK': eu = value + 34; break
  }
  return euToMm(eu)
}
