# Universal Planner Blueprint v2

**Sprint:** V3-09B Revision 2  
**Дата:** 2026-07-23  
**Статус:** ARCHITECTURE DOCUMENT — ревью CEO (v1 возвращён на доработку)  
**Изменение vs v1:** добавлен Strategy Engine как отдельный слой между Assessment и Planner

---

## Что изменилось и почему

В v1 архитектура была:

```
Assessment → Planner
```

CEO правильно указал: это слишком низкий уровень.

Planner не должен принимать решения. Planner должен исполнять решения.

Решение принимает **Strategy Engine**.

Новая архитектура:

```
Intent Cluster
  ↓
Assessment Engine    ← Что происходит (синтез данных)
  ↓
Strategy Engine      ← Какой путь (выбор подхода)  [НОВЫЙ]
  ↓
Planner Engine       ← Как выполнить (исполнение)
  ↓
Tracker Engine       ← Соблюдается ли (мониторинг) [future]
  ↓
AI Coach             ← Адаптация и поддержка (V3-10)
  ↓
Dashboard
```

---

## Ответ на ключевой вопрос CEO

> **Может ли один Assessment привести к двум разным Planner без изменения Planner Engine?**

**Да. Вот как:**

```
AssessmentResult (Weight)
  ↓
StrategyEngine.selectStrategy(assessmentResult, userPreference)
  ↓
  ├── "balanced"         → PlannerEngine.createPlan(configs/weight-balanced.ts, ...)
  ├── "fast-track"       → PlannerEngine.createPlan(configs/weight-fast.ts, ...)
  ├── "muscle-preserve"  → PlannerEngine.createPlan(configs/weight-muscle.ts, ...)
  └── "medical-referral" → GateScreen (план невозможен без врача)
```

PlannerEngine не знает, что такое "balanced" или "fast-track".

Он получает `PlannerConfig` и исполняет его.

Вся предметная логика — в конфигурациях.

---

## Часть I — Что такое Strategy Engine

### Определение

Strategy Engine — это **слой принятия решений** между диагнозом и планом.

Он отвечает на вопрос:

> "Вот где ты сейчас (Assessment). Вот что ты хочешь (Goal). Какой из возможных путей подходит именно тебе?"

### Что Strategy Engine делает

```
1. Читает AssessmentResult
2. Читает UserPreference (агрессивность, ограничения)
3. Применяет StrategyRules (условия отбора)
4. Возвращает:
   - recommended_strategy (лучший вариант)
   - available_strategies (все варианты для выбора)
   - disqualified_strategies (почему не подходят)
```

### Что Strategy Engine НЕ делает

```
❌ Не создаёт задачи (это Planner)
❌ Не знает о неделях и milestone (это Planner)
❌ Не хранит прогресс (это UserEngine + Tracker)
❌ Не принимает данные напрямую (только через AssessmentResult)
```

---

## Часть II — StrategyConfig Contract

