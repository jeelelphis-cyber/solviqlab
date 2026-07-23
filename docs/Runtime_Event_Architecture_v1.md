# SolviqLab — Runtime Event Architecture v1

*CEO Directive — V3-10D*  
*Дата принятия: 2026-07-23*  
*Статус: Официальный контракт платформы*

---

## Назначение документа

Этот документ отвечает на вопрос:

> **Как исполняется платформа?**

Все предыдущие документы описывали **что** существует (Domain, Bible, Manifest, Policy).  
Этот документ описывает **как** эти части взаимодействуют во времени.

**Это не диаграмма. Это контракт.**

---

# ЧАСТЬ I. ПРИНЦИП

---

## P-15 — Event Driven Platform (CEO Directive)

> Любой продукт знает только: **input → execute() → result**.  
> Всё остальное — ответственность платформы.

```typescript
// Контракт любого продукта (весь контракт)
interface InstrumentExecution {
  execute(input: InstrumentInput): InstrumentResult
  emit(result: InstrumentResult): void  // единственная точка выхода
}
```

Продукт **не знает**:
- Кто слушает его результат
- Существует ли Dashboard
- Есть ли Journey
- Что такое Strategy и Policy
- Как работает Recommendation
- На какой платформе он запущен (Web / Mobile / API / Voice)

**Почему это критично:**

```
Сейчас:   Web
Год 1:    Web + Mobile
Год 2:    Web + Mobile + API
Год 3:    Web + Mobile + API + AI Agent + Telegram + Voice

Если продукт вызывает Dashboard напрямую → переписывать всё
Если продукт только публикует событие → всё продолжает работать
```

**Сигнал нарушения P-15:**  
Компонент инструмента делает прямой импорт чего-либо кроме своей логики:
```typescript
❌ import { dashboardEngine } from '@/lib/dashboard'
❌ import { journeyEngine } from '@/lib/journey'
❌ import { profileEngine } from '@/lib/profile'
✅ window.dispatchEvent(new CustomEvent('solviqlab:result', { detail: result }))
```

---

# ЧАСТЬ II. EVENT BUS

---

## Архитектура Event Bus

```
Instrument
   ↓ emit(solviqlab:result)
EventBus.publish(event)
   ↓ fan-out to registered handlers (ordered)
Handler 1: UserEngine.onResult()
Handler 2: ProfileEngine.onResult()
Handler 3: AssessmentEngine.checkTrigger()
Handler 4: StrategyEngine.checkTrigger()
Handler 5: PolicyEngine.onStateChange()
Handler 6: RecommendationEngine.refresh()
Handler 7: JourneyEngine.onStep()
Handler 8: AnalyticsEngine.track()
   ↓ platform:state_updated (broadcast)
Dashboard / UI Layer
```

### Реализация (текущая — Browser)

```typescript
// Публикация (из инструмента)
window.dispatchEvent(new CustomEvent('solviqlab:result', {
  detail: {
    eventId: crypto.randomUUID(),    // idempotency key
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    value: 24.2,
    label: 'Normal',
    unit: 'kg/m²',
    metadata: fullResult,
    timestamp: Date.now(),
  }
}))

// Подписка (в EventBus)
window.addEventListener('solviqlab:result', (e: CustomEvent) => {
  eventBus.handle(e.detail)
})
```

### Реализация (будущая — Server/API)

EventBus сохраняет интерфейс. Меняется только транспорт:
```typescript
interface EventBus {
  publish(event: PlatformEvent): void
  subscribe(eventType: string, handler: EventHandler, priority: number): void
}
// Browser: CustomEvent
// Server:  Redis Streams / PostgreSQL LISTEN/NOTIFY
// AI Agent: gRPC stream
```

---

# ЧАСТЬ III. EVENT CONTRACTS

---

## Все события платформы

### Tier 1 — Instrument Events (из продуктов)

```typescript
interface ResultEvent {
  type: 'solviqlab:result'
  eventId: string           // UUID, для idempotency
  slug: string              // 'bmi-calculator'
  name: string              // 'BMI Calculator'
  value: number             // первичное значение (BMI = 24.2)
  label: string             // 'Normal'
  unit: string              // 'kg/m²'
  metadata: Record<string, unknown>  // полный результат
  timestamp: number
  sessionId: string
}
```

