import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FitOverlay from './FitOverlay'
import { fitGeometry } from '../fit/geometry'
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

  it('показывает достоверность оценки (confidence) в UI', () => {
    render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 265, widthMm: 100 })} />)
    expect(screen.getByText(/достоверность оценки/i)).toBeInTheDocument()
  })

  it('автоподбор длины → «подобрана под размер», а не зелёный вердикт «впору»', () => {
    render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 265, widthMm: 100 })} />)
    expect(screen.getByText(/Длина: подобрана под размер/i)).toBeInTheDocument()
  })

  it('размер из ввода → «Твой размер», а не «Рекомендуемый размер»', () => {
    render(<FitOverlay attrs={attrs()} foot={foot({ sizeValue: 42, sizeSystem: 'EU', widthMm: 100 })} />)
    expect(screen.getByText(/Твой размер/i)).toBeInTheDocument()
    expect(screen.queryByText(/Рекомендуемый размер/i)).not.toBeInTheDocument()
  })

  it('нетипичная длина → заглушка без SVG посадки', () => {
    const { container } = render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 50, widthMm: 30 })} />)
    expect(container.querySelector('svg')).toBeNull()
    expect(screen.getByText(/нетипичн/i)).toBeInTheDocument()
  })

  it('SVG: стопа и контур в одном масштабе и выровнены по пятке', () => {
    const a = attrs({ widthReputation: 'narrow' })
    const f = foot({ lengthMm: 265, widthMm: 130 }) // широкая стопа vs узкий контур
    const fit = fitGeometry(f, a)
    const { container } = render(<FitOverlay attrs={a} foot={f} />)
    const rect = container.querySelector('rect')!
    const ellipse = container.querySelector('ellipse')!
    const num = (el: Element, attr: string) => parseFloat(el.getAttribute(attr)!)
    // выровнены по пятке (общий низ rect и эллипса)
    const rectBottom = num(rect, 'y') + num(rect, 'height')
    const ellipseBottom = num(ellipse, 'cy') + num(ellipse, 'ry')
    expect(Math.abs(rectBottom - ellipseBottom)).toBeLessThan(0.01)
    // один масштаб px/мм у обеих фигур
    const shoeScale = num(rect, 'width') / fit.internalWidthMm!
    const footScale = (2 * num(ellipse, 'rx')) / fit.footWidthMm!
    expect(Math.abs(shoeScale - footScale)).toBeLessThan(1e-6)
    // широкая стопа выходит за узкий контур: rx эллипса больше полуширины rect
    expect(num(ellipse, 'rx')).toBeGreaterThan(num(rect, 'width') / 2)
  })
})
