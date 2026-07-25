# Architecture Changelog — Daily AI Coach Platform
## SolviqLab

---

## v2.0 → v2.1 (2026-07-25)

**Основание:** Architecture Review AR-1 (вердикт: APPROVE WITH CHANGES)  
**Источник изменений:** `/docs/Architecture_Review_AR1.md`  
**Применено корректировок:** 7 (C1–C7)

---

### C1 — CoachPersonaConfig

**Было:**  
Coach Brain спроектирован специально под Mia/Health. Decision Rules описаны как псевдокод внутри Раздела 06 — фактически хардкод в будущем engine.ts. Нет упоминания принципа "один движок, разные коучи". Добавление Finance Coach (Alex) потребовало бы переписывания Coach Brain.

**Стало:**  
Введён полный интерфейс `CoachPersonaConfig` со всеми полями (Раздел 03):
- personality (tone, style, languageLevel, emojiPolicy)
- decisionRules[] — Config-as-Data, движок исполняет правила, не знает их смысл
- toneByPhase (5 фаз жизненного цикла)
- videoTemplates (8 типов: morning, evening, intervention L1–L5, milestone, celebration, weekReview, monthReview)
- domainConfig (primaryMetric, taskCategories, interventionThresholds)
- safetyRules (neverMentionTopics, requiresDisclaimer, escalateToHuman)

Добавлены два полных примера конфига: MIA_CONFIG (Health) и ALEX_CONFIG (Finance). Они демонстрируют, что один движок обслуживает разные домены через разные конфиги.

Добавлен новый архитектурный принцип P-17 (Coach Persona Isolation Principle): добавление нового коуча = создание нового CoachPersonaConfig, не изменение движка.

**Причина:**  
Нарушение P-01 (Config-as-Data) и P-12 (Convergence over Divergence). Хардкод Decision Rules в движке при добавлении второго коуча привёл бы к дивергенции архитектуры.

---

### C2 — Planner Ownership

**Было:**  
Три конфликтующих пути вызова PlannerEngine.adapt():
1. Раздел 03: "Coach Brain вызывает PlannerEngine.adapt() при coaching сигналах"
2. platform-pipeline.ts P47: adapt() вызывается через EventBus при 'planner:check_in'
3. Раздел 11 P-16: "Coach Brain НИКОГДА не пишет напрямую в PlannerEngine"

Все три источника противоречили друг другу. Не было единого owner для операции adapt().

**Стало:**  
Единственный авторизованный путь адаптации плана из Coach Brain:

```
Coach Brain Orchestrator
    → Planner Adapter (dispatches 'coach:plan_adapt')
    → EventBus
    → Pipeline P48 (новый stage)
    → PlannerEngine.adapt()
    → UserEngine.setActivePlan()
```

P47 ('planner:check_in') сохранён — это пользовательский чекин через UI. Это отдельное событие с отдельным payload и отдельным источником. Конфликт устранён разделением на два независимых события.

Planner Module переименован в Planner Adapter — точнее отражает роль: dispatches событие, не вызывает движок напрямую.

Добавлен Pipeline stage P48 с полной спецификацией payload события 'coach:plan_adapt'.

Добавлен API endpoint POST /api/coach/plan-adapt.

**Причина:**  
Нарушение P-15 (Event Driven Platform). Двойное управление одной операцией из двух мест — источник непредсказуемого поведения при масштабировании. Выбран EventBus путь (Вариант A из AR-1) как более соответствующий P-15.

---

### C3 — Merge MoodEnergyNode + DailyHistoryNode

**Было:**  
Две ноды хранили одни и те же данные:
- DailyHistoryNode.entries[].moodRating: number | null
- MoodEnergyNode.entries[].mood: number

Единственное отличие: MoodEnergyNode добавляла context: 'morning' | 'evening'. Нарушение AP-07 (Multiple Source of Truth). При рассинхронизации Motivation Engine получал противоречивые сигналы.

**Стало:**  
MoodEnergyNode (нода 12 в v2.0) упразднена. Данные перенесены в DailyHistoryNode через новый тип MoodEnergyRecord:

