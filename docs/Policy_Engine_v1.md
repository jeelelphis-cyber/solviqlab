# Policy Engine — Platform Architecture v1

**Статус:** ARCHITECTURE DOCUMENT — CEO Directive (обязательный принцип)  
**Дата:** 2026-07-23  
**Контекст:** Принят в момент формирования архитектуры V3-09B

---

## CEO Directive (Архитектурная Библия)

> **Все бизнес-цели реализуются через Policy Engine. Бизнес-политика никогда не изменяет предметную логику, а только выбирает оптимальную последовательность среди решений, уже признанных подходящими для пользователя.**

Это принцип-основа. Нарушение этого принципа = нарушение архитектурного контракта платформы.

---

## Зачем нужен Policy Engine

### Проблема без Policy Engine

Без этого слоя бизнес-логика со временем проникает внутрь Domain Engine:

```
❌ RecommendationEngine начинает учитывать LTV при скоринге
❌ StrategyEngine рекомендует Premium-стратегию чаще, чем она подходит
❌ JourneyEngine меняет порядок шагов под конверсию
```

Через год платформа превращается в систему, которая **притворяется**, что помогает пользователю, а на самом деле оптимизирует бизнес. Это:
- Разрушает доверие пользователей
- Делает движки непредсказуемыми
- Создаёт технический и этический долг

### Решение

```
Decision Engine    — "Что подходит этому пользователю?"  (предметная логика, медицина, данные)
       ↓
Policy Engine      — "В каком порядке предлагать подходящее?"  (бизнес-логика, никогда не добавляет)
       ↓
Instrument Selection — финальная рекомендация
```

Policy Engine может менять **порядок** среди одобренных вариантов.  
Policy Engine **не может** добавить вариант, который Decision Engine отклонил.

---

## Полный Pipeline платформы (обновлённый)

```
SEO Entry (любой калькулятор)
  ↓  solviqlab:result
UserEngine.storeResult()
  ↓
ProfileEngine.processResult()
  ↓
─────────────────────────────────────────── DECISION LAYER
AssessmentEngine.canRun()     → GateResult
  ↓  если can_run
AssessmentEngine.run()        → AssessmentResult

StrategyEngine.evaluate()     → StrategyResult (список одобренных стратегий)

RecommendationEngine.recommend() → CandidateList (одобренные следующие шаги)
─────────────────────────────────────────── POLICY LAYER
PolicyEngine.apply(candidates, strategyResult, context)
  ↓
Ordered Recommendations (тот же список, другой порядок/веса)
─────────────────────────────────────────── PRESENTATION LAYER
Journey / Dashboard / AI Coach
  (видят только результат Policy Engine, не сырые кандидаты)
```

---

## Часть I — PolicyEngine Contract

```typescript
// Политика платформы — одна активная политика в каждый момент
type PlatformPolicy =
  | 'user_first'    // DEFAULT: Польза → Удержание → Простота
  | 'retention'     // Польза → Вернуть завтра → Завершить Journey
  | 'roi'           // Польза → LTV → Premium → AI Coach → Конверсия
  | 'growth'        // Польза → Регистрация → Шеринг → Виральность
  | 'enterprise'    // B2B: Польза → Отчёты → Интеграции → Renewal
  | 'custom'        // Кастомная политика (future: Enterprise клиенты)

// Контекст для Policy Engine
interface PolicyContext {
  readonly user_segment: 'anonymous' | 'registered' | 'premium'
  readonly session_depth: number         // сколько инструментов использовано
  readonly days_since_registration: number | null
  readonly has_active_plan: boolean
  readonly journey_completion_percent: number
  readonly platform_policy: PlatformPolicy
}

// Кандидат от Decision Engine
interface PolicyCandidate {
  readonly type: 'assessment' | 'strategy' | 'planner' | 'calculator' | 'ai_coach' | 'premium'
  readonly id: string
  readonly cluster: IntentCluster | null
  readonly base_score: number            // скор от Decision Engine (не меняется)
  readonly user_benefit_score: number    // только польза пользователю (не меняется)
  readonly approved: boolean             // Decision Engine одобрил
}

// Результат Policy Engine
interface PolicyResult {
  readonly primary: PolicyCandidate           // главная рекомендация
  readonly secondary: readonly PolicyCandidate[]  // альтернативы
  readonly policy_applied: PlatformPolicy
  readonly policy_boost_applied: boolean      // Policy изменила порядок?
  readonly user_benefit_preserved: boolean    // user_benefit_score primary остался топ-1?
}
```

