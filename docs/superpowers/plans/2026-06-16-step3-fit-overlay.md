# Шаг 3 — Рентген-оверлей посадки: план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Нарисовать схематичный оверлей «силуэт стопы под внутренним контуром кроссовка» в одном масштабе, с зонами тесноты по длине и ширине и честными пометками.

**Architecture:** Вся геометрия — чистые функции в `src/fit/` (`contour.ts` — модель «репутация-как-сдвиг», `geometry.ts` — запасы/зоны/уверенность/пометки). Рендер — отдельный компонент `FitOverlay.tsx` (SVG из чисел). Встройка в `App.tsx` на месте строки «Готово к шагу 3».

**Tech Stack:** Vite + React + TypeScript, Vitest + @testing-library/react. Реюз `src/foot/sizing.ts` и `src/foot/reference.ts`.

**Спека:** [docs/superpowers/specs/2026-06-16-step3-fit-overlay-design.md](../specs/2026-06-16-step3-fit-overlay-design.md)

---

### Task 1: Константы + рекомендуемый размер (`contour.ts`)

**Files:**
- Create: `src/fit/contour.ts`
- Test: `src/fit/contour.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
// src/fit/contour.test.ts
import { describe, it, expect } from 'vitest'
import { recommendedSizeEu } from './contour'

describe('recommendedSizeEu', () => {
  it('true_to_size: 265 мм → EU 42 без сдвига', () => {
    expect(recommendedSizeEu(265, 'true_to_size')).toBe(42)
  })
  it('runs_small → на размер больше', () => {
    expect(recommendedSizeEu(265, 'runs_small')).toBe(43)
  })
  it('runs_large → на размер меньше', () => {
    expect(recommendedSizeEu(265, 'runs_large')).toBe(41)
  })
  it('unknown → как true_to_size (без сдвига)', () => {
    expect(recommendedSizeEu(265, 'unknown')).toBe(42)
  })
})
```

- [ ] **Step 2: Прогнать тест — убедиться, что падает**

Run: `npx vitest run src/fit/contour.test.ts`
Expected: FAIL — `recommendedSizeEu` не найден / модуль `./contour` не существует.

- [ ] **Step 3: Минимальная реализация**

```ts
// src/fit/contour.ts
import type { Attributes } from '../types'
import { mmToEu, euToMm } from '../foot/sizing'

// Все приближения посадки в одном месте. Колодки производителей закрыты —
// значения ориентировочные («приблизительно»), калибруются тестами этого шага.
export const FIT_CONSTANTS = {
  TOE_ROOM_MM: 10,         // внутренняя длина сверх «длины под размер»
  WIDTH_RATIO: 0.40,       // внутр. ширина обуви ≈ доля внутр. длины (standard-колодка)
  WIDTH_REP_SHIFT_MM: 6,   // narrow/wide сдвигают ширину контура на ∓6 мм
  FOOT_WIDTH_RATIO: {      // оценка ширины СТОПЫ как доли длины, если не измерена
    narrow: 0.36,
    standard: 0.38,
    wide: 0.41,
  },
} as const

export function recommendedSizeEu(
  footLenMm: number,
  sizeReputation: Attributes['sizeReputation'],
): number {
  const base = mmToEu(footLenMm)
  const adj = sizeReputation === 'runs_small' ? 1 : sizeReputation === 'runs_large' ? -1 : 0
  return base + adj
}
```

(Примечание: `euToMm` импортирован заранее — он понадобится в Task 2. Если линтер ругается на неиспользованный импорт между задачами, добавь `euToMm` в Task 2 одним движением; здесь оставь импорт только `mmToEu`, а `euToMm` добавь в Task 2.)

Замени строку импорта на: `import { mmToEu } from '../foot/sizing'`

- [ ] **Step 4: Прогнать тест — убедиться, что проходит**

Run: `npx vitest run src/fit/contour.test.ts`
Expected: PASS (4 теста).

- [ ] **Step 5: Коммит**

```bash
git add src/fit/contour.ts src/fit/contour.test.ts
git commit -m "feat(fit): recommended EU size from foot length + sizeReputation (step3)"
```

---

### Task 2: Внутренний контур (`contour.ts`)

