import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { Attributes } from './types'

vi.mock('./lib/api', () => ({ lookupModel: vi.fn() }))
import { lookupModel } from './lib/api'

const SAMPLE: Attributes = {
  brand: 'Nike', model: 'Pegasus 40', category: 'running',
  upperMaterial: 'engineered mesh', stretch: 'moderate',
  sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
  confidence: 'high', notes: '', sources: [],
}

describe('App (общее состояние модели и стопы)', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('готовность к шагу 3 появляется только когда есть и подтверждённая модель, и ориентир стопы', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<App />)

    // изначально нет ни модели, ни ориентира → готовности нет
    expect(screen.queryByText(/Готово к шагу 3/i)).not.toBeInTheDocument()

    // подтверждаем модель — но стопы с ориентиром ещё нет
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(screen.queryByText(/Готово к шагу 3/i)).not.toBeInTheDocument()

    // вводим длину стопы → появляется ориентир → готовность к шагу 3
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5')
    expect(await screen.findByText(/Готово к шагу 3/i)).toBeInTheDocument()
  })
})
