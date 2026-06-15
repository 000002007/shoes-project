import { describe, it, expect } from 'vitest'
import { mmToEu, euToMm, mmToSize, sizeToMm } from './sizing'

describe('sizing (приблизительно)', () => {
  it('265 мм → EU 42', () => { expect(mmToEu(265)).toBe(42) })
  it('EU 42 → ~265 мм', () => { expect(euToMm(42)).toBe(265) })
  it('mmToSize US_M / UK от EU', () => {
    expect(mmToSize(265, 'EU')).toBe(42)
    expect(mmToSize(265, 'US_M')).toBe(9)
    expect(mmToSize(265, 'UK')).toBe(8)
  })
  it('sizeToMm обратимо к ~265', () => {
    expect(sizeToMm(42, 'EU')).toBe(265)
    expect(sizeToMm(9, 'US_M')).toBe(265)
    expect(sizeToMm(8, 'UK')).toBe(265)
  })
})
