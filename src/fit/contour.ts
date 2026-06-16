import type { Attributes } from '../types'
import { mmToEu, euToMm } from '../foot/sizing'

// Все приближения посадки в одном месте. Колодки производителей закрыты —
// значения ориентировочные («приблизительно»), калибруются тестами этого шага.
export const FIT_CONSTANTS = {
  TOE_ROOM_MM: 10,         // внутренняя длина сверх «длины под размер»
  WIDTH_RATIO: 0.40,       // внутр. ширина обуви ≈ доля внутр. длины (standard-колодка)
  WIDTH_REP_SHIFT_MM: 6,   // narrow/wide сдвигают ширину контура на ∓6 мм
  FOOT_WIDTH_RATIO: {      // оценка ширины СТОПЫ как доли длины, если не измерена
    narrow: 0.36,
    standard: 0.38,
    wide: 0.41,
  },
} as const

export function recommendedSizeEu(
  footLenMm: number,
  sizeReputation: Attributes['sizeReputation'],
): number {
  const base = mmToEu(footLenMm)
  const adj = sizeReputation === 'runs_small' ? 1 : sizeReputation === 'runs_large' ? -1 : 0
  return base + adj
}

export function internalContour(
  footLenMm: number,
  attrs: Attributes,
): { internalLenMm: number; internalWidthMm: number; recommendedSizeEu: number } {
  const recEu = recommendedSizeEu(footLenMm, attrs.sizeReputation)
  const internalLenMm = euToMm(recEu) + FIT_CONSTANTS.TOE_ROOM_MM
  const widthShift =
    attrs.widthReputation === 'narrow' ? -FIT_CONSTANTS.WIDTH_REP_SHIFT_MM
    : attrs.widthReputation === 'wide' ? FIT_CONSTANTS.WIDTH_REP_SHIFT_MM
    : 0
  const internalWidthMm = Math.round(FIT_CONSTANTS.WIDTH_RATIO * internalLenMm + widthShift)
  return { internalLenMm, internalWidthMm, recommendedSizeEu: recEu }
}
