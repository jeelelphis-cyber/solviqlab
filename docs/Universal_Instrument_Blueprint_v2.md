# Universal Instrument Blueprint v2.0
*SolviqLab Intent Platform · 2026-07-23*

> **Sprint V3-09A — Architecture Audit**
> Цель: доказать или опровергнуть, что любой новый тип продукта
> подключается к существующим Engine без изменения ядра.

---

## 0. Результат аудита — одной строкой

**Архитектура частично универсальна. Найдены 4 архитектурных долга.**
Новые типы продуктов могут использовать Profile Engine и Dashboard без изменений.
Но Journey Engine и Event Bus требуют расширения для каждого нового типа.

---

## 1. Что такое Instrument

Instrument — это любой продукт платформы, который:

1. **Принимает Intent пользователя** (явный или неявный)
2. **Производит значимый Result** (число, план, оценку, список, рекомендацию)
3. **Обновляет Profile пользователя** (сигналы, уверенность доменов)
4. **Продвигает Journey** (пользователь стал на шаг ближе к цели)
5. **Генерирует Recommendation** (что делать дальше)
6. **Виден на Dashboard** (прогресс отражается)

Calculator, Assessment, Quiz, Planner, Tracker, Generator, AI Coach —
это не разные продукты. Это разные **формы исполнения одного контракта**.

---

## 2. Аудит существующих типов (реальный код)

### Типы продуктов в кодовой базе

| Тип | Существует | Путь |
|-----|-----------|------|
| Calculator | ✅ | `app/[lang]/calculators/[slug]/` |
| Converter | ✅ | `app/[lang]/converters/[slug]/` |
| Assessment | ✅ | `app/[lang]/assessment/[cluster]/` |
| Quiz | ❌ | не существует |
| Planner | ❌ | не существует |
| Tracker | ❌ | не существует |
| Generator | ❌ | не существует |
| AI Tool | ❌ | не существует |

### Как каждый тип подключён к Engine (реальное состояние)

| | User Engine | Profile Engine | Journey Engine | Recommendation | Dashboard |
|---|---|---|---|---|---|
| **Calculator (BMI)** | ✅ storeResult() | ✅ processResult() | ✅ NEXT_STEP_DATA | ✅ полный | ✅ domain bars |
| **Calculator (остальные 35)** | ⚠️ markVisited() | ❌ нет сигналов | ✅ NEXT_STEP_DATA | ⚠️ только visited | ❌ нет данных |
| **Converter (6 типов)** | ❌ нет | ❌ нет | ❌ нет | ❌ нет | ❌ нет |
| **Assessment** | ❌ нет прямой связи | ✅ writeSignalsDirect() | ❌ нет записи | ❌ нет хуков | ✅ domain bars |

### Критический вывод

**35 из 36 калькуляторов не пишут в Profile Engine.**
Только BMI Calculator диспатчит `solviqlab:result`. Остальные отображают результат
пользователю, но платформа их не "видит". Dashboard пуст для всех кроме BMI.

**Assessment изолирован от Journey Engine.**
Прохождение Assessment не продвигает Journey. `NEXT_STEP_DATA` не знает об assessment.
Пользователь прошёл Weight Assessment — Journey показывает его не продвинувшимся.

---

## 3. Universal Instrument Contract

Минимальный интерфейс, который ОБЯЗАН реализовать любой Instrument.

