import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'
import { hasReference } from '../foot/reference'
import { sizeToMm } from '../foot/sizing'
import { internalContour, FIT_CONSTANTS } from './contour'

export type Zone = 'tight' | 'fit' | 'loose' | 'unknown'

export interface FitResult {
  drawable: boolean
  footLenMm?: number
  footWidthMm?: number
  internalLenMm?: number
  internalWidthMm?: number
  recommendedSizeEu?: number
  lengthMargin?: number
  widthMargin?: number
  lengthZone: Zone
  widthZone: Zone
  widthEstimated: boolean
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

// Пороги запаса (мм). Стартовые, калибруются; длина/ширина раздельно.
const LENGTH_THRESHOLDS = { tight: 3, loose: 16 }
const WIDTH_THRESHOLDS = { tight: 2, loose: 10 }

function classify(margin: number, t: { tight: number; loose: number }): Zone {
  return margin < t.tight ? 'tight' : margin > t.loose ? 'loose' : 'fit'
}

function footLength(foot: FootMeasurement): { lenMm?: number; fromSize: boolean } {
  if (typeof foot.lengthMm === 'number' && foot.lengthMm > 0) return { lenMm: foot.lengthMm, fromSize: false }
  if (typeof foot.sizeValue === 'number' && foot.sizeValue > 0 && foot.sizeSystem) {
    return { lenMm: sizeToMm(foot.sizeValue, foot.sizeSystem), fromSize: true }
  }
  return { fromSize: false }
}

function footWidth(foot: FootMeasurement, lenMm: number): { widthMm: number; estimated: boolean } {
  if (typeof foot.widthMm === 'number' && foot.widthMm > 0) return { widthMm: foot.widthMm, estimated: false }
  const ratio = foot.widthCategory
    ? FIT_CONSTANTS.FOOT_WIDTH_RATIO[foot.widthCategory]
    : FIT_CONSTANTS.FOOT_WIDTH_RATIO.standard
  return { widthMm: Math.round(ratio * lenMm), estimated: true }
}

export function fitGeometry(foot: FootMeasurement, attrs: Attributes): FitResult {
  if (!hasReference(foot)) {
    return {
      drawable: false, lengthZone: 'unknown', widthZone: 'unknown',
      widthEstimated: false, confidence: 'low',
      notes: ['Укажи длину стопы или размер — тогда покажем посадку.'],
    }
  }

  const notes: string[] = []
  const { lenMm, fromSize } = footLength(foot)
  const footLenMm = lenMm as number // hasReference гарантирует длину/размер
  if (fromSize) notes.push('Длина выведена из размера — менее точно.')

  const { internalLenMm, internalWidthMm, recommendedSizeEu } = internalContour(footLenMm, attrs)
  const fw = footWidth(foot, footLenMm)
  if (fw.estimated) notes.push('Ширина не измерена — оценка грубая; укажи ширину или замерь по A4.')

  if (attrs.sizeReputation === 'unknown' || attrs.widthReputation === 'unknown') {
    notes.push('Репутация модели неизвестна — взяли нейтрально, точность ниже.')
  }

  let penalty = 0
  if (fw.estimated) penalty++
  if (fromSize) penalty++
  if (attrs.sizeReputation === 'unknown') penalty++
  if (attrs.widthReputation === 'unknown') penalty++
  if (attrs.confidence === 'low') penalty++
  const confidence: FitResult['confidence'] = penalty === 0 ? 'high' : penalty === 1 ? 'medium' : 'low'

  const lengthMargin = internalLenMm - footLenMm
  const widthMargin = internalWidthMm - fw.widthMm

  return {
    drawable: true,
    footLenMm, footWidthMm: fw.widthMm,
    internalLenMm, internalWidthMm, recommendedSizeEu,
    lengthMargin, widthMargin,
    lengthZone: classify(lengthMargin, LENGTH_THRESHOLDS),
    widthZone: classify(widthMargin, WIDTH_THRESHOLDS),
    widthEstimated: fw.estimated,
    confidence,
    notes,
  }
}
