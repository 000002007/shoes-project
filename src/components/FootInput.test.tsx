import { describe, it, expect } from 'vitest'
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
})