### Tier 2 — Platform State Events (из движков, внутренние)

```typescript
// UserEngine → после storeResult()
interface IntentStateUpdatedEvent {
  type: 'platform:intent_state_updated'
  eventId: string
  userId: string
  clusterId: string
  changedFields: string[]   // ['completedInstruments', 'checkIns']
  timestamp: number
}

// ProfileEngine → после пересчёта
interface ProfileRecalculatedEvent {
  type: 'platform:profile_recalculated'
  eventId: string
  userId: string
  domainsChanged: string[]  // ['weight', 'sleep']
  overallConfidenceDelta: number
  timestamp: number
}

// AssessmentEngine → когда порог пройден
interface AssessmentTriggeredEvent {
  type: 'platform:assessment_triggered'
  eventId: string
  userId: string
  cluster: string           // 'weight'
  reason: 'threshold_met' | 'instruments_complete' | 'user_requested'
  readyAt: number
  timestamp: number
}

// StrategyEngine → после evaluate()
interface StrategyEvaluatedEvent {
  type: 'platform:strategy_evaluated'
  eventId: string
  userId: string
  cluster: string
  selectedStrategy: string  // 'balanced' | 'fast-track'
  timestamp: number
}

// PolicyEngine → после sort()
interface PolicyEvaluatedEvent {
  type: 'platform:policy_evaluated'
  eventId: string
  userId: string
  policy: string            // 'user_first' | 'retention'
  candidatesIn: number
  candidatesOut: number
  timestamp: number
}

// RecommendationEngine → после refresh()
interface RecommendationUpdatedEvent {
  type: 'platform:recommendation_updated'
  eventId: string
  userId: string
  topSlug: string           // slug первой рекомендации
  timestamp: number
}

// JourneyEngine → после шага
interface JourneyStepCompletedEvent {
  type: 'platform:journey_step_completed'
  eventId: string
  userId: string
  journeyId: string         // 'weight-management'
  stepSlug: string          // 'bmi-calculator'
  progress: number          // 0.0 - 1.0
  journeyComplete: boolean
  timestamp: number
}

// PlannerEngine → после создания плана
interface PlanCreatedEvent {
  type: 'platform:plan_created'
  eventId: string
  userId: string
  cluster: string
  planId: string
  strategy: string
  durationWeeks: number
  timestamp: number
}

// PlannerEngine → после check-in
interface PlanAdaptedEvent {
  type: 'platform:plan_adapted'
  eventId: string
  userId: string
  planId: string
  reason: string            // AdjustmentRule.id
  newProjectedEnd: number   // timestamp
  timestamp: number
}
```

### Tier 3 — UI Events (из Dashboard/UI в движки)

```typescript
// UI → UserEngine (пользователь явно запросил)
interface UserRequestedAssessmentEvent {
  type: 'user:requested_assessment'
  cluster: string
}

interface UserSubmittedCheckInEvent {
  type: 'user:submitted_checkin'
  planId: string
  week: number
  actualValue: number
  subjectiveScore: number
}

interface UserRegisteredEvent {
  type: 'user:registered'
  email: string
  name: string
}
```

---

# ЧАСТЬ IV. EVENT LIFECYCLE

---

## Полный жизненный цикл события

### Шаг 1: Инструмент завершает работу

```typescript
// Пользователь нажал "Рассчитать" в BMI Calculator
const result = calculateBMI(weight, height)
setResult(result)

// useEffect срабатывает при изменении result:
useEffect(() => {
  if (!result) return
  window.dispatchEvent(new CustomEvent('solviqlab:result', {
    detail: {
      eventId: crypto.randomUUID(),
      slug: 'bmi-calculator',
      value: result.bmi,
      // ...
    }
  }))
}, [result])
```

### Шаг 2: EventBus принимает событие

```typescript
// idempotency check
if (processedEventIds.has(event.eventId)) return
processedEventIds.add(event.eventId)

// dispatch в порядке приоритетов
await runHandlersInOrder(event, handlers)
```

### Шаг 3: Handlers выполняются в порядке (ORDERED)