```typescript
// Тип стратегии — что пользователь видит
interface StrategyOption {
  readonly id: string                     // 'balanced' | 'fast-track' | 'muscle-preserve'
  readonly name: string                   // "Balanced Approach"
  readonly tagline: string                // "Steady, sustainable, evidence-based"
  readonly description: string            // 2-3 предложения для пользователя
  readonly suitable_for: string           // "People who want..." — human text
  readonly risk_level: 'low' | 'medium' | 'high'
  readonly planner_config_id: string      // 'weight-balanced' | 'weight-fast'
  readonly recommended_when: readonly StrategyCondition[]
  readonly disqualified_when?: readonly StrategyCondition[]  // жёсткие блокеры
}

// Условия — DSL, аналогичный InsightCondition в Assessment Engine
type StrategyCondition =
  | { readonly type: 'assessment_score_range'; readonly min: number; readonly max: number }
  | { readonly type: 'dimension_score_above'; readonly dimension: string; readonly threshold: number }
  | { readonly type: 'dimension_score_below'; readonly dimension: string; readonly threshold: number }
  | { readonly type: 'goal_delta_above'; readonly threshold: number }     // gap слишком большой
  | { readonly type: 'goal_delta_below'; readonly threshold: number }
  | { readonly type: 'user_preference_is'; readonly key: string; readonly value: string }
  | { readonly type: 'always' }
  | { readonly type: 'and'; readonly conditions: readonly StrategyCondition[] }
  | { readonly type: 'or'; readonly conditions: readonly StrategyCondition[] }
  | { readonly type: 'not'; readonly condition: StrategyCondition }

// Главный контракт конфигурации
interface StrategyConfig {
  readonly cluster: IntentCluster
  readonly id: string                     // 'weight-strategy'
  readonly version: number

  readonly strategies: readonly StrategyOption[]
  readonly default_strategy_id: string    // fallback если условия не сработали

  // Как выбирается стратегия
  readonly selection_mode:
    | 'auto'          // Engine выбирает сам → Planner создаётся автоматически
    | 'user-choice'   // Engine рекомендует, пользователь выбирает из списка
    | 'hybrid'        // Engine рекомендует первой, пользователь может сменить

  // Пользовательские предпочтения (вход от пользователя перед стратегией)
  readonly preference_inputs: readonly PreferenceInput[]
}

interface PreferenceInput {
  readonly key: string                    // 'pace' | 'lifestyle_constraint'
  readonly type: 'select' | 'boolean'
  readonly label: string
  readonly options?: readonly { id: string; label: string }[]
}

// Результат StrategyEngine
interface StrategyResult {
  readonly cluster: IntentCluster
  readonly assessment_id: string          // ссылка на AssessmentResult
  readonly recommended: StrategyOption
  readonly available: readonly StrategyOption[]
  readonly disqualified: readonly { strategy: StrategyOption; reason: string }[]
  readonly selected: StrategyOption | null  // null пока пользователь не выбрал
  readonly selected_at: string | null
  readonly user_preferences: Record<string, string>
}
```

---

## Часть III — StrategyEngine API

```typescript
class StrategyEngine {

  // Вычислить доступные стратегии на основе Assessment
  evaluate(
    config: StrategyConfig,
    assessmentResult: AssessmentResult,
    userPreferences: Record<string, string>
  ): StrategyResult

  // Пользователь выбрал стратегию (или auto-selection подтверждена)
  confirm(
    strategyResult: StrategyResult,
    selectedStrategyId: string
  ): StrategyResult

  // Получить PlannerConfig для выбранной стратегии
  // Именно здесь связь Strategy → Planner
  getPlannerConfig(strategyResult: StrategyResult): PlannerConfig

  // Для Dashboard и AI Coach
  buildAIContext(strategyResult: StrategyResult): StrategyAIContext
}
```

### Жизненный цикл Strategy

```
StrategyEngine.evaluate()     → StrategyResult { selected: null }
  ↓ (если selection_mode = 'user-choice')
Пользователь выбирает из available[]
  ↓
StrategyEngine.confirm()      → StrategyResult { selected: chosen_strategy }
  ↓
StrategyEngine.getPlannerConfig() → PlannerConfig
  ↓
PlannerEngine.canRun(config, assessmentResult, profile)
  ↓
PlannerEngine.createPlan(config, ...)  → PlannerResult
```

---

## Часть IV — Первый StrategyConfig: Weight

