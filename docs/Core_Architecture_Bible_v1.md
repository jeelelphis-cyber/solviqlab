# SolviqLab — Core Architecture Bible v1

**Статус:** ЕДИНСТВЕННЫЙ ИСТОЧНИК ИСТИНЫ  
**Дата:** 2026-07-23  
**Версия:** 1.0  
**Автор:** Co-Founder + Architectural Review

> Все будущие архитектурные решения ссылаются на этот документ.  
> Все изменения архитектуры оформляются через ADR (Architecture Decision Record).  
> Этот документ — не история. Это настоящее состояние и принципы платформы.

---

## Как пользоваться этим документом

**Новый архитектор:** читать с начала. После прочтения — понятна вся платформа.

**Действующий разработчик:** использовать как справочник. Любой вопрос "почему X устроено так?" — ответ здесь или в ADR.

**CEO:** разделы Vision, Philosophy, Architecture Principles, Anti-Patterns.

**При добавлении нового продукта:** читать разделы Universal Instrument, Extension Rules, Intent Cluster.

---

# ЧАСТЬ I. FOUNDATION

---

## 1. Vision

### Чем SolviqLab не является

```
❌ Calculator website
❌ Health SaaS
❌ Tool aggregator
❌ Content platform
```

### Чем SolviqLab является

**SolviqLab — это Intent Platform.**

Платформа, где любой SEO-запрос ведёт пользователя к персонализированному решению его конкретной проблемы — через последовательность измерений, оценки, стратегии и плана.

Каждый пользователь приходит с намерением (Intent). Платформа превращает это намерение в завершённый путь (Journey).

### Долгосрочное видение

SolviqLab — первый продукт на пути к **DevOS** (AI Operating System), способной создавать прибыльные цифровые бизнесы по команде. Каждый движок SolviqLab — прообраз отдела DevOS:

| SolviqLab Engine | DevOS Department |
|---|---|
| Journey Engine | Journey Department |
| Assessment Engine | Evaluation Department |
| Policy Engine | Strategy Department |
| AI Coach | AI Department |
| Profile Engine | Intelligence Department |
| SEO System | Marketing Department |

**Мы не строим DevOS сейчас.** Но каждое архитектурное решение должно делать DevOS проще.

---

## 2. Philosophy

### Три аксиомы

**Аксиома 1 — Intent First**
> Любой продукт существует только как шаг к разрешению конкретного намерения пользователя. Продукт без Intent Cluster — не продукт, а инструмент.

**Аксиома 2 — Platform over Products**
> Мы строим движок, который масштабируется на 1000 продуктов. Не 1000 продуктов с разными движками.

**Аксиома 3 — Trust through Separation**
> Бизнес-логика никогда не загрязняет предметную логику. Это фундамент доверия пользователей. Policy Engine — единственное место с бизнес-логикой.

### Ключевая метрика

**Не DAU. Не pageviews. Не число инструментов.**

Ключевая метрика: **Сколько пользователей завершили полный Intent Journey?**

```
SEO Entry
  → Assessment
    → Strategy Selection
      → Active Plan
        → Check-In Week 3+    ← это "завершённый Journey" по критерию удержания
```

### Правило Product Filter

> До Public Beta: любой новый функционал должен отвечать на вопрос "Улучшает ли он завершённость Intent Journey?" Если нет — не входит в этап.

---

## 3. Evolution Timeline

История архитектурных решений. Важна для понимания ПОЧЕМУ система устроена так, а не иначе.

```
STAGE 0 — Calculator Platform (до V3)
  36 калькуляторов. Нет связи между ними. Нет пользователя. Нет прогресса.
  Проблема: пользователь использовал BMI и уходил. Нет следующего шага.

  ↓

STAGE 1 — Intent Platform (V3-01, V3-02)
  Journey Engine: 6 Intent Journeys, 17 инструментов.
  NextStepCard, JourneyProgressCard, UnlockCard, AIConsultCard.
  Проблема: прогресс не сохранялся (static position-based).

  ↓

STAGE 2 — User Identity Foundation (V3-03)
  AnonymousUser: localStorage UUID.
  ResultRecord: сохранение результатов инструментов.
  JourneyState: реальный прогресс, а не статичный.
  CTA Intelligence: A/B variants, urgency tiers, StickyCTA.
  Проблема: все 36 калькуляторов "немые" кроме BMI. Profile пустой.

  ↓

STAGE 3 — Profile Intelligence (V3-04, V3-05)
  RecommendationEngine: scoring через Need × Confidence × JourneyImportance.
  ProfileEngine: 12 HealthDomains + 5 FinanceDomains. Сигналы. Противоречия.
  Registration: Personal Health Profile как value prop.
  Dashboard: DomainBars + JourneyGrid + Contradictions + ResultHistory.
  Проблема: Assessment не существует. Strategy не существует.

  ↓

STAGE 4 — Assessment Engine (V3-08)
  Universal Assessment Engine: config-as-data, ScoringRule DSL, InsightCondition DSL.
  Weight Assessment (configs/weight.ts) + Sleep Assessment (configs/sleep.ts).
  AssessmentClient: gate / gap-questions / result states.
  Проблема: Assessment изолирован от Journey. 35 калькуляторов всё ещё немые.

  ↓

STAGE 5 — Event Unification (V3-09A)
  Fix 1: 29 калькуляторов добавили solviqlab:result dispatch.
  Fix 2: Assessment добавлен в Journey config.
  Universal Instrument Blueprint: аудит всей платформы.
  Проблема: нет Strategy. Нет Policy. Нет Planner.

  ↓

STAGE 6 — Decision Layer (V3-09B) ← CURRENT
  Strategy Engine: слой между Assessment и Planner.
  Policy Engine: CEO Directive — единственное место с бизнес-логикой.
  Intent Cluster Registry: верхний уровень платформы.
  Planner Blueprint: Goal → Milestones → Tasks → Progress → Adaptation → Completion.
  Проблема: ни один движок не реализован в коде. Только architecture.

  ↓

STAGE 7 — Execution Layer (V3-09C→H, будущее)
  Domain Contracts (types).
  StrategyEngine runtime.
  PlannerEngine runtime.
  First Products: Weight Strategy + Weight Planner.
  Dashboard integration.

  ↓

STAGE 8 — AI Layer (V3-10, будущее)
  AI Coach: читает весь Platform Context.
  PlannerAIContext + AssessmentAIContext + StrategyAIContext + ProfileContext.

  ↓

STAGE 9 — Monetization (V3-11, будущее)
  Premium: Stripe.
  Policy Engine: ROI policy activation.
  A/B тесты политик.
```

---

# ЧАСТЬ II. PLATFORM PIPELINE

---

## 4. Полный Pipeline SolviqLab

Это ЕДИНСТВЕННАЯ ПРАВИЛЬНАЯ схема потока данных на платформе.