**Files:**
- Modify: `src/fit/contour.ts`
- Test: `src/fit/contour.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
// добавить в src/fit/contour.test.ts
import { recommendedSizeEu, internalContour } from './contour'
import type { Attributes } from '../types'

const attrs = (p: Partial<Attributes>): Attributes => ({
  brand: '', model: '', category: 'running', upperMaterial: '',
  stretch: 'moderate', sizeReputation: 'true_to_size', widthReputation: 'standard',
  toeBox: 'standard', confidence: 'high', notes: '', sources: [], ...p,
})

describe('internalContour', () => {
  it('true_to_size + стопа 265 мм: длина = euToMm(42)+TOE_ROOM, запас по длине ≈ TOE_ROOM', () => {
    const c = internalContour(265, attrs({ sizeReputation: 'true_to_size' }))
    expect(c.recommendedSizeEu).toBe(42)
    expect(c.internalLenMm).toBe(275) // 265 + 10
  })
  it('narrow у́же, чем wide', () => {
    const n = internalContour(265, attrs({ widthReputation: 'narrow' }))
    const w = internalContour(265, attrs({ widthReputation: 'wide' }))
    expect(n.internalWidthMm).toBeLessThan(w.internalWidthMm)
    expect(w.internalWidthMm - n.internalWidthMm).toBe(12) // 2 * WIDTH_REP_SHIFT_MM
  })
})
```

- [ ] **Step 2: Прогнать тест — убедиться, что падает**

Run: `npx vitest run src/fit/contour.test.ts`
Expected: FAIL — `internalContour` не найден.

- [ ] **Step 3: Реализация**

Обнови импорт и добавь функцию:

```ts
// src/fit/contour.ts — заменить импорт sizing на:
import { mmToEu, euToMm } from '../foot/sizing'

// ...после recommendedSizeEu добавить:
export function internalContour(
  footLenMm: number,
  attrs: Attributes,
): { internalLenMm: number; internalWidthMm: number; recommendedSizeEu: number } {
  const recEu = recommendedSizeEu(footLenMm, attrs.sizeReputation)
  const internalLenMm = euToMm(recEu) + FIT_CONSTANTS.TOE_ROOM_MM
  const widthShift =
    attrs.widthReputation === 'narrow' ? -FIT_CONSTANTS.WIDTH_REP_SHIFT_MM
    : attrs.widthReputation === 'wide' ? FIT_CONSTANTS.WIDTH_REP_SHIFT_MM
    : 0
  const internalWidthMm = Math.round(FIT_CONSTANTS.WIDTH_RATIO * internalLenMm + widthShift)
  return { internalLenMm, internalWidthMm, recommendedSizeEu: recEu }
}
```

- [ ] **Step 4: Прогнать тест — убедиться, что проходит**

Run: `npx vitest run src/fit/contour.test.ts`
Expected: PASS (6 тестов).

- [ ] **Step 5: Коммит**

```bash
git add src/fit/contour.ts src/fit/contour.test.ts
git commit -m "feat(fit): internal shoe contour via reputation-as-offset (step3)"
```

---

### Task 3: Геометрия посадки — ядро (`geometry.ts`)

**Files:**
- Create: `src/fit/geometry.ts`
- Test: `src/fit/geometry.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
// src/fit/geometry.test.ts
import { describe, it, expect } from 'vitest'
import { fitGeometry } from './geometry'
import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'

const attrs = (p: Partial<Attributes> = {}): Attributes => ({
  brand: '', model: '', category: 'running', upperMaterial: '',
  stretch: 'moderate', sizeReputation: 'true_to_size', widthReputation: 'standard',
  toeBox: 'standard', confidence: 'high', notes: '', sources: [], ...p,
})
const foot = (p: Partial<FootMeasurement> = {}): FootMeasurement => ({ source: 'manual', ...p })

describe('fitGeometry — ядро', () => {
  it('нет ориентира → drawable=false, без чисел, с подсказкой', () => {
    const r = fitGeometry(foot({}), attrs())
    expect(r.drawable).toBe(false)
    expect(r.notes.join(' ')).toMatch(/длину|размер/i)
  })

  it('длина+ширина измерены, true_to_size → drawable, зоны посчитаны', () => {
    const r = fitGeometry(foot({ lengthMm: 265, widthMm: 100 }), attrs())
    expect(r.drawable).toBe(true)
    expect(r.footLenMm).toBe(265)
    expect(r.internalLenMm).toBe(275)
    expect(r.lengthMargin).toBe(10)
    expect(r.lengthZone).toBe('fit')
    expect(r.widthEstimated).toBe(false)
  })

  it('стопа длиннее контура → зона длины tight', () => {
    // runs_large сдвигает размер вниз → внутр. длина меньше → тесно по длине
    const r = fitGeometry(foot({ lengthMm: 272, widthMm: 100 }), attrs({ sizeReputation: 'runs_large' }))
    expect(r.lengthZone).toBe('tight')
  })
})
```