```typescript
interface InstrumentContract {
  // ─── Identity ──────────────────────────────────────────────────────────────
  readonly slug: string                    // 'bmi-calculator', 'weight-assessment'
  readonly type: InstrumentType            // 'calculator' | 'assessment' | 'planner' | ...
  readonly cluster: IntentCluster          // 'weight' | 'sleep' | 'finance' | ...
  readonly indexable: boolean              // SEO: true для Entry Pages, false для Internal

  // ─── Step 1: Input ─────────────────────────────────────────────────────────
  // Что пользователь вводит или что читается из Profile
  // Для Calculator: форма ввода
  // Для Assessment: читает ProfileEngine, задаёт gap questions
  // Для Planner: читает AssessmentResult + цель пользователя

  // ─── Step 2: Processing ────────────────────────────────────────────────────
  // Логика специфична для типа:
  // Calculator: математическая формула
  // Assessment: scoring DSL + insight rules
  // Planner: генерация плана по алгоритму
  // Quiz: ветвление вопросов + финальный скор

  // ─── Step 3: Result ────────────────────────────────────────────────────────
  readonly result: InstrumentResult        // унифицированный тип результата

  // ─── Step 4: Profile Update ────────────────────────────────────────────────
  // ОБЯЗАТЕЛЕН для всех типов
  emitResult(detail: ResultCaptureDetail): void
  // Диспатчит window CustomEvent 'solviqlab:result'
  // ИЛИ вызывает profileEngine.writeSignalsDirect() напрямую
  // Оба пути допустимы — важен факт записи в Profile

  // ─── Step 5: Journey Update ────────────────────────────────────────────────
  // Slug или cluster должен быть зарегистрирован в Journey config
  // Либо через NEXT_STEP_DATA (для SEO Entry инструментов)
  // Либо через ASSESSMENT_REGISTRY (для Internal инструментов)
  readonly journeySlug: string             // что регистрировать в Journey

  // ─── Step 6: Recommendation Hook ───────────────────────────────────────────
  // Что рекомендовать ПОСЛЕ этого инструмента
  readonly recommendationHooks: RecommendationBoost[]

  // ─── Step 7: Analytics ─────────────────────────────────────────────────────
  emitAnalytics(event: InstrumentAnalyticsEvent): void

  // ─── Step 8: AI Context ────────────────────────────────────────────────────
  // Структурированный контекст для AI Coach
  // Не сырые данные — интерпретированный результат
  buildAIContext?(): InstrumentAIContext
}

type InstrumentType =
  | 'calculator'    // числовой результат, математическая формула
  | 'converter'     // преобразование единиц (упрощённый calculator)
  | 'assessment'    // синтез из нескольких сигналов → оценка + нарратив
  | 'quiz'          // вопросы → категория/профиль
  | 'planner'       // цель + данные → план с шагами
  | 'checklist'     // список действий + отслеживание выполнения
  | 'tracker'       // повторяющийся ввод → прогресс во времени
  | 'generator'     // параметры → сгенерированный контент
  | 'ai-tool'       // NL вопрос + профиль → персонализированный ответ
```

---

## 4. Lifecycle любого Instrument

```
1. SEO / Discovery
   └─ Пользователь приходит через поиск или внутреннюю ссылку

2. Landing
   └─ SSG страница: title, meta, JSON-LD, hreflang
   └─ Client component загружается

3. Input
   ├─ Calculator:  пользователь заполняет форму
   ├─ Assessment:  ProfileEngine читается → gap questions если нужно
   ├─ Planner:     AssessmentResult + пользователь указывает цель
   ├─ Quiz:        последовательные вопросы
   └─ Tracker:     пользователь вводит значение за период

4. Processing
   ├─ Calculator:  детерминированная формула → Result
   ├─ Assessment:  ScoringDSL + InsightDSL → AssessmentResult
   ├─ Planner:     PlanAlgorithm → PlanResult с milestones
   └─ Quiz:        branch logic → category/score

5. Result Display
   └─ Показать результат пользователю (число, нарратив, план, список)

6. Profile Update  ← ОБЯЗАТЕЛЕН для всех типов
   ├─ Путь A (Calculator/Quiz): dispatch 'solviqlab:result' CustomEvent
   │   → UserJourneySection слушает → UserEngine.storeResult()
   │   → ProfileEngine.processResult() → сигналы в домены
   └─ Путь B (Assessment/Planner): profileEngine.writeSignalsDirect()
       → pre-built сигналы записываются напрямую

7. Journey Update  ← ОБЯЗАТЕЛЕН для всех типов
   ├─ SEO Entry инструменты: slug в NEXT_STEP_DATA → journey progress
   └─ Internal инструменты: регистрация в ASSESSMENT_REGISTRY (расширить)

8. Recommendation
   └─ RecommendationEngine читает обновлённый Profile + Journey state
   └─ Предлагает следующий Instrument

9. Dashboard Update (автоматический)
   └─ Profile domains обновились → DomainBars перестраиваются
   └─ Journey state обновился → JourneyGrid обновляется

10. AI Context (опционально)
    └─ buildAIContext() → AssessmentAIContext для AI Coach
```