```
SEO Traffic
  ↓  любой URL: /calculators/bmi-calculator, /calculators/sleep-calculator
─────────────────────────────────── ENTRY LAYER
Calculator / Converter
  (пользователь вводит данные, получает результат)
  ↓  window.dispatchEvent('solviqlab:result', { slug, value, label, unit, metadata })
─────────────────────────────────── STORAGE LAYER
UserEngine.storeResult()
  ↓  пишет ResultRecord в localStorage (AnonymousUser) или DB (AuthenticatedUser)
ProfileEngine.processResult()
  ↓  extractSignals() → обновляет DomainProfile confidence
─────────────────────────────────── DECISION LAYER
AssessmentEngine.canRun(config, profile) → GateResult
  если can_run:
AssessmentEngine.run(config, profile, answers, lang) → AssessmentResult
  ↓
StrategyEngine.evaluate(config, assessmentResult, preferences) → StrategyResult
  ↓  список одобренных стратегий + рекомендованная
RecommendationEngine.recommend(ctx) → CandidateList
  ↓  все одобренные следующие шаги (не только Planner)
─────────────────────────────────── POLICY LAYER
PolicyEngine.apply(candidates, strategyResult, context) → PolicyResult
  ↓  reorders among approved candidates only
─────────────────────────────────── EXECUTION LAYER
PlannerEngine.createPlan(config, assessmentResult, profile, goal) → PlannerResult
UserEngine.storePlan(plan) → ActivePlan
  ↓
PlannerEngine.checkIn(plan, input) → CheckInResult
─────────────────────────────────── AI LAYER (V3-10)
AI Coach receives:
  PersonalHealthProfile + AssessmentAIContext + StrategyAIContext + PlannerAIContext
─────────────────────────────────── PRESENTATION LAYER
Dashboard / Journey / Planner Page
  читает из UserEngine + PolicyEngine.primary()
```

### Закон Pipeline

> Каждый слой знает только о своём уровне. Нижний слой не знает, что с его выводом сделает следующий слой.

```
AssessmentEngine не знает о StrategyEngine.
StrategyEngine не знает о PlannerEngine.
PlannerEngine не знает об AI Coach.
AI Coach не знает о Policy.
```

Нарушение этого закона = architectural debt.

---

# ЧАСТЬ III. ENGINES

---

## 5. Universal Instrument Contract

Все продукты платформы (Calculator, Assessment, Quiz, Planner, Tracker, AI-tool) реализуют один контракт.

```typescript
interface UniversalInstrument {
  // Идентификация
  readonly slug: string             // уникальный идентификатор
  readonly type: InstrumentType     // calculator | assessment | quiz | planner | tracker | ai-tool
  readonly cluster: IntentCluster | null  // к какому Intent принадлежит
  readonly journey_id: string | null      // к какому Journey относится

  // Жизненный цикл
  canRun(context: InstrumentContext): boolean
  execute(input: unknown): Promise<InstrumentResult>

  // Platform Integration (обязателен для всех продуктов)
  dispatchResult(result: InstrumentResult): void  // solviqlab:result CustomEvent
  buildProfileSignals(result: InstrumentResult): readonly HealthSignal[]
  buildJourneyStep(): JourneyStep

  // AI Context (обязателен для Assessment и выше)
  buildAIContext(result: InstrumentResult): AIContext | null
}

type InstrumentType = 
  | 'calculator'   // SEO entry, пишет в Profile через CustomEvent
  | 'converter'    // SEO entry, НЕ пишет в Profile (утилита)
  | 'assessment'   // Internal, читает Profile → синтез → пишет через writeSignalsDirect
  | 'quiz'         // Internal, читает Profile → быстрый ввод
  | 'planner'      // Internal, читает AssessmentResult → создаёт план
  | 'tracker'      // Internal, читает ActivePlan → мониторинг
  | 'generator'    // Internal, читает Profile + Plan → генерирует контент
  | 'ai-tool'      // Internal, читает весь Platform Context
```

### Два пути записи в Profile

**Path A — SEO Entry Instruments (Calculator)**
```
User Input → Calculator → solviqlab:result CustomEvent
  → UserEngine.storeResult() → ProfileEngine.processResult() → extractSignals()
```

**Path B — Internal Instruments (Assessment)**
```
ProfileEngine.getProfile() → Assessment runs → writeSignalsDirect(outputSignals)
```

Конвертеры — исключение. Они не пишут в Profile никак (утилиты без медицинского смысла).

---

## 6. Profile Engine

Единственный источник истины о состоянии пользователя.

### Что хранит

```
PersonalHealthProfile
  ├── domains: Map<ProfileDomain, DomainProfile>
  │     ├── weight, nutrition, metabolism, fitness, sleep, recovery,
  │     │   hydration, cardiovascular, mental_wellness,
  │     │   womens_health, pregnancy, lifestyle
  │     └── savings, investment, debt, retirement, income
  ├── signals: HealthSignal[]          ← все сырые измерения
  ├── contradictions: Contradiction[]  ← обнаруженные несоответствия
  ├── missing_insights: MissingInsight[] ← что добавит больше confidence
  ├── timeline: ResultRecord[]         ← хронология всех инструментов
  ├── overall_confidence: number       ← 0-100
  └── total_signals: number
```

### Правила ProfileEngine

1. Profile не знает о Planner. Profile знает только о сигналах прошлого.
2. Profile обновляется ТОЛЬКО через двух авторизованных писателей: `UserEngine.storeResult()` и `Assessment.writeSignalsDirect()`.
3. Confidence не может уменьшиться при добавлении новых сигналов.
4. Contradictions — это флаги, не диагнозы. Никогда не используются как медицинские выводы.

---

## 7. Assessment Engine

Синтез: читает Profile → даёт insight о текущем состоянии.

### Принцип

Assessment — это не отдельный продукт. Это универсальный движок с конфигурацией.

```
AssessmentEngine (один, неизменный)
  + configs/weight.ts (~120 строк данных)
  + configs/sleep.ts  (~120 строк данных)
  + configs/...       (будущие кластеры, движок не меняется)
```

### Config-as-Data

AssessmentConfig полностью сериализуем. Нет функций. Только данные.

```typescript
interface AssessmentConfig {
  cluster: IntentCluster
  id: string
  version: number
  min_profile_confidence: number      // порог входа
  dimensions: DimensionConfig[]       // что оцениваем
  insights: InsightConfig[]           // что показываем
  narrative: NarrativeConfig          // человеческий текст
  output_signals: OutputSignalConfig[] // что пишем обратно в Profile
  ai_context: AIContextConfig         // что передаём AI Coach
}
```

### Assessment API

```
canRun(config, profile) → GateResult { can_run, missing_instruments }
getGapQuestions(config, signals) → AssessmentQuestion[]
run(config, profile, answers, lang) → AssessmentResult
buildDashboardCard(result) → ClusterCard
buildAIContext(result) → AssessmentAIContext
```

### Scoring DSL

