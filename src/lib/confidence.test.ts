import { describe, it, expect } from 'vitest'
import { confidenceLabel } from './confidence'

describe('confidenceLabel', () => {
  it('low → просит проверить', () => {
    expect(confidenceLabel('low')).toContain('проверьте')
  })
  it('high → высокая', () => {
    expect(confidenceLabel('high')).toContain('Высокая')
  })
})
