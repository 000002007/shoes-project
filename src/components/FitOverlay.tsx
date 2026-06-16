import type { CSSProperties } from 'react'
import type { Attributes, Confidence } from '../types'
import type { FootMeasurement } from '../foot/types'
import { fitGeometry, type Zone } from '../fit/geometry'
import { confidenceColor } from '../lib/confidence'

const ZONE_RU: Record<Zone, string> = { tight: 'тесно', fit: 'впору', loose: 'свободно', unknown: 'неизвестно' }
const ZONE_COLOR: Record<Zone, string> = { tight: '#cf222e', fit: '#1a7f37', loose: '#9a6700', unknown: '#666' }
const CONF_RU: Record<Confidence, string> = { high: 'высокая', medium: 'средняя', low: 'низкая' }

const hint: CSSProperties = { fontSize: 12, color: '#666' }
const NEUTRAL = '#666'
const PX_PER_MM = 0.8
const PAD = 16

export default function FitOverlay({ attrs, foot }: { attrs: Attributes; foot: FootMeasurement }) {
  const fit = fitGeometry(foot, attrs)

  if (!fit.drawable) {
    return (
      <section style={{ marginTop: 24 }}>
        <h2>Посадка</h2>
        <p style={{ color: '#9a6700' }}>{fit.notes[0]}</p>
      </section>
    )
  }

  const footLen = fit.footLenMm as number
  const footWid = fit.footWidthMm as number
  const inLen = fit.internalLenMm as number
  const inWid = fit.internalWidthMm as number

  // Один масштаб мм→px для обеих фигур; носок вверх, пятка внизу.
  const px = (mm: number) => mm * PX_PER_MM
  const W = px(Math.max(footWid, inWid)) + 2 * PAD
  const H = px(Math.max(footLen, inLen)) + 2 * PAD
  const cx = W / 2
  const baseY = H - PAD

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Посадка</h2>
      <svg width={W} height={H} role="img" aria-label="Силуэт стопы относительно контура кроссовка">
        {/* внутренний контур обуви — скруглённый прямоугольник */}
        <rect
          x={cx - px(inWid) / 2} y={baseY - px(inLen)}
          width={px(inWid)} height={px(inLen)} rx={px(inWid) / 2}
          fill="none" stroke="#333" strokeWidth={2}
        />
        {/* силуэт стопы — полупрозрачный эллипс, выровнен по пятке */}
        <ellipse
          cx={cx} cy={baseY - px(footLen) / 2}
          rx={px(footWid) / 2} ry={px(footLen) / 2}
          fill="rgba(31,111,235,0.35)" stroke="#1f6feb" strokeWidth={1}
        />
      </svg>

      <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
        {fit.lengthAutoFitted ? (
          // Длина «впору» лишь по построению (размер подобрали под стопу) — не вердикт по модели.
          <div style={hint}>Длина: подобрана под размер (EU {fit.recommendedSizeEu})</div>
        ) : (
          <div>Длина: <strong style={{ color: ZONE_COLOR[fit.lengthZone] }}>{ZONE_RU[fit.lengthZone]}</strong></div>
        )}
        <div>
          Ширина: <strong style={{ color: fit.widthEstimated ? NEUTRAL : ZONE_COLOR[fit.widthZone] }}>{ZONE_RU[fit.widthZone]}</strong>
          {fit.widthEstimated && <span style={hint}> (оценка по категории, не замер)</span>}
        </div>
        <div style={hint}>
          {fit.lengthFromSize ? 'Твой размер' : 'Рекомендуемый размер'}: EU {fit.recommendedSizeEu}
        </div>
        <div style={hint}>
          Достоверность оценки: <strong style={{ color: confidenceColor(fit.confidence) }}>{CONF_RU[fit.confidence]}</strong>
        </div>
      </div>

      {fit.notes.length > 0 && (
        <ul style={{ ...hint, marginTop: 8 }}>
          {fit.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
      <p style={hint}>Приблизительно, 2D — без подъёма и косточек; колодки производителей закрыты.</p>
    </section>
  )
}
