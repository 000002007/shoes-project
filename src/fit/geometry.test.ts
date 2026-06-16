import { describe, it, expect } from 'vitest'
import { fitGeometry } from './geometry'
import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'

const attrs = (p: Partial<Attributes> = {}): Attributes => ({
  brand: '', model: '', category: 'running', upperMaterial: '',
  stretch: 'moderate', sizeReputation: 'true_to_size', widthReputation: 'standard',
  toeBox: 'standard', confidence: 'high', notes: '', sources: [], ...p,
})
const foot = (p: Partial<FootMeasurement> = {}): FootMeasurement => ({ source: 'manual', ...p })

describe('fitGeometry — ядро', () => {
  it('нет ориентира → drawable=false, без чисел, с подсказкой', () => {
    const r = fitGeometry(foot({}), attrs())
    expect(r.drawable).toBe(false)
    expect(r.notes.join(' ')).toMatch(/длину|размер/i)
  })

  it('длина+ширина измерены, true_to_size → drawable, зоны посчитаны', () => {
    const r = fitGeometry(foot({ lengthMm: 265, widthMm: 100 }), attrs())
    expect(r.drawable).toBe(true)
    expect(r.footLenMm).toBe(265)
    expect(r.internalLenMm).toBe(275)
    expect(r.lengthMargin).toBe(10)
    expect(r.lengthZone).toBe('fit')
    expect(r.widthEstimated).toBe(false)
  })

  it('стопа длиннее контура (запас <3 мм) → зона длины tight', () => {
    // runs_large сдвигает размер вниз → внутр. длина меньше → тесно по длине
    const r = fitGeometry(foot({ lengthMm: 273, widthMm: 100 }), attrs({ sizeReputation: 'runs_large' }))
    expect(r.lengthMargin).toBeLessThan(3)
    expect(r.lengthZone).toBe('tight')
  })
})

describe('fitGeometry — неполные данные и уверенность', () => {
  it('ширина не измерена → widthEstimated=true, пометка про ширину, confidence ниже', () => {
    const r = fitGeometry(foot({ lengthMm: 265 }), attrs())
    expect(r.widthEstimated).toBe(true)
    expect(r.notes.join(' ')).toMatch(/ширин/i)
    expect(r.confidence).not.toBe('high')
  })

  it('длина из размера (нет lengthMm) → используется sizeToMm + пометка', () => {
    const r = fitGeometry(foot({ sizeValue: 42, sizeSystem: 'EU', widthMm: 100 }), attrs())
    expect(r.drawable).toBe(true)
    expect(r.footLenMm).toBe(265)
    expect(r.notes.join(' ')).toMatch(/из размера/i)
  })

  it('обе репутации unknown → нейтрально + пометка + confidence low', () => {
    const r = fitGeometry(
      foot({ lengthMm: 265, widthMm: 100 }),
      attrs({ sizeReputation: 'unknown', widthReputation: 'unknown' }),
    )
    expect(r.notes.join(' ')).toMatch(/репутаци/i)
    expect(r.confidence).toBe('low')
  })

  it('всё измерено, репутация известна, высокая уверенность → confidence high', () => {
    const r = fitGeometry(foot({ lengthMm: 265, widthMm: 100 }), attrs())
    expect(r.confidence).toBe('high')
  })
})

describe('fitGeometry — границы и честность длины', () => {
  it('нетипично маленькая стопа (<150мм) → не рисуем, честная пометка', () => {
    const r = fitGeometry(foot({ lengthMm: 50, widthMm: 30 }), attrs())
    expect(r.drawable).toBe(false)
    expect(r.notes.join(' ')).toMatch(/нетипичн/i)
  })

  it('нетипично большая стопа (>400мм) → не рисуем', () => {
    const r = fitGeometry(foot({ lengthMm: 450, widthMm: 150 }), attrs())
    expect(r.drawable).toBe(false)
  })

  it('true_to_size + впору по длине → lengthAutoFitted + честная пометка «подобрали размером»', () => {
    const r = fitGeometry(foot({ lengthMm: 265, widthMm: 100 }), attrs())
    expect(r.lengthAutoFitted).toBe(true)
    expect(r.notes.join(' ')).toMatch(/подобрал/i)
  })

  it('длина выведена из размера → lengthFromSize=true', () => {
    const r = fitGeometry(foot({ sizeValue: 42, sizeSystem: 'EU', widthMm: 100 }), attrs())
    expect(r.lengthFromSize).toBe(true)
  })
})