---

## Часть II — Как Policy Engine применяет политики

### Железное правило

```typescript
function apply(candidates: PolicyCandidate[], context: PolicyContext): PolicyResult {
  // 1. ТОЛЬКО одобренные кандидаты
  const approved = candidates.filter(c => c.approved)

  // 2. ВСЕГДА: user_benefit_score не может быть ниже чем у primary
  // Policy выбирает primary из топ-N по user_benefit, не произвольно
  const topByBenefit = approved.sort((a, b) => b.user_benefit_score - a.user_benefit_score)
  const primary_candidates = topByBenefit.slice(0, POLICY_TOP_N)  // N = 2-3 кандидата

  // 3. Policy применяет веса ТОЛЬКО внутри primary_candidates
  const scored = primary_candidates.map(c => ({
    ...c,
    policy_score: c.user_benefit_score * POLICY_WEIGHTS[context.platform_policy][c.type]
  }))

  const primary = scored.sort((a, b) => b.policy_score - a.policy_score)[0]
  // ...
}
```

**Policy не может выбрать инструмент, который не вошёл в топ-N по `user_benefit_score`.**

---

## Часть III — Политики и их веса

### USER_FIRST (по умолчанию)

Когда использовать: всегда, если не задана другая политика.

```
Приоритет в порядке убывания:
1. user_benefit_score       — польза пользователю
2. session_continuity       — логический следующий шаг в Journey
3. simplicity               — более простой инструмент предпочтительнее
```

```typescript
POLICY_WEIGHTS['user_first'] = {
  assessment:  1.0,   // без буста, чистый user_benefit
  calculator:  1.0,
  planner:     1.0,
  strategy:    1.0,
  ai_coach:    1.0,
  premium:     0.8,   // лёгкий штраф, чтобы не доминировало
}
```

---

### RETENTION_POLICY

Когда использовать: пользователь вернулся через 1+ дней, риск оттока.

```
Приоритет:
1. user_benefit_score
2. Продукт который "оставляет на завтра" (активный план, трекер, незавершённый Journey)
3. Быстрый win (короткий инструмент → мгновенный результат)
```

```typescript
POLICY_WEIGHTS['retention'] = {
  assessment:  1.05,  // +5% буст (даёт повод вернуться за планом)
  planner:     1.10,  // +10% буст (создаёт неделю обязательств)
  calculator:  0.95,  // -5% (не удерживает само по себе)
  ai_coach:    1.08,  // +8% (персональный коуч = привязанность)
  premium:     0.90,  // -10% (не давить на деньги при риске оттока)
}
```

---

### ROI_POLICY

Когда использовать: registered user, использовал 5+ инструментов, высокая вовлечённость.

```
Приоритет:
1. user_benefit_score
2. LTV-сигналы (Premium потенциал)
3. AI Coach (самый высокий ARPU продукт)
4. Конверсия в регистрацию (если анонимный)
```

```typescript
POLICY_WEIGHTS['roi'] = {
  ai_coach:    1.15,  // +15% — флагман монетизации
  premium:     1.12,  // +12%
  planner:     1.08,  // +8% — платная фича в будущем
  assessment:  1.00,
  calculator:  0.90,
  strategy:    1.05,
}
```

**ROI Policy никогда не покажет AI Coach пользователю с нулевой активностью** — Decision Engine не одобрит кандидата, `approved = false`, Policy не может это изменить.

---

### GROWTH_POLICY

Когда использовать: аномальный трафик, вирусная акция, продуктовый эксперимент.

```
Приоритет:
1. user_benefit_score
2. Инструменты с высоким sharing-потенциалом
3. Регистрация (анонимный → зарегистрированный)
4. Простые быстрые win (viral loop)
```

