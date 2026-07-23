# Universal Planner Blueprint v1

**Sprint:** V3-09B  
**Дата:** 2026-07-23  
**Статус:** ARCHITECTURE DOCUMENT — ревью перед имплементацией  
**Автор:** Co-Founder + Claude (архитектурный аудит)

---

## Контекст и мотивация

### Почему этот документ существует

После V3-09A мы зафиксировали ключевой принцип платформы:

> **Сначала универсальный Engine. Потом первый продукт как его конфигурация.**

Universal Assessment Engine доказал этот принцип:
- `configs/weight.ts` — 120 строк данных
- `configs/sleep.ts` — 120 строк данных
- Engine — один. Никогда не меняется при добавлении нового кластера.

Universal Planner Engine должен воспроизвести этот паттерн.

Если мы начнём писать Weight Loss Planner без Blueprint — мы получим
продукт, а не платформу. Через 6 месяцев появится Sleep Planner,
Finance Planner, Pregnancy Planner — и все они будут разными кодовыми
базами с разной логикой. Именно эту ошибку мы предотвращаем здесь.

### Место Planner в архитектуре

```
SEO Entry
  ↓
Calculator (любой)
  ↓  solviqlab:result CustomEvent
UserEngine.storeResult()
  ↓
ProfileEngine.processResult()
  ↓
AssessmentEngine.run()        ← синтез: что происходит
  ↓  AssessmentResult
PlannerEngine.createPlan()    ← план: что делать
  ↓  PlannerResult
Dashboard / Planner Page
  ↓
CheckIn → PlannerEngine.adapt()
  ↓
Completion / AI Coach (V3-10)
```

**Ключевое:** Planner читает `AssessmentResult`. Не сырые калькуляторы. Не `ProfileEngine` напрямую (только через Assessment). Это гарантирует pipeline: понять → спланировать.

---

## Часть I — Что такое Planner

### Определение сущности

Planner — это **динамический временной контракт** между пользователем и его целью.

Он отвечает на вопрос:

> "Я знаю, где ты сейчас (Assessment). Ты знаешь, куда хочешь (Goal). Вот точный маршрут с шагами, контрольными точками и правилами адаптации."

### Чем Planner отличается от Assessment

| Измерение | Assessment | Planner |
|-----------|------------|---------|
| Ориентация | Ретроспектива (что есть сейчас) | Проспектива (что делать дальше) |
| Выход | Insight: "Твой вес в зоне риска" | Action: "Неделя 1: -300 ккал/день" |
| Обновление | Однократно (пересдать → новый результат) | Динамически (чекины адаптируют план) |
| Вход | ProfileEngine signals | AssessmentResult + User Goal |
| Связь | Читает Profile | Пишет Plan в UserEngine |

### Planner — это не просто расписание

Ошибочное понимание Planner:

```
❌ Planner = список задач на N недель
```

Правильное понимание:

```
✅ Planner = адаптивная система, которая:
   1. Создаёт план на основе данных
   2. Отслеживает прогресс через чекины
   3. Адаптирует план при отклонениях
   4. Определяет момент завершения
   5. Передаёт данные в Profile и AI
```

---

## Часть II — Анатомия Planner

### Шесть компонентов Planner

```
Goal
  Что пользователь хочет достичь.
  Количественно, с дедлайном.
  Пример: "Сбросить 8 кг за 12 недель"

  ↓

Milestones
  Измеримые контрольные точки.
  Не задачи — это промежуточные состояния.
  Пример: "К неделе 4: -2.5 кг"

  ↓

Tasks
  Конкретные ежедневные/еженедельные действия.
  Привязаны к Milestone.
  Пример: "Дефицит 350 ккал/день. Белок ≥ 120г."

  ↓

Progress
  Как мы измеряем, что задачи выполняются.
  Модель чекина.
  Пример: "Раз в неделю: фактический вес + субъективная оценка"

  ↓

Adaptation
  Правила пересчёта плана при отклонениях.
  Не наказание — коррекция курса.
  Пример: "Если -1 кг за 2 недели вместо -2 кг → снизить дефицит, добавить активность"

  ↓

Completion
  Критерии успеха.
  Может быть раньше срока или позже.
  Пример: "Цель достигнута: вес в целевом диапазоне ±1 кг"
```

