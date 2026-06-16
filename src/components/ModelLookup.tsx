import { useState } from 'react'
import type { Attributes, Confidence } from '../types'
import { CATEGORIES as CATEGORY, STRETCHES as STRETCH, SIZE_REPUTATIONS as SIZE_REP, WIDTH_REPUTATIONS as WIDTH_REP, TOE_BOXES as TOEBOX } from '../types'
import { lookupModel } from '../lib/api'
import { confidenceLabel, confidenceColor } from '../lib/confidence'

function emptyAttributes(model: string): Attributes {
  return {
    brand: '', model, category: 'unknown', upperMaterial: 'unknown',
    stretch: 'unknown', sizeReputation: 'unknown', widthReputation: 'unknown',
    toeBox: 'unknown', confidence: 'low', notes: '', sources: [],
  }
}

export default function ModelLookup({ onConfirm }: { onConfirm?: (attrs: Attributes) => void } = {}) {
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attrs, setAttrs] = useState<Attributes | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  async function search() {
    setLoading(true); setError(null); setConfirmed(false)
    try {
      setAttrs(await lookupModel(model))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
      setAttrs(null)
    } finally {
      setLoading(false)
    }
  }

  function update<K extends keyof Attributes>(key: K, value: Attributes[K]) {
    setAttrs((a) => (a ? { ...a, [key]: value } : a))
    setConfirmed(false)
  }

  const badge = (c: Confidence) => (
    <span style={{ color: confidenceColor(c), fontWeight: 600 }}>{confidenceLabel(c)}</span>
  )

  return (
    <section>
      <form onSubmit={(e) => { e.preventDefault(); if (!loading && model.trim()) search() }}>
        <label htmlFor="model-input" style={{ display: 'block', marginBottom: 4 }}>Модель кроссовок</label>
        <input
          id="model-input"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="Напр. Nike Pegasus 40"
          style={{ padding: 8, width: '100%', maxWidth: 360 }}
        />
        <button type="submit" disabled={loading || !model.trim()} style={{ marginLeft: 8, padding: '8px 16px' }}>
          {loading ? 'Идёт поиск…' : 'Найти'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: '#cf222e' }}>{error}</p>
          <button type="button" onClick={() => { setAttrs(emptyAttributes(model)); setError(null) }}>
            Заполнить вручную
          </button>
        </div>
      )}

      {attrs && (
        <form onSubmit={(e) => e.preventDefault()} style={{ marginTop: 24, display: 'grid', gap: 12, maxWidth: 480 }}>
          <div>Уверенность: {badge(attrs.confidence)}</div>

          <label>Бренд
            <input value={attrs.brand} onChange={(e) => update('brand', e.target.value)} />
          </label>
          <label>Модель
            <input value={attrs.model} onChange={(e) => update('model', e.target.value)} />
          </label>
          <label>Категория
            <select value={attrs.category} onChange={(e) => update('category', e.target.value as Attributes['category'])}>
              {CATEGORY.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Материал верха
            <input value={attrs.upperMaterial} onChange={(e) => update('upperMaterial', e.target.value)} />
          </label>
          <label>Тянется
            <select value={attrs.stretch} onChange={(e) => update('stretch', e.target.value as Attributes['stretch'])}>
              {STRETCH.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Репутация по размеру
            <select value={attrs.sizeReputation} onChange={(e) => update('sizeReputation', e.target.value as Attributes['sizeReputation'])}>
              {SIZE_REP.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Репутация по ширине
            <select value={attrs.widthReputation} onChange={(e) => update('widthReputation', e.target.value as Attributes['widthReputation'])}>
              {WIDTH_REP.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Носок (toe box)
            <select value={attrs.toeBox} onChange={(e) => update('toeBox', e.target.value as Attributes['toeBox'])}>
              {TOEBOX.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
          <label>Заметки
            <textarea value={attrs.notes} onChange={(e) => update('notes', e.target.value)} rows={2} />
          </label>

          <button type="button" onClick={() => { setConfirmed(true); if (attrs) onConfirm?.(attrs) }} style={{ padding: '8px 16px' }}>
            Подтвердить
          </button>
          {confirmed && <p style={{ color: '#1a7f37' }}>Атрибуты подтверждены.</p>}
        </form>
      )}
    </section>
  )
}