```typescript
POLICY_WEIGHTS['growth'] = {
  calculator:  1.10,  // калькуляторы шарятся (BMI, Calorie результаты)
  assessment:  1.08,  // "Мой Weight Assessment: 78/100" — шарабельно
  planner:     1.05,
  ai_coach:    0.95,  // не продвигать до регистрации
  premium:     0.80,  // минимально
}
```

---

## Часть IV — Где Policy Engine хранит состояние

Policy Engine — **stateless**. Политика задаётся извне.

```typescript
// Где задаётся активная политика:
// 1. Конфиг платформы (один файл, меняется без деплоя через env)
// 2. Admin Dashboard (future) — переключение без кода
// 3. A/B Test Engine (future) — разные политики для разных сегментов

// platform.config.ts
export const PLATFORM_CONFIG = {
  active_policy: (process.env.PLATFORM_POLICY ?? 'user_first') as PlatformPolicy,
  policy_top_n: 3,   // сколько top-N кандидатов Policy Engine рассматривает
}
```

Меняем `PLATFORM_POLICY=retention` в `.env` → вся платформа работает по Retention политике. Ни один движок не изменился.

---

## Часть V — Что Policy Engine никогда не делает

Это жёсткий список запретов, нарушение которых = баг архитектуры:

```
❌ Не добавляет кандидата с approved = false
❌ Не изменяет user_benefit_score кандидата
❌ Не скрывает кандидата которого Decision Engine одобрил (только порядок)
❌ Не рекомендует медицинское действие (Assessment/Planner с medical-referral strategy)
❌ Не учитывает реальные деньги пользователя как сигнал (только user_segment: premium)
❌ Не меняет тип контента (не может превратить Calculator в AI Coach)
❌ Не хранит историю решений (только UserEngine хранит)
```

---

## Часть VI — Практический пример

### Сценарий: Пользователь завершил Weight Assessment, score = 68, confidence = moderate

**Decision Engine output:**
```
candidates: [
  { type: 'strategy',   id: 'weight-strategy',  approved: true,  user_benefit_score: 92 },
  { type: 'planner',    id: 'weight-balanced',   approved: true,  user_benefit_score: 88 },
  { type: 'calculator', id: 'calorie-deficit',   approved: true,  user_benefit_score: 72 },
  { type: 'ai_coach',   id: 'weight-coach',      approved: false, user_benefit_score: 45 }, // ← не готов
  { type: 'premium',    id: 'premium-upsell',    approved: false, user_benefit_score: 10 }, // ← явно не подходит
]
```

**USER_FIRST Policy:**
```
primary:   strategy (score 92) → "Выбери подход к похудению"
secondary: planner  (score 88) → "Сразу создать план"
```

**RETENTION Policy:**
```
strategy  score = 92 × 1.05 = 96.6
planner   score = 88 × 1.10 = 96.8  ← побеждает (неделя обязательств)
calculator score = 72 × 0.95 = 68.4

primary: planner  → "Создай план прямо сейчас"
secondary: strategy
```

**ROI Policy:**
```
ai_coach approved=false → ПРОПУЩЕН (нельзя!)
strategy  score = 92 × 1.05 = 96.6  ← победитель (ai_coach недоступен)
planner   score = 88 × 1.08 = 95.0

primary: strategy → стандартный flow (ai_coach заблокирован Decision Engine)
```

Результат: ROI Policy **хотела** показать AI Coach, но не смогла — Decision Engine сказал `approved: false`. Платформа автоматически выбрала лучший доступный вариант.

---

## Часть VII — Admin Dashboard (future)

```
Platform Policy

  ● User First     (active)     — Польза → Удержание → Простота
  ○ Retention                   — Польза → Вернуть завтра → Journey
  ○ ROI                         — Польза → LTV → Premium → AI Coach
  ○ Growth                      — Польза → Регистрация → Виральность
  ○ Enterprise                  — B2B: Отчёты → Интеграции → Renewal
  ○ Custom         (future)      — Настраиваемые веса

  [Apply] — меняет PLATFORM_POLICY env, никакого деплоя
```

