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

  it('при подтверждении отдаёт текущие атрибуты через onConfirmedChange', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    const onConfirmedChange = vi.fn()
    render(<ModelLookup onConfirmedChange={onConfirmedChange} />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(onConfirmedChange).toHaveBeenLastCalledWith(SAMPLE)
  })

  it('подтверждение передаёт ОТРЕДАКТИРОВАННЫЕ атрибуты, а не исходные', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    const onConfirmedChange = vi.fn()
    render(<ModelLookup onConfirmedChange={onConfirmedChange} />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    const brand = await screen.findByDisplayValue('Nike')
    await userEvent.clear(brand)
    await userEvent.type(brand, 'Adidas')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(onConfirmedChange).toHaveBeenLastCalledWith(expect.objectContaining({ brand: 'Adidas' }))
  })

  it('правка после подтверждения сбрасывает подтверждение (onConfirmedChange ← null)', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    const onConfirmedChange = vi.fn()
    render(<ModelLookup onConfirmedChange={onConfirmedChange} />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    const brand = await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(onConfirmedChange).toHaveBeenLastCalledWith(SAMPLE)
    await userEvent.type(brand, ' Air')
    expect(onConfirmedChange).toHaveBeenLastCalledWith(null)
  })

  it('при ошибке показывает сообщение и кнопку ручного ввода', async () => {
    vi.mocked(lookupModel).mockRejectedValue(new Error('LLM не настроен'))
    render(<ModelLookup />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'X')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    expect(await screen.findByText('LLM не настроен')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Заполнить вручную' })).toBeInTheDocument()
  })

  it('«Заполнить вручную» открывает редактируемую форму', async () => {
    vi.mocked(lookupModel).mockRejectedValue(new Error('boom'))
    render(<ModelLookup />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'My Shoe')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByText('boom')
    await userEvent.click(screen.getByRole('button', { name: 'Заполнить вручную' }))
    expect(await screen.findByRole('button', { name: 'Подтвердить' })).toBeInTheDocument()
  })
})