---

## 5. Engine Matrix — какой тип что использует

| Engine | Calculator | Converter | Assessment | Quiz | Planner | Tracker | Generator | AI Tool |
|--------|-----------|-----------|-----------|------|---------|---------|-----------|---------|
| **User Engine** | ✅ storeResult | ❌ | ❌ прямой | ✅ storeResult | ✅ storeResult | ✅ storeResult | ❌ | ✅ storeResult |
| **Profile Engine** | ✅ processResult | ❌ | ✅ writeSignalsDirect | ✅ processResult | ✅ writeSignalsDirect | ✅ writeSignalsDirect | ❌ | ✅ читает |
| **Journey Engine** | ✅ NEXT_STEP_DATA | ❌ | ⚠️ не зарегистрирован | нужна регистрация | нужна регистрация | ❌ | ❌ | ❌ |
| **Recommendation** | ✅ полный | ❌ | ⚠️ нет хуков | нужны хуки | нужны хуки | нужны хуки | ❌ | ❌ |
| **Assessment Engine** | ❌ | ❌ | ✅ engine.run() | ❌ | читает результат | ❌ | ❌ | читает контекст |
| **Dashboard** | ✅ через Profile | ❌ | ✅ через Profile | ✅ через Profile | ✅ через Profile | ✅ через Profile | ❌ | ✅ через Profile |
| **Analytics** | ✅ GA4 | ❌ | ✅ GA4 | ✅ GA4 | ✅ GA4 | ✅ GA4 | ✅ GA4 | ✅ GA4 |

**Легенда:**
- ✅ реализовано
- ⚠️ частично / архитектурный долг
- ❌ не нужно для этого типа / не реализовано
- "нужна регистрация" = добавить в конфиг без изменения ядра

---

## 6. Найденные архитектурные проблемы

### 🔴 Проблема 1 — 35 калькуляторов "немые"

**Описание:** Только BMI Calculator диспатчит `solviqlab:result`.
35 других калькуляторов вычисляют результат и показывают пользователю,
но Platform их не видит. Profile Engine для них пустой.

**Последствие:** Dashboard почти пуст для большинства пользователей.
Recommendation Engine работает только на visited-данных, не на реальных сигналах.

**Решение:** Добавить `window.dispatchEvent(new CustomEvent('solviqlab:result', ...))` 
в каждый Calculator Client. Не нужно менять ядро — только клиентский компонент.

**Масштаб:** 35 файлов × ~5 строк = ~175 строк. Механический рефактор.

---

### 🔴 Проблема 2 — Assessment изолирован от Journey

**Описание:** `NEXT_STEP_DATA` в `src/lib/journey/config.ts` содержит только
calculator slugs. Assessment cluster IDs ('weight', 'sleep') там отсутствуют.

**Последствие:** Пользователь прошёл Weight Assessment — Journey показывает
что он застрял на том же шаге. Нет milestone "Assessment Completed".
`NextStepCard` никогда не предложит Assessment как следующий шаг.

**Решение:** Расширить Journey Engine для поддержки internal продуктов:
```typescript
// ДОБАВИТЬ в journey/config.ts — НЕ изменяет существующую структуру
const ASSESSMENT_JOURNEY_STEPS: Record<string, JourneyStepConfig> = {
  'assessment:weight': {
    journeyId: 'weight-management',
    milestone: 'synthesis',
    nextSlug: 'weight-planner',
    ...
  }
}
```
**Масштаб:** ~20 строк в config.ts + обновление UserEngine.storeResult() для
распознавания assessment событий.