- [ ] **Step 2: Прогнать тест — убедиться, что падает**

Run: `npx vitest run src/fit/geometry.test.ts`
Expected: FAIL — `fitGeometry` не найден.

- [ ] **Step 3: Реализация ядра**

```ts
// src/fit/geometry.ts
import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'
import { hasReference } from '../foot/reference'
import { sizeToMm } from '../foot/sizing'
import { internalContour, FIT_CONSTANTS } from './contour'

export type Zone = 'tight' | 'fit' | 'loose' | 'unknown'

export interface FitResult {
  drawable: boolean
  footLenMm?: number
  footWidthMm?: number
  internalLenMm?: number
  internalWidthMm?: number
  recommendedSizeEu?: number
  lengthMargin?: number
  widthMargin?: number
  lengthZone: Zone
  widthZone: Zone
  widthEstimated: boolean
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

// Пороги запаса (мм). Стартовые, калибруются; длина/ширина раздельно.
const LENGTH_THRESHOLDS = { tight: 3, loose: 16 }
const WIDTH_THRESHOLDS = { tight: 2, loose: 10 }

function classify(margin: number, t: { tight: number; loose: number }): Zone {
  return margin < t.tight ? 'tight' : margin > t.loose ? 'loose' : 'fit'
}

function footLength(foot: FootMeasurement): { lenMm?: number; fromSize: boolean } {
  if (typeof foot.lengthMm === 'number' && foot.lengthMm > 0) return { lenMm: foot.lengthMm, fromSize: false }
  if (typeof foot.sizeValue === 'number' && foot.sizeValue > 0 && foot.sizeSystem) {
    return { lenMm: sizeToMm(foot.sizeValue, foot.sizeSystem), fromSize: true }
  }
  return { fromSize: false }
}

function footWidth(foot: FootMeasurement, lenMm: number): { widthMm: number; estimated: boolean } {
  if (typeof foot.widthMm === 'number' && foot.widthMm > 0) return { widthMm: foot.widthMm, estimated: false }
  const ratio = foot.widthCategory
    ? FIT_CONSTANTS.FOOT_WIDTH_RATIO[foot.widthCategory]
    : FIT_CONSTANTS.FOOT_WIDTH_RATIO.standard
  return { widthMm: Math.round(ratio * lenMm), estimated: true }
}

export function fitGeometry(foot: FootMeasurement, attrs: Attributes): FitResult {
  if (!hasReference(foot)) {
    return {
      drawable: false, lengthZone: 'unknown', widthZone: 'unknown',
      widthEstimated: false, confidence: 'low',
      notes: ['Укажи длину стопы или размер — тогда покажем посадку.'],
    }
  }

  const notes: string[] = []
  const { lenMm, fromSize } = footLength(foot)
  const footLenMm = lenMm as number // hasReference гарантирует длину/размер
  if (fromSize) notes.push('Длина выведена из размера — менее точно.')

  const { internalLenMm, internalWidthMm, recommendedSizeEu } = internalContour(footLenMm, attrs)
  const fw = footWidth(foot, footLenMm)

  const lengthMargin = internalLenMm - footLenMm
  const widthMargin = internalWidthMm - fw.widthMm

  return {
    drawable: true,
    footLenMm, footWidthMm: fw.widthMm,
    internalLenMm, internalWidthMm, recommendedSizeEu,
    lengthMargin, widthMargin,
    lengthZone: classify(lengthMargin, LENGTH_THRESHOLDS),
    widthZone: classify(widthMargin, WIDTH_THRESHOLDS),
    widthEstimated: fw.estimated,
    confidence: 'high', // уточняется в Task 4
    notes,
  }
}
```