### Модель данных Planner

```typescript
// Цель пользователя — вход от пользователя
interface PlannerGoal {
  readonly cluster: IntentCluster           // 'weight' | 'sleep' | 'finance' | ...
  readonly target_value: number             // целевое значение
  readonly target_unit: string              // 'kg' | 'hours' | 'USD' | ...
  readonly current_value: number            // текущее значение (из AssessmentResult)
  readonly delta: number                    // target - current (gap)
  readonly target_date: string | null       // ISO date или null (движок рассчитает)
  readonly duration_weeks: number | null    // задаёт пользователь ИЛИ рассчитывает движок
}

// Контрольная точка
interface PlanMilestone {
  readonly id: string
  readonly week: number                     // к какой неделе достичь
  readonly label: string                    // "Week 4 — First checkpoint"
  readonly target_value: number             // значение к этой неделе
  readonly target_unit: string
  readonly tasks: readonly PlanTask[]
  readonly check_in_required: boolean
}

// Задача
interface PlanTask {
  readonly id: string
  readonly type: 'daily' | 'weekly' | 'one-time'
  readonly category: string                 // 'nutrition' | 'activity' | 'sleep' | 'finance'
  readonly description: string              // человеческий текст
  readonly metric: string | null            // 'calories_deficit' | 'steps' | null
  readonly target: number | null            // 350 | 8000 | null
  readonly unit: string | null              // 'kcal' | 'steps' | null
}

// Результат планировщика
interface PlannerResult {
  readonly plan_id: string                  // 'weight-plan-{user_id}-{timestamp}'
  readonly cluster: IntentCluster
  readonly config_id: string
  readonly config_version: number

  readonly goal: PlannerGoal
  readonly milestones: readonly PlanMilestone[]

  readonly total_weeks: number
  readonly start_date: string               // ISO date
  readonly projected_end_date: string       // ISO date

  readonly created_at: string
  readonly lang: string

  // Метаданные для AI Coach
  readonly assessment_id: string            // ссылка на AssessmentResult
  readonly assessment_score: number
  readonly profile_confidence: number
}

// Статус активного плана
interface ActivePlan {
  readonly result: PlannerResult
  readonly status: 'active' | 'paused' | 'completed' | 'abandoned'
  readonly current_week: number
  readonly check_ins: readonly CheckIn[]
  readonly last_adapted_at: string | null
}

// Чекин (еженедельное обновление)
interface CheckIn {
  readonly week: number
  readonly recorded_at: string
  readonly actual_value: number             // фактический результат
  readonly subjective_score: number         // 1-5 (насколько хорошо я соблюдал план)
  readonly notes: string | null
}

// Результат чекина с адаптацией
interface CheckInResult {
  readonly on_track: boolean
  readonly deviation_percent: number        // % отклонения от плана
  readonly adaptation: PlanAdaptation | null  // null если в норме
  readonly updated_projected_end: string
  readonly encouragement: string            // мотивационный текст
}

interface PlanAdaptation {
  readonly type: 'accelerate' | 'maintain' | 'decelerate' | 'restructure'
  readonly reason: string
  readonly updated_tasks: readonly PlanTask[]
  readonly updated_milestone: PlanMilestone | null
}
```

---

## Часть III — Planner Contract (TypeScript Interface)

Контракт — это то, что должна реализовать каждая конфигурация.

