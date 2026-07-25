# Coach Platform — Архитектурный обзор

> Основа: Architecture Bible v2.1. Этот README — краткая карта, не замена Библии.

---

## Что такое Coach Platform

Coach Platform — это **слой поверх AICompanion и существующей платформы SolviqLab**, реализующий ежедневный персональный AI-коучинг.

Три ключевых слова архитектуры: **ежедневный, персонализированный, накопленная память**.

Coach Platform НЕ заменяет и НЕ изменяет:
- `lib/coach/engine.ts` — CoachEngine v1 остаётся без изменений
- `lib/planner/engine.ts` — PlannerEngine используется как есть
- `lib/graph/types.ts` — UserGraph только расширяется (ноды 10–13)
- `lib/events/` — EventBus архитектура P-15 сохраняется
- AICompanion — единственное ядро для разговорного AI

---

## Структура папок

```
src/lib/coach/
  domain/           — Immutable domain entities (branded IDs, value objects)
    types.ts        — CoachPersona, CoachSession, CoachPlan, CoachGoal, CoachDecision,
                      DailyReview, DailyHistory, CoachIntervention, CoachRoutine, CoachNotification
    index.ts        — barrel

  events/           — Coach-specific EventBus event types
    types.ts        — 16 событий: session, daily, metrics, outputs + CoachEvent union
    index.ts        — barrel

  contracts/        — Interfaces для всех движков и провайдеров
    index.ts        — CoachPersonaConfig, DecisionEngine, CoachMemoryInterface,
                      CoachPlanner, VideoProvider, NotificationProvider,
                      ConversationProvider, ScriptGenerator, MiaContext, VideoScript

  state-machine/    — State machine types и карта переходов
    types.ts        — CoachState, CoachStateTransition, COACH_TRANSITIONS, CoachStateMachine
    index.ts        — barrel

  brain/            — Coach Brain Orchestrator (Sprint C-1.1)
  planner/          — Planner Adapter (Sprint C-1.4) — dispatches coach:plan_adapt
  persona/          — MIA_CONFIG, ALEX_CONFIG (Sprint C-1.2)
    mia.ts
    alex.ts
  memory/           — CoachMemoryInterface implementation (Sprint C-1.3)
  scheduler/        — Vercel Cron scheduler (Sprint C-1.5)
  providers/
    video/          — VideoProvider: HeyGen, Synthesia, TextFallback (Sprint C-1.6)
    notification/   — NotificationProvider (Sprint C-1.7)
    conversation/   — ConversationProvider wrapping AICompanion (Sprint C-1.7)
  api/              — API route handlers (Sprint C-1.8)

  index.ts          — Главный экспорт всего публичного API
  README.md         — этот файл
```

---

## Главные архитектурные правила (выдержки из P-16, P-17, P-18)

### 1. AICompanion = неизменное ядро

Coach Platform **не дублирует** логику разговора. Все диалоги идут через `ConversationProvider`, который оборачивает AICompanion. Нет второго LLM pipeline в Coach Brain.

### 2. Адаптация плана ТОЛЬКО через EventBus

```
Coach Brain → Planner Adapter → emit('coach:plan_adapt') → P48 → PlannerEngine.adapt()
```

Прямой вызов `PlannerEngine.adapt()` из Coach Brain — **запрещён**. Без исключений.

### 3. Один движок, разные конфиги (P-17)

Mia, Alex, Emma, Noah — это `CoachPersonaConfig`, не разные движки. Добавить нового коуча = создать новый файл в `persona/`. Менять `brain/` для этого — нарушение.

### 4. Single Source of Truth (P-18)

- Mood/Energy данные → только `DailyHistoryNode`
- Nutrition → только `ProfileEngine`
- Medical restrictions → только `MedicalRestrictionsNode`
- Plan state → только `ActivePlan` через `UserEngine`

Дублирования нет. При необходимости — читаем из авторизованного источника.

### 5. Никаких импортов из `components/`

Всё в `lib/coach/` импортирует только из `lib/`. UI компоненты — потребители, не источники.

---

## Иерархия сигналов Coach Brain

```
1. Safety signals (MedicalRestrictionsNode)   → АБСОЛЮТНЫЙ ПРИОРИТЕТ
2. UserGraph: DailyHistoryNode (mood/energy)  → АДАПТАЦИЯ ДНЯ
3. ActivePlan (PlannerEngine)                 → БАЗОВЫЙ ПЛАН
4. AssessmentResult                           → СТРАТЕГИЧЕСКИЙ КОНТЕКСТ
5. CoachNotes (CoachMemoryNode.facts)         → ПЕРСОНАЛЬНЫЙ КОНТЕКСТ
```

---

## Как добавить нового коуча

1. Создать `persona/emma.ts` с `EMMA_CONFIG: CoachPersonaConfig`
2. Экспортировать из `persona/index.ts`
3. Добавить `'emma'` в `CoachPersonaConfig.coachId` union (contracts/index.ts)
4. Создать `MIA_BIBLE.md`-аналог для нового коуча
5. **Не трогать** `brain/`, `memory/`, `state-machine/`

---

## Фазы реализации

| Фаза | Что реализуется | Когда |
|---|---|---|
| Фаза 1 | MIA_CONFIG + UserGraph v2.1 + Video Script Engine + Today View | 4–6 нед |
| Фаза 2A | Scheduler + DB + Evening Check-in UI | 6–8 нед |
| Фаза 2B | Coach Brain Orchestrator + Motivation Engine + P48 | 8–12 нед |
| Фаза 3 | SyncEngine → Production + Intervention Engine + VideoQueue | 12–18 нед |
| Фаза 4 | LLM Conversation (Pro) + Multi-cluster + VideoProvider alternates | 18+ нед |

---

*Coach Platform v2.1 — SolviqLab*
*Основан на Architecture Bible v2.1 (FROZEN, 2026-07-25)*
*Обновление только через ADR + CEO approval*
