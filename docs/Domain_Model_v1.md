# SolviqLab — Domain Model v1

**Sprint:** V3-10B  
**Дата:** 2026-07-23  
**Статус:** DOMAIN DESIGN — до TypeScript, до Engine, до UI  
**Предшественник:** Core_Architecture_Bible_v1.md

> Этот документ отвечает на вопрос: **что является главным объектом SolviqLab?**
> 
> После принятия этого документа все TypeScript-контракты (V3-10C) будут  
> отражать эту доменную модель — а не наоборот.

---

## Ответ на главный вопрос

**Главный объект SolviqLab — `IntentState`.**

Не User. Не Plan. Не Assessment.

`IntentState` — это состояние пользователя в рамках конкретного намерения (Intent).

```
User
  ├── IntentState(weight)
  │     ├── assessment: AssessmentResult  [immutable]
  │     ├── strategy: StrategyDecision    [immutable]
  │     ├── plan: ActivePlan              [mutable]
  │     ├── completed_steps: slug[]       [append-only]
  │     └── history: IntentEvent[]        [append-only]
  │
  └── IntentState(sleep)
        └── ...
```

Любой движок читает `IntentState` и возвращает обновлённый `IntentState`:

```
IntentState → Engine → Updated IntentState
```

Это единственная модель взаимодействия на платформе.

---

# ЧАСТЬ I — AGGREGATE ROOTS

---

## Определение

**Aggregate Root** — это объект, через который осуществляется весь доступ к кластеру связанных сущностей. Внешний мир не может напрямую изменить объекты внутри агрегата — только через Root.

---

## 1. User (Aggregate Root)

**Что это:** Идентификационная единица платформы. Агрегирует всё состояние конкретного человека.

**Источник истины для:**
- Кто этот пользователь (анонимный или зарегистрированный)
- Какие намерения он преследует
- Все сырые результаты инструментов

**Изменяемость:** Мutable — состояние пользователя меняется по мере использования платформы.

**Кто имеет право изменять:**
- `UserEngine` — единственный авторизованный модификатор User агрегата.
- Никто больше. Ни компоненты, ни другие движки напрямую.

```
User
  id: UserId                               (immutable после создания)
  identity: UserIdentity                   (mutable — регистрация)
  storage_type: 'anonymous' | 'authenticated'
  
  instrument_results: InstrumentResult[]   (append-only)
  intent_states: Map<IntentCluster, IntentState>  (per-intent)
  profile: PersonalProfile                 (derived — не источник истины)
  
  created_at: Timestamp                    (immutable)
```

---

## 2. IntentState (Entity, ключевой объект платформы)

**Что это:** Состояние пользователя внутри одного Intent Journey.  
Это главный объект платформы — то, что читают все движки.

**Источник истины для:**
- Где пользователь находится в рамках данного Intent
- Что уже сделано (assessment, strategy, plan)
- Куда двигаться дальше

**Изменяемость:** Mutable — обновляется при каждом шаге пользователя.

**Immutable внутри:** `assessment`, `strategy` — раз созданные, не заменяются. При пересдаче Assessment → создаётся новый `AssessmentResult`, который добавляется в `history`.

**Кто имеет право изменять:**
- `UserEngine.updateIntentState()` — через него, не напрямую.

```
IntentState
  cluster: IntentCluster                   (immutable)
  status: IntentStatus                     (mutable)
  
  completed_steps: InstrumentSlug[]        (append-only)
  confidence: number                       (derived из instrument_results)
  
  assessment: AssessmentResult | null      (immutable once set; new = history entry)
  strategy: StrategyDecision | null        (immutable once set)
  plan: ActivePlan | null                  (mutable — чекины, адаптации)
  
  goals: UserGoal[]                        (mutable — пользователь может уточнять)
  history: IntentEvent[]                   (append-only audit log)
  
  last_updated_at: Timestamp               (mutable)
```

### IntentStatus — жизненный цикл

