# Universal Assessment Engine — Architecture v1.0
*SolviqLab Platform Architecture · 2026-07-20*

---

> **Принцип спринта V3-08B:**
> Каждый новый продукт использует существующий движок — или создаёт универсальный,
> которым воспользуются десятки будущих продуктов.
>
> Assessment Engine — это второй фундаментальный движок платформы.
> ProfileEngine строит данные. AssessmentEngine их интерпретирует.

---

## 0. Проблема, которую решает этот движок

Без универсального движка каждый Assessment — это отдельный продукт с нуля:

```
Weight Assessment    →  500 строк специфичного кода
Sleep Assessment     →  500 строк специфичного кода
Finance Assessment   →  500 строк специфичного кода
Pregnancy Assessment →  500 строк специфичного кода
```

Итого: ~2 000 строк, 4 раза одни и те же паттерны, 4 раза одни и те же баги.

С Universal Assessment Engine:

```
AssessmentEngine     →  ~300 строк кода (один раз)
WeightAssessmentConfig →  ~80 строк конфигурации
SleepAssessmentConfig  →  ~80 строк конфигурации
FinanceAssessmentConfig →  ~80 строк конфигурации
```

Вместо написания продуктов — написание конфигураций.

---

## 1. Место в архитектуре платформы

```
                    ┌─────────────────────────────────┐
                    │         Calculator Result         │
                    └─────────────────┬───────────────┘
                                      │ solviqlab:result
                                      ▼
                    ┌─────────────────────────────────┐
                    │           UserEngine             │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │          ProfileEngine           │  ← Хранит сигналы
                    │  domains[] + signals[] + conf    │
                    └────────────┬────────────────────┘
                                 │ reads
                                 ▼
                    ┌─────────────────────────────────┐
                    │      AssessmentEngine ★ NEW      │  ← ЭТОТ ДВИЖОК
                    │  config + scoring + insights     │
                    └────┬───────────┬──────────┬─────┘
                         │           │           │
                         ▼           ▼           ▼
              RecommendationEngine  Dashboard  AI Coach
              (hooks)               (hooks)    (hooks)
```

**Ключевое свойство:** AssessmentEngine — это ЧИТАТЕЛЬ, не писатель.
Он читает ProfileEngine. Он не заменяет его.

Единственное обратное действие: запись `AssessmentCompletedSignal` в ProfileEngine
(чтобы Dashboard знал, что Assessment был пройден).

---

## 2. Что такое Assessment (определение)

Assessment — это **синтетический продукт** с тремя свойствами:

1. **Синтез** — комбинирует данные из нескольких инструментов в единый вывод
2. **Нарратив** — объясняет результат на языке пользователя (не числа, а смысл)
3. **Действие** — указывает приоритетный следующий шаг

Assessment НЕ является:
- Калькулятором (не вычисляет новые данные из пользовательского ввода)
- Диагнозом (не ставит медицинских заключений)
- Заменой инструментам (зависит от них, не конкурирует с ними)

---

## 3. Жизненный цикл Assessment

```
1. TRIGGER
   Пользователь завершил ≥N инструментов в кластере.
   RecommendationEngine выставляет Assessment как primary с высоким score.

2. GATE CHECK
   AssessmentEngine.canRun(config, profile) → { canRun: bool, missing: string[] }
   Если данных недостаточно → показать "Complete X to unlock"
   Если данных достаточно → показать Assessment

3. GAP QUESTIONS
   Если profile не содержит некоторых необходимых сигналов →
   Assessment задаёт минимальный набор вопросов (≤3).
   Например: "What is your primary goal?" если goal не выводится из истории.

4. SCORING
   AssessmentEngine.score(config, resolvedSignals, answers)
   → DimensionScores (0–100 по каждому измерению)
   → OverallScore (0–100, взвешенное среднее)
   → ConfidenceLevel (preliminary / established / comprehensive)

5. INSIGHT GENERATION
   AssessmentEngine.generateInsights(config, scores, signals)
   → InsightRule[] evaluation → ranked Insight[]
   Каждый инсайт: тип (achievement/warning/opportunity) + текст + приоритет

6. NARRATIVE BUILD
   AssessmentEngine.buildNarrative(config, scores, insights, lang)
   → AssessmentNarrative { headline, body, key_points[], cta }

7. RESULT
   AssessmentResult {
     assessment_id, cluster, score, confidence,
     dimension_scores, insights, narrative,
     recommended_next, ai_context
   }

8. HOOKS (параллельно)
   → ProfileEngine.writeAssessmentSignal(result)
   → RecommendationEngine.applyAssessmentHook(result)
   → Dashboard.invalidateClusterCard(cluster)
   → AICoach.updateContext(result.ai_context)

9. DISPLAY
   AssessmentUI рендерит result.narrative + result.insights
   AssessmentUI показывает result.recommended_next как CTA
```

