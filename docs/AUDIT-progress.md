# Аудит проекта — прогресс (точка возобновления)

Структурный аудит (5 дименшенов + адверсариальная верификация) дал **13 подтверждённых
находок**. Чиним на ветке **`audit-fixes`** (запушена на GitHub). Каждый фикс = коммит + тесты.

Состояние ветки `audit-fixes`: всё зелёное — **фронт 30 тестов, сервер 17, сборка чистая.**

## Сделано (закоммичено на `audit-fixes`)
- ✅ **#1 (bug, important)** Честность ориентира: `parseNum` принимает только положительное
  число без мусора; `hasReference` требует `> 0`; добавлена санити-проверка размера. (`src/foot/*`)
- ✅ **#3 (structure)** Единый источник enum-словарей: массивы `as const` в `types.ts` и
  `foot/types.ts`, типы выведены из них; `ModelLookup`/`FootInput` импортируют массивы.
- ✅ **#4 + #9 (structure/tests)** Типизированный `err.code = 'LLM_NOT_CONFIGURED'`; `app.mjs`
  ветвится по коду (не по тексту); `createApp(provider)` инъектируемый; добавлен интеграционный тест 503.
- ✅ **#7 (spec)** В `CLAUDE.md` убрана старая формулировка «подбор» из вводной строки.

## Осталось (делать на ветке `audit-fixes`, по порядку)
- ⬜ **#2 (structure, important)** Поднять общее состояние в `App`: дать `ModelLookup`
  колбэк `onConfirm?(attrs)` (симметрично `FootInput.onChange`), `App` держит `attributes`
  и `foot` — чтобы шагам 3–4 было откуда брать оба. Обновить тесты ModelLookup.
- ⬜ **#10 (tests, minor)** `src/lib/api.test.ts`: добавить кейсы — тело ответа без `message`
  (ожидаем дефолтный текст) и не-JSON тело (catch не бросает, тот же дефолт).
- ⬜ **#13 (tests, minor)** `src/lib/confidence.test.ts`: покрыть `confidenceColor` (3 цвета)
  и `confidenceLabel('medium')`.
- ⬜ **#5 (simplify, minor)** `src/foot/sizing.ts`: `sizeToMm`/`euToMm` не вызываются из
  приложения — пометить комментарием как задел под шаг 3.1 (size → внутр. мм) ЛИБО удалить.
- ⬜ **#8 (spec, minor)** `docs/ROADMAP.md`: отметить галочками подшаги 2.1–2.5 и пункт
  «убрать подбор» (код уже сделан) — чтобы трекер не противоречил себе.
- Затем: мерж `audit-fixes` → `main` (FF), удалить ветку, `git push origin main`,
  обновить статусы в `ROADMAP.md` и `CLAUDE.md`.

## Осознанно НЕ меняем
- **#6**: `default`-ветки в `src/lib/confidence.ts` — это намеренная страховка от дрейфа
  данных (ответ API кастится `as`), а не лишний дубликат. Оставляем как есть.

## Как продолжить
1. `cd C:\Users\zhana\shoes-project` → `git checkout audit-fixes`
2. Делать пункты из «Осталось». После каждого: `npm test` + `npm --prefix server test`
   + `npm run build`, затем коммит + `git push origin audit-fixes`.
3. Когда всё готово — мерж в `main`, пуш, обновить статусы.
