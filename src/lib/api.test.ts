import { describe, it, expect, vi, afterEach } from 'vitest'
import { lookupModel } from './api'
import type { Attributes } from '../types'

const SAMPLE: Attributes = {
  brand: 'Nike', model: 'Pegasus 40', category: 'running',
  upperMaterial: 'engineered mesh', stretch: 'moderate',
  sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
  confidence: 'high', notes: '', sources: [],
}

afterEach(() => { vi.restoreAllMocks() })

describe('lookupModel', () => {
  it('возвращает атрибуты при успехе', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ normalized: 'nike pegasus 40', attributes: SAMPLE }), { status: 200 })))
    const r = await lookupModel('Nike Pegasus 40')
    expect(r.brand).toBe('Nike')
  })

  it('бросает ошибку с сообщением сервера', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ message: 'LLM не настроен' }), { status: 503 })))
    await expect(lookupModel('x')).rejects.toThrow('LLM не настроен')
  })
})
