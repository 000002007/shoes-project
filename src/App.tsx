import { useState } from 'react'
import ModelLookup from './components/ModelLookup'
import FootInput from './components/FootInput'
import type { Attributes } from './types'
import type { FootMeasurement } from './foot/types'
import { hasReference } from './foot/reference'

export default function App() {
  // Общее состояние шагов 1–2 живёт здесь, чтобы шагам 3–4 (вердикт, картинка)
  // было откуда брать и модель, и замер стопы.
  const [attributes, setAttributes] = useState<Attributes | null>(null)
  const [foot, setFoot] = useState<FootMeasurement | null>(null)

  // Честно: «готово» = есть подтверждённая модель И есть ориентир стопы (длина/размер).
  // Это не вердикт, а лишь признак, что шагу 3 будет с чем работать.
  const readyForFit = attributes !== null && foot !== null && hasReference(foot)

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Примерка: как сидят кроссовки</h1>
      <p>Шаг 1 — модель и её атрибуты. Шаг 2 — твоя стопа.</p>
      <ModelLookup onConfirm={setAttributes} />
      <FootInput onChange={setFoot} />
      {readyForFit && (
        <p style={{ marginTop: 24, color: '#1a7f37' }}>
          Готово к шагу 3: модель подтверждена и есть ориентир стопы (фидбэк о посадке — следующий шаг).
        </p>
      )}
    </main>
  )
}