```typescript
// src/lib/strategy/configs/weight.ts
// ~120 строк данных. Strategy Engine не меняется.

export const weightStrategyConfig: StrategyConfig = {
  cluster: 'weight',
  id: 'weight-strategy',
  version: 1,

  selection_mode: 'hybrid',  // рекомендуем, пользователь подтверждает

  preference_inputs: [
    {
      key: 'pace',
      type: 'select',
      label: 'How fast do you want to progress?',
      options: [
        { id: 'gradual',    label: 'Gradual — slow and sustainable' },
        { id: 'moderate',   label: 'Moderate — steady progress' },
        { id: 'aggressive', label: 'Aggressive — fastest results' },
      ],
    },
    {
      key: 'lifestyle',
      type: 'select',
      label: 'Which describes you best?',
      options: [
        { id: 'sedentary',  label: 'Mostly sedentary (desk job)' },
        { id: 'active',     label: 'Moderately active' },
        { id: 'athletic',   label: 'Athletic / trains regularly' },
      ],
    },
  ],

  strategies: [
    {
      id: 'balanced',
      name: 'Balanced Approach',
      tagline: 'Steady, sustainable, evidence-based',
      description: 'A calorie deficit with high protein intake to preserve muscle. Gradual weight loss of 0.3–0.5 kg/week.',
      suitable_for: 'People who want sustainable results without extreme restriction',
      risk_level: 'low',
      planner_config_id: 'weight-balanced',
      recommended_when: [
        { type: 'assessment_score_range', min: 35, max: 75 },
      ],
    },
    {
      id: 'fast-track',
      name: 'Fast Track',
      tagline: 'Aggressive deficit, maximum results',
      description: 'A larger calorie deficit with high protein. Weight loss of 0.7–1 kg/week. Requires discipline.',
      suitable_for: 'People with a clear deadline and high motivation',
      risk_level: 'medium',
      planner_config_id: 'weight-fast',
      recommended_when: [
        { type: 'assessment_score_range', min: 60, max: 100 },
        { type: 'user_preference_is', key: 'pace', value: 'aggressive' },
      ],
      disqualified_when: [
        { type: 'assessment_score_below', dimension: 'metabolism', threshold: 40 },
      ],
    },
    {
      id: 'muscle-preserve',
      name: 'Muscle Preservation',
      tagline: 'Lose fat, keep every gram of muscle',
      description: 'Minimal deficit with high protein and strength focus. Slower fat loss, zero muscle loss.',
      suitable_for: 'Athletic people or those who have trained before',
      risk_level: 'low',
      planner_config_id: 'weight-muscle',
      recommended_when: [
        { type: 'user_preference_is', key: 'lifestyle', value: 'athletic' },
        { type: 'dimension_score_above', dimension: 'fitness', threshold: 60 },
      ],
    },
    {
      id: 'recomposition',
      name: 'Body Recomposition',
      tagline: 'Lose fat and gain muscle simultaneously',
      description: 'Maintenance calories with high protein. Slower visible results, but best body composition outcome.',
      suitable_for: 'People who train regularly and are near their goal weight',
      risk_level: 'low',
      planner_config_id: 'weight-recomposition',
      recommended_when: [
        {
          type: 'and',
          conditions: [
            { type: 'assessment_score_above', dimension: 'fitness', threshold: 65 },
            { type: 'goal_delta_below', threshold: 5 },  // близко к цели
          ],
        },
      ],
    },
    {
      id: 'medical-referral',
      name: 'Medical Support Needed',
      tagline: 'Consult a healthcare provider first',
      description: 'Your assessment indicates factors that require medical supervision before starting a weight loss plan.',
      suitable_for: 'People with very high BMI or severe metabolic risk factors',
      risk_level: 'high',
      planner_config_id: '',  // нет Planner — это Gate
      recommended_when: [],
      disqualified_when: [],
    },
  ],

  default_strategy_id: 'balanced',
}
```

---

## Часть V — Обновлённый Intent Cluster как верхний уровень

Intent Cluster теперь владеет всем. Это единая вертикаль.

```typescript
interface IntentClusterDefinition {
  readonly cluster: IntentCluster

  // Инструменты-входы (SEO entry points)
  readonly entry_instruments: readonly string[]       // calculators в этом кластере

  // Pipeline
  readonly assessment_config_id: string              // 'weight-assessment'
  readonly strategy_config_id: string                // 'weight-strategy'  [НОВОЕ]
  readonly planner_config_ids: readonly string[]     // ['weight-balanced', 'weight-fast', ...]
  readonly tracker_config_id?: string                // future

  // SEO и контент
  readonly seo_entry_page: string                    // /calculators/bmi-calculator
  readonly assessment_page: string                   // /assessment/weight
  readonly planner_page: string                      // /planner/weight  [НОВОЕ]

  // Journey Integration
  readonly journey_id: string                        // 'weight-management'
}

// Регистрация кластеров
export const INTENT_CLUSTER_REGISTRY: Readonly<Record<IntentCluster, IntentClusterDefinition>> = {
  weight: {
    cluster: 'weight',
    entry_instruments: ['bmi-calculator', 'calorie-calculator', 'tdee-calculator',
                        'bmr-calculator', 'body-fat-calculator', 'ideal-weight-calculator',
                        'calorie-deficit-calculator'],
    assessment_config_id: 'weight-assessment',
    strategy_config_id: 'weight-strategy',
    planner_config_ids: ['weight-balanced', 'weight-fast', 'weight-muscle', 'weight-recomposition'],
    assessment_page: '/assessment/weight',
    planner_page: '/planner/weight',
    seo_entry_page: '/calculators/bmi-calculator',
    journey_id: 'weight-management',
  },
  sleep: {
    cluster: 'sleep',
    entry_instruments: ['sleep-calculator'],
    assessment_config_id: 'sleep-assessment',
    strategy_config_id: 'sleep-strategy',
    planner_config_ids: ['sleep-routine', 'sleep-shift-worker', 'sleep-parent'],
    assessment_page: '/assessment/sleep',
    planner_page: '/planner/sleep',
    seo_entry_page: '/calculators/sleep-calculator',
    journey_id: 'sleep-wellness',
  },
  // finance, pregnancy, nutrition... добавляются как данные
}
```