---

## 4. AssessmentConfig — структура конфигурации

Это ЕДИНСТВЕННОЕ, что нужно написать для нового Assessment.

Конфиг — чистые данные. Никакого кода внутри конфига.

```typescript
interface AssessmentConfig {
  // ─── Identity ──────────────────────────────────────────────────────────────
  readonly id: string                      // 'weight-assessment'
  readonly cluster: IntentCluster          // 'weight'
  readonly version: number                 // 1
  readonly schema_version: 1

  // ─── Trigger Rules ─────────────────────────────────────────────────────────
  readonly trigger: {
    // Минимум сигналов из этих доменов для запуска Assessment
    readonly required_domains: readonly {
      readonly domain: ProfileDomain
      readonly min_confidence: number      // напр. 20 — хоть что-то есть
    }[]
    // Минимальное число завершённых инструментов из кластера
    readonly min_instruments_completed: number
  }

  // ─── Gate Questions ─────────────────────────────────────────────────────────
  // Вопросы, которые Assessment задаёт если нужных данных нет в Profile
  readonly gap_questions: readonly AssessmentQuestion[]

  // ─── Dimensions ─────────────────────────────────────────────────────────────
  // Каждое измерение — одна ось Assessment (напр. "Метаболизм", "Вес", "Питание")
  readonly dimensions: readonly AssessmentDimension[]

  // ─── Insight Rules ──────────────────────────────────────────────────────────
  readonly insight_rules: readonly InsightRule[]

  // ─── Narrative Templates ────────────────────────────────────────────────────
  // i18n ключи + шаблоны для headline и body
  readonly narrative: AssessmentNarrativeConfig

  // ─── Recommendation Hooks ───────────────────────────────────────────────────
  // Какие инструменты/продукты рекомендовать после Assessment
  readonly recommendation_hooks: readonly AssessmentRecommendationHook[]

  // ─── AI Coach Context ───────────────────────────────────────────────────────
  // Что передать AI Coach (структурированный, не сырой)
  readonly ai_context_fields: readonly AIContextField[]

  // ─── Output Signals ─────────────────────────────────────────────────────────
  // Что записать обратно в ProfileEngine после завершения Assessment
  readonly output_signals: readonly OutputSignalConfig[]
}
```

---

## 5. Scoring DSL — без кода в конфигурации

Ключевое решение: скоринг описывается данными, а не функциями.

Это означает, что конфиги:
- Полностью сериализуемы (JSON)
- Могут версионироваться и A/B тестироваться
- Не содержат скрытой логики
- Можно отрендерить в UI как объяснение

### ScoringRule (DSL)

```typescript
type ScoringRule =
  | {
      // Числовое значение метрики → балл через пороги
      readonly type: 'signal_value_threshold'
      readonly metric: string               // 'bmi', 'body_fat_percent'
      readonly thresholds: readonly {
        readonly max: number                // если value ≤ max → этот балл
        readonly score: number              // 0–100
        readonly label: string             // 'Optimal', 'Normal', 'Warning'
      }[]
      readonly gender_variant?: {           // разные пороги по полу
        readonly male: readonly Threshold[]
        readonly female: readonly Threshold[]
      }
    }
  | {
      // Статус сигнала → балл (optimal=100, normal=75, warning=40, critical=10)
      readonly type: 'signal_status_map'
      readonly metric: string
      readonly status_scores: Readonly<Record<SignalStatus, number>>
    }
  | {
      // Наличие/отсутствие сигнала
      readonly type: 'signal_presence'
      readonly metric: string
      readonly score_if_present: number
      readonly score_if_absent: number
    }
  | {
      // Составной скоринг: взвешенное среднее нескольких правил
      readonly type: 'composite_weighted'
      readonly rules: readonly {
        readonly rule: ScoringRule
        readonly weight: number             // 0–1, сумма всех весов = 1.0
      }[]
    }
```