```
'exploring'   — пользователь использует entry instruments, Profile строится
  ↓  (AssessmentEngine.canRun() → true)
'assessed'    — Assessment завершён, есть AssessmentResult
  ↓  (StrategyEngine.confirm())
'strategized' — стратегия выбрана, есть StrategyDecision
  ↓  (PlannerEngine.createPlan())
'executing'   — ActivePlan создан, идут чекины
  ↓  (ActivePlan.status → 'completed')
'completed'   — цель достигнута
  ↓  (пользователь ставит новую цель)
'exploring'   — новый цикл
```

Любой переход — через `UserEngine`. Движок вызывается → возвращает результат → `UserEngine.updateIntentState()`.

---

## 3. PersonalProfile (Read Model, не Aggregate Root)

**Что это:** Проекция всех `InstrumentResult[]` пользователя на доменную модель здоровья/финансов.

**Важно:** `PersonalProfile` — **НЕ источник истины**. Это вычисленное представление.

Источник истины — `InstrumentResult[]`. Profile можно пересчитать с нуля из результатов.

**Изменяемость:** Derived / Computed. Обновляется `ProfileEngine` при добавлении нового `InstrumentResult`.

**Кто имеет право изменять:** только `ProfileEngine`.

```
PersonalProfile
  domains: Map<ProfileDomain, DomainProfile>   (computed)
  signals: HealthSignal[]                      (computed)
  contradictions: Contradiction[]              (computed)
  overall_confidence: number                   (computed)
  missing_insights: MissingInsight[]           (computed)
  timeline: InstrumentResult[]                 (sorted by time)
  
  — Не хранится как источник истины.
  — Пересчитывается из InstrumentResult[] при изменениях.
  — Может кэшироваться, но кэш всегда инвалидируется при новом InstrumentResult.
```

---

# ЧАСТЬ II — VALUE OBJECTS (Immutable Records)

Value Objects не имеют собственной идентичности. Они описывают состояние в момент времени. После создания — **неизменны**.

---

## 4. InstrumentResult (Value Object, immutable)

**Что это:** Неизменяемая запись о том, что произошло когда пользователь использовал инструмент.

**Источник истины для:** "Что именно пользователь измерил и когда."

**Почему immutable:** История не лжёт. Если пользователь пересдаёт BMI — создаётся новый `InstrumentResult`. Старый остаётся.

**Кто создаёт:** `UserEngine.storeResult()` — при получении `solviqlab:result` CustomEvent.

**Кто имеет право изменять:** Никто. После создания — только чтение.

```
InstrumentResult
  id: ResultId                    (UUID, immutable)
  slug: InstrumentSlug            (immutable)
  instrument_type: InstrumentType (immutable)
  cluster: IntentCluster | null   (immutable)
  
  value: number | null            (immutable — главная метрика)
  label: string | null            (immutable — категория/статус)
  unit: string | null             (immutable)
  metadata: Record<string, unknown> (immutable — полный вывод калькулятора)
  
  recorded_at: Timestamp          (immutable)
  user_id: UserId                 (immutable)
```

---

## 5. AssessmentResult (Value Object, immutable)

**Что это:** Неизменяемый снимок синтеза данных пользователя в конкретный момент времени.

**Источник истины для:** "Что платформа знала о пользователе на момент T и какой вывод сделала."

**Почему immutable:** Assessment — это заключение на основе данных в момент времени. Если позже добавились новые данные → нужен новый Assessment, а не изменение старого. История решений должна сохраняться.

**Кто создаёт:** `AssessmentEngine.run()`.

**Кто имеет право изменять:** Никто. После создания — только чтение.

```
AssessmentResult
  assessment_id: AssessmentId     (UUID, immutable)
  cluster: IntentCluster          (immutable)
  config_id: string               (immutable — какая конфигурация использовалась)
  config_version: number          (immutable)
  
  overall_score: number           (immutable — 0-100)
  confidence: AssessmentConfidence (immutable)
  dimension_scores: DimensionScore[] (immutable)
  insights: Insight[]             (immutable)
  narrative: AssessmentNarrative  (immutable)
  
  completed_at: Timestamp         (immutable)
  user_id: UserId                 (immutable)
  profile_snapshot_confidence: number (immutable — confidence Profile на момент Assessment)
```