```typescript
interface MoodEnergyRecord {
  readonly value:   number | null
  readonly context: 'morning' | 'evening' | null
}

interface DailyEntry {
  // ...
  readonly moodRating:   MoodEnergyRecord   // ЕДИНСТВЕННЫЙ источник
  readonly energyRating: MoodEnergyRecord   // ЕДИНСТВЕННЫЙ источник
}
```

Motivation Engine, Habit Engine, Daily Review Module читают mood/energy только из DailyHistoryNode. Нет альтернативного источника.

UserGraph v2.1 содержит 13 нод вместо 15 (с учётом C4). Нумерация нод обновлена в Разделе 05.

**Причина:**  
Нарушение AP-07. Дублирование данных в двух нодах при масштабировании до 1M пользователей создаёт риск corrupted data в Motivation Engine.

---

### C4 — NutritionContextNode Review

**Было:**  
NutritionContextNode (нода 15 в v2.0) хранила в UserGraph:
- dailyCalorieTarget
- proteinTarget
- dietType
- mealFrequency
- restrictions[]

Эти данные уже существовали в ProfileEngine через цепочку Calorie Calculator → P20 (ProfileEngine.processResult).

**Стало:**  
NutritionContextNode удалена из UserGraph.

Coach Brain читает nutrition данные напрямую из ProfileEngine.getOrCreateProfile(userId). Это чтение, не запись — принцип изоляции слоёв не нарушается.

Правило границы чтения зафиксировано в Разделе 05: Coach Brain читает из ProfileEngine только через публичный API (getOrCreateProfile). Прямой доступ к внутренним структурам — запрещён.

Добавлен принцип P-18 (Single Source of Truth for User State) в Раздел 11.

**Причина:**  
Нарушение AP-07. Дублирование данных ProfileEngine в UserGraph без дополнительной ценности. Единственный источник истины для nutrition данных — ProfileEngine.

---

### C5 — Rewrite P-16

**Было:**  
P-16 в Разделе 11 (v2.0):
```
Coach Brain НИКОГДА не пишет напрямую в ProfileEngine или PlannerEngine.
Единственные авторизованные исходящие операции Coach Brain:
  - UserEngine.updateUserGraph()
  - PlannerEngine.adapt() (через Planner Module, только с явным coaching сигналом)  ← ПРОТИВОРЕЧИЕ
  - VideoScriptEngine.generate()
```

Формулировка "никогда не пишет в PlannerEngine" и одновременно "PlannerEngine.adapt() через Planner Module" — прямое внутреннее противоречие в одном принципе.

**Стало:**  
P-16 полностью переформулирован (Раздел 11):

```
AI Coach Brain существует как отдельный слой поверх Platform Pipeline.
Coach Brain читает из UserGraph и ProfileEngine как потребитель данных.
Coach Brain пишет только в UserGraph через UserEngine (авторизованный API).

Авторизованные исходящие операции:
  1. UserEngine.updateUserGraph()
  2. EventBus.dispatch('coach:plan_adapt', payload)  — ЕДИНСТВЕННЫЙ способ изменить план
  3. VideoProvider.generate(script)

ЗАПРЕЩЕНО: прямой вызов PlannerEngine.adapt() из Coach Brain — без исключений.
Адаптация плана происходит ТОЛЬКО через 'coach:plan_adapt' событие.
```

Каждое утверждение в P-16 теперь детерминировано. Нет исключений. Нет "только с явным сигналом" — есть один конкретный путь.

**Причина:**  
Недетерминированный архитектурный принцип нельзя реализовать корректно. Разработчик трактует исключения произвольно. Принцип должен быть абсолютным или не существовать.

---

### C6 — HeyGen Unit Economics

**Было:**  
Раздел 08 (Premium Strategy) содержал только:
```
"Экономика HeyGen: один скрипт = одна генерация. Кэшировать по hash скрипта."
"Если HeyGen стоит $0.50 за видео — это $17 только на видео."
```

Без анализа реальных цен, break-even расчёта, нагрузки при масштабировании, рисков.

AR-1 определил это как критический риск PR-1: стоимость HeyGen на Premium может превысить revenue.