### AssessmentDimension

```typescript
interface AssessmentDimension {
  readonly id: string                      // 'body_composition', 'metabolism'
  readonly label_key: string               // i18n ключ
  readonly weight: number                  // 0–1, вес в overall score
  readonly scoring_rule: ScoringRule       // DSL — без функций
  readonly confidence_threshold: number    // мин. confidence для включения
  readonly icon: string                    // '⚖️', '🔥', '💪'
}
```

### Пример: WeightAssessment Dimension

```typescript
// Измерение "Состав тела" (вес 0.35 в общем балле)
{
  id: 'body_composition',
  label_key: 'assessment.weight.dimension.body_composition',
  weight: 0.35,
  icon: '⚖️',
  confidence_threshold: 25,
  scoring_rule: {
    type: 'composite_weighted',
    rules: [
      {
        weight: 0.5,
        rule: {
          type: 'signal_value_threshold',
          metric: 'bmi',
          thresholds: [
            { max: 16.0, score: 15, label: 'Severe underweight' },
            { max: 18.5, score: 50, label: 'Underweight' },
            { max: 24.9, score: 100, label: 'Normal' },
            { max: 27.5, score: 75, label: 'Overweight' },
            { max: 30.0, score: 50, label: 'Obese I' },
            { max: 99.0, score: 20, label: 'Obese II+' },
          ]
        }
      },
      {
        weight: 0.5,
        rule: {
          type: 'signal_value_threshold',
          metric: 'body_fat_percent',
          gender_variant: {
            male: [
              { max: 6, score: 40 },    // essential fat
              { max: 13, score: 100 },   // athlete
              { max: 17, score: 90 },    // fitness
              { max: 24, score: 70 },    // acceptable
              { max: 99, score: 25 },    // obese
            ],
            female: [
              { max: 14, score: 40 },
              { max: 20, score: 100 },
              { max: 24, score: 90 },
              { max: 31, score: 70 },
              { max: 99, score: 25 },
            ]
          }
        }
      }
    ]
  }
}
```

---

## 6. Insight Rules — данные, не код

Инсайт-правила описывают условия на языке данных.

```typescript
type InsightCondition =
  | { type: 'dimension_score_below'; dimension: string; threshold: number }
  | { type: 'dimension_score_above'; dimension: string; threshold: number }
  | { type: 'signal_status'; metric: string; status: SignalStatus }
  | { type: 'signal_value_range'; metric: string; min?: number; max?: number }
  | { type: 'overall_score_below'; threshold: number }
  | { type: 'overall_score_above'; threshold: number }
  | { type: 'and'; conditions: readonly InsightCondition[] }
  | { type: 'or'; conditions: readonly InsightCondition[] }
  | { type: 'not'; condition: InsightCondition }

interface InsightRule {
  readonly id: string                      // 'R1', 'R2', 'achievement_normal_bmi'
  readonly condition: InsightCondition
  readonly insight: {
    readonly type: 'achievement' | 'warning' | 'opportunity' | 'contradiction'
    readonly priority: 1 | 2 | 3          // 1 = показать первым
    readonly title_key: string             // i18n
    readonly body_key: string              // i18n
    // Какие значения из сигналов подставить в i18n шаблон
    readonly params_from_signals?: readonly string[]
  }
}
```

### Пример: Weight Assessment Insight Rules

