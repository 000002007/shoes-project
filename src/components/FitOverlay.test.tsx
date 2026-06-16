import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FitOverlay from './FitOverlay'
import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'

const attrs = (p: Partial<Attributes> = {}): Attributes => ({
  brand: 'Nike', model: 'Pegasus 40', category: 'running', upperMaterial: 'mesh',
  stretch: 'moderate', sizeReputation: 'true_to_size', widthReputation: 'standard',
  toeBox: 'standard', confidence: 'high', notes: '', sources: [], ...p,
})
const foot = (p: Partial<FootMeasurement> = {}): FootMeasurement => ({ source: 'manual', ...p })

describe('FitOverlay', () => {
  it('есть ориентир → рисует SVG, сводку зон и рекомендуемый размер', () => {
    const { container } = render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 265, widthMm: 100 })} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText(/Длина:/)).toBeInTheDocument()
    expect(screen.getByText(/Ширина:/)).toBeInTheDocument()
    expect(screen.getByText(/Рекомендуемый размер/i)).toBeInTheDocument()
  })

  it('тесная зона по длине → показывает «тесно»', () => {
    render(<FitOverlay attrs={attrs({ sizeReputation: 'runs_large' })} foot={foot({ lengthMm: 273, widthMm: 100 })} />)
    expect(screen.getByText(/тесно/i)).toBeInTheDocument()
  })

  it('нет ориентира → заглушка без SVG посадки', () => {
    const { container } = render(<FitOverlay attrs={attrs()} foot={foot({})} />)
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.getByText(/длину стопы или размер/i)).toBeInTheDocument()
  })

  it('ширина не измерена → честная пометка про ширину', () => {
    render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 265 })} />)
    expect(screen.getByText(/ширина не измерена/i)).toBeInTheDocument()
  })

  it('всегда показывает дисклеймер «приблизительно, 2D»', () => {
    render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 265, widthMm: 100 })} />)
    expect(screen.getByText(/приблизительно, 2D/i)).toBeInTheDocument()
  })
})