---

## Часть VI — Полный Pipeline SolviqLab

```
SEO Traffic
  ↓ /calculators/bmi-calculator
Calculator (solviqlab:result event)
  ↓ UserEngine.storeResult()
ProfileEngine.processResult()   — domain confidence ++
  ↓ (3+ calculators completed)
AssessmentEngine.run()          — "Вот где ты сейчас"
  ↓ AssessmentResult
StrategyEngine.evaluate()       — "Вот возможные пути"  [НОВЫЙ СЛОЙ]
  ↓ StrategyResult
(user confirms strategy)
  ↓ StrategyResult.selected
PlannerEngine.createPlan()      — "Вот точный маршрут"
  ↓ PlannerResult → UserEngine.storePlan()
ActivePlanView + CheckIn
  ↓ weekly check-ins
TrackerEngine (future)          — "Ты на пути?"
  ↓
AI Coach (V3-10)                — "Вот как адаптироваться"
  ↓
Dashboard                       — полная картина
```

Каждый слой:
- **Знает только о своём уровне**
- **Получает вход от предыдущего слоя**
- **Не знает о следующем слое**

Assessment не знает о Strategy. Strategy не знает о Planner. Planner не знает об AI.

---

## Часть VII — Как это масштабируется на 1000+ продуктов

### Scenario A — Новый Intent Cluster (Pregnancy)

```
1. Создать src/lib/assessment/configs/pregnancy.ts
2. Создать src/lib/strategy/configs/pregnancy.ts
   - strategies: normal, high-risk, ivf, twins, vbac
3. Создать src/lib/planner/configs/pregnancy-normal.ts
4. Создать src/lib/planner/configs/pregnancy-high-risk.ts
5. Зарегистрировать в INTENT_CLUSTER_REGISTRY
```

**Движки не меняются.** Только данные.

### Scenario B — Новая стратегия в существующем кластере

Пользователи показывают, что нужна Keto стратегия для Weight:

```
1. Создать src/lib/planner/configs/weight-keto.ts
2. Добавить стратегию в src/lib/strategy/configs/weight.ts
```

**Ни Assessment Engine, ни Strategy Engine, ни Planner Engine не меняются.**

### Scenario C — Новый продукт в кластере (Mental Health)

```
Assessment → Strategy → Planner
  где strategies: cbt-based | mindfulness | behavioral-activation | medical-referral
```

Та же архитектура. Тот же код движков. Только конфиги.

---

## Часть VIII — Engine Matrix (обновлённая)

```
Layer              | Input                      | Output              | Writes to
───────────────────┼────────────────────────────┼─────────────────────┼──────────────
Calculator         | User input                 | solviqlab:result    | UserEngine
                   |                            |                     | ProfileEngine
───────────────────┼────────────────────────────┼─────────────────────┼──────────────
AssessmentEngine   | ProfileEngine signals      | AssessmentResult    | UserEngine
                   |                            |                     | ProfileEngine*
───────────────────┼────────────────────────────┼─────────────────────┼──────────────
StrategyEngine     | AssessmentResult           | StrategyResult      | UserEngine
[НОВЫЙ]            | UserPreferences            | (selected strategy) |
───────────────────┼────────────────────────────┼─────────────────────┼──────────────
PlannerEngine      | StrategyResult (config)    | PlannerResult       | UserEngine
                   | AssessmentResult           | ActivePlan          |
                   | ProfileEngine              |                     |
───────────────────┼────────────────────────────┼─────────────────────┼──────────────
TrackerEngine      | ActivePlan                 | TrackingResult      | UserEngine
[future]           | CheckIn data               |                     | ProfileEngine
───────────────────┼────────────────────────────┼─────────────────────┼──────────────
AI Coach           | All contexts               | Recommendations     | -
[V3-10]            | (Profile + Assessment +    |                     |
                   |  Strategy + Planner)       |                     |

* через writeSignalsDirect()
```

---

## Часть IX — UserEngine расширение (обновлённое)