---

## 6. StrategyDecision (Value Object, immutable)

**Что это:** Неизменяемая запись о выборе стратегии.

**Источник истины для:** "Какой путь был выбран, когда и на основании какого Assessment."

**Почему immutable:** Решение зафиксировано. Если пользователь меняет стратегию → создаётся новый `StrategyDecision` + старый `ActivePlan` помечается `abandoned`. История решений важна для AI Coach.

**Кто создаёт:** `StrategyEngine.confirm()`.

**Кто имеет право изменять:** Никто. После создания — только чтение.

```
StrategyDecision
  decision_id: DecisionId         (UUID, immutable)
  cluster: IntentCluster          (immutable)
  strategy_id: string             (immutable — 'balanced' | 'fast-track' | ...)
  planner_config_id: string       (immutable — ключ к PlannerConfig)
  
  assessment_id: AssessmentId     (immutable — ссылка на основание решения)
  user_preferences: Record<string, string> (immutable)
  
  decided_at: Timestamp           (immutable)
  user_id: UserId                 (immutable)
```

---

## 7. CheckIn (Value Object, immutable)

**Что это:** Еженедельная запись о фактическом прогрессе.

**Почему immutable:** Отчёт о прошлом не меняется. Если пользователь ошибся → следующий CheckIn исправит картину.

**Кто создаёт:** `PlannerEngine.checkIn()` после валидации ввода.

```
CheckIn
  check_in_id: CheckInId          (UUID, immutable)
  plan_id: PlanId                 (immutable)
  week: number                    (immutable)
  actual_value: number            (immutable — фактический результат)
  subjective_score: number        (immutable — 1-5)
  notes: string | null            (immutable)
  adaptation_applied: PlanAdaptation | null (immutable — что изменилось)
  recorded_at: Timestamp          (immutable)
```

---

# ЧАСТЬ III — MUTABLE ENTITIES

---

## 8. ActivePlan (Entity, mutable)

**Что это:** Живой план — создаётся на основе `StrategyDecision`, наполняется `CheckIn[]`.

**Источник истины для:** "Что пользователь должен делать прямо сейчас и как он продвигается."

**Изменяемость:** Mutable — `status` меняется, `check_ins` накапливаются, задачи могут адаптироваться.

**Что никогда не меняется:** `goal`, `created_at`, `strategy_id`, `config_id` — исходные параметры плана.

**Кто имеет право изменять:**
- `PlannerEngine.checkIn()` — добавляет CheckIn и может адаптировать milestones
- `UserEngine.completePlan()` / `UserEngine.abandonPlan()` — изменяет статус

```
ActivePlan
  plan_id: PlanId                 (immutable после создания)
  cluster: IntentCluster          (immutable)
  strategy_id: string             (immutable — ссылка на StrategyDecision)
  config_id: string               (immutable — какой PlannerConfig использован)
  
  goal: PlannerGoal               (immutable — исходная цель)
  milestones: PlanMilestone[]     (mutable — могут адаптироваться)
  
  status: PlanStatus              (mutable: active | paused | completed | abandoned)
  current_week: number            (mutable)
  check_ins: CheckIn[]            (append-only)
  
  created_at: Timestamp           (immutable)
  assessment_id: AssessmentId     (immutable — ссылка на основание)
  decision_id: DecisionId         (immutable — ссылка на StrategyDecision)
```

---

## 9. UserGoal (Entity, mutable)

**Что это:** Явно заявленная цель пользователя в рамках Intent.

**Изменяемость:** Mutable — пользователь может уточнять цель.

**Кто имеет право изменять:** `UserEngine.setGoal()`.

```
UserGoal
  goal_id: GoalId
  cluster: IntentCluster
  target_value: number            (целевое значение)
  target_unit: string
  current_value: number           (на момент постановки цели)
  target_date: Timestamp | null   
  set_at: Timestamp
  updated_at: Timestamp           (мutable — при уточнении цели)
```

