import { describe, it, expect } from 'vitest'
import { recommendedSizeEu, internalContour } from './contour'
import type { Attributes } from '../types'

const attrs = (p: Partial<Attributes> = {}): Attributes => ({
  brand: '', model: '', category: 'running', upperMaterial: '',
  stretch: 'moderate', sizeReputation: 'true_to_size', widthReputation: 'standard',
  toeBox: 'standard', confidence: 'high', notes: '', sources: [], ...p,
})

describe('recommendedSizeEu', () => {
  it('true_to_size: 265 мм → EU 42 без сдвига', () => {
    expect(recommendedSizeEu(265, 'true_to_size')).toBe(42)
  })
  it('runs_small → на размер больше', () => {
    expect(recommendedSizeEu(265, 'runs_small')).toBe(43)
  })
  it('runs_large → на размер меньше', () => {
    expect(recommendedSizeEu(265, 'runs_large')).toBe(41)
  })
  it('unknown → как true_to_size (без сдвига)', () => {
    expect(recommendedSizeEu(265, 'unknown')).toBe(42)
  })
})

describe('internalContour', () => {
  it('true_to_size + стопа 265 мм: длина = euToMm(42)+TOE_ROOM', () => {
    const c = internalContour(265, attrs({ sizeReputation: 'true_to_size' }))
    expect(c.recommendedSizeEu).toBe(42)
    expect(c.internalLenMm).toBe(275) // 265 + 10
  })
  it('narrow у́же, чем wide на 2 * WIDTH_REP_SHIFT_MM', () => {
    const n = internalContour(265, attrs({ widthReputation: 'narrow' }))
    const w = internalContour(265, attrs({ widthReputation: 'wide' }))
    expect(n.internalWidthMm).toBeLessThan(w.internalWidthMm)
    expect(w.internalWidthMm - n.internalWidthMm).toBe(12)
  })
})