```
Priority 10  UserEngine.storeResult(event)
             → добавляет InstrumentResult в IntentState
             → обновляет completed_slugs
             → публикует platform:intent_state_updated

Priority 20  ProfileEngine.processResult(event)
             → извлекает HealthSignals из результата
             → обновляет confidence по доменам
             → публикует platform:profile_recalculated

Priority 30  AssessmentEngine.checkTrigger(event)
             → проверяет: достаточно ли данных для Assessment?
             → если да → публикует platform:assessment_triggered

Priority 40  StrategyEngine.checkTrigger(event)
             → только если есть AssessmentResult
             → пересчитывает рекомендуемую стратегию

Priority 50  PolicyEngine.onStateChange(event)
             → пересчитывает порядок кандидатов по текущей политике

Priority 60  RecommendationEngine.refresh(event)
             → формирует новый список рекомендаций
             → публикует platform:recommendation_updated

Priority 70  JourneyEngine.onStep(event)
             → если slug = Journey step → обновляет progress
             → публикует platform:journey_step_completed

Priority 80  AnalyticsEngine.track(event)
             → отправляет в GA4 / Clarity (async, не блокирует)
```

### Шаг 4: UI реагирует на platform events

```typescript
// Dashboard слушает только platform events, не instrument events
useEffect(() => {
  const handler = () => refreshDashboard()
  window.addEventListener('platform:recommendation_updated', handler)
  window.addEventListener('platform:journey_step_completed', handler)
  return () => {
    window.removeEventListener('platform:recommendation_updated', handler)
    window.removeEventListener('platform:journey_step_completed', handler)
  }
}, [])
```

---

# ЧАСТЬ V. EVENT ORDERING

---

## Правила порядка

**Правило 1: Данные всегда раньше логики**

```
UserEngine (Priority 10) → ProfileEngine (Priority 20)
```
Нельзя пересчитать Profile до того, как данные сохранены.

**Правило 2: Синтез всегда раньше оценки**

```
ProfileEngine (20) → AssessmentEngine (30) → StrategyEngine (40)
```
Нельзя выбирать стратегию без синтеза. Нельзя синтезировать без данных.

**Правило 3: Бизнес-логика всегда последней среди engines**

```
StrategyEngine (40) → PolicyEngine (50) → RecommendationEngine (60)
```
Policy видит финальный список кандидатов, не промежуточный.

**Правило 4: Analytics всегда последний (async)**

```
JourneyEngine (70) → AnalyticsEngine (80)
```
Analytics не влияет на бизнес-логику. Failure in Analytics = silent.

**Правило 5: UI никогда не в цепочке handlers**

```
❌ handlers[90] = DashboardEngine.refresh()  // запрещено
✅ Dashboard слушает platform:recommendation_updated самостоятельно
```

---

# ЧАСТЬ VI. ASYNC vs SYNC

---

## Модель выполнения

```
SYNC (блокирующие, в том же тике):
  UserEngine.storeResult()
  ProfileEngine.processResult()
  AssessmentEngine.checkTrigger()
  StrategyEngine.checkTrigger()
  PolicyEngine.onStateChange()
  RecommendationEngine.refresh()
  JourneyEngine.onStep()

ASYNC (не блокирующие, следующий тик):
  AnalyticsEngine.track()     → setTimeout(0)
  Dashboard refresh           → React useEffect
  Animation triggers          → CSS transitions

FIRE-AND-FORGET (не ждём ответа):
  GA4 event                   → gtag()
  Clarity heatmap             → window.clarity()
```

**Почему sync для business handlers:**  
После `emit()` инструмент завершён. Пользователь видит Dashboard обновлённым немедленно. Нет race conditions.

**Почему async для analytics:**  
Failure в аналитике не должна блокировать UI. Потеря события ≠ критическая ошибка.

---

# ЧАСТЬ VII. IDEMPOTENCY

---

## Правила идемпотентности

**Правило I-01: Каждое событие имеет уникальный ID**

```typescript
eventId: crypto.randomUUID()
```

**Правило I-02: EventBus хранит processedEventIds**