```typescript
// ── Goal Input Schema ──────────────────────────────────────────────────────────
// Определяет, что пользователь вводит как цель

interface GoalInputField {
  readonly key: string                      // 'target_weight' | 'target_savings'
  readonly type: 'number' | 'select' | 'date'
  readonly label: string                    // "Target Weight"
  readonly unit: string                     // "kg" | "USD"
  readonly min?: number
  readonly max?: number
  readonly options?: readonly string[]      // для select
  readonly default_from?: string            // ключ из AssessmentResult для pre-fill
}

// ── Milestone Formula ──────────────────────────────────────────────────────────
// Описывает как рассчитать milestone значения

type MilestoneFormulaType =
  | 'linear'           // равномерное распределение delta по неделям
  | 'progressive'      // медленно в начале, быстрее к середине
  | 'deload_cycle'     // недели нагрузки + недели восстановления
  | 'step_function'    // уровни без промежуточных значений

interface MilestoneFormula {
  readonly type: MilestoneFormulaType
  readonly check_in_frequency: number       // каждые N недель
  readonly early_milestone_weeks?: number[] // фиксированные контрольные точки
  readonly buffer_weeks: number             // запас недель после последнего milestone
}

// ── Task Template ──────────────────────────────────────────────────────────────
// Шаблон задачи с условиями применения

interface TaskTemplate {
  readonly id: string
  readonly category: string
  readonly type: 'daily' | 'weekly' | 'one-time'
  readonly description_template: string     // "Дефицит {{deficit_kcal}} ккал/день"
  readonly variables: Record<string, string> // { deficit_kcal: 'milestone.calorie_deficit' }
  readonly condition?: TaskCondition        // когда применять этот шаблон
}

type TaskCondition =
  | { readonly type: 'assessment_score_above'; readonly threshold: number }
  | { readonly type: 'assessment_score_below'; readonly threshold: number }
  | { readonly type: 'dimension_above'; readonly dimension: string; readonly threshold: number }
  | { readonly type: 'dimension_below'; readonly dimension: string; readonly threshold: number }
  | { readonly type: 'goal_pace_above'; readonly weekly_delta: number }  // агрессивная цель
  | { readonly type: 'always' }

// ── Progress Scoring ──────────────────────────────────────────────────────────
// Как измерять прогресс на чекине

interface ProgressScoring {
  readonly primary_metric: string           // 'weight_kg' | 'sleep_hours' | 'savings_usd'
  readonly deviation_tolerance_percent: number   // ±N% = on track
  readonly check_in_questions: readonly CheckInQuestion[]
}

interface CheckInQuestion {
  readonly key: string
  readonly type: 'number' | 'scale_1_5' | 'boolean'
  readonly label: string
  readonly maps_to: 'actual_value' | 'subjective_score' | 'notes'
}

// ── Adjustment Rules ──────────────────────────────────────────────────────────

interface AdjustmentRule {
  readonly condition: AdjustmentCondition
  readonly adaptation_type: 'accelerate' | 'maintain' | 'decelerate' | 'restructure'
  readonly task_delta_percent: number       // +20% / -20% от текущих задач
  readonly reason_template: string
}

type AdjustmentCondition =
  | { readonly type: 'ahead_by_percent'; readonly threshold: number }
  | { readonly type: 'behind_by_percent'; readonly threshold: number }
  | { readonly type: 'subjective_score_below'; readonly threshold: number }
  | { readonly type: 'missed_checkins'; readonly count: number }

// ── Completion Rules ──────────────────────────────────────────────────────────

interface CompletionCriteria {
  readonly primary_reached: boolean         // цель достигнута
  readonly tolerance_percent: number        // ±N% от цели = успех
  readonly minimum_weeks: number            // минимальный срок (нельзя завершить раньше)
  readonly celebration_message_template: string
}

// ── Planner Config — главный контракт ──────────────────────────────────────────

interface PlannerConfig {
  readonly cluster: IntentCluster
  readonly id: string                       // 'weight-loss-planner'
  readonly name: string                     // 'Weight Loss Planner'
  readonly version: number

  // Требования к данным
  readonly requires_assessment: boolean     // true для всех Intent Clusters
  readonly min_assessment_confidence: 'preliminary' | 'moderate' | 'high'

  // Схема ввода цели
  readonly goal_inputs: readonly GoalInputField[]

  // Расчёт продолжительности
  readonly duration_formula: {
    readonly type: 'from_goal_input' | 'calculated'
    // если calculated:
    readonly weeks_per_unit?: number        // сколько недель на единицу изменения
    readonly min_weeks: number
    readonly max_weeks: number
  }

  // Milestone формула
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
  readonly ai_context_fields: readonly string[]  // какие поля из PlannerResult передавать AI
}
```