---

### 🟡 Проблема 3 — Converter полностью изолирован

**Описание:** 6 конвертеров не подключены ни к одному Engine.
Нет события, нет Profile сигналов, нет Journey, нет Recommendation.

**Оценка:** Это НАМЕРЕННО для Converters — они utility продукты.
Currency Converter, Length Converter не являются частью Intent Journey.
Они SEO-страницы для общего трафика.

**Решение:** Не исправлять. Converter — отдельная категория, не Intent Instrument.
Добавить явную пометку в архитектуру: Converter is NOT an Intent Instrument.

---

### 🟡 Проблема 4 — Recommendation Engine не получает Assessment результаты

**Описание:** `RecommendationEngine.recommend()` строит контекст через
`buildContextFromEngine()` который читает только UserEngine данные.
AssessmentResult не передаётся в Recommendation Engine напрямую.

**Последствие:** После Weight Assessment Recommendation Engine не знает
что Assessment завершён с каким score. Не может правильно взвесить Planner.

**Решение:** `AssessmentClient` должен после завершения вызывать
`userEngine.storeResult()` с assessment slug — тогда Recommendation Engine
увидит его в completed_slugs и сможет применить boost.
Это 3-5 строк в AssessmentClient без изменения ядра.

---

## 7. Extension Rules — как добавить новый Instrument

### Правило 1: без изменения ядра Engine

Profile Engine, User Engine, Recommendation Engine, Dashboard —
не трогать. Они уже универсальны.

### Правило 2: новый тип = новая папка + регистрация

```
Шаг 1: создать src/app/[lang]/[type]/[slug]/page.tsx
Шаг 2: создать src/components/[type]/[Type]Client.tsx
Шаг 3: зарегистрировать в Journey config (NEXT_STEP_DATA или эквивалент)
Шаг 4: добавить emitResult() в Client компонент
```

### Правило 3: два пути записи в Profile (оба допустимы)

```
Путь A — через CustomEvent (для SEO Entry инструментов):
  window.dispatchEvent(new CustomEvent('solviqlab:result', { detail: {...} }))
  ↓ UserJourneySection слушает ↓ UserEngine.storeResult() ↓ ProfileEngine

Путь B — прямая запись (для Internal инструментов):
  profileEngine.writeSignalsDirect({ signals: [...] })
  ↓ Profile обновляется ↓ Dashboard перестраивается
```

### Правило 4: Dashboard не трогать

DashboardClient читает Profile Engine автоматически.
Если новый Instrument пишет сигналы в Profile — Dashboard их покажет без изменений.

### Правило 5: Assessment Engine открыт для конфигов

Добавить новый Assessment = создать `src/lib/assessment/configs/[cluster].ts`
Движок не меняется. Доказано: Weight и Sleep уже работают.

---

## 8. Можем ли мы добавить новые типы без изменения ядра?

### Sleep Quiz
**Ответ: ДА с минимальными изменениями.**
- Новая страница `app/[lang]/quiz/[slug]/page.tsx` — не меняет ядро
- QuizClient диспатчит `solviqlab:result` — UserEngine и Profile подхватят
- Добавить quiz slug в `NEXT_STEP_DATA` (config, не ядро)
- Dashboard покажет quiz сигналы автоматически

### Pregnancy Planner
**Ответ: ДА с минимальными изменениями.**
- PlannerClient читает ProfileEngine (pregnancy signals), записывает через writeSignalsDirect
- Plan результат пишется в ProfileEngine как новый domain signal
- Dashboard покажет planner сигналы автоматически
- Добавить в Journey config как milestone после due-date-calculator

### Finance Checklist
**Ответ: ДА без изменений ядра.**
- ChecklistClient хранит состояние в localStorage
- Completion диспатчит `solviqlab:result` с completion%
- Profile Engine записывает completion_rate как finance domain signal

