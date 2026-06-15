# Step 1 — Model → Attributes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Пользователь вводит название модели кроссовок → сервер возвращает структурированные атрибуты с уровнем уверенности → пользователь правит и подтверждает.

**Architecture:** Vite + React + TS фронт в корне; отдельный Node-сервер (`server/`, чистый `node:http`, файлы `.mjs`) с одним эндпоинтом `POST /api/lookup`. За эндпоинтом — интерфейс провайдера: `mock` сейчас (готовые фикстуры), `anthropic` потом (Claude API + веб-поиск), выбор через `LLM_PROVIDER`. Ключ только на сервере. Атрибуты валидируются схемой (zod); при неуверенности поля = `unknown`, числа не выдумываются.

**Tech Stack:** Vite 8, React 19, TypeScript, Vitest (+ jsdom, @testing-library) на фронте; Node ≥20 `node:http` + zod + встроенный `node:test` на сервере.

---

## Конвенции для исполнителя

- **Все команды выполняются из корня `shoes-project`.** npm для сервера — через `--prefix server` (не использовать `cd`).
- **Каждое git-сообщение заканчивается строкой:** `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Порядок шагов в каждой задаче строгий: тест → запуск (падает) → реализация → запуск (проходит) → коммит.

## Карта файлов

**Корень (фронт)**
- `package.json` — скрипты и зависимости фронта.
- `vite.config.ts` — Vite + React + конфиг Vitest (jsdom, include только `src/**`).
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — TS.
- `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css` — каркас UI.
- `src/test-setup.ts` — подключение `@testing-library/jest-dom`.
- `src/types.ts` — типы атрибутов (зеркало серверной схемы).
- `src/lib/api.ts` — клиент `lookupModel()`.
- `src/lib/confidence.ts` — подписи/цвет бейджа уверенности.
- `src/components/ModelLookup.tsx` — экран: ввод → карточка → правка → подтверждение.

**`server/` (бэкенд)**
- `server/package.json`, `server/.gitignore`, `server/.env.example`.
- `server/attributes.mjs` — zod-схема + `validateAttributes()`.
- `server/normalize.mjs` — `normalizeModelName()`.
- `server/mockProvider.mjs` — `mockLookup()` + фикстуры.
- `server/anthropicProvider.mjs` — `anthropicLookup()` (заглушка «не настроено»).
- `server/provider.mjs` — `getProvider()` (выбор по `LLM_PROVIDER`).
- `server/app.mjs` — `node:http` сервер (экспорт `server`, без авто-listen).
- `server/index.mjs` — точка входа: `server.listen(PORT)`.
- `server/test/*.test.mjs` — тесты (`node:test`).

**Канонический тип `Attributes` (используется везде одинаково):**
`brand: string`, `model: string`, `category: running|lifestyle|basketball|training|hiking|other|unknown`, `upperMaterial: string`, `stretch: stretchy|moderate|rigid|unknown`, `sizeReputation: runs_small|true_to_size|runs_large|unknown`, `widthReputation: narrow|standard|wide|unknown`, `toeBox: low|standard|roomy|unknown`, `confidence: high|medium|low`, `notes: string`, `sources: {title, url}[]`.

Ответ эндпоинта: `{ normalized: string, attributes: Attributes }`.

---

### Task 1: Каркас фронтенда (Vite + React + TS + Vitest)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test-setup.ts`, `.gitignore`

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "shoes-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Установить зависимости**

```bash
npm install react react-dom
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 3: Создать конфиги**

`.gitignore`:
```
node_modules
dist
*.local
.env
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['src/test-setup.ts'],
  },
})
```

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

`tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vite/client", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "module": "esnext",
    "types": ["node"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true
  },
  "include": ["vite.config.ts"]
}
```

`index.html`:
```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Подбор кроссовок по удобству</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Подбор кроссовок по удобству</h1>
      <p>Шаг 1 — проверка модели.</p>
    </main>
  )
}
```

`src/index.css`:
```css
:root { color-scheme: light dark; }
body { margin: 0; }
* { box-sizing: border-box; }
```

`src/test-setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Проверить, что каркас собирается**

Run: `npm run build`
Expected: сборка завершается без ошибок, появляется папка `dist/`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS frontend with Vitest"
```

---

### Task 2: Каркас сервера (node:http, zod, node:test)

**Files:**
- Create: `server/package.json`, `server/.gitignore`, `server/.env.example`

- [ ] **Step 1: Создать `server/package.json`**

```json
{
  "name": "shoes-project-server",
  "private": true,
  "type": "module",
  "version": "0.1.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "start": "node index.mjs",
    "dev": "node --watch index.mjs",
    "test": "node --test"
  },
  "dependencies": {}
}
```

- [ ] **Step 2: Установить zod в серверный пакет**

```bash
npm --prefix server install zod
```

- [ ] **Step 3: Создать `server/.gitignore` и `server/.env.example`**

`server/.gitignore`:
```
node_modules
.env
```

`server/.env.example`:
```
# Порт API
PORT=8787
# Провайдер LLM: mock (по умолчанию) или anthropic
LLM_PROVIDER=mock
# Разрешённые origin фронта (через запятую)
CORS_ORIGINS=http://localhost:5173
# Ключ Anthropic (нужен только при LLM_PROVIDER=anthropic). НЕ коммитить реальный ключ.
ANTHROPIC_API_KEY=
```

- [ ] **Step 4: Проверить установку zod**

Run: `npm --prefix server ls zod`
Expected: в выводе строка `zod@...` без `(empty)`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold node:http server package with zod"
```

---

### Task 3: Схема атрибутов (zod)

**Files:**
- Create: `server/attributes.mjs`
- Test: `server/test/attributes.test.mjs`

- [ ] **Step 1: Написать падающий тест**

`server/test/attributes.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAttributes } from '../attributes.mjs';

const VALID = {
  brand: 'Nike',
  model: 'Pegasus 40',
  category: 'running',
  upperMaterial: 'engineered mesh',
  stretch: 'moderate',
  sizeReputation: 'true_to_size',
  widthReputation: 'standard',
  toeBox: 'standard',
  confidence: 'high',
  notes: '',
  sources: [],
};

test('пропускает валидный объект атрибутов', () => {
  assert.deepEqual(validateAttributes(VALID), VALID);
});

test('пропускает значения unknown', () => {
  const u = { ...VALID, category: 'unknown', stretch: 'unknown', sizeReputation: 'unknown', widthReputation: 'unknown', toeBox: 'unknown', confidence: 'low' };
  assert.deepEqual(validateAttributes(u), u);
});

test('отвергает неизвестную категорию', () => {
  assert.throws(() => validateAttributes({ ...VALID, category: 'sneakers' }));
});

test('отвергает отсутствующее поле', () => {
  const { confidence, ...missing } = VALID;
  void confidence;
  assert.throws(() => validateAttributes(missing));
});
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm --prefix server test`
Expected: FAIL — `Cannot find module '../attributes.mjs'`.

- [ ] **Step 3: Реализовать схему**

`server/attributes.mjs`:
```js
import { z } from 'zod';

export const AttributesSchema = z.object({
  brand: z.string(),
  model: z.string(),
  category: z.enum(['running', 'lifestyle', 'basketball', 'training', 'hiking', 'other', 'unknown']),
  upperMaterial: z.string(),
  stretch: z.enum(['stretchy', 'moderate', 'rigid', 'unknown']),
  sizeReputation: z.enum(['runs_small', 'true_to_size', 'runs_large', 'unknown']),
  widthReputation: z.enum(['narrow', 'standard', 'wide', 'unknown']),
  toeBox: z.enum(['low', 'standard', 'roomy', 'unknown']),
  confidence: z.enum(['high', 'medium', 'low']),
  notes: z.string(),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
});

// Бросает ZodError, если объект не соответствует схеме.
export function validateAttributes(obj) {
  return AttributesSchema.parse(obj);
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm --prefix server test`
Expected: PASS (4 теста).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): attributes zod schema + validation"
```

---

### Task 4: Нормализация названия модели

**Files:**
- Create: `server/normalize.mjs`
- Test: `server/test/normalize.test.mjs`

- [ ] **Step 1: Написать падающий тест**

`server/test/normalize.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeModelName } from '../normalize.mjs';

test('обрезает пробелы и схлопывает повторы', () => {
  assert.equal(normalizeModelName('  Nike   Pegasus 40 '), 'nike pegasus 40');
});

test('приводит к нижнему регистру', () => {
  assert.equal(normalizeModelName('AIR Force 1'), 'air force 1');
});

test('пустые/невалидные входы → пустая строка', () => {
  assert.equal(normalizeModelName(''), '');
  assert.equal(normalizeModelName(null), '');
  assert.equal(normalizeModelName(undefined), '');
});
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm --prefix server test`
Expected: FAIL — `Cannot find module '../normalize.mjs'`.

- [ ] **Step 3: Реализовать нормализацию**

`server/normalize.mjs`:
```js
// Каноничный ключ модели: trim, схлопывание пробелов, нижний регистр.
export function normalizeModelName(raw) {
  return String(raw ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm --prefix server test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): model name normalization"
```

---

### Task 5: Mock-провайдер + фикстуры

**Files:**
- Create: `server/mockProvider.mjs`
- Test: `server/test/mockProvider.test.mjs`

- [ ] **Step 1: Написать падающий тест**

`server/test/mockProvider.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockLookup } from '../mockProvider.mjs';
import { validateAttributes } from '../attributes.mjs';

test('известная модель → валидные атрибуты с высокой/средней уверенностью', () => {
  const a = mockLookup('Nike Pegasus 40');
  assert.doesNotThrow(() => validateAttributes(a));
  assert.equal(a.brand, 'Nike');
  assert.notEqual(a.confidence, 'low');
});

test('регистр и пробелы не важны (нормализация ключа)', () => {
  const a = mockLookup('  nike   PEGASUS 40 ');
  assert.equal(a.brand, 'Nike');
});

test('неизвестная модель → confidence low и поля unknown', () => {
  const a = mockLookup('Zzz Unknown 999');
  assert.doesNotThrow(() => validateAttributes(a));
  assert.equal(a.confidence, 'low');
  assert.equal(a.category, 'unknown');
  assert.equal(a.model, 'Zzz Unknown 999');
});
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm --prefix server test`
Expected: FAIL — `Cannot find module '../mockProvider.mjs'`.

- [ ] **Step 3: Реализовать mock-провайдер**

`server/mockProvider.mjs`:
```js
import { normalizeModelName } from './normalize.mjs';

// Курируемые примеры. Ключ — нормализованное имя. Значения подобраны вручную
// (это фикстуры для разработки без ключа API, не «правда» о моделях).
const FIXTURES = {
  'nike pegasus 40': {
    brand: 'Nike', model: 'Pegasus 40', category: 'running',
    upperMaterial: 'engineered mesh', stretch: 'moderate',
    sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
    confidence: 'high', notes: 'Универсальная беговая, садится в размер.', sources: [],
  },
  'adidas ultraboost': {
    brand: 'Adidas', model: 'Ultraboost', category: 'running',
    upperMaterial: 'Primeknit (вязаный)', stretch: 'stretchy',
    sizeReputation: 'runs_small', widthReputation: 'narrow', toeBox: 'standard',
    confidence: 'medium', notes: 'Вязаный верх тянется; многие берут на полразмера больше.', sources: [],
  },
  'new balance 990': {
    brand: 'New Balance', model: '990', category: 'lifestyle',
    upperMaterial: 'замша/сетка', stretch: 'rigid',
    sizeReputation: 'true_to_size', widthReputation: 'wide', toeBox: 'roomy',
    confidence: 'medium', notes: 'Просторная колодка, есть варианты ширины.', sources: [],
  },
  'asics gel kayano': {
    brand: 'ASICS', model: 'Gel-Kayano', category: 'running',
    upperMaterial: 'engineered mesh', stretch: 'moderate',
    sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
    confidence: 'medium', notes: 'Стабилизирующая беговая, в размер.', sources: [],
  },
  'nike air force 1': {
    brand: 'Nike', model: 'Air Force 1', category: 'lifestyle',
    upperMaterial: 'кожа', stretch: 'rigid',
    sizeReputation: 'runs_large', widthReputation: 'standard', toeBox: 'standard',
    confidence: 'medium', notes: 'Кожаный верх не тянется; многие берут на полразмера меньше.', sources: [],
  },
  'converse chuck taylor': {
    brand: 'Converse', model: 'Chuck Taylor All Star', category: 'lifestyle',
    upperMaterial: 'текстиль (канвас)', stretch: 'rigid',
    sizeReputation: 'runs_large', widthReputation: 'narrow', toeBox: 'low',
    confidence: 'medium', notes: 'Узкие, обычно берут на полразмера меньше.', sources: [],
  },
};

export function mockLookup(model) {
  const key = normalizeModelName(model);
  const found = FIXTURES[key];
  if (found) return found;
  return {
    brand: '',
    model: String(model ?? '').trim(),
    category: 'unknown',
    upperMaterial: 'unknown',
    stretch: 'unknown',
    sizeReputation: 'unknown',
    widthReputation: 'unknown',
    toeBox: 'unknown',
    confidence: 'low',
    notes: 'Модель не найдена среди примеров — заполните атрибуты вручную.',
    sources: [],
  };
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm --prefix server test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): mock provider with fixtures + unknown fallback"
```

---

### Task 6: Anthropic-заглушка + фабрика провайдеров

**Files:**
- Create: `server/anthropicProvider.mjs`, `server/provider.mjs`
- Test: `server/test/provider.test.mjs`

- [ ] **Step 1: Написать падающий тест**

`server/test/provider.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getProvider } from '../provider.mjs';

test('по умолчанию провайдер mock и отдаёт валидный бренд', async () => {
  delete process.env.LLM_PROVIDER;
  const p = getProvider();
  assert.equal(p.kind, 'mock');
  const a = await p.lookup('Nike Pegasus 40');
  assert.equal(a.brand, 'Nike');
});

test('LLM_PROVIDER=anthropic → kind anthropic, lookup бросает NOT_CONFIGURED', async () => {
  process.env.LLM_PROVIDER = 'anthropic';
  const p = getProvider();
  assert.equal(p.kind, 'anthropic');
  await assert.rejects(() => p.lookup('Nike Pegasus 40'), /NOT_CONFIGURED/);
  delete process.env.LLM_PROVIDER;
});
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm --prefix server test`
Expected: FAIL — `Cannot find module '../provider.mjs'`.

- [ ] **Step 3: Реализовать заглушку и фабрику**

`server/anthropicProvider.mjs`:
```js
// Заглушка. Реальный вызов Claude API + веб-поиск (вариант b) добавим, когда
// будет ключ ANTHROPIC_API_KEY. Сейчас сигнализируем «не настроено».
export async function anthropicLookup(/* model */) {
  throw new Error('ANTHROPIC_PROVIDER_NOT_CONFIGURED');
}
```

`server/provider.mjs`:
```js
import { mockLookup } from './mockProvider.mjs';
import { anthropicLookup } from './anthropicProvider.mjs';