---

## Часть IV — PlannerEngine API

Движок — один. Конфиги — бесконечно масштабируемые.

```typescript
class PlannerEngine {

  // Можно ли создать план?
  // Возвращает false если нет Assessment или цель невозможна
  canRun(
    config: PlannerConfig,
    assessmentResult: AssessmentResult,
    profile: PersonalHealthProfile
  ): GateResult

  // Создать план
  // Вызывается один раз. Результат сохраняется в UserEngine.
  createPlan(
    config: PlannerConfig,
    assessmentResult: AssessmentResult,
    profile: PersonalHealthProfile,
    goal: PlannerGoal,
    lang: string
  ): PlannerResult

  // Обработать чекин
  // Вызывается еженедельно. Может изменить задачи.
  checkIn(
    plan: ActivePlan,
    input: { actual_value: number; subjective_score: number; notes?: string }
  ): CheckInResult

  // Для Dashboard
  buildDashboardCard(plan: ActivePlan): PlannerCard

  // Для AI Coach (V3-10)
  buildAIContext(plan: ActivePlan, latestCheckIn: CheckIn | null): PlannerAIContext
}
```

### Жизненный цикл плана

```
createPlan()          → ActivePlan { status: 'active', week: 0 }
  ↓
checkIn(week 1)       → CheckInResult → обновляет ActivePlan
  ↓
checkIn(week 2)       → deviation detected → adaptation
  ↓
  ...
  ↓
checkIn(week N)       → goal reached → status: 'completed'
  ↓
buildAIContext()      → AI Coach получает полную историю
```

---

## Часть V — Как Weight Planner станет конфигурацией

Вот как Weight Loss Planner выразится как `configs/weight.ts`:

```typescript
// src/lib/planner/configs/weight.ts
// ~150 строк данных. Движок не меняется.

export const weightPlannerConfig: PlannerConfig = {
  cluster: 'weight',
  id: 'weight-loss-planner',
  name: 'Weight Loss Planner',
  version: 1,

  requires_assessment: true,
  min_assessment_confidence: 'preliminary',

  goal_inputs: [
    {
      key: 'target_weight',
      type: 'number',
      label: 'Target Weight',
      unit: 'kg',
      min: 30,
      max: 300,
      default_from: 'assessment.dimensions.ideal_weight.target_value',
    },
    {
      key: 'pace',
      type: 'select',
      label: 'Weight Loss Pace',
      unit: '',
      options: ['gradual', 'moderate', 'aggressive'],
      // gradual = 0.3 kg/week, moderate = 0.5 kg/week, aggressive = 0.75 kg/week
    },
  ],

  duration_formula: {
    type: 'calculated',
    weeks_per_unit: 2,  // 1 кг = 2 недели при moderate pace
    min_weeks: 4,
    max_weeks: 52,
  },

  milestone_formula: {
    type: 'linear',
    check_in_frequency: 1,         // чекин каждую неделю
    early_milestone_weeks: [4, 8], // обязательные точки месячной проверки
    buffer_weeks: 2,
  },

  task_templates: [
    {
      id: 'calorie-deficit',
      category: 'nutrition',
      type: 'daily',
      description_template: 'Stay at {{daily_calories}} kcal/day ({{deficit}} kcal deficit)',
      variables: {
        daily_calories: 'milestone.daily_target_kcal',
        deficit: 'milestone.deficit_kcal',
      },
      condition: { type: 'always' },
    },
    {
      id: 'protein-target',
      category: 'nutrition',
      type: 'daily',
      description_template: 'Eat at least {{protein_g}}g protein to preserve muscle',
      variables: { protein_g: 'milestone.protein_g' },
      condition: { type: 'always' },
    },
    {
      id: 'high-intensity-cardio',
      category: 'activity',
      type: 'weekly',
      description_template: '3× cardio sessions (30 min each)',
      variables: {},
      condition: {
        type: 'assessment_score_below',
        threshold: 60,  // только если Assessment показал плохой метаболизм
      },
    },
  ],

  progress_scoring: {
    primary_metric: 'weight_kg',
    deviation_tolerance_percent: 15,  // ±15% = on track
    check_in_questions: [
      {
        key: 'actual_weight',
        type: 'number',
        label: 'Your weight this week (kg)',
        maps_to: 'actual_value',
      },
      {
        key: 'adherence',
        type: 'scale_1_5',
        label: 'How well did you follow the plan? (1-5)',
        maps_to: 'subjective_score',
      },
    ],
  },

  adjustment_rules: [
    {
      condition: { type: 'ahead_by_percent', threshold: 20 },
      adaptation_type: 'accelerate',
      task_delta_percent: 10,
      reason_template: 'You\'re ahead of schedule. Slightly increasing targets to match your momentum.',
    },
    {
      condition: { type: 'behind_by_percent', threshold: 20 },
      adaptation_type: 'decelerate',
      task_delta_percent: -15,
      reason_template: 'You\'re slightly behind. Reducing targets to keep the plan sustainable.',
    },
    {
      condition: { type: 'subjective_score_below', threshold: 2 },
      adaptation_type: 'restructure',
      task_delta_percent: -25,
      reason_template: 'The plan feels too hard. Restructuring for long-term consistency.',
    },
  ],

  completion_criteria: {
    primary_reached: true,
    tolerance_percent: 5,  // ±5% от цели = успех
    minimum_weeks: 4,
    celebration_message_template: 'You reached your weight goal of {{target_weight}}kg in {{actual_weeks}} weeks.',
  },

  ai_context_fields: [
    'goal', 'current_week', 'milestone_scores',
    'adaptation_history', 'completion_projection',
  ],
}
```

