import { describe, it, expect } from 'vitest'
import { confidenceLabel, confidenceColor } from './confidence'

describe('confidenceLabel', () => {
  it('low → просит проверить', () => {
    expect(confidenceLabel('low')).toContain('проверьте')
  })
  it('medium → средняя', () => {
    expect(confidenceLabel('medium')).toContain('Средняя')
  })
  it('high → высокая', () => {
    expect(confidenceLabel('high')).toContain('Высокая')
  })
})

describe('confidenceColor', () => {
  it('high → зелёный', () => { expect(confidenceColor('high')).toBe('#1a7f37') })
  it('medium → жёлтый', () => { expect(confidenceColor('medium')).toBe('#9a6700') })
  it('low → красный', () => { expect(confidenceColor('low')).toBe('#cf222e') })
})
