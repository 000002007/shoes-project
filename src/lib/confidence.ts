import type { Confidence } from '../types'

export function confidenceLabel(c: Confidence): string {
  switch (c) {
    case 'high': return 'Высокая уверенность'
    case 'medium': return 'Средняя уверенность'
    case 'low': return 'Низкая уверенность — проверьте'
    default: return 'Низкая уверенность — проверьте'
  }
}

export function confidenceColor(c: Confidence): string {
  switch (c) {
    case 'high': return '#1a7f37'
    case 'medium': return '#9a6700'
    case 'low': return '#cf222e'
    default: return '#cf222e'
  }
}