**Масштабируемость:**
- Sleep Improvement Planner = `configs/sleep.ts` (~150 строк)
- Finance Savings Planner = `configs/finance.ts` (~150 строк)
- Pregnancy Nutrition Planner = `configs/pregnancy.ts` (~150 строк)
- Движок — один. Никогда не меняется.

---

## Часть VI — Engine Matrix

Как PlannerEngine вписывается в существующую архитектуру.

```
Instrument Type      | ProfileEngine | AssessmentEngine | PlannerEngine | UserEngine
─────────────────────┼───────────────┼──────────────────┼───────────────┼──────────
Calculator           | WRITE         | reads            | -             | WRITE
Assessment           | WRITE*        | EXECUTE          | reads         | WRITE
Planner              | -             | reads            | EXECUTE       | WRITE
Quiz (V3-10)         | WRITE         | -                | -             | WRITE
Tracker (future)     | WRITE         | reads            | reads+updates | WRITE
AI Coach (V3-11)     | reads         | reads            | reads         | -

* Assessment пишет через writeSignalsDirect()
```

### Важный принцип: Planner не пишет в ProfileEngine

Planner пишет только в UserEngine (хранит `ActivePlan`).

Почему? Потому что Profile = что есть сейчас. Plan = что будет.

Когда пользователь делает чекин и фактически теряет вес → новое
измерение должно пойти через Calculator → solviqlab:result → ProfileEngine.
Plan сам по себе не является источником истины о состоянии здоровья.

---

## Часть VII — 4 Архитектурных проблемы Planner

### Проблема 1: Привязка к AssessmentResult (РЕШЕНО дизайном)

**Симптом:** Что если пользователь хочет создать план БЕЗ Assessment?

**Решение:** `requires_assessment: true` в PlannerConfig. Если Assessment не пройден → Gate Screen с объяснением почему нужен Assessment. Тот же UX паттерн что и в AssessmentClient.

### Проблема 2: Изменение цели в середине плана

**Симптом:** Пользователь начал с "похудеть на 10 кг" → передумал → "похудеть на 5 кг"

**Решение:** Не адаптировать план — завершить текущий (status: 'abandoned') и создать новый. Это сохраняет историю чекинов и позволяет AI видеть паттерн изменения целей.

### Проблема 3: Несколько активных планов

**Симптом:** Пользователь хочет одновременно Weight Plan + Sleep Plan