```typescript
// R1 — Нормальный BMI + нормальный body fat → Achievement
{
  id: 'achievement_healthy_composition',
  condition: {
    type: 'and',
    conditions: [
      { type: 'signal_value_range', metric: 'bmi', min: 18.5, max: 24.9 },
      { type: 'signal_status', metric: 'body_fat_percent', status: 'optimal' }
    ]
  },
  insight: {
    type: 'achievement',
    priority: 1,
    title_key: 'assessment.weight.insight.healthy_composition.title',
    body_key: 'assessment.weight.insight.healthy_composition.body',
    params_from_signals: ['bmi', 'body_fat_percent']
  }
}

// R2 — Высокий BMI + высокий body fat → Warning
{
  id: 'warning_dual_risk',
  condition: {
    type: 'and',
    conditions: [
      { type: 'signal_value_range', metric: 'bmi', min: 30 },
      { type: 'signal_status', metric: 'body_fat_percent', status: 'critical' }
    ]
  },
  insight: {
    type: 'warning',
    priority: 1,
    title_key: 'assessment.weight.insight.dual_risk.title',
    body_key: 'assessment.weight.insight.dual_risk.body'
  }
}

// R3 — BMR медленный для возраста → Opportunity
{
  id: 'opportunity_slow_metabolism',
  condition: { type: 'dimension_score_below', dimension: 'metabolism', threshold: 50 },
  insight: {
    type: 'opportunity',
    priority: 2,
    title_key: 'assessment.weight.insight.slow_metabolism.title',
    body_key: 'assessment.weight.insight.slow_metabolism.body',
    params_from_signals: ['bmr_kcal', 'tdee_kcal']
  }
}
```

---

## 7. Narrative Config — шаблоны на языке данных

Нарратив — это человеческий текст, который пользователь читает как главный результат.

```typescript
interface AssessmentNarrativeConfig {
  // Headline зависит от tier overall score
  readonly headline_by_tier: {
    readonly excellent: string   // i18n ключ (score 80–100)
    readonly good: string        // i18n ключ (score 60–79)
    readonly fair: string        // i18n ключ (score 40–59)
    readonly poor: string        // i18n ключ (score <40)
  }

  // Тип тела / профиль — вычисляется из комбинации dimension scores
  readonly profile_classifier: readonly {
    readonly id: string          // 'active_and_lean', 'metabolically_slow'
    readonly condition: InsightCondition
    readonly label_key: string
    readonly description_key: string
  }[]

  // Ключевые выводы (берутся из топ-N инсайтов по priority)
  readonly max_key_points: number   // 3

  // CTA после Assessment
  readonly cta: {
    readonly high_score: { label_key: string; product_id: string }
    readonly low_score: { label_key: string; product_id: string }
  }
}
```

---

## 8. Recommendation Hooks

После завершения Assessment RecommendationEngine получает дополнительный контекст.

```typescript
interface AssessmentRecommendationHook {
  readonly condition: InsightCondition      // когда применяется
  readonly boost_product: string            // product_id или slug
  readonly score_boost: number             // +N к composite score
  readonly reason: string                  // объяснение для scoring.factors[]
}

// Примеры для Weight Assessment:
// Если overall score < 60 → boost Weight Loss Planner (+25)
// Если metabolism dimension < 50 → boost TDEE Calculator (+15)
// Если assessment complete → boost Registration (+30)
```

---

## 9. Dashboard Hooks

После Assessment Dashboard получает ClusterCard для отображения.

```typescript
// AssessmentEngine.buildDashboardCard(result) → ClusterCard
interface ClusterCard {
  readonly cluster: IntentCluster
  readonly cluster_label: string
  readonly overall_score: number            // 0–100
  readonly score_label: string              // 'Good', 'Needs Attention'
  readonly color_tier: 'emerald' | 'blue' | 'amber' | 'red'
  readonly top_insight: Insight | null      // priority=1 инсайт
  readonly cta_label: string
  readonly cta_product_id: string
  readonly completed_at: string
  readonly confidence: AssessmentConfidence
}
```

Dashboard.tsx просто рендерит `ClusterCard[]` — не знает о структуре каждого Assessment.

---

## 10. AI Coach Hooks

AI Coach получает структурированный контекст, а не сырые сигналы.

```typescript
interface AssessmentAIContext {
  readonly cluster: IntentCluster
  readonly assessment_id: string
  readonly completed_at: string

  // Что AI Coach должен понять о пользователе
  readonly summary: {
    readonly overall_score: number
    readonly confidence: AssessmentConfidence
    readonly top_insights: readonly {
      readonly type: 'achievement' | 'warning' | 'opportunity'
      readonly text: string                // уже на английском, не i18n ключ
    }[]
    readonly profile_type: string | null   // 'Metabolically Slow', 'Active & Lean'
    readonly priority_action: string       // что нужно сделать прямо сейчас
  }

  // Какие данные использовались (для объяснений AI)
  readonly data_sources: readonly {
    readonly instrument_slug: string
    readonly metric: string
    readonly value: number | null
    readonly label: string | null
    readonly recorded_at: string
  }[]

  // Чего НЕТ (для того чтобы AI знал о пробелах)
  readonly missing_signals: readonly {
    readonly metric: string
    readonly would_improve: string         // 'metabolism assessment accuracy'
  }[]

  // Инсайты по измерениям
  readonly dimension_breakdown: readonly {
    readonly dimension_id: string
    readonly label: string
    readonly score: number
    readonly confidence: number
  }[]
}
```