Четыре типа правил:
- `signal_value_threshold` — числовое пороговое значение
- `signal_status_map` — маппинг label → status
- `signal_presence` — наличие/отсутствие сигнала
- `composite_weighted` — взвешенная сумма нескольких сигналов

### Insight DSL

Условия для показа Insight: `and / or / not` + 8 leaf types: `score_above`, `score_below`, `dimension_above`, `dimension_below`, `signal_present`, `signal_absent`, `confidence_above`, `always`.

---

## 8. Strategy Engine

Решение: читает AssessmentResult → выбирает подход.

### Место в Pipeline

```
AssessmentEngine → AssessmentResult
  ↓
StrategyEngine → StrategyResult { recommended, available[], disqualified[] }
  ↓
(user confirms)
  ↓
StrategyResult { selected }
  ↓
PlannerEngine.createPlan(getPlannerConfig(strategyResult), ...)
```

### Ключевое свойство

> Один AssessmentResult → два разных Planner без изменения PlannerEngine.

```
AssessmentResult (Weight, score=68)
  ↓ StrategyEngine

  User A → выбирает 'balanced'     → PlannerEngine(configs/weight-balanced.ts)
  User B → выбирает 'fast-track'   → PlannerEngine(configs/weight-fast.ts)

  PlannerEngine — тот же. Движок не знает о "balanced" или "fast-track".
```

### StrategyConfig

```typescript
interface StrategyConfig {
  cluster: IntentCluster
  id: string
  version: number
  strategies: StrategyOption[]        // все возможные стратегии
  default_strategy_id: string         // fallback
  selection_mode: 'auto' | 'user-choice' | 'hybrid'
  preference_inputs: PreferenceInput[] // что спрашиваем у пользователя
}

interface StrategyOption {
  id: string
  name: string
  tagline: string
  planner_config_id: string           // ключ к PlannerConfig
  recommended_when: StrategyCondition[]
  disqualified_when?: StrategyCondition[]
  risk_level: 'low' | 'medium' | 'high'
}
```

### StrategyCondition DSL

```
assessment_score_range(min, max)
dimension_score_above(dimension, threshold)
dimension_score_below(dimension, threshold)
goal_delta_above(threshold)
goal_delta_below(threshold)
user_preference_is(key, value)
and(conditions[])
or(conditions[])
not(condition)
always
```

---

## 9. Policy Engine

**CEO Directive:** единственный слой с бизнес-логикой.

### Фундаментальный принцип

```
Decision Layer (Assessment + Strategy + Recommendation)
  = "Что подходит пользователю?"
  = Предметная логика. Медицина. Данные.
  = НИКАКОЙ бизнес-логики.

Policy Engine
  = "В каком порядке предлагать подходящее?"
  = Бизнес-логика. Только здесь.
  = НЕ добавляет. Только переупорядочивает.

─────────────────────────

Policy Engine может менять ORDER среди approved кандидатов.
Policy Engine НЕ МОЖЕТ добавить кандидата с approved = false.
Policy Engine НЕ МОЖЕТ изменить user_benefit_score.
```

### Platform Policies

| Policy | Приоритеты | Когда использовать |
|--------|-----------|-------------------|
| `user_first` | Польза → Удержание → Простота | По умолчанию |
| `retention` | Польза → Вернуть завтра → Journey | Риск оттока |
| `roi` | Польза → LTV → Premium → AI Coach | Высокая вовлечённость |
| `growth` | Польза → Регистрация → Виральность | Продуктовый эксперимент |
| `enterprise` | Польза → Отчёты → Интеграции | B2B клиенты (future) |

### Активация политики

```bash
PLATFORM_POLICY=retention  # в .env — никакого деплоя кода
```

### Железные запреты Policy Engine

```
❌ Не добавляет кандидата с approved=false
❌ Не изменяет user_benefit_score
❌ Не скрывает approved кандидата (только порядок)
❌ Не действует при medical / safety флагах (они абсолютны)
❌ Не учитывает реальные деньги пользователя как сигнал
```

---

## 10. Planner Engine

Исполнение: читает StrategyResult → создаёт план.

### Определение

Planner — это **динамический временной контракт** между пользователем и его целью.

```
Goal
  ↓ "Что хочу достичь?"
Milestones
  ↓ "Измеримые контрольные точки"
Tasks
  ↓ "Конкретные ежедневные/еженедельные действия"
Progress
  ↓ "Как измеряем соблюдение"
Adaptation
  ↓ "Как меняем при отклонении"
Completion
  ↓ "Критерии успеха"
```

### Принцип

PlannerEngine — один. Конфиги — масштабируемые.

```
configs/weight-balanced.ts    (~150 строк)
configs/weight-fast.ts        (~150 строк)
configs/weight-muscle.ts      (~150 строк)
configs/sleep-routine.ts      (~150 строк)
configs/finance-savings.ts    (~150 строк)
...
```

Добавить новый тип плана = только новый конфиг-файл.

### Planner читает, не пишет в Profile

```
Profile = что есть сейчас (Past + Present)
Plan   = что будет (Future)
```

Planner пишет только в UserEngine (хранит ActivePlan). Когда пользователь делает чекин и реально теряет вес — новое измерение идёт через Calculator → solviqlab:result → ProfileEngine. Plan сам по себе не источник истины о состоянии.

### Planner API

```
canRun(config, assessmentResult, profile) → GateResult
createPlan(config, assessmentResult, profile, goal, lang) → PlannerResult
checkIn(plan, input) → CheckInResult
buildDashboardCard(plan) → PlannerCard
buildAIContext(plan, checkIn) → PlannerAIContext
```

### AdjustmentRule DSL

```
ahead_by_percent(threshold)        → adaptation: accelerate
behind_by_percent(threshold)       → adaptation: decelerate
subjective_score_below(threshold)  → adaptation: restructure
missed_checkins(count)             → adaptation: restructure
```

---

## 11. Recommendation Engine

Скоринг кандидатов для следующего шага.

### Формула

```
Score = Need × Confidence × JourneyImportance × CompletionProbability × 100
```

- **Need** — насколько нужен пользователю (по Profile signals)
- **Confidence** — насколько уверены в релевантности
- **JourneyImportance** — место в Journey path
- **CompletionProbability** — вероятность завершения

### Важно

RecommendationEngine производит `CandidateList` с `approved` флагами и `user_benefit_score`. PolicyEngine получает этот список и применяет веса. RecommendationEngine никогда не знает о Policy.

---

## 12. Journey Engine

Отслеживание прогресса пользователя через Intent Journey.

### Структура

```
JourneyDefinition
  id: 'weight-management'
  steps: JourneyStep[]  ← slug каждого инструмента в правильном порядке
  unlockAtStep: number  ← после скольких шагов открывается бонус
  unlockReward: string

JourneyState (per user per journey)
  journey: JourneyDefinition
  completed_slugs: string[]
  progress_percent: number
  next_step: NextStepData | null
  unlocked: boolean
```

### Assessment и Planner в Journey