**Решение:** Один активный план на кластер. `UserEngine.getActivePlans()` возвращает `Map<IntentCluster, ActivePlan>`. Dashboard показывает все активные планы.

### Проблема 4: Сезонность и пропуски чекинов

**Симптом:** Пользователь не делал чекин 3 недели

**Решение:** `adjustment_rules` включает `{ type: 'missed_checkins', count: 2 }` → adaptation_type: 'restructure'. Движок не "ждёт" — он адаптирует по последним известным данным и предлагает рестарт.

---

## Часть VIII — UserEngine расширение

UserEngine нужно расширить для хранения планов.

```typescript
// Дополнения к UserEngine (не ломают существующий API)

interface AuthenticatedUser {
  // existing fields...
  active_plans: readonly ActivePlan[]    // NEW
  completed_plans: readonly ActivePlan[] // NEW
}

// Новые методы:
interface UserEngine {
  // existing methods...
  storePlan(plan: PlannerResult): ActivePlan
  updatePlan(planId: string, update: Partial<ActivePlan>): void
  getActivePlan(cluster: IntentCluster): ActivePlan | null
  getActivePlans(): readonly ActivePlan[]
  completePlan(planId: string): void
  abandonPlan(planId: string): void
}
```

---

## Часть IX — Страницы и компоненты

### Новые роуты

```
app/[lang]/planner/[cluster]/page.tsx   ← SSG (10 langs × N clusters)
app/[lang]/planner/[cluster]/[planId]/page.tsx  ← активный план (динамический)
```

### PlannerClient states (4 состояния, аналогично AssessmentClient)

```
1. skeleton       — загрузка данных
2. gate           — нет Assessment → объяснение + ссылка
3. goal-input     — форма ввода цели (target weight, pace, etc.)
4. active-plan    — отображение плана + чекин
5. completed      — план завершён + celebration
```

### Dashboard интеграция

`DashboardClient.tsx` → новая секция `ActivePlansSection`:
- Показывает все активные планы
- Текущая неделя, прогресс до milestone
- Кнопка "Check In" → открывает модал

---

## Часть X — Extension Rules для будущих Planner

### Правило 1 — Новый Planner = новый конфиг

Добавить Sleep Improvement Planner:

1. Создать `src/lib/planner/configs/sleep.ts` (~150 строк)
2. Зарегистрировать в `PLANNER_REGISTRY`
3. Создать SSG страницу (автоматически через `[cluster]` роут)
4. Добавить `sleep-planner` в `NEXT_STEP_DATA` journey/config.ts

**Нет изменений в PlannerEngine.**

### Правило 2 — Task Types расширяемы

Новый тип задачи (например, `mindfulness`) не требует изменения движка.
Просто добавить `category: 'mindfulness'` в task_templates.
PlannerClient рендерит по category → иконка и цвет меняются.

### Правило 3 — AdjustmentRules composable

Если в Sleep Planner нужно особое правило адаптации — добавить в конфиг.
Движок применяет ВСЕ правила в порядке их объявления. Первое сработавшее = победитель.

### Правило 4 — AI Context agnostic

AI Coach получает `PlannerAIContext` — стандартный объект. Что именно входит
в контекст — определяет `ai_context_fields` в конфиге. AI не знает, что такое
"weight" или "sleep" — он знает Goal, Progress, Adaptations.

---

## Часть XI — Ответы на ключевые вопросы

### Может ли существовать Planner без Assessment?

**Нет.** Принципиальное решение. Assessment — это данные, без которых план
не может быть персонализированным. Это защищает от "пустых планов" которые
игнорируют реальное состояние пользователя.

### Может ли Planner создавать данные для ProfileEngine?

**Нет.** Planner — это план, не измерение. ProfileEngine обновляется через
solviqlab:result CustomEvent когда пользователь РЕАЛЬНО использует инструменты
(Calculator, Assessment). Чекин в Planner — это не измерение, это самоотчёт.

### Что происходит с планом после Registration?

Plan сохранён в UserEngine (anonymous → authenticated merge). `upgradeToAuthenticated()`
уже реализован (V3-06) и сохраняет completed_slugs. Нужно добавить active_plans в merge.