// Единый интерфейс: { kind, lookup(model) -> Promise<Attributes> }.
// Выбор реализации по env LLM_PROVIDER (по умолчанию mock).
export function getProvider() {
  const kind = process.env.LLM_PROVIDER || 'mock';
  if (kind === 'anthropic') {
    return { kind: 'anthropic', lookup: anthropicLookup };
  }
  return { kind: 'mock', lookup: async (model) => mockLookup(model) };
}
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm --prefix server test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): provider factory + anthropic stub"
```

---

### Task 7: HTTP-сервер и эндпоинт `POST /api/lookup`

**Files:**
- Create: `server/app.mjs`, `server/index.mjs`
- Test: `server/test/app.integration.test.mjs`

- [ ] **Step 1: Написать падающий интеграционный тест**

`server/test/app.integration.test.mjs`:
```js
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../app.mjs';

let base;
before(async () => {
  await new Promise((r) => server.listen(0, r));
  const { port } = server.address();
  base = `http://127.0.0.1:${port}`;
});
after(() => new Promise((r) => server.close(r)));

function post(path, body) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('GET /api/health → { ok: true }', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test('POST /api/lookup известная модель → атрибуты + normalized', async () => {
  const res = await post('/api/lookup', { model: 'Nike Pegasus 40' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.normalized, 'nike pegasus 40');
  assert.equal(data.attributes.brand, 'Nike');
  assert.equal(data.attributes.confidence, 'high');
});

test('POST /api/lookup без model → 400', async () => {
  const res = await post('/api/lookup', {});
  assert.equal(res.status, 400);
});

test('POST /api/lookup неизвестная модель → confidence low', async () => {
  const res = await post('/api/lookup', { model: 'Zzz Unknown 999' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.attributes.confidence, 'low');
});
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm --prefix server test`
Expected: FAIL — `Cannot find module '../app.mjs'`.

- [ ] **Step 3: Реализовать сервер**

`server/app.mjs`:
```js
import { createServer } from 'node:http';
import { getProvider } from './provider.mjs';
import { normalizeModelName } from './normalize.mjs';
import { validateAttributes } from './attributes.mjs';

const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);

const provider = getProvider();
export const providerKind = provider.kind;

function setCors(req, res) {
  const origin = req.headers.origin;
  if (origin && (CORS_ORIGINS.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8') || '{}';
  return JSON.parse(raw);
}

export const server = createServer(async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/lookup') {
      const body = await readJsonBody(req).catch(() => null);
      const model = body && typeof body.model === 'string' ? body.model.trim() : '';
      if (!model) return json(res, 400, { error: 'model_required', message: 'Укажите название модели.' });

      const normalized = normalizeModelName(model);
      let attrs;
      try {
        attrs = await provider.lookup(model);
      } catch (e) {
        if (String(e?.message).includes('NOT_CONFIGURED')) {
          return json(res, 503, { error: 'llm_not_configured', message: 'LLM-провайдер не настроен. Введите атрибуты вручную.' });
        }
        throw e;
      }

      const attributes = validateAttributes(attrs);
      return json(res, 200, { normalized, attributes });
    }

    return json(res, 404, { error: 'not_found' });
  } catch {
    return json(res, 500, { error: 'internal_error' });
  }
});
```

`server/index.mjs`:
```js
import { server, providerKind } from './app.mjs';

const PORT = Number(process.env.PORT || 8787);
server.listen(PORT, () => {
  console.log(JSON.stringify({ event: 'server_listening', port: PORT, provider: providerKind }));
});
```

- [ ] **Step 4: Запустить тест — должен пройти**

Run: `npm --prefix server test`
Expected: PASS (все серверные тесты).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(server): http server + POST /api/lookup endpoint"
```

---

### Task 8: Фронт — клиент API и хелпер уверенности

**Files:**
- Create: `src/types.ts`, `src/lib/api.ts`, `src/lib/confidence.ts`
- Test: `src/lib/confidence.test.ts`, `src/lib/api.test.ts`

- [ ] **Step 1: Написать падающие тесты**

`src/lib/confidence.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { confidenceLabel } from './confidence'

describe('confidenceLabel', () => {
  it('low → просит проверить', () => {
    expect(confidenceLabel('low')).toContain('проверьте')
  })
  it('high → высокая', () => {
    expect(confidenceLabel('high')).toContain('Высокая')
  })
})
```

`src/lib/api.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { lookupModel } from './api'
import type { Attributes } from '../types'

const SAMPLE: Attributes = {
  brand: 'Nike', model: 'Pegasus 40', category: 'running',
  upperMaterial: 'engineered mesh', stretch: 'moderate',
  sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
  confidence: 'high', notes: '', sources: [],
}

afterEach(() => { vi.restoreAllMocks() })

describe('lookupModel', () => {
  it('возвращает атрибуты при успехе', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ normalized: 'nike pegasus 40', attributes: SAMPLE }), { status: 200 })))
    const r = await lookupModel('Nike Pegasus 40')
    expect(r.brand).toBe('Nike')
  })

  it('бросает ошибку с сообщением сервера', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ message: 'LLM не настроен' }), { status: 503 })))
    await expect(lookupModel('x')).rejects.toThrow('LLM не настроен')
  })
})
```

- [ ] **Step 2: Запустить тесты — должны упасть**

Run: `npm test`
Expected: FAIL — модули `./confidence` и `./api` не найдены.

- [ ] **Step 3: Реализовать типы, клиент и хелпер**

`src/types.ts`:
```ts
export type Confidence = 'high' | 'medium' | 'low'

export interface AttributeSource {
  title: string
  url: string
}

export interface Attributes {
  brand: string
  model: string
  category: 'running' | 'lifestyle' | 'basketball' | 'training' | 'hiking' | 'other' | 'unknown'
  upperMaterial: string
  stretch: 'stretchy' | 'moderate' | 'rigid' | 'unknown'
  sizeReputation: 'runs_small' | 'true_to_size' | 'runs_large' | 'unknown'
  widthReputation: 'narrow' | 'standard' | 'wide' | 'unknown'
  toeBox: 'low' | 'standard' | 'roomy' | 'unknown'
  confidence: Confidence
  notes: string
  sources: AttributeSource[]
}

export interface LookupResponse {
  normalized: string
  attributes: Attributes
}
```

`src/lib/confidence.ts`:
```ts
import type { Confidence } from '../types'

export function confidenceLabel(c: Confidence): string {
  switch (c) {
    case 'high': return 'Высокая уверенность'
    case 'medium': return 'Средняя уверенность'
    case 'low': return 'Низкая уверенность — проверьте'
  }
}

export function confidenceColor(c: Confidence): string {
  switch (c) {
    case 'high': return '#1a7f37'
    case 'medium': return '#9a6700'
    case 'low': return '#cf222e'
  }
}
```

`src/lib/api.ts`:
```ts
import type { Attributes, LookupResponse } from '../types'

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '')
  || 'http://localhost:8787'

export async function lookupModel(model: string): Promise<Attributes> {
  const res = await fetch(`${BASE}/api/lookup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  if (!res.ok) {
    let message = 'Не удалось получить атрибуты'
    try {
      const e = await res.json()
      if (e?.message) message = e.message
    } catch { /* тело не JSON — оставляем дефолтное сообщение */ }
    throw new Error(message)
  }
  const data = (await res.json()) as LookupResponse
  return data.attributes
}
```

- [ ] **Step 4: Запустить тесты — должны пройти**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(web): types, api client, confidence helper"
```

