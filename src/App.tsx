import { useState } from 'react'
import ModelLookup from './components/ModelLookup'
import FootInput from './components/FootInput'
import FitOverlay from './components/FitOverlay'
import type { Attributes } from './types'
import type { FootMeasurement } from './foot/types'
import { hasReference } from './foot/reference'

export default function App() {
  // Общее состояние шагов 1–2 живёт здесь, чтобы шагам 3–4 (вердикт, картинка)
  // было откуда брать и модель, и замер стопы.
  const [attributes, setAttributes] = useState<Attributes | null>(null)
  const [foot, setFoot] = useState<FootMeasurement | null>(null)

  // Оверлей рисуем, только когда есть ПОДТВЕРЖДЁННАЯ модель и ориентир стопы.
  const showOverlay = attributes !== null && foot !== null && hasReference(foot)

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Примерка: как сидят кроссовки</h1>
      <p>Шаг 1 — модель и её атрибуты. Шаг 2 — твоя стопа. Шаг 3 — посадка.</p>
      <ModelLookup onConfirmedChange={setAttributes} />
      <FootInput onChange={setFoot} />
      {showOverlay && <FitOverlay attrs={attributes} foot={foot} />}
    </main>
  )
}
