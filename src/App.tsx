import ModelLookup from './components/ModelLookup'

export default function App() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Подбор кроссовок по удобству</h1>
      <p>Шаг 1 — введите модель и проверьте найденные атрибуты.</p>
      <ModelLookup />
    </main>
  )
}