---

### Task 9: Фронт — экран ModelLookup (ввод → карточка → правка → подтверждение)

**Files:**
- Create: `src/components/ModelLookup.tsx`
- Modify: `src/App.tsx`
- Test: `src/components/ModelLookup.test.tsx`

- [ ] **Step 1: Написать падающий тест**

`src/components/ModelLookup.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelLookup from './ModelLookup'
import type { Attributes } from '../types'

vi.mock('../lib/api', () => ({ lookupModel: vi.fn() }))
import { lookupModel } from '../lib/api'

const SAMPLE: Attributes = {
  brand: 'Nike', model: 'Pegasus 40', category: 'running',
  upperMaterial: 'engineered mesh', stretch: 'moderate',
  sizeReputation: 'true_to_size', widthReputation: 'standard', toeBox: 'standard',
  confidence: 'high', notes: '', sources: [],
}

describe('ModelLookup', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('после поиска показывает атрибуты в редактируемой форме', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<ModelLookup />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    expect(await screen.findByDisplayValue('Nike')).toBeInTheDocument()
  })

  it('после подтверждения показывает сообщение', async () => {
    vi.mocked(lookupModel).mockResolvedValue(SAMPLE)
    render(<ModelLookup />)
    await userEvent.type(screen.getByLabelText('Модель кроссовок'), 'Nike Pegasus 40')
    await userEvent.click(screen.getByRole('button', { name: 'Найти' }))
    await screen.findByDisplayValue('Nike')
    await userEvent.click(screen.getByRole('button', { name: 'Подтвердить' }))
    expect(await screen.findByText(/подтверждены/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Запустить тест — должен упасть**

Run: `npm test`
Expected: FAIL — модуль `./ModelLookup` не найден.

- [ ] **Step 3: Реализовать компонент**

`src/components/ModelLookup.tsx`:
```tsx
import { useState } from 'react'
import type { Attributes, Confidence } from '../types'
import { lookupModel } from '../lib/api'
import { confidenceLabel, confidenceColor } from '../lib/confidence'

