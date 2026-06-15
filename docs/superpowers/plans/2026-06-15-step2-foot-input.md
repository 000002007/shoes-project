# Step 2 — Foot Input (measurement) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Собрать и честно сохранить размеры стопы (`FootMeasurement`, мм) + логику «есть ли ориентир», чтобы потом питать оверлей (шаг 3) и фидбэк (шаг 4).

**Architecture:** Только фронт (Vite + React + TS, Vitest). Чистые модули (`src/foot/*`) + компонент `FootInput`. Сервер не трогаем. A4-фото-замер отложен.

**Tech Stack:** TypeScript, Vitest (+ @testing-library), React.

## Конвенции для исполнителя
- Все команды — из корня `C:\Users\zhana\shoes-project` (`cd /c/Users/zhana/shoes-project`; cwd персистится). ABSOLUTE-пути для записи.
- Тесты фронта: `npm test`. Сборка: `npm run build`.
- Каждое git-сообщение заканчивается: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Порядок: тест → запуск (падает) → реализация → запуск (проходит) → коммит.

## Карта файлов
- `src/foot/types.ts` — типы `FootMeasurement`, `WidthCategory`, `SizeSystem`.
- `src/foot/sizing.ts` — приблизительная конвертация мм ↔ размер.
- `src/foot/reference.ts` — `hasReference`, `referenceWarnings`.
- `src/components/FootInput.tsx` — форма ввода + подписи + предупреждения.
- `src/App.tsx` — разместить `FootInput`, переименовать заголовок (убрать «подбор»).
- `index.html` — `<title>` без «подбора».

---

### Task 1: Типы стопы + конвертация размеров

**Files:**
- Create: `src/foot/types.ts`, `src/foot/sizing.ts`
- Test: `src/foot/sizing.test.ts`

- [ ] **Step 1: Падающий тест** — `src/foot/sizing.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { mmToEu, euToMm, mmToSize, sizeToMm } from './sizing'

describe('sizing (приблизительно)', () => {
  it('265 мм → EU 42', () => { expect(mmToEu(265)).toBe(42) })
  it('EU 42 → ~265 мм', () => { expect(euToMm(42)).toBe(265) })
  it('mmToSize US_M / UK от EU', () => {
    expect(mmToSize(265, 'EU')).toBe(42)
    expect(mmToSize(265, 'US_M')).toBe(9)
    expect(mmToSize(265, 'UK')).toBe(8)
  })
  it('sizeToMm обратимо к ~265', () => {
    expect(sizeToMm(42, 'EU')).toBe(265)
    expect(sizeToMm(9, 'US_M')).toBe(265)
    expect(sizeToMm(8, 'UK')).toBe(265)
  })
})
```

- [ ] **Step 2: Запустить — упадёт** — `npm test` → FAIL (нет `./sizing`).

- [ ] **Step 3: Реализовать**

`src/foot/types.ts`:
```ts
export type WidthCategory = 'narrow' | 'standard' | 'wide'
export type SizeSystem = 'EU' | 'US_M' | 'UK'

export interface FootMeasurement {
  lengthMm?: number
  widthMm?: number
  widthCategory?: WidthCategory
  sizeValue?: number
  sizeSystem?: SizeSystem
  source: 'manual' | 'a4'
}
```

`src/foot/sizing.ts`:
```ts
import type { SizeSystem } from './types'

// Приблизительно: парижский штих (2/3 см) + типичный припуск колодки ~15 мм.
// Точных таблиц у брендов нет — значения ориентировочные.

export function mmToEu(lengthMm: number): number {
  return Math.round((lengthMm / 10 + 1.5) * 1.5)
}

export function euToMm(eu: number): number {
  return Math.round((eu / 1.5 - 1.5) * 10)
}

// US (муж.) и UK — грубые смещения от EU.
export function mmToSize(lengthMm: number, system: SizeSystem): number {
  const eu = mmToEu(lengthMm)
  switch (system) {
    case 'EU': return eu
    case 'US_M': return eu - 33
    case 'UK': return eu - 34
  }
}

export function sizeToMm(value: number, system: SizeSystem): number {
  let eu: number
  switch (system) {
    case 'EU': eu = value; break
    case 'US_M': eu = value + 33; break
    case 'UK': eu = value + 34; break
  }
  return euToMm(eu)
}
```

- [ ] **Step 4: Запустить — пройдёт** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(foot): measurement types + approximate size conversion"`

---

### Task 2: Логика ориентира и предупреждений

**Files:**
- Create: `src/foot/reference.ts`
- Test: `src/foot/reference.test.ts`

