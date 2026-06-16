import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FootInput from './FootInput'

describe('FootInput', () => {
  it('без данных показывает предупреждение о недостоверности', () => {
    render(<FootInput />)
    expect(screen.getByText(/недостоверна/i)).toBeInTheDocument()
  })

  it('ввод длины убирает это предупреждение и показывает разбор мм/EU', async () => {
    render(<FootInput />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5')
    expect(screen.queryByText(/недостоверна/i)).not.toBeInTheDocument()
    expect(screen.getByText(/265 мм/)).toBeInTheDocument()
    expect(screen.getByText(/EU 42/)).toBeInTheDocument()
  })

  it('ввод "0" не считается ориентиром — предупреждение остаётся', async () => {
    render(<FootInput />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '0')
    expect(screen.getByText(/недостоверна/i)).toBeInTheDocument()
  })

  it('отрицательное "-3" не считается ориентиром — предупреждение остаётся', async () => {
    render(<FootInput />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '-3')
    expect(screen.getByText(/недостоверна/i)).toBeInTheDocument()
  })

  it('мусор в хвосте "26.5xyz" не считается ориентиром — предупреждение остаётся', async () => {
    render(<FootInput />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5xyz')
    expect(screen.getByText(/недостоверна/i)).toBeInTheDocument()
  })

  it('сообщает FootMeasurement через onChange (запятая, ширина, размер)', async () => {
    const onChange = vi.fn()
    render(<FootInput onChange={onChange} />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26,5')
    await userEvent.type(screen.getByLabelText('Ширина стопы (см) — необязательно'), '10')
    await userEvent.type(screen.getByLabelText('Значение'), '42')
    const last = onChange.mock.calls.at(-1)?.[0]
    expect(last).toMatchObject({ lengthMm: 265, widthMm: 100, sizeValue: 42, sizeSystem: 'EU', source: 'manual' })
  })

  it('ввод ширины убирает предупреждение про ширину', async () => {
    render(<FootInput />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5')
    expect(screen.getByText(/Ширина не указана/i)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Ширина стопы (см) — необязательно'), '10')
    expect(screen.queryByText(/Ширина не указана/i)).not.toBeInTheDocument()
  })
})