AI Coach видит не "bmi=26.2" — а "пользователь с профилем 'Metabolically Slow',
приоритет — снизить TDEE через активность, доверие к данным — 73%."

---

## 11. Output Signals — обратная запись в ProfileEngine

После завершения Assessment он сам становится источником сигнала.

```typescript
interface OutputSignalConfig {
  readonly metric: string              // напр. 'weight_assessment_score'
  readonly domain: ProfileDomain
  readonly value_from: 'overall_score' | 'dimension_score'
  readonly dimension_id?: string       // если value_from = 'dimension_score'
  readonly unit: string                // 'score/100'
  readonly confidence_contribution: number
}

// Пример для Weight Assessment:
// { metric: 'weight_assessment_score', domain: 'weight', value_from: 'overall_score',
//   unit: 'score/100', confidence_contribution: 20 }

// Эффект: после Weight Assessment →
//   ProfileEngine.domains.weight.confidence += 20
//   Dashboard видит обновлённый weight domain bar
```

---

## 12. AssessmentEngine API (публичный контракт)

```typescript
class AssessmentEngine {

  // Можно ли запустить Assessment (достаточно ли данных)?
  canRun(config: AssessmentConfig, profile: PersonalHealthProfile): GateResult

  // Какие дополнительные вопросы нужно задать?
  getGapQuestions(
    config: AssessmentConfig,
    profile: PersonalHealthProfile
  ): readonly AssessmentQuestion[]

  // Главный метод — вычислить результат
  run(
    config: AssessmentConfig,
    profile: PersonalHealthProfile,
    answers: QuestionAnswers,
    lang: string
  ): AssessmentResult

  // Построить ClusterCard для Dashboard
  buildDashboardCard(result: AssessmentResult): ClusterCard

  // Построить AI контекст
  buildAIContext(result: AssessmentResult, profile: PersonalHealthProfile): AssessmentAIContext

  // Подготовить хуки для RecommendationEngine
  buildRecommendationHooks(
    result: AssessmentResult,
    config: AssessmentConfig
  ): readonly RecommendationBoost[]
}

// Singleton — аналогично ProfileEngine и RecommendationEngine
export function getAssessmentEngine(): AssessmentEngine
```

---

## 13. Как Weight Assessment становится конфигурацией

После того как движок реализован, Weight Assessment — это один файл:

```
src/lib/assessment/configs/weight.ts      ← ~80 строк конфигурации
```

Содержит:
- trigger: { required_domains: ['weight'], min_instruments_completed: 3 }
- gap_questions: [{ id: 'goal', type: 'select', options: ['lose', 'maintain', 'build'] }]
- dimensions: [body_composition (0.35), metabolism (0.30), nutrition (0.20), lifestyle (0.15)]
- insight_rules: [R1…R8]
- narrative: { headline_by_tier, profile_classifier, cta }
- recommendation_hooks: [...]
- output_signals: [weight_assessment_score]
- ai_context_fields: [...]

Никаких компонентов. Никаких алгоритмов. Только конфигурация.

---

## 14. Как Sleep Assessment добавляется после Weight

```
src/lib/assessment/configs/sleep.ts       ← ~80 строк конфигурации
```

Отличается только:
- trigger: { required_domains: ['sleep', 'recovery'], min_instruments_completed: 1 }
- dimensions: [sleep_quality (0.40), sleep_duration (0.30), recovery (0.30)]
- insight_rules: [sleep-specific R1…R6]

Движок — тот же. UI — тот же (параметрический). Только данные разные.

**Время разработки Sleep Assessment:** ~2 часа (vs. ~2 дней с нуля).

---

## 15. Файловая структура