---

## 10. IntentEvent (Value Object, append-only audit log)

**Что это:** Любое значимое событие в рамках Intent — audit trail.

**Зачем:** AI Coach видит историю решений, не только текущее состояние. "Почему этот пользователь перешёл с balanced на fast-track?" — ответ в `IntentEvent[]`.

**Immutable:** да. События не удаляются и не изменяются.

```
IntentEvent
  event_id: EventId
  cluster: IntentCluster
  type: IntentEventType
  payload: Record<string, unknown>
  occurred_at: Timestamp

type IntentEventType =
  | 'instrument_completed'
  | 'assessment_completed'
  | 'strategy_selected'
  | 'plan_created'
  | 'plan_check_in'
  | 'plan_adapted'
  | 'plan_completed'
  | 'plan_abandoned'
  | 'goal_updated'
  | 'status_changed'
```

---

# ЧАСТЬ IV — ПРАВА ЗАПИСИ

---

## 11. Матрица прав изменения

Кто имеет право создавать и изменять каждый объект.

```
Object               | Create                    | Modify              | Delete
─────────────────────┼───────────────────────────┼─────────────────────┼────────
User                 | UserEngine (first use)    | UserEngine only     | Never
IntentState          | UserEngine (auto)         | UserEngine only     | Never
InstrumentResult     | UserEngine.storeResult()  | Nobody — immutable  | Never
AssessmentResult     | AssessmentEngine.run()    | Nobody — immutable  | Never
StrategyDecision     | StrategyEngine.confirm()  | Nobody — immutable  | Never
ActivePlan           | PlannerEngine.createPlan()| PlannerEngine only  | Never*
CheckIn              | PlannerEngine.checkIn()   | Nobody — immutable  | Never
UserGoal             | UserEngine.setGoal()      | UserEngine only     | Never**
IntentEvent          | UserEngine (auto)         | Nobody — immutable  | Never
PersonalProfile      | ProfileEngine (computed)  | ProfileEngine only  | Never (recompute)

* ActivePlan: status изменяется на 'completed'/'abandoned', но объект не удаляется
** UserGoal: создаётся новая запись при изменении, старая сохраняется в истории
```

### Принцип

> Объекты не удаляются. При "изменении" immutable объекта — создаётся новый, старый остаётся.  
> Это гарантирует полную аудируемость и возможность AI Coach видеть эволюцию решений.

---

# ЧАСТЬ V — КАК ДВИЖКИ ВЗАИМОДЕЙСТВУЮТ С МОДЕЛЬЮ

---

## 12. Паттерн взаимодействия

```
Engine читает IntentState (через UserEngine)
  ↓
Engine выполняет свою логику
  ↓
Engine возвращает результат (не пишет напрямую)
  ↓
UserEngine.updateIntentState(result) — единственный писатель
```

### Пример: Assessment Flow

```
Dashboard → UserEngine.getIntentState('weight')
  → IntentState { status: 'exploring', assessment: null }

AssessmentEngine.canRun(config, profile) → GateResult { can_run: true }

AssessmentEngine.run(config, profile, answers, lang)
  → AssessmentResult { overall_score: 72, confidence: 'moderate', ... }

UserEngine.updateIntentState('weight', {
  assessment: assessmentResult,     // сохраняем immutable snapshot
  status: 'assessed',               // обновляем status
  // автоматически добавляется IntentEvent { type: 'assessment_completed' }
})

Dashboard → UserEngine.getIntentState('weight')
  → IntentState { status: 'assessed', assessment: AssessmentResult { score: 72 } }
```

### Пример: Strategy + Plan Flow