- `weight-assessment` — step в `weight-management` Journey (добавлен V3-09A Fix 2)
- `sleep-assessment` — step в `sleep-wellness` Journey
- `weight-loss-planner` — будущий step в `weight-management` (NEXT_STEP_DATA placeholder)

---

## 13. User Engine

Центральное хранилище состояния пользователя.

### Типы пользователей

```
AnonymousUser
  id: string (UUID)
  completed_slugs: string[]
  journey_states: JourneyState[]
  result_history: ResultRecord[]
  assessment_results: AssessmentResult[]
  strategy_results: StrategyResult[]   // future
  active_plans: ActivePlan[]           // future
  storage: 'local'

AuthenticatedUser (extends AnonymousUser)
  email: string
  name: string
  registered_at: string
  storage: 'local' (MVP) | 'remote' (future)
```

### Правила UserEngine

1. `storeResult()` → единственная точка входа от Calculator/Assessment через CustomEvent
2. `upgradeToAuthenticated()` → AnonymousUser данные не теряются при регистрации
3. UserEngine не валидирует медицинские данные — только хранит
4. Один активный план на кластер (`Map<IntentCluster, ActivePlan>`)

---

## 14. Intent Cluster Registry

Верхний уровень платформы. Владеет полным pipeline для каждого Intent.

```typescript
interface IntentClusterDefinition {
  cluster: IntentCluster
  entry_instruments: string[]         // calculator slugs
  assessment_config_id: string
  strategy_config_id: string
  planner_config_ids: string[]
  tracker_config_id?: string          // future
  assessment_page: string             // /assessment/weight
  planner_page: string                // /planner/weight
  seo_entry_page: string              // /calculators/bmi-calculator
  journey_id: string
}
```

### Зарегистрированные кластеры

| Cluster | Entry Instruments | Assessment | Strategy | Journey |
|---------|------------------|------------|----------|---------|
| `weight` | bmi, calorie, tdee, bmr, body-fat, ideal-weight, calorie-deficit | weight-assessment | weight-strategy | weight-management |
| `sleep` | sleep-calculator | sleep-assessment | sleep-strategy | sleep-wellness |
| `pregnancy` | due-date, pregnancy, ovulation | (future) | (future) | family-planning |
| `finance` | savings, compound, investment, retirement, inflation | (future) | (future) | finance |

---

# ЧАСТЬ IV. ARCHITECTURE PRINCIPLES

---

## 15. Architecture Principles

Это **неизменяемые правила**. Нарушение любого из них = PR отклоняется.

---

### P-01: Universal Engine Principle

> Каждый движок должен быть универсальным. Новый продукт = новый конфиг, не новый движок.

Добавить Sleep Assessment = создать `configs/sleep.ts`. Движок не трогается.  
Добавить новый Planner = создать `configs/weight-fast.ts`. PlannerEngine не трогается.

**Сигнал нарушения:** если для нового продукта нужно изменить логику Engine — это значит, что предметная логика спрятана в движке. Нужно вынести в конфиг.

---

### P-02: Config-as-Data Principle

> Все конфигурации полностью сериализуемы. В конфигурации нет функций, нет импортов, нет условий на TypeScript.

AssessmentConfig — это JSON-совместимый объект. ScoringRule — это данные, не код.

**Почему:** конфиги можно хранить в БД, редактировать через UI, экспортировать в другие системы, тестировать изолированно от движка.

---

### P-03: Layer Isolation Principle

> Каждый слой знает только о своём уровне. Нижний слой не знает о следующем.

```
ProfileEngine не знает о AssessmentEngine.
AssessmentEngine не знает о StrategyEngine.
StrategyEngine не знает о PlannerEngine.
PlannerEngine не знает об AI Coach.
```

**Сигнал нарушения:** если движок A импортирует тип из движка B, который находится выше в Pipeline — это нарушение.

---

### P-04: Single Business Logic Principle

> Бизнес-логика живёт только в Policy Engine. Ни в одном другом движке нет оптимизации бизнес-метрик.

RecommendationEngine скорит по user_benefit, не по LTV.  
StrategyEngine рекомендует по данным, не по conversion rate.  
PlannerEngine строит план по медицинской логике, не по тому, что лучше продаёт Premium.

**Сигнал нарушения:** если в комментарии к методу написано "чтобы увеличить конверсию" — это нарушение. Это работа PolicyEngine.

---

### P-05: Event-Driven Profile Principle

> ProfileEngine обновляется только через два авторизованных канала.

**Path A:** `solviqlab:result` CustomEvent → `UserEngine.storeResult()` → `ProfileEngine.processResult()`

**Path B:** `Assessment` → `ProfileEngine.writeSignalsDirect()`

Нет третьего пути. Если компонент хочет обновить Profile напрямую — это нарушение.

---

### P-06: Medical Non-Negotiability Principle

> Safety и medical флаги имеют абсолютный приоритет. Policy Engine не может их переопределить.

Если `StrategyEngine` вернул `medical-referral` как единственную стратегию — Policy Engine не может выбрать `fast-track`. Это невозможно архитектурно (approved=false).

**Сигнал нарушения:** любой bypass approved=false флага для "медицинских соображений" бизнеса.

---

### P-07: Immutable Benefit Score Principle

> `user_benefit_score` вычисляется один раз в Decision Layer и никогда не изменяется.

Policy Engine читает `user_benefit_score` но не записывает. Это делает систему аудитируемой: можно в любой момент увидеть, что Policy рекомендовала и каков был benefit score независимо от политики.

---

### P-08: Instrument Contract Principle

> Любой новый продукт (Calculator, Assessment, Planner, Quiz, Tracker) обязан реализовать UniversalInstrument Contract.

Минимально: `slug`, `type`, `cluster`, `dispatchResult()`.

**Почему:** без этого Dashboard, Journey, Analytics, AI Coach не смогут интегрироваться с новым продуктом автоматически.

---

### P-09: Intent Cluster First Principle

> Новый продукт создаётся только в рамках существующего или нового Intent Cluster.

Нельзя создать "просто ещё один калькулятор". Нужно определить: к какому Intent он относится? Какой следующий шаг после него? Как он продвигает пользователя к Assessment?

**Сигнал нарушения:** новый инструмент не зарегистрирован в `INTENT_CLUSTER_REGISTRY` и не имеет `journey_id`.

---

### P-10: Pipeline Directionality Principle

> Данные движутся только вниз по Pipeline. Нет обратных зависимостей.

```
Calculator → Profile  ✅
Profile → Assessment  ✅
Assessment → Planner  ✅
Planner → Profile     ❌ (нарушение)
Assessment → Journey  ❌ (нарушение — Journey читает UserEngine, не Assessment)
```

---

### P-11: ADR Principle

> Любое изменение архитектуры, не предусмотренное Bible, оформляется через ADR до реализации.

ADR создаётся ПЕРЕД кодом. Не после. Формат — в разделе 19.

---