const CATEGORY = ['running', 'lifestyle', 'basketball', 'training', 'hiking', 'other', 'unknown'] as const
const STRETCH = ['stretchy', 'moderate', 'rigid', 'unknown'] as const
const SIZE_REP = ['runs_small', 'true_to_size', 'runs_large', 'unknown'] as const
const WIDTH_REP = ['narrow', 'standard', 'wide', 'unknown'] as const
const TOEBOX = ['low', 'standard', 'roomy', 'unknown'] as const

function emptyAttributes(model: string): Attributes {
  return {
    brand: '', model, category: 'unknown', upperMaterial: 'unknown',
    stretch: 'unknown', sizeReputation: 'unknown', widthReputation: 'unknown',
    toeBox: 'unknown', confidence: 'low', notes: '', sources: [],
  }
}

export default function ModelLookup() {
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
      <label htmlFor="model-input" style={{ display: 'block', marginBottom: 4 }}>Модель кроссовок</label>
      <input
        id="model-input"
        aria-label="Модель кроссовок"
        value={model}
        onChange={(e) => setModel(e.target.value)}
        placeholder="Напр. Nike Pegasus 40"
        style={{ padding: 8, width: '100%', maxWidth: 360 }}
      />
      <button onClick={search} disabled={loading || !model.trim()} style={{ marginLeft: 8, padding: '8px 16px' }}>
        {loading ? 'Идёт поиск…' : 'Найти'}
      </button>

      {error && (
        <div style={{ marginTop: 16 }}>
          <p style={{ color: '#cf222e' }}>{error}</p>
          <button onClick={() => { setAttrs(emptyAttributes(model)); setError(null) }}>
            Заполнить вручную
          </button>
        </div>
      )}

      {attrs && (
        <form style={{ marginTop: 24, display: 'grid', gap: 12, maxWidth: 480 }}>
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

          <button type="button" onClick={() => setConfirmed(true)} style={{ padding: '8px 16px' }}>
            Подтвердить
          </button>
          {confirmed && <p style={{ color: '#1a7f37' }}>Атрибуты подтверждены.</p>}
        </form>
      )}
    </section>
  )
}
```

- [ ] **Step 4: Подключить компонент в `src/App.tsx`**

Заменить содержимое `src/App.tsx` на:
```tsx
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
```

- [ ] **Step 5: Запустить тесты — должны пройти**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Ручная проверка (две консоли)**

Консоль 1: `npm --prefix server start` → ждём лог `server_listening`.
Консоль 2: `npm run dev` → открыть напечатанный URL (обычно http://localhost:5173).
Проверить: ввести «Nike Pegasus 40» → «Найти» → появляется карточка с бейджем «Высокая уверенность», поля редактируются, «Подтвердить» → «Атрибуты подтверждены». Ввести выдуманную модель → бейдж «Низкая уверенность — проверьте», поля `unknown`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(web): ModelLookup screen with editable attributes + confirm"
```