### Как AI Coach (V3-10) использует Planner?

AI получает `PlannerAIContext` для каждого активного плана:
- Цель, текущая неделя, прогресс
- История адаптаций
- Проекция завершения
- Последний чекин

AI НЕ получает сырые задачи — только контекст. AI Coach комментирует прогресс
и предлагает поведенческие рекомендации, а не технические корректировки плана.

### Может ли Planner существовать в Finance Intent Cluster?

**Да.** Пример: Savings Planner. AssessmentResult для finance кластера →
`configs/finance.ts` → цель: "Накопить $20,000 за 18 месяцев" → milestones
по месяцам → задачи: ежемесячный взнос, сокращение расходов. Движок тот же.

---

## Часть XII — Риски и митигация

| Риск | Вероятность | Влияние | Митигация |
|------|-------------|---------|-----------|
| Пользователь не делает чекины | Высокая | Средняя | Auto-remind (future). Adjustment rule для missed_checkins. |
| AssessmentResult устарел | Средняя | Средняя | Planner показывает "основан на Assessment от {date}". Предлагает пересдать после плана. |
| Цель нереалистична | Средняя | Высокая | Duration formula + max_weeks = предел. Если цель требует >52 нед → Gate с объяснением. |
| Несколько планов конфликтуют | Низкая | Низкая | Один план на кластер. Разные кластеры не конфликтуют (weight и finance независимы). |
| Plan данные не синхронизированы с Profile | Низкая | Средняя | Planner не пишет в Profile. Только читает. Нет состояния гонки. |

---

## Часть XIII — Roadmap имплементации

```
V3-09B (этот документ) — ARCHITECTURE
  ✅ Universal Planner Blueprint v1
  → Ревью CEO → Утверждение → Переход к V3-09C

V3-09C — CONTRACT + FIRST CONFIG
  src/lib/planner/types.ts          (Planner Contract, TypeScript)
  src/lib/planner/configs/weight.ts  (First config, ~150 строк данных)
  → После этого: Weight Planner = только UI

V3-09D — RUNTIME ENGINE
  src/lib/planner/engine.ts         (PlannerEngine)
  src/lib/planner/scoring.ts        (milestone calculation)
  src/lib/planner/adaptation.ts     (adjustment rules evaluator)
  src/lib/planner/strings.ts        (string interpolation)
  src/lib/planner/events.ts         (analytics)
  src/lib/planner/index.ts          (public API)

V3-09E — FIRST PRODUCT
  app/[lang]/planner/[cluster]/page.tsx
  components/planner/PlannerClient.tsx  (5 состояний)
  components/planner/GoalInputForm.tsx
  components/planner/ActivePlanView.tsx
  components/planner/CheckInModal.tsx
  UserEngine: добавить active_plans поддержку

V3-09F — DASHBOARD INTEGRATION
  DashboardClient: ActivePlansSection
  journey/config.ts: weight-loss-planner → зарегистрировать
  Build: 20+ planner pages (10 langs × N clusters)
```

**После V3-09F:** полный intent pipeline работает:
```
SEO → Calculator → Assessment → Planner → Dashboard → Registration → AI Coach
```

---

## Acceptance Criteria для V3-09B

1. ✅ Определена сущность Planner (Goal / Milestones / Tasks / Progress / Adaptation / Completion)
2. ✅ TypeScript Contract (PlannerConfig, PlannerResult, ActivePlan, CheckIn, CheckInResult)
3. ✅ PlannerEngine API определён (canRun / createPlan / checkIn / buildDashboardCard / buildAIContext)
4. ✅ Доказана масштабируемость: Weight Planner = конфиг, не новый движок
5. ✅ 4 архитектурных проблемы идентифицированы и решены на уровне дизайна
6. ✅ Extension Rules сформулированы
7. ✅ Ответы на ключевые вопросы (Assessment required / Profile isolation / AI context)
8. ✅ Roadmap V3-09C→F определён

---

*Universal Planner Blueprint v1 — готов к CEO ревью перед переходом к V3-09C*