### P-12: Convergence over Divergence Principle

> Мы добавляем движки, которые будут использоваться для 10+ продуктов. Мы не создаём специализированные движки для одного продукта.

Каждый новый движок должен доказать: будет ли он использован в 3+ Intent Clusters?  
Если нет — это конфиг существующего движка, не новый движок.

---

### P-13: One Product Rule (CEO Directive)

> Добавление нового продукта затрагивает только папку его Capability/Cluster.  
> Максимум допустимая стоимость: 1 новый файл (Manifest) + 1 строка экспорта в cluster/index.ts.  
> Если нужно менять engine-файл — архитектура неуниверсальна. Спринт не принят.

**KPI платформы.** Тест: добавить новый Planner, убедиться что ни один существующий engine-файл не изменился. Если изменился — Phase 3 не завершена.

**Сигнал нарушения:** PR с новым продуктом касается файлов за пределами `capabilities/[cap]/[cluster]/`.

---

### P-14: Self Describing Products (CEO Directive)

> Каждый продукт полностью описывает себя через Manifest.  
> Движки не знают о конкретных продуктах — они читают Manifest.  
> CapabilityCatalog строится из манифестов автоматически.

Manifest определяет: что продукт умеет (`provides`), что требует (`requires`), какие события генерирует (`emits`), какие данные потребляет (`consumes`).

```typescript
// Каждый продукт:
export default defineInstrument({
  slug: 'bmi-calculator',
  cluster: 'weight',
  capability: 'health',
  requires: { profile_confidence_min: 0 },
  provides: { profile_signals: ['bmi', 'bmi_fitness_proxy'], journey_step: true },
  emits: ['solviqlab:result'],
  consumes: ['user_input'],
  // ... остальные поля манифеста
})
```

**Сигнал нарушения:** добавление продукта требует изменения хардкода в `INSTRUMENT_PROFILE_MAP`, `NEXT_STEP_DATA`, `CLUSTER_INSTRUMENTS` — это значит продукт не является self-describing.

---

### P-15: Event Driven Platform (CEO Directive)

> Любой продукт знает только: **input → execute() → result → emit()**.  
> Всё остальное — ответственность платформы.

Продукт не знает о Dashboard, Journey, Strategy, Policy, Recommendation, и о том, на какой платформе он запущен.

```typescript
// Весь контракт инструмента:
execute(input: InstrumentInput): InstrumentResult
emit(result: InstrumentResult): void  // единственная точка выхода

// Реализация emit():
window.dispatchEvent(new CustomEvent('solviqlab:result', { detail: result }))
```

EventBus обеспечивает fan-out ко всем платформенным handlers в правильном порядке.  
При смене платформы (Mobile / Server / AI Agent) меняется только транспорт EventBus.  
Продукты и контракты событий не меняются.

**Сигнал нарушения:** компонент инструмента импортирует что-либо из `@/lib/profile`, `@/lib/recommendation`, `@/lib/journey` или любого другого платформенного модуля.

Подробно: `docs/Runtime_Event_Architecture_v1.md`

---

# ЧАСТЬ V. ANTI-PATTERNS

---

## 16. Anti-Patterns

Архитектурные решения, которые **запрещено принимать**. Каждый задокументирован с объяснением почему.

---

### AP-01: Feature Flags in Engines

```
❌ if (config.featureFlag === 'roi-mode') { boost premium }
```

**Почему запрещено:** бизнес-логика в движке нарушает P-04. Использовать Policy Engine.

---

### AP-02: Direct Profile Mutation

```
❌ profileEngine.setDomainConfidence('weight', 90)  // из компонента
```

**Почему запрещено:** нарушает P-05. Profile обновляется только через авторизованные каналы.

---

### AP-03: Cross-Engine Import (Horizontal)

```
❌ // в StrategyEngine:
   import { getPlannerScore } from '@/lib/planner/scoring'
```

**Почему запрещено:** нарушает P-03. StrategyEngine не должен знать о PlannerEngine.

---

### AP-04: Hardcoded Business Metrics in Recommendations

```
❌ candidates.sort((a, b) => b.premium_probability - a.premium_probability)
```

**Почему запрещено:** нарушает P-04. Скоринг только по user_benefit. Policy Engine добавит business weights.

---

### AP-05: Instrument Without Cluster

```
❌ // новый компонент без cluster и journey_id
   export const MacroCalculatorClient = () => { ... }
```

**Почему запрещено:** нарушает P-09. Каждый инструмент — часть Intent Cluster.

---

### AP-06: Config with Business Logic

```
❌ // в AssessmentConfig:
   recommended_when: (user) => user.hasPaymentMethod ? 'premium' : 'basic'
```

**Почему запрещено:** нарушает P-02. Конфиг — только данные, никаких функций.

---

### AP-07: Multiple "Source of Truth"

```
❌ localStorage.setItem('weight_goal', target)  // хранилище вне UserEngine
❌ sessionStorage.setItem('active_plan', plan)
```

**Почему запрещено:** UserEngine — единственное хранилище состояния пользователя.

---

### AP-08: Medical Conclusion from AI Coach

```
❌ AI Coach: "На основе ваших данных у вас метаболический синдром."
```

**Почему запрещено:** AI Coach комментирует прогресс и предлагает поведенческие рекомендации. Медицинские диагнозы — только через медицинских специалистов. Platform флаги (contradiction, medical-referral) — не диагнозы.

---

### AP-09: Policy in UI Component

```
❌ // в DashboardClient.tsx:
   const shouldShowPremium = user.sessionDepth > 5 && !user.isPremium
   if (shouldShowPremium) { return <PremiumUpsell /> }
```

**Почему запрещено:** нарушает P-04. Бизнес-логика о том, что показать — только в PolicyEngine. UI только рендерит PolicyResult.

---

### AP-10: Planner Writing to Profile

```
❌ // в PlannerEngine:
   profileEngine.addSignal({ metric: 'plan_adherence', value: 0.8 })
```

**Почему запрещено:** Plan = будущее состояние. Profile = текущее состояние. Смешивание нарушает смысловую целостность ProfileEngine.

---

### AP-11: Instrument Without Manifest

```
❌ // новый калькулятор без defineInstrument()
   export const MacroCalculatorClient = () => { ... }
   // где-то в domains.ts: добавили INSTRUMENT_PROFILE_MAP entry вручную
   // где-то в config.ts: добавили NEXT_STEP_DATA entry вручную
```

**Почему запрещено:** нарушает P-13 и P-14. Продукт обязан описывать себя через Manifest в своём кластере. CapabilityCatalog строится из манифестов автоматически. Если продукт не имеет манифеста — платформа его не видит.

---

### AP-12: Cluster as Top-Level Owner (вместо Capability)

```
❌ src/clusters/weight/  ← cluster владеет всем
❌ src/clusters/sleep/
❌ src/clusters/finance/
```