```
src/lib/assessment/
├── types.ts              ← Все типы (этот документ → код)
├── config.ts             ← AssessmentConfig validator + helpers
├── engine.ts             ← AssessmentEngine class (главная логика)
├── scoring.ts            ← ScoringRule DSL evaluator
├── insights.ts           ← InsightCondition evaluator
├── narrative.ts          ← AssessmentNarrative builder + i18n
├── events.ts             ← Assessment analytics events
├── hooks/
│   ├── recommendation.ts ← RecommendationBoost builder
│   ├── dashboard.ts      ← ClusterCard builder
│   └── ai-coach.ts       ← AssessmentAIContext builder
├── configs/
│   ├── weight.ts         ← WeightAssessmentConfig (Wave 1)
│   ├── sleep.ts          ← SleepAssessmentConfig (Wave 2)
│   ├── finance.ts        ← FinanceAssessmentConfig (Wave 2)
│   └── pregnancy.ts      ← PregnancyAssessmentConfig (Wave 2)
└── index.ts              ← Public API
```

---

## 16. Порядок реализации (Implementation Order)

Движок строится снизу вверх — от типов к конфигурациям:

```
Step 1: types.ts           — контракт (2 ч)
Step 2: scoring.ts         — DSL evaluator (3 ч)
Step 3: insights.ts        — InsightCondition evaluator (2 ч)
Step 4: engine.ts          — AssessmentEngine.run() (4 ч)
Step 5: hooks/             — Dashboard, Recommendation, AI (3 ч)
Step 6: configs/weight.ts  — Первая конфигурация (2 ч)
Step 7: UI                 — AssessmentUI.tsx (параметрический) (4 ч)
─────────────────────────────────────────────
Total: ~20 ч → Weight Assessment готов

Step 8: configs/sleep.ts   ← 2 ч (движок уже есть)
Step 9: configs/finance.ts ← 2 ч
Step 10: configs/pregnancy.ts ← 2 ч
```

Инвестиция в платформу: 14 ч.
Каждый следующий Assessment: 2–3 ч.
После 4 Assessments: платформа окупилась.

---

## 17. Связь с Universal Planner Engine (следующий спринт)

Planner Engine строится по той же логике:

```typescript
interface PlannerConfig {
  id: string
  cluster: IntentCluster

  // Какие данные нужны из ProfileEngine (через Assessment или напрямую)
  required_assessment?: string          // 'weight-assessment' (если нужен синтез)
  required_signals: SignalRequirement[]

  // Что спрашивает Planner у пользователя
  goal_questions: PlannerQuestion[]

  // Как строить план (DSL аналогичный ScoringRule)
  plan_algorithm: PlanAlgorithmConfig

  // Что записать в ProfileEngine
  output_signals: OutputSignalConfig[]
}
```

Weight Planner → конфиг PlannerEngine.
Sleep Planner → другой конфиг. Движок — тот же.

---

## 18. Ключевые архитектурные решения

### Решение 1: Config-as-data, не config-as-code

Все правила (скоринг, инсайты, нарратив) — это данные, не функции.
Это означает: версионирование, A/B тесты, remote config в будущем.

### Решение 2: Assessment читает ProfileEngine, не принимает данные напрямую

Weight Assessment не знает про `bmi=26.2`.
Он знает про `profile.domains.weight.signals.find(s => s.metric === 'bmi')`.
Это делает его независимым от порядка прохождения инструментов.

### Решение 3: Hooks, не прямые вызовы

AssessmentEngine не вызывает RecommendationEngine.
Он возвращает `RecommendationBoost[]`.
Caller решает, как их применить.
Это сохраняет детерминизм и тестируемость.

### Решение 4: AI Coach получает AssessmentAIContext, не сырой profile

AI не должен сам интерпретировать BMI=26.2.
Движок уже сделал это. AI получает "пользователь с профилем Metabolically Slow,
приоритет — увеличить NEAT активность, доверие к данным 67%."

### Решение 5: AssessmentUI — параметрический компонент

Один компонент для всех Assessments.
`<AssessmentUI config={weightConfig} result={result} lang={lang} />`

Меняется только конфиг → меняется весь Assessment.

---

*Статус: Архитектура утверждена. Следующий шаг: реализация types.ts*
*После утверждения этого документа — начать Step 1: types.ts*
