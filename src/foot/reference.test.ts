import { describe, it, expect } from 'vitest'
import { hasReference, referenceWarnings } from './reference'
import type { FootMeasurement } from './types'

const m = (p: Partial<FootMeasurement>): FootMeasurement => ({ source: 'manual', ...p })

describe('hasReference', () => {
  it('длина → есть', () => { expect(hasReference(m({ lengthMm: 265 }))).toBe(true) })
  it('размер → есть', () => { expect(hasReference(m({ sizeValue: 42, sizeSystem: 'EU' }))).toBe(true) })
  it('только ширина → нет', () => { expect(hasReference(m({ widthMm: 100 }))).toBe(false) })
  it('пусто → нет', () => { expect(hasReference(m({}))).toBe(false) })
  it('0 или отрицательная длина → нет', () => {
    expect(hasReference(m({ lengthMm: 0 }))).toBe(false)
    expect(hasReference(m({ lengthMm: -30 }))).toBe(false)
  })
  it('0 или отрицательный размер → нет', () => {
    expect(hasReference(m({ sizeValue: 0, sizeSystem: 'EU' }))).toBe(false)
    expect(hasReference(m({ sizeValue: -1, sizeSystem: 'EU' }))).toBe(false)
  })
})

describe('referenceWarnings', () => {
  it('пусто → предупреждение о недостоверности + про ширину', () => {
    const w = referenceWarnings(m({}))
    expect(w.some((x) => /недостоверна/i.test(x))).toBe(true)
    expect(w.some((x) => /ширина/i.test(x))).toBe(true)
  })
  it('есть длина, нет ширины → нет «недостоверна», есть про ширину', () => {
    const w = referenceWarnings(m({ lengthMm: 265 }))
    expect(w.some((x) => /недостоверна/i.test(x))).toBe(false)
    expect(w.some((x) => /ширина/i.test(x))).toBe(true)
  })
  it('слишком большая длина → нетипичная', () => {
    expect(referenceWarnings(m({ lengthMm: 500 })).some((x) => /нетипичн/i.test(x))).toBe(true)
  })
  it('слишком маленькая длина (<150) → нетипичная', () => {
    expect(referenceWarnings(m({ lengthMm: 100 })).some((x) => /нетипичн/i.test(x))).toBe(true)
  })
  it('ширина в мм убирает предупреждение про ширину', () => {
    expect(referenceWarnings(m({ lengthMm: 265, widthMm: 100 })).some((x) => /ширина/i.test(x))).toBe(false)
  })
  it('категория ширины убирает предупреждение про ширину', () => {
    expect(referenceWarnings(m({ lengthMm: 265, widthCategory: 'wide' })).some((x) => /ширина/i.test(x))).toBe(false)
  })
  it('нетипичный размер → предупреждение', () => {
    expect(referenceWarnings(m({ sizeValue: 999, sizeSystem: 'EU' })).some((x) => /нетипичн/i.test(x))).toBe(true)
  })
})