**Почему запрещено (в долгосрочной перспективе):** Longevity, Women's Health, Metabolic Health охватывают несколько кластеров одновременно. Если кластер — вершина дерева, нельзя выразить cross-cluster продукты без дублирования. Правильная вершина — Capability.

```
✅ src/capabilities/health/weight/
✅ src/capabilities/health/sleep/
✅ src/capabilities/finance/budget/
```

---

# ЧАСТЬ VI. EXTENSION RULES

---

## 17. Extension Rules

Как добавлять новые продукты, не нарушая архитектуру.

### Rule E-01: Новый Intent Cluster

```
1. Определить: что является Intent? (Lose Weight / Sleep Better / Save Money)
2. Найти или создать entry instruments (calculators)
3. Создать AssessmentConfig (configs/assessment/[cluster].ts)
4. Создать StrategyConfig (configs/strategy/[cluster].ts)
5. Создать минимум один PlannerConfig (configs/planner/[cluster]-[strategy].ts)
6. Зарегистрировать в INTENT_CLUSTER_REGISTRY
7. Добавить в JOURNEY_DEFINITIONS + NEXT_STEP_DATA
8. Создать SSG страницы (/assessment/[cluster], /planner/[cluster])
```

Движки НЕ МЕНЯЮТСЯ.

### Rule E-02: Новая стратегия в существующем кластере

```
1. Добавить StrategyOption в configs/strategy/[cluster].ts
2. Создать PlannerConfig для новой стратегии
3. Добавить в PLANNER_REGISTRY
```

Один файл стратегии. Один файл конфига. Готово.

### Rule E-03: Новый тип инструмента

```
1. Добавить тип в InstrumentType union
2. Реализовать UniversalInstrument Contract
3. Определить как инструмент пишет в Profile (Path A или Path B)
4. Зарегистрировать в INTENT_CLUSTER_REGISTRY
5. Добавить в JOURNEY_DEFINITIONS
```

### Rule E-04: Новая Platform Policy

```
1. Добавить тип в PlatformPolicy union
2. Создать веса в PolicyEngine.POLICY_WEIGHTS
3. Добавить в Admin UI список
4. Задокументировать в ADR
```

### Rule E-05: Новый движок (только после проверки)

Перед созданием нового движка ответить на вопросы:
- Будет ли этот движок использован в 3+ Intent Clusters? (если нет — это конфиг)
- Есть ли существующий движок, который можно расширить через конфиг? (если да — расширяй)
- Нарушает ли новый движок P-03 (Layer Isolation)?

Только после "да / нет / нет" — создавать движок.

---

# ЧАСТЬ VII. DEPENDENCY MAP

---

## 18. Engine Dependency Map

```
                    ┌─────────────────────────────────┐
                    │     INTENT CLUSTER REGISTRY      │
                    │  (верхний уровень — владеет всем)│
                    └──────────────┬──────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     ENTRY LAYER          ASSESSMENT CONFIG      STRATEGY CONFIG
    (Calculators)          (per cluster)          (per cluster)
         │                      │                      │
         ▼                      ▼                      ▼
  solviqlab:result        AssessmentEngine        StrategyEngine
    CustomEvent               │reads                  │reads
         │                    │                       │
         ▼                    ▼                       ▼
    UserEngine  ────────► ProfileEngine ◄──── Assessment writeSignalsDirect
         │                    │
         │            PersonalHealthProfile
         │                    │
         │              DECISION LAYER
         │                    │
         │         ┌──────────┴──────────┐
         │         │                     │
         │    AssessmentEngine       RecommendationEngine
         │         │                     │
         │    StrategyEngine        CandidateList
         │         │                     │
         └─────────┴──────────── PolicyEngine
                                          │
                                   PolicyResult
                                          │
                        ┌─────────────────┼────────────────────┐
                        ▼                 ▼                    ▼
                  PlannerEngine      AI Coach (V3-10)    Dashboard
                        │
                   ActivePlan
                        │
                    UserEngine (storePlan)
```

### Кто что читает

| Engine | Читает | Пишет |
|--------|--------|-------|
| Calculator | User input | UserEngine, ProfileEngine (via Event) |
| ProfileEngine | solviqlab:result events, writeSignalsDirect | PersonalHealthProfile |
| AssessmentEngine | ProfileEngine | UserEngine, ProfileEngine (via writeSignalsDirect) |
| StrategyEngine | AssessmentResult, UserPreferences | UserEngine |
| RecommendationEngine | UserEngine, ProfileEngine | CandidateList (transient) |
| PolicyEngine | CandidateList, StrategyResult, Context | PolicyResult (transient) |
| PlannerEngine | StrategyResult, AssessmentResult, ProfileEngine | UserEngine |
| AI Coach | All contexts | — (suggestions only) |
| Dashboard | UserEngine, PolicyResult | — |

---

# ЧАСТЬ VIII. CAPABILITY LAYER И PLATFORM CATALOG

---

## 19. Capability Layer

### Проблема Cluster-as-Top-Level

Если Intent Cluster — вершина дерева, появляется проблема cross-cluster продуктов:

- **Longevity** использует Weight + Sleep + Nutrition + Stress + Activity одновременно
- **Women's Health** пересекается с Pregnancy + Nutrition + Mental Wellness
- **Metabolic Health** = Weight + Nutrition + Activity + Sleep

Если кластер — вершина, эти продукты невозможно разместить без дублирования.

### Решение: Capability как верхний уровень

```
Capability (широкая область)
  └── Cluster (конкретный Intent)
        └── Products (инструменты кластера)
```

```
capabilities/
  health/                    ← Capability
    weight/                  ← Cluster
      instruments/
        bmi-calculator.ts    ← Product Manifest
        calorie-calculator.ts
        weight-assessment.ts
        weight-planner-balanced.ts
      strategies/
        balanced.ts
        fast-track.ts
      cluster.ts

    sleep/
      instruments/
        sleep-calculator.ts
        sleep-assessment.ts
      cluster.ts

    longevity/               ← Cross-cluster (uses weight + sleep + nutrition)
      instruments/
        longevity-assessment.ts
      cluster.ts
      cross_clusters: ['weight', 'sleep', 'nutrition']  ← новый тип связи

  finance/
    budget/
    mortgage/
    retirement/

  education/
    language/
    career/
```

### Зачем это нужно сейчас?

Не чтобы сразу строить Longevity. А чтобы **не закрыть эту возможность** неправильной структурой папок сегодня.

Стоимость: переименовать `clusters/` в `capabilities/health/` + `capabilities/finance/`.  
Ценность: через 2 года не нужен болезненный рефакторинг.

---

## 20. Product Manifest и CapabilityCatalog

### Product Manifest — контракт

Каждый продукт = один файл с `defineInstrument()`. Движки читают только Manifest.

