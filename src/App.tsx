import ModelLookup from './components/ModelLookup'
import FootInput from './components/FootInput'

export default function App() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Примерка: как сидят кроссовки</h1>
      <p>Шаг 1 — модель и её атрибуты. Шаг 2 — твоя стопа.</p>
      <ModelLookup />
      <FootInput />
    </main>
  )
}