- [ ] **Step 4: Прогнать тест — убедиться, что проходит**

Run: `npx vitest run src/fit/geometry.test.ts`
Expected: PASS (3 теста).

- [ ] **Step 5: Коммит**

```bash
git add src/fit/geometry.ts src/fit/geometry.test.ts
git commit -m "feat(fit): fitGeometry core — margins + length/width zones (step3)"
```

---

### Task 4: Геометрия — неполные данные, уверенность, пометки (`geometry.ts`)

**Files:**
- Modify: `src/fit/geometry.ts`
- Test: `src/fit/geometry.test.ts`

- [ ] **Step 1: Написать падающий тест**

```ts
// добавить в src/fit/geometry.test.ts
describe('fitGeometry — неполные данные и уверенность', () => {
  it('ширина не измерена → widthEstimated=true, пометка про ширину, confidence ниже', () => {
    const r = fitGeometry(foot({ lengthMm: 265 }), attrs())
    expect(r.widthEstimated).toBe(true)
    expect(r.notes.join(' ')).toMatch(/ширин/i)
    expect(r.confidence).not.toBe('high')
  })

  it('длина из размера (нет lengthMm) → используется sizeToMm + пометка', () => {
    const r = fitGeometry(foot({ sizeValue: 42, sizeSystem: 'EU', widthMm: 100 }), attrs())
    expect(r.drawable).toBe(true)
    expect(r.footLenMm).toBe(265) // sizeToMm(42,'EU')
    expect(r.notes.join(' ')).toMatch(/из размера/i)
  })

  it('репутация unknown → нейтрально + пометка + confidence low', () => {
    const r = fitGeometry(
      foot({ lengthMm: 265, widthMm: 100 }),
      attrs({ sizeReputation: 'unknown', widthReputation: 'unknown' }),
    )
    expect(r.notes.join(' ')).toMatch(/репутаци/i)
    expect(r.confidence).toBe('low')
  })

  it('всё измерено, репутация известна, высокая уверенность → confidence high', () => {
    const r = fitGeometry(foot({ lengthMm: 265, widthMm: 100 }), attrs())
    expect(r.confidence).toBe('high')
  })
})
```

- [ ] **Step 2: Прогнать тест — убедиться, что падает**

Run: `npx vitest run src/fit/geometry.test.ts`
Expected: FAIL — нет пометки про ширину/репутацию, `confidence` всегда `high`.

- [ ] **Step 3: Реализация — добавить пометки и расчёт уверенности**

В `fitGeometry`, после вычисления `fw`, добавь пометку про ширину; перед `return` посчитай confidence. Замени хвост функции (от `const fw = ...` до `return`) на:

```ts
  const fw = footWidth(foot, footLenMm)
  if (fw.estimated) notes.push('Ширина не измерена — оценка грубая; укажи ширину или замерь по A4.')

  const repUnknown = attrs.sizeReputation === 'unknown' || attrs.widthReputation === 'unknown'
  if (repUnknown) notes.push('Репутация модели неизвестна — взяли нейтрально, точность ниже.')

  let penalty = 0
  if (fw.estimated) penalty++
  if (fromSize) penalty++
  if (repUnknown) penalty++
  if (attrs.confidence === 'low') penalty++
  const confidence: FitResult['confidence'] = penalty === 0 ? 'high' : penalty === 1 ? 'medium' : 'low'

  const lengthMargin = internalLenMm - footLenMm
  const widthMargin = internalWidthMm - fw.widthMm

  return {
    drawable: true,
    footLenMm, footWidthMm: fw.widthMm,
    internalLenMm, internalWidthMm, recommendedSizeEu,
    lengthMargin, widthMargin,
    lengthZone: classify(lengthMargin, LENGTH_THRESHOLDS),
    widthZone: classify(widthMargin, WIDTH_THRESHOLDS),
    widthEstimated: fw.estimated,
    confidence,
    notes,
  }
```

- [ ] **Step 4: Прогнать тест — убедиться, что проходит**

Run: `npx vitest run src/fit/geometry.test.ts`
Expected: PASS (7 тестов).

- [ ] **Step 5: Коммит**

