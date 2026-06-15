import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelLookup from './ModelLookup'
import type { Attributes } from '../types'

vi.mock('../lib/api', () => ({ lookupModel: vi.fn() }))
import { lookupModel } from '../lib/api'

const SAMPLE: Attributes = {
  brand: 'Nike', model: 'Pegasus 40', category: 'running',
  upperMaterial: 'engineered mesh', stretch: 'moderate',
  sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
  confidence: 'high', notes: '', sources: [],
}

describe('ModelLookup', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('после поиска показывает атрибуты в редактируемой форме', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<ModelLookup />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    expect(await screen.findByDisplayValue('Nike')).toBeInTheDocument()
  })

  it('после подтверждения показывает сообщение', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<ModelLookup />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(await screen.findByText(/подтверждены/i)).toBeInTheDocument()
  })
})