```
StrategyEngine.evaluate(config, intentState.assessment, preferences)
  → StrategyResult { recommended: 'balanced', available: [...] }

User выбирает стратегию.

StrategyEngine.confirm(strategyResult, 'fast-track')
  → StrategyDecision { strategy_id: 'fast-track', planner_config_id: 'weight-fast' }

UserEngine.updateIntentState('weight', {
  strategy: strategyDecision,
  status: 'strategized',
})

PlannerEngine.canRun(config, intentState)  // читает весь IntentState
  → GateResult { can_run: true }

PlannerEngine.createPlan(config, intentState, goal, lang)
  → PlannerResult → ActivePlan { status: 'active' }

UserEngine.updateIntentState('weight', {
  plan: activePlan,
  status: 'executing',
})
```

---

## 13. Что движки получают на вход

| Engine | Получает на вход |
|--------|-----------------|
| AssessmentEngine | `PersonalProfile` (derived from InstrumentResults) |
| StrategyEngine | `AssessmentResult` (immutable) + `UserPreferences` |
| PolicyEngine | `CandidateList` (transient) + `IntentState` (for context) |
| PlannerEngine | `IntentState` (весь объект) + `UserGoal` |
| AI Coach | `IntentState` (весь объект) + `PersonalProfile` |
| Dashboard | `IntentState[]` (все) + `PolicyResult` |
| RecommendationEngine | `User` (весь) + `PersonalProfile` |

**Ключевое изменение vs предыдущих версий:**  
Движки теперь получают `IntentState`, а не разрозненные объекты. Это делает интерфейс движков унифицированным.

---

# ЧАСТЬ VI — СРАВНЕНИЕ С ПРЕДЫДУЩЕЙ МОДЕЛЬЮ

---

## 14. Что изменилось vs Blueprint v1/v2

| Аспект | Blueprint v1/v2 | Domain Model v1 |
|--------|----------------|-----------------|
| Главный объект | PlannerResult / ActivePlan | **IntentState** |
| Вход движков | Разрозненные объекты | **IntentState (unified)** |
| Profile | Источник истины | **Read Model (projection)** |
| AssessmentResult | Передаётся напрямую в StrategyEngine | **Читается из IntentState** |
| StrategyDecision | Не было отдельного объекта | **Immutable Value Object** |
| Audit trail | IntentEvent[] не был явным | **Явный append-only audit log** |
| CheckIn | Был в ActivePlan.check_ins | **Отдельный immutable Value Object** |
| UserGoal | Был внутри PlannerGoal | **Отдельный mutable Entity** |

### Почему это важно

До Domain Model: `StrategyEngine.evaluate(assessmentResult, preferences)` — движок принимал сырой AssessmentResult.

После Domain Model: `StrategyEngine.evaluate(config, intentState, preferences)` — движок принимает весь IntentState.

Разница: в первом случае движок не знает, есть ли уже предыдущий Plan, какой статус Intent, не менял ли пользователь стратегию раньше. Во втором — знает всё.

---

# ЧАСТЬ VII — IMMUTABLE vs MUTABLE: ИТОГ

---

## 15. Сводная таблица

```
IMMUTABLE (Value Objects — никогда не меняются после создания)

  InstrumentResult       ← "что пользователь измерил"
  AssessmentResult       ← "что платформа синтезировала в момент T"
  StrategyDecision       ← "какой путь был выбран и когда"
  CheckIn                ← "что пользователь сообщил на неделе N"
  IntentEvent            ← "что произошло и когда"

─────────────────────────────────────────────────────────

DERIVED (Read Models — не источник истины, вычисляется)

  PersonalProfile        ← производная от InstrumentResult[]
  CandidateList          ← производная от User + Profile (transient, не хранится)
  PolicyResult           ← производная от CandidateList + Context (transient)

─────────────────────────────────────────────────────────

MUTABLE (Entities — меняются в рамках своего жизненного цикла)

  User                   ← identity, status, список IntentState
  IntentState            ← status, plan (вся жизнь намерения)
  ActivePlan             ← status, current_week, milestones (адаптации)
  UserGoal               ← target (пользователь уточняет цель)
```

### Правило чтения

> Если нужно понять ПРОШЛОЕ — читай immutable objects.  
> Если нужно понять НАСТОЯЩЕЕ — читай IntentState.  
> Если нужно понять ТЕКУЩИЙ ПРОФИЛЬ — читай PersonalProfile (derived).  
> Если нужно понять ЧТО ДЕЛАТЬ ДАЛЬШЕ — спрашивай PolicyEngine.