```typescript
interface AuthenticatedUser {
  // existing fields...
  assessment_results: readonly AssessmentResult[]    // уже есть
  strategy_results: readonly StrategyResult[]        // NEW
  active_plans: readonly ActivePlan[]                // NEW (из v1)
  completed_plans: readonly ActivePlan[]             // NEW (из v1)
}

// Новые методы:
interface UserEngine {
  // existing methods...
  storeStrategyResult(result: StrategyResult): void          // NEW
  confirmStrategy(cluster: IntentCluster, strategyId: string): StrategyResult | null  // NEW
  getStrategyResult(cluster: IntentCluster): StrategyResult | null  // NEW
  storePlan(plan: PlannerResult): ActivePlan                // NEW
  getActivePlan(cluster: IntentCluster): ActivePlan | null  // NEW
}
```

---

## Часть X — Planner Contract (уточнённый из v1)

Единственное изменение vs v1: PlannerConfig больше не содержит логику "какой план выбрать". Он только описывает "как выполнить выбранный план".

```typescript
interface PlannerConfig {
  readonly cluster: IntentCluster
  readonly id: string                    // 'weight-balanced' (не 'weight-planner')
  readonly name: string                  // 'Balanced Weight Loss'
  readonly strategy_id: string           // 'balanced' — ссылка на StrategyOption
  readonly version: number

  // Требования
  readonly requires_assessment: boolean
  readonly min_assessment_confidence: 'preliminary' | 'moderate' | 'high'

  // Цель (после выбора стратегии, цель уточняется)
  readonly goal_inputs: readonly GoalInputField[]

  // Расчёт продолжительности
  readonly duration_formula: DurationFormula

  // Milestones
  readonly milestone_formula: MilestoneFormula

  // Задачи
  readonly task_templates: readonly TaskTemplate[]

  // Прогресс
  readonly progress_scoring: ProgressScoring

  // Адаптация
  readonly adjustment_rules: readonly AdjustmentRule[]

  // Завершение
  readonly completion_criteria: CompletionCriteria

  // AI контекст
  readonly ai_context_fields: readonly string[]
}
```

Все остальные типы из v1 остаются без изменений: `PlannerGoal`, `PlanMilestone`, `PlanTask`, `CheckIn`, `CheckInResult`, `PlanAdaptation`.

---

## Часть XI — Страницы и компоненты (обновлено)

### Новые роуты

```
app/[lang]/assessment/[cluster]/page.tsx      ← уже есть (V3-08C)
app/[lang]/strategy/[cluster]/page.tsx        ← НОВАЯ (Strategy selection)
app/[lang]/planner/[cluster]/page.tsx         ← НОВАЯ (Plan creation)
app/[lang]/planner/[cluster]/[planId]/page.tsx  ← НОВАЯ (Active plan)
```

### StrategyClient states (3 состояния)

```
1. preference-input    — пользователь отвечает на preference_inputs
2. strategy-selection  — видит все варианты + рекомендацию
3. confirmed           → redirect к /planner/[cluster]
```

### PlannerClient states (5 состояний, из v1)

```
1. skeleton
2. gate          — нет Assessment или нет стратегии
3. goal-input    — уточняет цель (target weight, deadline)
4. active-plan   — план + чекин
5. completed
```

---

## Часть XII — Ответы на ключевые вопросы (обновлено)

### Может ли один Assessment привести к двум разным Planner без изменения Planner Engine?

**Да.**

```
Assessment (Weight, score=72)
  ↓
StrategyEngine → рекомендует 'fast-track' (score > 60)
                 доступны: 'balanced', 'fast-track', 'muscle-preserve'

Пользователь А выбирает 'fast-track'
  → PlannerEngine.createPlan(configs/weight-fast.ts)
  → дефицит 600 ккал/день, 0.7 кг/неделю

Пользователь Б выбирает 'muscle-preserve'
  → PlannerEngine.createPlan(configs/weight-muscle.ts)
  → дефицит 200 ккал/день, фокус на белок, 0.2 кг/неделю

PlannerEngine — тот же.
Конфиги — разные.
```

### Что такое Strategy на уровне платформы?

Strategy — это **именованный подход** к достижению цели внутри одного Intent Cluster.

Она определяет:
- Какую скорость прогресса ожидать
- Какие задачи будут в плане (через `planner_config_id`)
- Какие риски допустимы

Она НЕ определяет:
- Конкретные milestone значения (это Planner)
- Конкретные недельные цели (это Planner)
- Как адаптироваться при отклонении (это Planner)