```typescript
// capabilities/health/weight/instruments/bmi-calculator.ts

export default defineInstrument({
  // Идентификация
  slug: 'bmi-calculator',
  name: 'BMI Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  version: 1,

  // Что требует перед запуском
  requires: {
    profile_confidence_min: 0,    // может запуститься без данных
    assessment: null,             // не требует Assessment
    strategy: false,              // не требует стратегии
    plan: false,                  // не требует плана
  },

  // Что производит для платформы
  provides: {
    profile_signals: ['bmi', 'bmi_fitness_proxy'],  // обновляет эти домены
    journey_step: true,                              // является шагом Journey
    assessment_gate_contribution: ['weight'],        // открывает этот Assessment
  },

  // События, которые генерирует
  emits: ['solviqlab:result'],

  // Данные, которые потребляет
  consumes: ['user_input'],

  // Journey конфигурация (читается JourneyEngine)
  journey: {
    journey_id: 'weight-management',
    position: 0,
    next_slug: 'calorie-calculator',
    reason: 'Your BMI reveals where you stand. Now discover your calorie needs.',
    estimated_minutes: 2,
    profile_contribution: 20,
    benefits: [
      'Know your exact daily calorie target',
      'Personalize your nutrition plan',
    ],
  },

  // Profile contribution (читается ProfileEngine)
  profile_domains: [
    {
      domain: 'weight',
      metric: 'bmi',
      confidence_contribution: 30,
      status_map: {
        'Underweight': 'warning',
        'Normal Weight': 'optimal',
        'Overweight': 'warning',
        'Obese': 'critical',
      },
    },
    {
      domain: 'fitness',
      metric: 'bmi_fitness_proxy',
      confidence_contribution: 15,
    },
  ],

  // SEO
  seo_indexed: true,
  url_path: '/calculators/bmi-calculator',
})
```

### Для Assessment:

```typescript
// capabilities/health/weight/instruments/weight-assessment.ts

export default defineInstrument({
  slug: 'weight-assessment',
  name: 'Weight Assessment',
  type: 'assessment',
  capability: 'health',
  cluster: 'weight',

  requires: {
    profile_confidence_min: 30,       // нужны данные
    assessment: null,
    strategy: false,
  },

  provides: {
    profile_signals: ['weight_assessment_score'],
    journey_step: true,
    unlocks: ['weight-strategy'],     // разблокирует выбор стратегии
  },

  emits: ['solviqlab:result', 'assessment:completed'],
  consumes: ['profile', 'intent_state'],

  journey: {
    journey_id: 'weight-management',
    position: 5,
    next_slug: 'weight-loss-planner',
    reason: 'Your profile is built. Get your personalized Weight Assessment.',
    estimated_minutes: 3,
    profile_contribution: 30,
    benefits: ['Personalized insights', 'Strategy recommendations'],
  },

  seo_indexed: false,
  url_path: '/assessment/weight',
})
```

### CapabilityCatalog

`buildRegistry()` → `CapabilityCatalog` (новое название, более точное):

```typescript
// src/lib/catalog/index.ts

import { healthCapability } from '@/capabilities/health'
import { financeCapability } from '@/capabilities/finance'

export const CapabilityCatalog = buildCatalog([
  healthCapability,
  financeCapability,
])

// API:
CapabilityCatalog.getBySlug('bmi-calculator')
CapabilityCatalog.getCluster('health', 'weight')
CapabilityCatalog.getCapability('health')
CapabilityCatalog.getJourneyInstruments('weight-management')
CapabilityCatalog.getAssessmentGate('weight')     // что нужно для weight-assessment
CapabilityCatalog.getProfileDomains('bmi-calculator')
CapabilityCatalog.getCandidates(intentState)      // для RecommendationEngine
```

### Как движки перестают знать о конкретных продуктах

```
БЫЛО:
ProfileEngine: читает INSTRUMENT_PROFILE_MAP (hardcoded в domains.ts)
JourneyEngine: читает NEXT_STEP_DATA (hardcoded в config.ts)
AssessmentEngine: читает CLUSTER_INSTRUMENTS (hardcoded в profile-reader.ts)

СТАНЕТ:
ProfileEngine: CapabilityCatalog.getProfileDomains(slug)
JourneyEngine: CapabilityCatalog.getJourneyInstruments(journeyId)
AssessmentEngine: CapabilityCatalog.getAssessmentGate(cluster)
RecommendationEngine: CapabilityCatalog.getCandidates(intentState)
```

Движки — неизменны. Каталог — читает манифесты.

---

## 21. One Product Rule — Acceptance Test

Это KPI платформы (P-13). Тест выполняется после V3-10C Phase 4.

```
Добавить: capabilities/health/weight/instruments/weight-planner-keto.ts

Запустить:
  git diff --name-only HEAD~1 HEAD

Ожидаемый результат (список изменённых файлов):
  capabilities/health/weight/instruments/weight-planner-keto.ts   ← новый манифест
  capabilities/health/weight/index.ts                              ← 1 строка экспорта

Недопустимый результат (спринт НЕ принят):
  src/lib/profile/domains.ts          ← нарушение P-13
  src/lib/journey/config.ts           ← нарушение P-13
  src/lib/assessment/profile-reader.ts ← нарушение P-13
```

---

# ЧАСТЬ IX. GLOSSARY

---

## 22. Ключевые термины

**Intent** — намерение пользователя, выраженное в поисковом запросе или действии. Например: "lose weight", "sleep better", "save money".

**Intent Cluster** — полная вертикаль платформы вокруг одного Intent. Включает: entry instruments, assessment, strategy, planner(s), tracker (future), journey.

**Entry Instrument** — Calculator или Converter, доступный по SEO URL. Первый контакт с платформой.

**Internal Instrument** — Assessment, Planner, Tracker, AI-tool. Доступен только внутри платформы после достаточной активности.

**Config-as-Data** — конфигурационный файл, не содержащий функций. Полностью сериализуем в JSON. Содержит только data и DSL conditions.

**DSL (Domain-Specific Language)** — мини-язык для выражения условий и правил в виде данных (ScoringRule, InsightCondition, StrategyCondition, AdjustmentRule).

**ProfileEngine** — единственный источник истины о ТЕКУЩЕМ состоянии пользователя. Profile = Past + Present. Не Future.

**UserEngine** — единственное хранилище всего состояния пользователя: identity, results, journeys, plans.

**Decision Layer** — совокупность AssessmentEngine + StrategyEngine + RecommendationEngine. Отвечает на "что подходит пользователю?" Никакой бизнес-логики.

**Policy Engine** — единственный слой с бизнес-логикой. Отвечает на "в каком порядке предлагать подходящее?" Не добавляет — только переупорядочивает.

**solviqlab:result** — CustomEvent, которое любой инструмент dispatches в window после получения результата. Универсальный язык платформы.

**Path A / Path B** — два авторизованных пути обновления ProfileEngine. Path A через CustomEvent (Calculators). Path B через writeSignalsDirect (Assessment).

**approved=false** — флаг PolicyCandidate, означающий что Decision Layer не одобрил этот продукт для данного пользователя. Policy Engine не может это изменить.