- [ ] **Step 1: Падающий тест** — `src/foot/reference.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { hasReference, referenceWarnings } from './reference'
import type { FootMeasurement } from './types'

const m = (p: Partial<FootMeasurement>): FootMeasurement => ({ source: 'manual', ...p })

describe('hasReference', () => {
  it('длина → есть', () => { expect(hasReference(m({ lengthMm: 265 }))).toBe(true) })
  it('размер → есть', () => { expect(hasReference(m({ sizeValue: 42, sizeSystem: 'EU' }))).toBe(true) })
  it('только ширина → нет', () => { expect(hasReference(m({ widthMm: 100 }))).toBe(false) })
  it('пусто → нет', () => { expect(hasReference(m({}))).toBe(false) })
})

describe('referenceWarnings', () => {
  it('пусто → предупреждение о недостоверности + про ширину', () => {
    const w = referenceWarnings(m({}))
    expect(w.some((x) => /недостоверна/i.test(x))).toBe(true)
    expect(w.some((x) => /ширина/i.test(x))).toBe(true)
  })
  it('есть длина, нет ширины → нет «недостоверна», есть про ширину', () => {
    const w = referenceWarnings(m({ lengthMm: 265 }))
    expect(w.some((x) => /недостоверна/i.test(x))).toBe(false)
    expect(w.some((x) => /ширина/i.test(x))).toBe(true)
  })
  it('нетипичная длина → предупреждение', () => {
    const w = referenceWarnings(m({ lengthMm: 500 }))
    expect(w.some((x) => /нетипичн/i.test(x))).toBe(true)
  })
})
```

- [ ] **Step 2: Запустить — упадёт** — `npm test` → FAIL (нет `./reference`).

- [ ] **Step 3: Реализовать** — `src/foot/reference.ts`:
```ts
import type { FootMeasurement } from './types'

// Ориентир есть, если известна длина ИЛИ размер. Только ширина — не ориентир.
export function hasReference(m: FootMeasurement): boolean {
  return typeof m.lengthMm === 'number' || typeof m.sizeValue === 'number'
}

// Честные предупреждения о недостоверности/неполноте.
export function referenceWarnings(m: FootMeasurement): string[] {
  const w: string[] = []
  if (!hasReference(m)) {
    w.push('Без длины стопы или размера оценка недостоверна — укажите хотя бы одно.')
  }
  if (typeof m.widthMm !== 'number' && !m.widthCategory) {
    w.push('Ширина не указана — оценка по ширине будет грубой.')
  }
  if (typeof m.lengthMm === 'number' && (m.lengthMm < 150 || m.lengthMm > 400)) {
    w.push('Длина выглядит нетипичной — проверьте, что это длина стопы в мм.')
  }
  return w
}
```

- [ ] **Step 4: Запустить — пройдёт** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(foot): reference detection + honest warnings"`

---

### Task 3: Компонент FootInput

**Files:**
- Create: `src/components/FootInput.tsx`
- Test: `src/components/FootInput.test.tsx`

- [ ] **Step 1: Падающий тест** — `src/components/FootInput.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FootInput from './FootInput'

describe('FootInput', () => {
  it('без данных показывает предупреждение о недостоверности', () => {
    render(<FootInput />)
    expect(screen.getByText(/недостоверна/i)).toBeInTheDocument()
  })

  it('ввод длины убирает это предупреждение и показывает разбор мм/EU', async () => {
    render(<FootInput />)
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5')
    expect(screen.queryByText(/недостоверна/i)).not.toBeInTheDocument()
    expect(screen.getByText(/265 мм/)).toBeInTheDocument()
    expect(screen.getByText(/EU 42/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить — упадёт** — `npm test` → FAIL (нет `./FootInput`).

- [ ] **Step 3: Реализовать** — `src/components/FootInput.tsx`:
```tsx
import { useEffect, useState } from 'react'
import type { FootMeasurement, SizeSystem, WidthCategory } from '../foot/types'
import { referenceWarnings } from '../foot/reference'
import { mmToSize } from '../foot/sizing'

const WIDTH_CATS: ReadonlyArray<WidthCategory> = ['narrow', 'standard', 'wide']
const SIZE_SYSTEMS: ReadonlyArray<SizeSystem> = ['EU', 'US_M', 'UK']

function parseNum(s: string): number | undefined {
  const v = parseFloat(s.replace(',', '.'))
  return Number.isFinite(v) ? v : undefined
}

const hint: React.CSSProperties = { display: 'block', fontSize: 12, color: '#666' }

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
      <p style={hint}>Меряй бо́льшую стопу. Лучше всего — обведя её на листе A4.</p>

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
```

- [ ] **Step 4: Запустить — пройдёт** — `npm test` → PASS (все тесты фронта).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(foot): FootInput form with labels + honest warnings"`

---

### Task 4: Подключить в App + убрать «подбор» из заголовка

**Files:**
- Modify: `src/App.tsx`, `index.html`

- [ ] **Step 1: Заменить `src/App.tsx`**:
```tsx
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
```

- [ ] **Step 2: В `index.html`** заменить `<title>Подбор кроссовок по удобству</title>` на `<title>Примерка кроссовок</title>`.

- [ ] **Step 3: Проверить** — `npm test` (все проходят) и `npm run build` (компилируется). Paste обе сводки.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(web): mount FootInput in App; rename title (drop ‘подбор’)"`

---

## Самопроверка плана
- Покрытие спеки: типы (T1), конвертация (T1), ориентир+предупреждения (T2), форма с подписями (T3), размещение + переименование (T4). ✓
- Заглушек нет; весь код приведён.
- Типы согласованы: `FootMeasurement`/`SizeSystem`/`WidthCategory` едины в types.ts и используются в sizing/reference/FootInput.
- A4-фото (2.6) намеренно вне рамок.

## Вне рамок
Оверлей (шаг 3), фидбэк (шаг 4), A4-фото-замер, БД.