### Нужна ли Strategy для каждого кластера?

Да, но сложность разная:

```
Weight:     5 стратегий (balanced / fast / muscle / recomposition / medical)
Sleep:      3 стратегии (gradual-routine / sleep-restriction / shift-worker)
Finance:    4 стратегии (debt-first / invest-first / hybrid / emergency-fund)
Pregnancy:  3 стратегии (normal / high-risk / ivf)
```

Для простых кластеров Strategy может быть `selection_mode: 'auto'` — Engine выбирает без участия пользователя.

### Что если пользователь хочет сменить стратегию после старта плана?

```
1. Abandon текущего ActivePlan (status: 'abandoned')
2. StrategyEngine.confirm(strategyResult, new_strategy_id)
3. PlannerEngine.createPlan(new_config, ...)
4. История предыдущего плана сохраняется в completed_plans
5. AI Coach видит смену стратегии → учитывает в рекомендациях
```

---

## Часть XIII — Roadmap имплементации (обновлено)

```
V3-09B (этот документ) — ARCHITECTURE ✅
  Universal Planner Blueprint v2
  Strategy Engine layer добавлен
  Ответ на ключевой вопрос: YES

V3-09C — CONTRACT LAYER (только TypeScript, никакого runtime)
  src/lib/strategy/types.ts          (StrategyConfig, StrategyResult, StrategyOption)
  src/lib/planner/types.ts           (PlannerConfig, PlannerResult, ActivePlan — из v1)
  src/lib/intent/types.ts            (IntentClusterDefinition, INTENT_CLUSTER_REGISTRY)

V3-09D — FIRST CONFIGS (только данные, никакого движка)
  src/lib/strategy/configs/weight.ts  (5 стратегий, ~120 строк)
  src/lib/planner/configs/weight-balanced.ts  (~150 строк)
  src/lib/planner/configs/weight-fast.ts      (~150 строк)

V3-09E — STRATEGY ENGINE RUNTIME
  src/lib/strategy/engine.ts         (evaluate / confirm / getPlannerConfig)
  src/lib/strategy/evaluator.ts      (StrategyCondition DSL evaluator)
  src/lib/strategy/index.ts          (public API + STRATEGY_REGISTRY)

V3-09F — PLANNER ENGINE RUNTIME
  src/lib/planner/engine.ts          (createPlan / checkIn / buildDashboardCard)
  src/lib/planner/scoring.ts         (milestone calculation)
  src/lib/planner/adaptation.ts      (AdjustmentRule evaluator)
  src/lib/planner/strings.ts         (template interpolation)
  src/lib/planner/index.ts           (public API + PLANNER_REGISTRY)

V3-09G — FIRST PRODUCTS
  app/[lang]/strategy/[cluster]/page.tsx
  app/[lang]/planner/[cluster]/page.tsx
  components/strategy/StrategyClient.tsx
  components/planner/PlannerClient.tsx
  UserEngine: strategy_results + active_plans extension

V3-09H — DASHBOARD INTEGRATION
  DashboardClient: StrategyCard + ActivePlansSection
  journey/config.ts: weight-loss-planner → nextSlug registered
  Build: 10 langs × 2 clusters = 20+ new pages
```

**После V3-09H — полный Intent Cluster работает:**

```
SEO → Calculator → Assessment → Strategy Selection → Planner → Dashboard → AI Coach (V3-10)
```

---

## Acceptance Criteria для V3-09B Rev.2

1. ✅ Strategy Engine добавлен как отдельный слой между Assessment и Planner
2. ✅ Ответ на CEO вопрос: один Assessment → два разных Planner без изменения Planner Engine — **YES**
3. ✅ StrategyConfig Contract определён (StrategyOption, StrategyCondition DSL, StrategyResult)
4. ✅ Intent Cluster стал верхним уровнем (`INTENT_CLUSTER_REGISTRY`)
5. ✅ Engine Matrix обновлена (5 слоёв: Calculator / Assessment / Strategy / Planner / Tracker)
6. ✅ PlannerConfig уточнён: содержит только "как выполнить", не "что выбрать"
7. ✅ Масштабируемость доказана для Pregnancy, Sleep, Finance — новые кластеры = только конфиги
8. ✅ Roadmap обновлён: V3-09C→H с чёткими deliverables по слоям

---

*Universal Planner Blueprint v2 — готов к CEO ревью*