```typescript
private processedIds = new Set<string>()

handle(event: PlatformEvent): void {
  if (this.processedIds.has(event.eventId)) return  // idempotent
  this.processedIds.add(event.eventId)
  // process...
}
```

**Правило I-03: InstrumentResult дедуплицируется по (slug, timestamp rounded to minute)**

Пользователь может нажать "Рассчитать" 3 раза подряд → одна запись в истории.

**Правило I-04: ProfileEngine.processResult() — идемпотентен**

Обработать один и тот же ResultEvent дважды = тот же результат.  
Confidence не накапливается дважды от одного сигнала.

**Правило I-05: JourneyStep completion — идемпотентен**

`completed_slugs` — Set, не Array. Добавление дважды = нет эффекта.

---

# ЧАСТЬ VIII. RETRY RULES

---

## Browser Context (текущий)

```
Retry policy: NONE

Обоснование: все операции синхронные, в памяти.
Нет сетевых вызовов. Нет частичных состояний.
Если handler упал → log error, continue next handler.
```

```typescript
for (const handler of handlers) {
  try {
    await handler.handle(event)
  } catch (err) {
    console.error(`[EventBus] Handler ${handler.name} failed:`, err)
    // continue — не прерываем цепочку
  }
}
```

## Server Context (будущий — при добавлении backend)

```
Retry policy: Exponential backoff
  Attempt 1: немедленно
  Attempt 2: 1 секунда
  Attempt 3: 4 секунды
  После 3 попыток: Dead Letter Queue

Критичные events (plan_created, user_registered): 3 попытки
Некритичные events (recommendation_updated): 1 попытка
Analytics events: fire-and-forget, нет retry
```

---

# ЧАСТЬ IX. ПОЛНЫЙ EVENT FLOW

---

## Официальная схема платформы

```
╔═══════════════════════════════════════╗
║           INSTRUMENT LAYER            ║
║                                       ║
║   BMI Calculator                      ║
║   execute(weight, height)             ║
║   → result = { bmi: 24.2, ... }       ║
║   → emit('solviqlab:result', result)  ║
╚═══════════════════════════════════════╝
                   ↓
╔═══════════════════════════════════════╗
║              EVENT BUS                ║
║                                       ║
║   receive('solviqlab:result')         ║
║   check idempotency (eventId)         ║
║   dispatch to handlers in order       ║
╚═══════════════════════════════════════╝
                   ↓
╔═══════════════════════════════════════╗
║           PLATFORM HANDLERS           ║
║                                       ║
║   [P10] UserEngine.storeResult()      ║  ← пишет в IntentState
║          ↓ platform:intent_updated    ║
║   [P20] ProfileEngine.processResult() ║  ← пересчитывает Profile
║          ↓ platform:profile_updated   ║
║   [P30] AssessmentEngine.check()      ║  ← проверяет trigger
║          ↓ platform:assess_triggered? ║
║   [P40] StrategyEngine.check()        ║  ← выбирает путь
║          ↓ platform:strategy_updated? ║
║   [P50] PolicyEngine.sort()           ║  ← бизнес-порядок
║          ↓                            ║
║   [P60] RecommendationEngine.refresh()║  ← формирует список
║          ↓ platform:recommend_updated ║
║   [P70] JourneyEngine.onStep()        ║  ← обновляет прогресс
║          ↓ platform:journey_updated   ║
║   [P80] AnalyticsEngine.track() async ║  ← GA4/Clarity
╚═══════════════════════════════════════╝
                   ↓
╔═══════════════════════════════════════╗
║               UI LAYER                ║
║                                       ║
║   Dashboard listens:                  ║
║     platform:recommend_updated →      ║
║       re-render PrimaryCard           ║
║     platform:journey_updated →        ║
║       re-render JourneyProgressCard   ║
║     platform:assess_triggered →       ║
║       show AssessmentCTA              ║
╚═══════════════════════════════════════╝
```

**Инструмент видит только:**
```
execute() → emit()
```

**Платформа делает всё остальное автоматически.**

---

# ЧАСТЬ X. ДОБАВЛЕНИЕ НОВОГО ПРОДУКТА

---

## Что делает новый продукт

