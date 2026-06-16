import { useEffect, useState, type CSSProperties } from 'react'
import type { FootMeasurement, SizeSystem, WidthCategory } from '../foot/types'
import { WIDTH_CATEGORIES as WIDTH_CATS, SIZE_SYSTEMS } from '../foot/types'
import { referenceWarnings } from '../foot/reference'
import { mmToSize } from '../foot/sizing'

// Принимаем только положительное число (с точкой или запятой), без мусора в хвосте.
// '0', '-3', '26.5xyz' → undefined, чтобы не считать их валидным замером.
function parseNum(s: string): number | undefined {
  if (!/^\s*\d+([.,]\d+)?\s*$/.test(s)) return undefined
  const v = parseFloat(s.replace(',', '.'))
  return Number.isFinite(v) && v > 0 ? v : undefined
}

const hint: CSSProperties = { display: 'block', fontSize: 12, color: '#666' }

export default function FootInput({ onChange }: { onChange?: (m: FootMeasurement) => void }) {
  const [lengthCm, setLengthCm] = useState('')
  const [widthCm, setWidthCm] = useState('')
  const [widthCategory, setWidthCategory] = useState<WidthCategory | ''>('')
  const [sizeValue, setSizeValue] = useState('')
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('EU')

  const lengthCmN = parseNum(lengthCm)
  const widthCmN = parseNum(widthCm)
  const sizeValueN = parseNum(sizeValue)

  const measurement: FootMeasurement = {
    source: 'manual',
    ...(lengthCmN !== undefined ? { lengthMm: Math.round(lengthCmN * 10) } : {}),
    ...(widthCmN !== undefined ? { widthMm: Math.round(widthCmN * 10) } : {}),
    ...(widthCategory ? { widthCategory } : {}),
    ...(sizeValueN !== undefined ? { sizeValue: sizeValueN, sizeSystem } : {}),
  }

  const warnings = referenceWarnings(measurement)

  useEffect(() => {
    onChange?.(measurement)
    // зависим от примитивов, а не от пересоздаваемого объекта measurement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lengthCm, widthCm, widthCategory, sizeValue, sizeSystem])

  return (
    <section style={{ display: 'grid', gap: 12, maxWidth: 480, marginTop: 32 }}>
      <h2>Твоя стопа</h2>
      <p style={hint}>Стопы немного асимметричны — меряй обе и бери бо́льшую (по ней и считаем). Лучше всего — обведя её на листе A4.</p>

      <div>
        <label htmlFor="foot-length">Длина стопы (см)</label>
        <input id="foot-length" inputMode="decimal" value={lengthCm}
          onChange={(e) => setLengthCm(e.target.value)} placeholder="напр. 26.5" />
        <span style={hint}>От пятки до самого длинного пальца. Это НЕ длина стельки и НЕ размер обуви.</span>
      </div>

      <div>
        <label htmlFor="foot-width">Ширина стопы (см) — необязательно</label>
        <input id="foot-width" inputMode="decimal" value={widthCm}
          onChange={(e) => setWidthCm(e.target.value)} placeholder="самое широкое место" />
      </div>

      <div>
        <label htmlFor="foot-width-cat">Или ширина категорией — необязательно</label>
        <select id="foot-width-cat" value={widthCategory}
          onChange={(e) => setWidthCategory(e.target.value as WidthCategory | '')}>
          <option value="">—</option>
          {WIDTH_CATS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <fieldset style={{ border: '1px solid #ddd', padding: 8 }}>
        <legend>Размер (если знаешь) — необязательно</legend>
        <div>
          <label htmlFor="size-value">Значение</label>
          <input id="size-value" inputMode="decimal" value={sizeValue}
            onChange={(e) => setSizeValue(e.target.value)} placeholder="напр. 42" />
        </div>
        <div>
          <label htmlFor="size-system">Система</label>
          <select id="size-system" value={sizeSystem}
            onChange={(e) => setSizeSystem(e.target.value as SizeSystem)}>
            {SIZE_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </fieldset>

      {measurement.lengthMm !== undefined && (
        <p>Разобрано: {measurement.lengthMm} мм ≈ EU {mmToSize(measurement.lengthMm, 'EU')} (приблизительно)</p>
      )}

      {warnings.length > 0 && (
        <ul style={{ color: '#9a6700' }}>
          {warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
    </section>
  )
}