---

## Самопроверка плана

**Покрытие спеки:**
- Ввод модели → атрибуты: Task 7 (эндпоинт) + Task 9 (UI). ✓
- Структурированные атрибуты + схема: Task 3. ✓
- Уверенность + `unknown`, без выдуманных чисел: Task 3 (схема с `unknown`), Task 5 (fallback low/unknown), Task 9 (бейдж). ✓
- Интерфейс провайдера (mock сейчас / anthropic потом, env): Task 6. ✓
- Ключ на сервере, не во фронте: ключ только в `server/.env` (Task 2); фронт ходит на `/api/lookup`. ✓
- Нормализация имени: Task 4, используется в Task 5 и Task 7. ✓
- Правка/подтверждение пользователем: Task 9. ✓
- Обработка ошибок (нет ключа / неизвестная модель): Task 7 (503 `llm_not_configured`), Task 5 (low/unknown), Task 9 («Заполнить вручную»). ✓
- Тесты без сети и ключа: серверные на `mock`; фронтовые мокают `fetch`/`lookupModel`. ✓

**Сканирование заглушек:** настоящих TODO/«реализовать позже» в коде шага нет. `anthropicLookup` — намеренная заглушка по дизайну (вариант b позже), покрыта тестом.

**Согласованность типов:** поля и значения enum совпадают между `server/attributes.mjs` и `src/types.ts`; ответ `{ normalized, attributes }` одинаков в Task 7 и `LookupResponse` (Task 8); имена функций (`lookupModel`, `getProvider`, `mockLookup`, `anthropicLookup`, `normalizeModelName`, `validateAttributes`, `confidenceLabel`, `confidenceColor`) едины во всех задачах.

## Вне рамок шага 1

Замер стопы (шаг 2), вердикт (шаг 3), визуализация посадки (3b), картинка на ноге (Фича 2, шаг 4), база/каталог (шаг 5), реальный вызов Claude API + веб-поиск (включается заменой заглушки в `anthropicProvider.mjs`).