---

# ЧАСТЬ VIII — ПРИНЦИПЫ ДОМЕННОЙ МОДЕЛИ

---

## 16. Domain Principles

**D-01: IntentState как центральный объект**
> Все движки читают IntentState. Все движки возвращают результат, который идёт в IntentState. Нет движка, который работает "мимо" IntentState.

**D-02: История не переписывается**
> InstrumentResult, AssessmentResult, StrategyDecision, CheckIn — immutable. При "изменении" создаётся новый объект. Старый остаётся в истории.

**D-03: Profile — это проекция, не источник истины**
> PersonalProfile вычисляется из InstrumentResult[]. Если Profile противоречит InstrumentResult[] — доверяем InstrumentResult[]. Profile может быть пересчитан с нуля.

**D-04: UserEngine — единственный писатель**
> Никакой движок не пишет напрямую в User или IntentState. Движок возвращает результат, UserEngine решает как обновить состояние.

**D-05: Audit Trail обязателен**
> Каждый значимый переход IntentState генерирует IntentEvent. AI Coach, Analytics, Debugging используют IntentEvent[].

**D-06: Один активный план на кластер**
> `IntentState.plan: ActivePlan | null`. Не массив. Один. При смене стратегии — старый plan → `abandoned`, создаётся новый.

**D-07: UserGoal отделён от Plan**
> UserGoal — намерение пользователя (то, что он хочет). PlannerGoal (внутри ActivePlan) — операционная интерпретация UserGoal после создания плана. Пользователь может уточнять UserGoal без пересоздания плана.

---

# ЧАСТЬ IX — ПУТЬ К КОНТРАКТАМ

---

## 17. Что теперь становится V3-10C

Теперь, когда Domain Model определён, V3-10C создаёт TypeScript-интерфейсы как **прямое отражение доменных сущностей**.

Порядок создания типов:

```
1. src/lib/domain/ids.ts
   UserId, ResultId, AssessmentId, DecisionId, PlanId, ...
   (branded types для type safety)

2. src/lib/domain/intent-state.ts
   IntentState, IntentStatus, IntentEvent, IntentEventType

3. src/lib/domain/user.ts
   User, UserIdentity, UserGoal

4. src/lib/domain/instrument-result.ts
   InstrumentResult (immutable Value Object)

5. src/lib/domain/assessment-result.ts
   AssessmentResult, DimensionScore, Insight (immutable)

6. src/lib/domain/strategy-decision.ts
   StrategyDecision (immutable)

7. src/lib/domain/active-plan.ts
   ActivePlan, PlanMilestone, PlanTask, PlanStatus, CheckIn

8. src/lib/domain/personal-profile.ts
   PersonalProfile, DomainProfile, HealthSignal, Contradiction
   (clearly marked as derived / read model)

9. src/lib/domain/index.ts
   (публичный API — реэкспорт всего)
```

---

## 18. Acceptance Criteria для V3-10B

1. ✅ Главный объект определён: `IntentState`
2. ✅ Все Aggregate Roots перечислены: `User`, `IntentState`, `ActivePlan`
3. ✅ Value Objects (immutable) перечислены и обоснованы: `InstrumentResult`, `AssessmentResult`, `StrategyDecision`, `CheckIn`, `IntentEvent`
4. ✅ Read Models обозначены: `PersonalProfile`, `CandidateList`, `PolicyResult`
5. ✅ Матрица прав изменения: кто создаёт, кто модифицирует, кто не может ничего
6. ✅ Паттерн взаимодействия движков с моделью: `Engine reads IntentState → returns result → UserEngine updates`
7. ✅ Domain Principles (D-01..D-07): 7 неизменяемых правил доменной модели
8. ✅ Путь к V3-10C определён: порядок создания TypeScript типов

---

*Domain Model v1 — до TypeScript, до Engine, до UI*  
*2026-07-23*