A/B тесты (future):
```
Segment A (50%) → retention
Segment B (50%) → roi
Measure: 7-day retention / conversion rate
```

---

## Часть VIII — Место Policy Engine в Engine Matrix

```
Layer              | Reads                     | Writes         | Business Logic?
───────────────────┼───────────────────────────┼────────────────┼────────────────
Calculator         | User input                | UserEngine     | No
                   |                           | ProfileEngine  |
───────────────────┼────────────────────────────────────────────┼────────────────
AssessmentEngine   | ProfileEngine signals     | UserEngine     | No (domain only)
                   |                           | ProfileEngine  |
───────────────────┼────────────────────────────────────────────┼────────────────
StrategyEngine     | AssessmentResult          | UserEngine     | No (domain only)
                   | UserPreferences           |                |
───────────────────┼────────────────────────────────────────────┼────────────────
RecommendationEngine| UserEngine state         | —              | No (domain only)
                   | ProfileEngine             |                |
───────────────────┼────────────────────────────────────────────┼────────────────
PolicyEngine       | CandidateList (approved)  | —              | YES (ONLY HERE)
                   | PolicyContext             |                |
                   | PlatformPolicy config     |                |
───────────────────┼────────────────────────────────────────────┼────────────────
PlannerEngine      | StrategyResult (config)   | UserEngine     | No (domain only)
                   | PolicyResult (primary)    |                |
───────────────────┼────────────────────────────────────────────┼────────────────
AI Coach           | All contexts              | —              | No (guidance only)
```

**PolicyEngine — единственный слой с бизнес-логикой.**

Это делает систему аудитируемой: если платформа ведёт себя "слишком коммерчески" → проверяем Policy Engine. Ни в каком другом месте бизнес-логики нет.

---

## Часть IX — Roadmap имплементации

```
Сейчас (V3-09B) — ESTABLISHED AS PRINCIPLE
  ✅ Policy Engine задокументирован
  ✅ PolicyCandidate, PolicyContext, PolicyResult contracts определены
  ✅ 4 стандартные политики описаны с весами
  ✅ platform.config.ts placeholder (PLATFORM_POLICY env var)

V3-09E / V3-09F — MINIMAL IMPLEMENTATION
  src/lib/policy/types.ts           (PolicyCandidate, PolicyContext, PolicyResult)
  src/lib/policy/engine.ts          (PolicyEngine.apply())
  src/lib/policy/policies/user_first.ts   (DEFAULT)
  src/lib/policy/policies/retention.ts
  src/lib/policy/policies/roi.ts
  src/lib/policy/index.ts           (getPlatformPolicy() + POLICY_REGISTRY)

После V3-10 — FULL INTEGRATION
  PolicyEngine wired into DashboardClient
  PolicyEngine wired into UserJourneySection (NextStepCard)
  PolicyEngine wired into AI Coach context
  Admin UI: policy switcher (env var → admin panel)

После Public Beta — A/B TESTING
  PolicyEngine.applyForSegment(userId, context)
  Analytics: policy performance metrics
  Automatic policy optimization
```

---

## Принципы-следствия (вытекают из CEO Directive)

1. **Никакой бизнес-логики в Domain Engines.** AssessmentEngine, StrategyEngine, PlannerEngine — только предметная логика. Если появляется соблазн добавить "буст" в Recommendation за Premium → это сигнал, что нужен Policy Engine.

2. **user_benefit_score вычисляется один раз.** Decision Engine считает его до PolicyEngine. PolicyEngine не может его изменить. Это делает систему аудитируемой.

3. **Переключение политики = изменение конфига, не кода.** Если смена политики требует изменения кода движка — архитектура нарушена.

4. **Policy Engine прозрачен для пользователя.** Пользователь всегда видит контент, который Decision Engine одобрил. Policy только выбирает, что показать первым.

5. **Medical и Safety decisions не подлежат Policy.** Если Decision Engine сказал "medical-referral" — Policy Engine не может заменить это на "попробуй AI Coach". Safety-флаги имеют абсолютный приоритет.

---

*Policy Engine v1 — CEO Directive принят 2026-07-23. Обязательный принцип платформы.*