### Nutrition Generator
**Ответ: ДА с минимальными изменениями.**
- GeneratorClient принимает параметры (TDEE, goals из Profile)
- Результат (meal plan text) диспатчит `solviqlab:result`
- Profile Engine записывает `meal_plan_generated: true` как nutrition signal

### Mental Health AI (AI Coach)
**Ответ: ДА — данные уже готовы.**
- ProfileEngine уже строит PersonalHealthProfile
- AssessmentEngine.buildAIContext() уже генерирует структурированный контекст
- AI Coach получает эти данные и отвечает
- Записывает `ai_consultation_count` в Profile через writeSignalsDirect

---

## 9. Эволюция модели платформы

```
Этап 1 — Calculator Platform (до 17 июля)
  36 независимых калькуляторов. Нет связей между ними.
  Пользователь считает и уходит.

Этап 2 — Product Platform (17-20 июля)
  Journey Engine + Recommendation Engine.
  Калькуляторы соединены в цепочки.
  Пользователь ведётся к следующему шагу.

Этап 3 — Intent Platform (V3-01→V3-08D)
  Profile Engine + Assessment Engine + Dashboard.
  Платформа знает КТО пользователь и ЧТО ему нужно.
  Любой SEO вход → один Intent Journey.

Этап 4 — Universal Instrument Platform (этот документ)
  Любой тип продукта (Quiz/Planner/Tracker/AI) = конфигурация.
  Один контракт. Одни Engine. Разная логика.
  Новый Instrument → 4 шага, без изменения ядра.
```

---

## 10. Risk Report

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| 35 "немых" калькуляторов → пустой Dashboard | 🔴 СЕЙЧАС | Высокое | Механический рефактор — добавить dispatchEvent в 35 файлов |
| Assessment не считается прогрессом Journey | 🔴 СЕЙЧАС | Среднее | 20 строк в journey/config.ts |
| Planner не знает AssessmentResult | 🟡 При V3-09B | Среднее | Planner читает ProfileEngine (Assessment туда пишет) — автоматически |
| Quiz мешает Calculator Journey | 🟢 Низкий | Низкое | Правило: Quiz всегда Internal (не в NEXT_STEP_DATA главного Journey) |

---

## 11. Roadmap после аудита

### Немедленно (перед V3-09B)

**Fix 1 — "Немые" калькуляторы:** добавить `dispatchEvent` в 35 Client компонентов.
Это разблокирует полный Dashboard и осмысленные рекомендации для всех пользователей.

**Fix 2 — Assessment в Journey:** добавить assessment milestones в journey/config.ts.
Это закроет разрыв между Assessment и Journey progress.

### V3-09B — Universal Planner Engine

После Fix 1 и Fix 2 Planner строится на реальных данных (Profile наполнен).
Архитектурный долг закрыт — Planner реализуется чисто.

### Затем

```
V3-10  Sleep Quiz (первый Quiz тип — тест расширения)
V3-11  AI Coach (данные уже готовы в ProfileEngine + AssessmentAIContext)
V3-12  Premium + Stripe
```

---

## Acceptance Criteria — выполнено

- ✅ проведён аудит реального проекта (36 инструментов + 3 типа страниц)
- ✅ существующий код не изменён
- ✅ найдены 4 архитектурных слабых места (2 критических, 2 некритических)
- ✅ доказано: Quiz/Planner/Tracker/AI подключаются без изменения ядра Engine
- ✅ доказано: Converter — отдельная категория, не Intent Instrument
- ✅ найден критический долг: 35 калькуляторов не пишут в Profile
- ✅ предложен следующий спринт: Fix 1 + Fix 2 → V3-09B

---

*Документ утверждён: 2026-07-23*
*Следующий шаг: Fix 1 (35 калькуляторов) + Fix 2 (Assessment в Journey) → V3-09B Planner*