**ADR (Architecture Decision Record)** — краткий документ, фиксирующий одно архитектурное решение: контекст, решение, последствия, альтернативы.

---

## 20. ADR Format

Все будущие изменения архитектуры оформляются через ADR.

### Шаблон

```markdown
# ADR-NNN: [Название решения]

**Дата:** YYYY-MM-DD  
**Статус:** proposed | accepted | deprecated | superseded by ADR-NNN  
**Контекст:** Sprint V3-XX

## Проблема

Одно-два предложения: что происходит и почему нужно решение.

## Рассмотренные варианты

1. Вариант A — [описание]
2. Вариант B — [описание]
3. Вариант C (принято) — [описание]

## Решение

Что именно мы решили и почему.

## Последствия

**Положительные:**
- ...

**Отрицательные / Trade-offs:**
- ...

## Связанные принципы

- P-NN: [название]
```

### Уже принятые архитектурные решения (как ADR)

```
ADR-001  Policy Engine как отдельный слой (не "Business Mode" в Engine)
ADR-002  Strategy Engine между Assessment и Planner
ADR-003  Planner не пишет в ProfileEngine
ADR-004  Assessment обязателен для Planner (cannot bypass)
ADR-005  user_benefit_score вычисляется в Decision Layer, не меняется PolicyEngine
ADR-006  Config-as-Data (нет функций в конфигурациях)
ADR-007  Один активный план на Intent Cluster
ADR-008  Converters изолированы от Profile (утилиты без медицинского смысла)
ADR-009  medical-referral стратегия блокирует Planner creation (approved=false)
ADR-010  Capability Layer над Cluster (не Cluster как вершина) — масштабируемость cross-cluster
ADR-011  Product Manifest + CapabilityCatalog (не INSTRUMENT_REGISTRY hardcoded)
ADR-012  buildRegistry() → CapabilityCatalog (название отражает бизнес-смысл, не техническую деталь)
```

---

# ЧАСТЬ IX. ROADMAP

---

## 21. Статус реализации по слоям

```
✅ РЕАЛИЗОВАНО И В PRODUCTION

  Calculator Layer
    36 инструментов (29 + BMI dispatching solviqlab:result, 6 converters isolated)
    SSG, 10 языков, SEO Gold Standard

  UserEngine
    AnonymousUser (localStorage UUID)
    ResultRecord, JourneyState
    upgradeToAuthenticated() (local merge)
    Dashboard, Registration, NavBar UserMenu

  ProfileEngine
    12 HealthDomains + 5 FinanceDomains
    extractSignals(), contradictions, missing_insights
    writeSignalsDirect()

  JourneyEngine
    6 journeys (health, weight-management, sleep-wellness, finance, home-buying, family-planning)
    weight-assessment + sleep-assessment зарегистрированы в steps

  RecommendationEngine
    Need × Confidence × JourneyImportance × CompletionProbability scoring
    5 candidate sources

  AssessmentEngine
    engine.ts, scoring.ts, insights.ts, profile-reader.ts, strings.ts
    configs/weight.ts, configs/sleep.ts
    AssessmentClient (gate / gap-questions / result)
    20 SSG pages (/[lang]/assessment/[cluster])

─────────────────────────────────────────────────────

📐 АРХИТЕКТУРА ОПРЕДЕЛЕНА, КОД НЕ НАПИСАН

  Strategy Engine
    StrategyConfig, StrategyOption, StrategyCondition DSL, StrategyResult
    Конфиг: strategy/configs/weight.ts (5 стратегий определены в Blueprint)

  Policy Engine
    PolicyCandidate, PolicyContext, PolicyResult contracts
    5 политик определены с весами
    PLATFORM_POLICY env var

  Planner Engine
    PlannerConfig, PlannerResult, ActivePlan, CheckIn, CheckInResult contracts
    AdjustmentRule DSL
    Конфиги: planner/configs/weight-balanced.ts, weight-fast.ts (в Blueprint)

  Intent Cluster Registry
    IntentClusterDefinition, INTENT_CLUSTER_REGISTRY

─────────────────────────────────────────────────────

🔮 FUTURE (не в текущем roadmap)

  Tracker Engine
  Generator Engine
  AI Coach (V3-10 — после Policy Engine)
  Premium + Stripe (V3-11)
  A/B тесты политик
  Admin Dashboard (Policy switcher)
  Remote storage (сейчас только localStorage)
```

---

## 22. Следующие спринты

```
V3-09C  Domain Contracts
        src/lib/strategy/types.ts
        src/lib/planner/types.ts
        src/lib/intent/types.ts
        src/lib/policy/types.ts

V3-09D  First Configs
        strategy/configs/weight.ts
        planner/configs/weight-balanced.ts
        planner/configs/weight-fast.ts

V3-10C  Domain Types + Product Manifest Contract
        src/lib/domain/ids.ts
        src/lib/domain/intent-state.ts
        src/lib/domain/instrument-result.ts
        src/lib/domain/assessment-result.ts
        src/lib/domain/strategy-decision.ts
        src/lib/domain/active-plan.ts
        src/lib/domain/personal-profile.ts
        src/lib/catalog/types.ts (defineInstrument, InstrumentManifest, CapabilityCatalog)

V3-10D  Runtime Event Architecture
        src/lib/events/types.ts    — все Event Contracts
        src/lib/events/bus.ts      — EventBus implementation
        src/lib/events/handlers.ts — handler registry + ordering
        src/lib/events/index.ts
        Ref: docs/Runtime_Event_Architecture_v1.md

V3-10E  Capability Manifests + Engine Refactor
        src/capabilities/health/weight/instruments/ — 36 манифестов
        Refactor ProfileEngine → читает из CapabilityCatalog
        Refactor JourneyEngine → читает из CapabilityCatalog
        Refactor AssessmentEngine → читает из CapabilityCatalog
        One Product Rule Test: добавить weight-planner-balanced, verify git diff

V3-10F  First Planner (Planner Engine Runtime)
        src/lib/planner/engine.ts
        src/lib/planner/scoring.ts
        src/lib/planner/adaptation.ts
        src/lib/planner/configs/weight-balanced.ts
        src/lib/planner/configs/weight-fast.ts
        src/lib/strategy/engine.ts
        src/lib/strategy/configs/weight.ts
        app/[lang]/strategy/[cluster]/page.tsx
        app/[lang]/planner/[cluster]/page.tsx
        components/strategy/StrategyClient.tsx
        components/planner/PlannerClient.tsx

V3-10G  Dashboard Integration
        DashboardClient: StrategyCard + ActivePlansSection

V3-11   AI Coach
        Claude API integration
        PlannerAIContext + AssessmentAIContext + StrategyAIContext

V3-12   Premium + Stripe
        Policy Engine: ROI policy activation
```

---

*SolviqLab Core Architecture Bible v1 — Single Source of Truth*  
*Дата принятия: 2026-07-23*  
*Следующее обновление: при изменении архитектуры через ADR*