```bash
git add src/fit/geometry.ts src/fit/geometry.test.ts
git commit -m "feat(fit): degraded-data handling, confidence + honest notes (step3)"
```

---

### Task 5: Компонент оверлея (`FitOverlay.tsx`)

**Files:**
- Create: `src/components/FitOverlay.tsx`
- Test: `src/components/FitOverlay.test.tsx`

- [ ] **Step 1: Написать падающий тест**

```tsx
// src/components/FitOverlay.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FitOverlay from './FitOverlay'
import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'

const attrs = (p: Partial<Attributes> = {}): Attributes => ({
  brand: 'Nike', model: 'Pegasus 40', category: 'running', upperMaterial: 'mesh',
  stretch: 'moderate', sizeReputation: 'true_to_size', widthReputation: 'standard',
  toeBox: 'standard', confidence: 'high', notes: '', sources: [], ...p,
})
const foot = (p: Partial<FootMeasurement> = {}): FootMeasurement => ({ source: 'manual', ...p })

describe('FitOverlay', () => {
  it('есть ориентир → рисует SVG и зоны длины/ширины', () => {
    const { container } = render(<FitOverlay attrs={attrs()} foot={foot({ lengthMm: 265, widthMm: 100 })} />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(screen.getByText(/длина/i)).toBeInTheDocument()
    expect(screen.getByText(/ширина/i)).toBeInTheDocument()
  })

  it('тесная зона по длине → показывает «тесно»', () => {
    render(<FitOverlay attrs={attrs({ sizeReputation: 'runs_large' })} foot={foot({ lengthMm: 272, widthMm: 100 })} />)
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
})
```

- [ ] **Step 2: Прогнать тест — убедиться, что падает**

Run: `npx vitest run src/components/FitOverlay.test.tsx`
Expected: FAIL — модуль `./FitOverlay` не существует.

- [ ] **Step 3: Реализация**

```tsx
// src/components/FitOverlay.tsx
import type { CSSProperties } from 'react'
import type { Attributes } from '../types'
import type { FootMeasurement } from '../foot/types'
import { fitGeometry, type Zone } from '../fit/geometry'

const ZONE_RU: Record<Zone, string> = { tight: 'тесно', fit: 'впору', loose: 'свободно', unknown: 'неизвестно' }
const ZONE_COLOR: Record<Zone, string> = { tight: '#cf222e', fit: '#1a7f37', loose: '#9a6700', unknown: '#666' }

const hint: CSSProperties = { fontSize: 12, color: '#666' }

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

  // Масштаб мм→px: вертикальная раскладка (носок вверх, пятка внизу), обе фигуры в одном масштабе.
  const VIEW_W = 200
  const PAD = 16
  const scale = 1.4 // px на мм визуально мелковато; берём фикс. множитель и центрируем
  const footLen = fit.footLenMm as number
  const footWid = fit.footWidthMm as number
  const inLen = fit.internalLenMm as number
  const inWid = fit.internalWidthMm as number
  const maxLen = Math.max(footLen, inLen)
  const px = (mm: number) => mm * (VIEW_W - 2 * PAD) / 220 // нормируем по ~220 мм в ширину viewBox
  void scale
  const viewH = px(maxLen) + 2 * PAD
  const cx = VIEW_W / 2
  const baseY = viewH - PAD // пятка

  return (
    <section style={{ marginTop: 24 }}>
      <h2>Посадка</h2>
      <svg width={VIEW_W} height={viewH} role="img" aria-label="Силуэт стопы относительно контура кроссовка">
        {/* контур обуви (скруглённый прямоугольник) */}
        <rect
          x={cx - px(inWid) / 2} y={baseY - px(inLen)}
          width={px(inWid)} height={px(inLen)} rx={px(inWid) / 2}
          fill="none" stroke="#333" strokeWidth={2}
        />
        {/* силуэт стопы (полупрозрачный эллипс) */}
        <ellipse
          cx={cx} cy={baseY - px(footLen) / 2}
          rx={px(footWid) / 2} ry={px(footLen) / 2}
          fill="rgba(31,111,235,0.35)" stroke="#1f6feb" strokeWidth={1}
        />
      </svg>

      <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
        <div>Длина: <strong style={{ color: ZONE_COLOR[fit.lengthZone] }}>{ZONE_RU[fit.lengthZone]}</strong></div>
        <div>
          Ширина: <strong style={{ color: ZONE_COLOR[fit.widthZone] }}>{ZONE_RU[fit.widthZone]}</strong>
          {fit.widthEstimated && <span style={hint}> (оценка)</span>}
        </div>
        <div style={hint}>Рекомендуемый размер: EU {fit.recommendedSizeEu}</div>
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
```