**Стало:**  
В Раздел 08 добавлен полный подраздел Unit Economics HeyGen:
- Текущие цены HeyGen v2 (Personal vs Enterprise API)
- Расчёт нагрузки на Premium пользователя в месяц (~$2.28 HeyGen/мес)
- Расчёт нагрузки на Pro пользователя (~$4.10 HeyGen/мес)
- Break-even анализ: Premium gross margin ~80%, Pro ~72–80%
- Таблица нагрузки при 1K / 10K / 100K пользователях
- Оптимизации: script caching, text fallback, evening opt-in, pre-generation window
- VideoProvider interface — полный TypeScript интерфейс для абстракции от HeyGen
- Реализации: HeyGenProvider, SynthesiaProvider, D_IDProvider, TextFallbackProvider
- Правило автоматического переключения на TextFallbackProvider
- Таблица Scaling Risks с порогами и митигациями

**Причина:**  
Без unit economics невозможно принять решение о запуске Premium tier. Платная модель без проверки экономики — операционный риск с Фазы 2.

---

### C7 — SyncEngine Status

**Было:**  
SyncEngine упомянут в 3 местах v2.0:
- Раздел 09: "Существующий SyncEngine (`src/lib/sync/`)"
- Раздел 05: "SyncEngine обрабатывает миграцию"
- Раздел 12: "SyncEngine Extension (Фаза 3)"

При этом SyncEngine отсутствовал в списке "Есть в коде" (Раздел 03). Статус — undefined.

**Стало:**  
SyncEngine статус: **Experimental** (чётко определён в Разделе 09).

Введена система статусов компонентов:
- Production: работает, покрыт тестами, используется пользователями
- Experimental: код существует, но не в Production flow
- Future: не реализован, запланирован
- Deprecated: намечен к удалению

SyncEngine = Experimental:
- Код в `src/lib/sync/` существует
- Не часть текущего Production Pipeline (P10–P80)
- Не в списке "Есть в коде" в Разделе 03
- Не в Production до Фазы 3

До Фазы 3: Coach Brain не зависит от SyncEngine. Timezone и preferredMorningTime пишутся в DB напрямую. localStorage — primary storage.

Задача "SyncEngine → Production" вынесена в Acceptance Criteria Фазы 3.

**Причина:**  
Undefined компоненты создают ложные зависимости. Разработчик Фазы 1 мог считать SyncEngine доступным и строить на него зависимости. Явный статус Experimental исключает эту ошибку.

---

## Дополнительные изменения v2.1 (не из C1–C7, но применены)

### Фаза 2 разбита на 2A и 2B
**Было:** Фаза 2 (6–10 недель): Scheduler + Coach Brain Orchestrator — одна фаза.  
**Стало:** 2A (6–8 недель) — Scheduler + Evening UI. 2B (8–12 недель) — Coach Brain + Planner Adapter + P48.  
**Причина:** AR-1 оценил Фазу 2 как нереалистично сжатую. Coach Brain Orchestrator — это 7 модулей, их реализация не укладывается в 4 недели параллельно со Scheduler.

### Premium-gate через PolicyEngine
**Было:** Chat Screen "заблокировано с preview" — решение о показе в UI компоненте.  
**Стало:** Раздел 10 описывает flow: UI запрашивает доступ через EventBus → PolicyEngine → returns allowed/!allowed → UI рендерит. Бизнес-логика в PolicyEngine, не в UI.  
**Причина:** Противоречие 1 из AR-1 — нарушение P-04 (PolicyEngine — единственный слой с бизнес-логикой).

### Internal Consistency Review
**Добавлено:** перед фиксацией v2.1 проведён формальный Consistency Review с таблицей проверок и Ownership Map всех модулей.

### Нумерация нод UserGraph
**Было:** ноды 10–15 с MoodEnergyNode и NutritionContextNode.  
**Стало:** ноды 10–13 (13 итого вместо 15). Нода 12 (MoodEnergyNode) удалена, нода 15 (NutritionContextNode) удалена. Новая нумерация: 10=DailyHistoryNode, 11=HabitTrackingNode, 12=CoachDecisionsNode, 13=MedicalRestrictionsNode.

---

*Changelog составлен: 2026-07-25*  
*Автор: Principal Architect*  
*Следующая версия: v2.2 — после первого Sprint Review Фазы 1 или по CEO directive*