```typescript
// 1. Создаёт манифест (P-14)
export default defineInstrument({
  slug: 'macro-calculator',
  cluster: 'weight',
  capability: 'health',
  provides: { profile_signals: ['protein_intake', 'carb_intake', 'fat_intake'] },
  emits: ['solviqlab:result'],
})

// 2. Реализует calculate()
function calculateMacros(input: MacroInput): MacroResult { /* ... */ }

// 3. Эмитит результат
useEffect(() => {
  if (!result) return
  window.dispatchEvent(new CustomEvent('solviqlab:result', {
    detail: { eventId: crypto.randomUUID(), slug: 'macro-calculator', ...result }
  }))
}, [result])
```

**Что продукт НЕ делает:**
- Не вызывает ProfileEngine
- Не обновляет Dashboard
- Не знает о Journey
- Не знает о Strategy или Policy
- Не знает о Recommendation

**Платформа автоматически:**
- Сохраняет результат в IntentState
- Обновляет `protein_intake` сигналы в Profile
- Пересчитывает confidence для nutrition domain
- Проверяет, стал ли Assessment доступен
- Обновляет Recommendation (макро-калькулятор → Assessment → Planner)
- Добавляет шаг в Journey
- Отправляет аналитику

**Это и есть P-13 One Product Rule в действии.**

---

# ЧАСТЬ XI. РАСШИРЕНИЕ ДЛЯ НОВЫХ ПЛАТФОРМ

---

## Как добавить Mobile / Telegram / Voice

Меняется только транспорт EventBus. Контракты событий не меняются.

```typescript
// Сейчас (Browser)
class BrowserEventBus implements EventBus {
  publish(event) { window.dispatchEvent(new CustomEvent(event.type, { detail: event })) }
  subscribe(type, handler) { window.addEventListener(type, (e) => handler(e.detail)) }
}

// Будущее (React Native)
class ReactNativeEventBus implements EventBus {
  publish(event) { DeviceEventEmitter.emit(event.type, event) }
  subscribe(type, handler) { DeviceEventEmitter.addListener(type, handler) }
}

// Будущее (Server API)
class ServerEventBus implements EventBus {
  publish(event) { await redis.xadd('platform:events', '*', event) }
  subscribe(type, handler) { /* Redis XREAD consumer group */ }
}

// Будущее (AI Agent)
class AgentEventBus implements EventBus {
  publish(event) { await grpcStream.write(event) }
  subscribe(type, handler) { /* gRPC server-side streaming */ }
}
```

**Продукты не меняются. Контракты не меняются. Меняется только EventBus.**

---

# ЧАСТЬ XII. ADR

---

## ADR-013: Принятие Event-Driven Platform Architecture

**Контекст:** Даже с Policy Engine и Capability Layer продукты всё ещё могут делать прямые вызовы движков. Это создаёт coupling, который сломается при добавлении новых платформ.

**Решение:** Формализовать Event Bus как единственный канал коммуникации инструментов с платформой. Добавить P-15.

**Последствия:**
- (+) Продукты полностью изолированы
- (+) Любая новая платформа = новый EventBus transport
- (+) Тестирование инструментов без движков
- (-) Требует рефакторинга AssessmentClient (сейчас читает ProfileEngine напрямую)
- (-) EventBus нужно реализовать явно (сейчас implicit через CustomEvent)

**Принято:** 2026-07-23

---

## ADR-014: Sync-first для business handlers, Async для Analytics

**Контекст:** Нужно определить, какие handlers могут быть асинхронными.

**Решение:** Business handlers (P10-P70) — sync. Analytics (P80) — async fire-and-forget.

**Обоснование:** После emit() пользователь видит Dashboard обновлённым без задержки. Потеря аналитического события не критична.

**Принято:** 2026-07-23

---

## ADR-015: Idempotency через eventId UUID

**Контекст:** React StrictMode вызывает useEffect дважды. Пользователь может нажать "Calculate" несколько раз.

**Решение:** EventBus хранит Set<string> processedEventIds. Дубли игнорируются.

**Принято:** 2026-07-23

---

*Runtime Event Architecture v1 — Official Platform Contract*  
*Принят: 2026-07-23*  
*Следующее обновление: при изменении Event Bus через ADR*