- [ ] **Step 4: Прогнать тест — убедиться, что проходит**

Run: `npx vitest run src/components/FitOverlay.test.tsx`
Expected: PASS (4 теста).

- [ ] **Step 5: Коммит**

```bash
git add src/components/FitOverlay.tsx src/components/FitOverlay.test.tsx
git commit -m "feat(web): FitOverlay SVG — schematic foot vs contour, zones, honest marks (step3)"
```

---

### Task 6: Встройка в App + обновление тестов App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Обновить тесты App (заменяют проверку строки «Готово к шагу 3» на оверлей)**

Замени в `src/App.test.tsx` тело `describe('App ...')` так, чтобы вместо текста «Готово к шагу 3» проверялся оверлей. Конкретно, замени два теста:

```tsx
  it('оверлей посадки появляется только когда есть подтверждённая модель и ориентир стопы', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<App />)
    expect(screen.queryByText(/Рекомендуемый размер/i)).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(screen.queryByText(/Рекомендуемый размер/i)).not.toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5')
    expect(await screen.findByText(/Рекомендуемый размер/i)).toBeInTheDocument()
  })

  it('правка модели после подтверждения убирает оверлей (поднятое состояние не рассинхронизируется)', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<App />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    await userEvent.type(screen.getByLabelText('Длина стопы (см)'), '26.5')
    expect(await screen.findByText(/Рекомендуемый размер/i)).toBeInTheDocument()

    await userEvent.type(screen.getByDisplayValue('Nike'), ' Air')
    expect(screen.queryByText(/Рекомендуемый размер/i)).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Прогнать тест — убедиться, что падает**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — `/Рекомендуемый размер/` не находится (App ещё рисует старую строку «Готово к шагу 3»).

- [ ] **Step 3: Реализация — заменить строку готовности на FitOverlay**

В `src/App.tsx`: добавь импорт и замени блок `{readyForFit && (...)}` на рендер `FitOverlay`. Полный файл:

```tsx
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
```

- [ ] **Step 4: Прогнать тесты — весь фронт зелёный**

Run: `npm test`
Expected: PASS — все файлы (фронт), включая обновлённые App-тесты и новые fit/FitOverlay.

- [ ] **Step 5: Типы + сборка**

Run: `npx tsc -b && npm run build`
Expected: exit 0, сборка чистая.

- [ ] **Step 6: Коммит**

```bash
git add src/App.tsx src/App.test.tsx
git commit -m "feat(web): mount FitOverlay in App; gate on confirmed model + reference (step3)"
```

---

## Self-Review (выполнено автором плана)

- **Покрытие спеки:** размер→Task1; контур→Task2; геометрия/зоны→Task3; адаптивная точность/уверенность/пометки→Task4; SVG-рендер/легенда/пустые состояния→Task5; встройка в App→Task6. Все разделы спеки покрыты.
- **Плейсхолдеры:** нет TBD/«добавь обработку ошибок» — везде конкретный код. Константы заданы числами в Task1.
- **Согласованность типов:** `recommendedSizeEu`, `internalContour`, `FitResult`, `Zone`, `fitGeometry` — имена и сигнатуры совпадают между задачами; `FIT_CONSTANTS.FOOT_WIDTH_RATIO[narrow|standard|wide]` совпадает с типом `WidthCategory`.
- **Примечание по импортам:** в Task1 импортируем только `mmToEu`; `euToMm` добавляется в Task2 (чтобы не словить `noUnusedLocals` между задачами).

## Граница и риски

- Константы (TOE_ROOM, WIDTH_RATIO, пороги) — стартовые; зоны на граничных значениях не пинуем, тесты берут явно «глубокие» кейсы. При желании калибруются позже без смены интерфейсов.
- `stretch`, текст-вердикт — шаг 4. A4-фотозамер — 2.6. Реальное фото — шаг 5.
