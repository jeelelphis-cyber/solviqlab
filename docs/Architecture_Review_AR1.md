# Architecture Review AR-1 — Architecture Bible v2.0
## Daily AI Coach Platform — SolviqLab

**Дата:** 2026-07-25  
**Статус:** APPROVE WITH CHANGES  
**Вердикт:** Архитектура правильная по направлению, но требует 7 обязательных изменений до начала реализации  
**Рецензент:** Principal Architect (независимый)  
**Объект ревью:** `/docs/Architecture_Bible_v2.0.md`  
**Источники сравнения:** Core_Architecture_Bible_v1.md, graph/types.ts, planner/engine.ts, session/engine.ts, coach/MIA_BIBLE.md, runtime/platform-pipeline.ts

---

## ЭТАП 1 — PRODUCT REVIEW

### Является ли Mia коучем, а не чат-ботом?

**Вывод: Да, но с оговоркой.**

Документ корректно определяет три критерия AI Coach: ежедневный, персонализированный, накопленная память. Разграничение с Companion (Раздел 01, таблица) точное и принципиально важное. Mia ориентирована на результат, а не на время в приложении.

Что конкретно делает Mia коучем (заложено в архитектуру):
- Decision Rules детерминированы — нет произвольных советов.
- Иерархия сигналов (Safety → DailyHistory → ActivePlan → AssessmentResult → CoachNotes) предотвращает "советы из головы".
- Intervention Engine с 5 уровнями — это поведенческий коучинг, не spam.
- "Немного впереди тебя" реализовано через Pattern Recognition в Habit Engine.

**Оговорка:** Conversation Engine на шаблонах (Free/Premium) — это де-факто чат-бот. Разрыв между обещанием "Mia — коуч" и реализацией шаблонных ответов должен быть явно коммуницирован в продукте. LLM-powered Engine только в Pro tier создаёт несоответствие ожиданий на начальном уровне.

---

### Почему пользователь вернётся на 30-й день?

Документ даёт конкретный ответ: утреннее видео с заданием + вечерний check-in + накопление UserGraph.

**Что есть в документе (убедительно):**
- Ритм как механизм удержания — правильный вывод из поведенческой науки.
- "Уйти = потерять историю" — сильный психологический lock-in через данные, не через технические барьеры.
- Mia на Day 8–30 называет паттерны пользователя — момент "меня изучили" — самый сильный retention механизм.

**Что не доказано в документе:**
- Нет baseline метрики. Раздел 12 даёт цель Retention Day 7 > 35%, но нет данных о текущем Retention Day 1 и Day 7 у продуктов-аналогов в health-niche.
- Нет механизма для пользователей, которые пропустили день и вернулись на Day 30 без streak. Что их удерживает? Документ объясняет удержание через streak и ритм, но не объясняет "возвращение после перерыва".

---

### Почему пользователь будет платить через 6 месяцев?

**Premium экономика (Раздел 08):**
- $19.99/мес — адекватная цена для AI health coaching ниши.
- Психологический lock-in через UserGraph накопление — правильная стратегия.
- 7-day trial с показом Weekly Review на Day 3 — сильный conversion moment.

**Слабое место:** Нет unit economics. Сколько HeyGen генераций в месяц на Premium пользователя? При $19.99 и стоимости HeyGen API + LLM — маржа неизвестна. Для Premium: 30 утренних видео + ~4 intervention видео = 34 генерации/месяц. Если HeyGen стоит $0.50 за видео — это $17 только на видео. Остаётся $2.99 на все остальные расходы. **Это потенциально убыточная модель без анализа.**

---

### Главный measurable outcome продукта

Документ называет правильный ответ в разных местах, но не формулирует его одним предложением.

**Читаемый из контекста:** "Пользователь достиг измеримой цели (вес, сон, и т.д.) за определённый срок с помощью Mia."

**Проблема:** метрика платформы (Core_Architecture_Bible_v1.md) = "завершённость Intent Journey". Документ v2.0 вводит другую метрику — Retention Day 7/30. Эти две метрики не согласованы и могут противоречить друг другу: пользователь может иметь высокий Retention без достижения цели (геймифицированный streak) или достичь цели без высокого Retention (достиг быстро, ушёл).

---

### Недоказанные гипотезы

1. **HeyGen видео создаёт "ощущение реального коуча"** — не проверено A/B тестом. Hypothesis, не факт.
2. **"Ритм важнее глубины сессии"** (Duolingo insight) — применимость к health coaching не доказана. Duolingo = low-stakes learning. Weight loss = высокий personal stakes.
3. **Накопление UserGraph создаёт psychological lock-in** — верная гипотеза для B2B (data gravity), но для B2C health приложений данные переносятся к конкуренту за несколько нажатий.
4. **Шаблонные ответы Conversation Engine на Free = приемлемый UX** — под вопросом. Если Mia выглядит как коуч, но отвечает как бот — доверие разрушается.
5. **Retention Day 7 > 35% достижима в Фазе 3** — без baseline сравнения это число в воздухе.

---

### Продуктовые риски

| # | Риск | Серьёзность |
|---|---|---|
| PR-1 | Стоимость HeyGen на Premium может быть выше revenue | Критическая |
| PR-2 | Разрыв между "Mia — коуч" и шаблонными ответами разрушает доверие | Высокая |
| PR-3 | Пользователь не возвращается после потери streak — документ не решает это | Высокая |
| PR-4 | Quiz онбординг может снизить conversion на Assessment (лишний шаг) | Средняя |
| PR-5 | LLM hallucination в Pro tier при использовании данных из UserGraph | Высокая |
| PR-6 | Конкурент копирует продукт за 3 месяца — retention через data не защищает на старте | Средняя |

---

## ЭТАП 2 — ARCHITECTURE REVIEW

### Противоречия между разделами

**Противоречие 1 — PolicyEngine роль (КРИТИЧЕСКОЕ):**

Core_Architecture_Bible_v1.md (P-04, P-50 в pipeline): PolicyEngine — единственный слой с бизнес-логикой. Только переупорядочивает кандидатов.

Architecture_Bible_v2.0 (Раздел 08, Premium Strategy): логика показа Premium upsell и ограничений функций (Free vs Premium vs Pro) нигде не привязана к PolicyEngine. В Разделе 10 (Frontend): "Chat Screen заблокировано с preview" — это бизнес-решение, реализованное в UI, что нарушает AP-09 и P-04.

Документ v2.0 не уточняет, кто принимает решения о показе Premium-gate: PolicyEngine или UI компонент. Это должно быть явно решено.

**Противоречие 2 — Coach Brain и PlannerEngine.adapt():**

Раздел 03 (Planner Module): Coach Brain вызывает PlannerEngine.adapt() при coaching сигналах (снижение энергии).

platform-pipeline.ts (P47): PlannerEngine.adapt() вызывается через EventBus при 'planner:check_in' событии.

Раздел 11 (новый P-16): "Coach Brain НИКОГДА не пишет напрямую в PlannerEngine."

Итого: три разных источника говорят три разных вещи о том, кто вызывает adapt(). Это архитектурно неопределённое место.

**Противоречие 3 — StorageEngine для UserGraph:**

Раздел 09: для Scheduler нужны timezone + preferredMorningTime в DB. Остальное — localStorage.

Раздел 05 (правила расширения UserGraph): "Migration: при добавлении ноды — версия UserGraph увеличивается. SyncEngine обрабатывает миграцию."

SyncEngine упомянут как "существующий" (`src/lib/sync/`), но в списке "Есть в коде" (Раздел 03) SyncEngine отсутствует. Нет подтверждения, что SyncEngine существует в production.

---

### Дублирование модулей

**Дублирование 1 — CoachEngine (существующий) vs Coach Brain (новый):**

Раздел 03 заявляет: "Coach Brain — набор 10 модулей". Но существующий CoachEngine (src/lib/coach/engine.ts) уже содержит триггеры (13 штук), anti-spam rules, CoachMemory. Раздел 12 говорит: "CoachEngine (13 триггеров) — расширяем, не меняем."

Вопрос: где граница между CoachEngine и Coach Brain Orchestrator? Документ не даёт чёткого ответа. Это создаст путаницу при реализации: разработчик не знает, что добавлять в engine.ts, а что — в brain.ts.

**Дублирование 2 — RetentionNode vs Motivation Engine:**

RetentionNode (graph/types.ts) содержит daysSinceActive, dormancyLevel. Motivation Engine в Разделе 03 описывает MotivationState (high/medium/low/critical). Документ сам признаёт: "RetentionNode — это retention signal, не motivation model." Но оба модуля используют overlapping входные данные и принимают похожие решения об интервенциях.

**Дублирование 3 — DailyHistoryNode.moodRating vs MoodEnergyNode:**

Нода 10 (DailyHistoryNode) содержит moodRating: number | null и energyRating: number | null.
Нода 12 (MoodEnergyNode) содержит mood: number и energy: number.

Одни и те же данные хранятся в двух разных нодах с незначительными различиями (context: 'morning' | 'evening'). Это нарушение принципа Single Source of Truth (AP-07 аналог для Graph).

---

### Циклические зависимости

**Найдена потенциальная циклическая зависимость:**

```
Daily Review Module
    читает → DailyHistoryNode
    → Motivation Engine
        → Intervention Engine
            → Video Script Engine
                → генерирует DailyEntry.tasksAssigned
                    → записывается в DailyHistoryNode
```

Это не строгий цикл (разные временные слои), но если не разграничить явно "данные за сегодня" и "решения на сегодня", реализация запутается.

**Зависимость Coach Brain от PlannerEngine — не цикл, но тревожная связь:**

Coach Brain читает ActivePlan (PlannerEngine output) → принимает решение → вызывает PlannerEngine.adapt(). PlannerEngine не знает о Coach Brain. Это одностороннее использование, но Raздел 11 (P-16) говорит "никогда не пишет в PlannerEngine" — при этом адаптация плана это и есть запись в PlannerEngine. **Формулировка P-16 противоречит самой себе.**

---

### Принцип "Один Engine → много Coach Personas"

Раздел 12 MIA_BIBLE.md (существующий документ) содержит раздел 12 "Future Coaches": Mia, Alex, Emma, Noah — одна UserGraph система, разные persona.

Architecture_Bible_v2.0 **не упоминает этот принцип ни разу.** Coach Brain построен под Mia. Нет секции о том, как Coach Brain масштабируется на других коучей.

**Вывод:** принцип "Один Engine → много Coach Personas" декларирован в MIA_BIBLE.md, но не реализован в архитектуре v2.0. Это нарушение P-12 (Convergence over Divergence). Если сейчас построить Coach Brain специально для Mia/health, через год будет переписывание для Finance Coach.

---

### Совместимость с Pipeline (P10→P80)

Анализ platform-pipeline.ts показывает: Pipeline полностью реализован и работает. P10→P80 последовательность корректна.

**Совместимость v2.0 с Pipeline: ДА, при условии.**

Раздел 09 правильно описывает: "Coach Brain — отдельный слой, читает из UserGraph, использует движки как библиотеки." Новый слой добавляется поверх существующего Pipeline, не внутри.

**Риск:** Scheduler запускает Coach Brain без участия Pipeline. Это значит, что Coach Brain вызывает PlannerEngine.adapt() напрямую, минуя EventBus. Это нарушает P-15 (Event Driven Platform) — "Любой продукт знает только: input → execute() → result → emit()."

Если Coach Brain вызывает adapt() напрямую (не через EventBus), это нарушение P-15. Если через EventBus — нужен новый event type и handler, чего в документе нет.

---

## ЭТАП 3 — DATA ARCHITECTURE

### Анализ UserGraph Extension (Раздел 05)

**Что хранить где (оценка):**

| Нода | Правильность | Замечание |
|---|---|---|
| DailyHistoryNode (10) | Правильно | Rolling 90 дней — разумно. FIFO корректен. |
| HabitTrackingNode (11) | Правильно концептуально | Дублирует moodRating с нодой 10 — см. ниже |
| MoodEnergyNode (12) | ПРОБЛЕМА | Дублирует DailyHistoryNode.moodRating и energyRating |
| CoachDecisionsNode (13) | Правильно | Аудит-trail — важно для debugging |
| MedicalRestrictionsNode (14) | Правильно | Privacy rule верный |
| NutritionContextNode (15) | Сомнительно | Почему отдельная нода если данные уже в ProfileEngine? |

---

### Дублирование данных: DailyHistoryNode vs MoodEnergyNode

DailyHistoryNode.entries[].moodRating (нода 10) и MoodEnergyNode.entries[].mood (нода 12) хранят одно и то же: настроение пользователя за день.

Единственное отличие: MoodEnergyNode добавляет context: 'morning' | 'evening'. Это не требует отдельной ноды — достаточно добавить поле context в DailyHistoryNode.moodRating.

**Нарушение:** AP-07 (Multiple Source of Truth). При рассинхронизации данных (запись в одну ноду не дублируется в другую) Motivation Engine получит противоречивые сигналы.

---

### Нода 15 — NutritionContextNode: избыточность

ProfileEngine уже хранит сигналы от Calorie Calculator (dailyCalorieTarget через solviqlab:result). AssessmentEngine хранит данные в AssessmentsNode. Дублировать nutritionContext в отдельной ноде UserGraph — это нарушение принципа единого источника истины.

**Правильное решение:** NutritionContext читается Coach Brain из ProfileEngine напрямую, не дублируется в UserGraph.

---

### Реалистичность 6 новых нод

| Нода | Оценка MVP необходимости |
|---|---|
| DailyHistoryNode | Критическая. Без неё Daily Coach невозможен |
| HabitTrackingNode | Важная. Но можно начать с DailyHistoryNode.tasksCompleted |
| MoodEnergyNode | Избыточная. Объединить с DailyHistoryNode |
| CoachDecisionsNode | Важная для Фазы 2+. Не Фаза 1 |
| MedicalRestrictionsNode | Критическая по safety. Фаза 1 |
| NutritionContextNode | Избыточная. Удалить, использовать ProfileEngine |

**Рекомендация:** для MVP нужны 2 обязательных ноды (DailyHistoryNode + MedicalRestrictionsNode) + 1 полезная (HabitTrackingNode с объединённым mood). Остальные — Фаза 3.

---

### Performance при 1M пользователей

**Проблема 1 — localStorage лимиты:**

90 дней DailyHistory + 30 дней HabitTracking + 30 дней MoodEnergy + CoachDecisions. Оценочный объём: ~500KB на пользователя в localStorage. localStorage лимит — 5–10MB. При нескольких кластерах (Weight + Sleep) — переполнение реально.

Документ это признаёт ("Rolling windows") и предлагает SyncEngine, но SyncEngine не реализован.

**Проблема 2 — DB запросы Scheduler:**

При 1M пользователей: Scheduler каждые 15 минут запрашивает пользователей с preferred_morning_time в ±15 минут. Это может быть 50K+ запросов за 15 минут если timezone распределение равномерное. Без индекса на (preferred_morning_time, timezone) — full table scan. Документ не упоминает индексирование.

**Проблема 3 — HeyGen на 1M:**

1M Premium пользователей × 1 видео/день = 1M HeyGen генераций в день. HeyGen не позиционируется как enterprise API для такой нагрузки. Нет упоминания rate limits или enterprise соглашения.

---

## ЭТАП 4 — COACH BRAIN REVIEW

### Достаточность 10 модулей

Анализ зависимостей (Раздел 03, схема Зависимостей):

**Лишние модули (или неправильно границы):**

- **Goal Engine** частично дублирует функции PlannerEngine (milestones, progress). Вопрос: зачем отдельный Goal Engine если PlannerEngine.getRecommendedAction() уже это делает?
- **Planner Module** — не модуль, а адаптер. Правильнее назвать его PlannerAdapter и сделать частью Coach Brain Orchestrator, не отдельным модулем.

**Отсутствующие модули:**

- **Context Assembly** упомянут в Разделе 06 как часть принятия решений, но не выделен в Разделе 03 как отдельный модуль. Memory Module + Context Assembly — это разные операции.
- **Delivery Module** — кто отвечает за выбор канала (video/text/push/email)? Раздел 07 описывает правила, но не описывает модуль, который их исполняет.

---

### Детерминированность принятия решений

Раздел 06 правильно описывает принцип: детерминированные Decision Rules + LLM только для body генерации текста.

Иерархия из 5 уровней (Safety → Intervention L3+ → Milestone → Motivation-adjusted → Standard) — корректная и реализуемая.

**Проблема:** Decision Rules в Разделе 06 написаны как псевдокод, но не оформлены как Config-as-Data (нарушение P-02). Если Decision Rules захардкожены в brain.ts, это нарушение P-01 и P-02 — невозможно добавить новый коуч без изменения движка.

**Правильное решение:** Decision Rules должны быть CoachPersonaConfig (как AssessmentConfig), тогда Mia и Alex — это разные конфиги одного Coach Brain.

---

### Что запускается по расписанию / событием / сообщением

| Триггер | Источник | Что запускает |
|---|---|---|
| Время (утро) | Scheduler (Vercel Cron) | Coach Brain → Video Script Engine → HeyGen |
| Время (вечер) | Scheduler | Coach Brain → Evening check-in UI |
| Пользователь сделал check-in | API POST /api/coach/check-in | Daily Review Module → Motivation Engine |
| Пользователь написал в чат | Conversation Engine | LLM/template response |
| PlannerEngine.adapt() | plan:check_in в EventBus (P47) | Coach Brain получает сигнал? |

**Проблема:** P47 в pipeline вызывает PlannerEngine.adapt(). Coach Brain Orchestrator должен знать об этом событии для обновления MotivationState и DailyReview. Но Coach Brain не подключён к EventBus согласно документу. Как Coach Brain узнает о результате adapt()? Не описано.

---

### Граница между Coach Brain и PlannerEngine

Граница нечёткая по трём причинам:

1. PlannerEngine.adapt() принимает бизнес-решение об изменении плана. Coach Brain тоже принимает бизнес-решение о вызове adapt(). Кто финально владеет логикой "когда адаптировать план"?

2. В platform-pipeline.ts (P47): adapt() вызывается при оффтреке (2+ check-ins). В Разделе 06 (Coach Brain): adapt() вызывается при energy_low. Два разных условия, два разных места вызова. Двойное управление одной операцией.

3. Раздел 11 (P-16): "Coach Brain НИКОГДА не пишет напрямую в PlannerEngine" — при этом через Planner Module он вызывает PlannerEngine.adapt(), что и есть запись. Противоречие в формулировке.

**Рекомендация:** определить: PlannerEngine.adapt() вызывается ТОЛЬКО через EventBus ('coach:plan_adapt' event). Coach Brain dispatches событие, Pipeline его обрабатывает. Так сохраняется P-15.

---

## ЭТАП 5 — MVP DEFINITION

### MVP одним предложением через результат

Документ не формулирует MVP одним предложением. Из анализа Фазы 1:

**Читаемый MVP Фазы 1:** "Пользователь, прошедший Assessment, получает персональное Welcome видео с заданием на первый день, выполняет его и видит утром второго дня новое видео с обратной связью на вчерашнее действие."

**Минимальный набор для первого живого пользователя:**
1. Quiz онбординг (3 вопроса → UserGraph.Goals + Preferences)
2. AssessmentEngine (существует)
3. Video Script Engine — Welcome (существует частично)
4. DailyHistoryNode (новое)
5. MedicalRestrictionsNode (новое)
6. Today View экран с заданием дня
7. Manual trigger для утреннего видео (без Scheduler)

Итого: 2 новых ноды + 1 новый движок + 1 новый экран. Это реалистично за 4–6 недель при одном разработчике.

---

### Реалистичность таймлайна (Раздел 12)

| Фаза | Срок в документе | Оценка реалистичности |
|---|---|---|
| Фаза 1 | 4–6 недель | РЕАЛИСТИЧНО если команда фокусирована |
| Фаза 2 | 6–10 недель | СЛОЖНО. Scheduler + Coach Brain Orchestrator — две большие задачи |
| Фаза 3 | 10–16 недель | НЕРЕАЛИСТИЧНО. DB синхронизация + UserVideoQueue + Intervention Engine — слишком много |
| Фаза 4 | 16+ недель | ОТКРЫТЫЙ КОНЕЦ — правильно, но LLM интеграция с контролем галлюцинаций требует дополнительного времени |

**Главная проблема таймлайна:** Фаза 2 включает Coach Brain Orchestrator ("базовый"), но "базовый Coach Brain" — это 7 новых модулей (Memory, Goal, Daily Review, Habit, Motivation, Video Script, Intervention). Даже базовая реализация — это 8–12 недель, не 4.

**Recommendation:** разбить Фазу 2 на 2A (Scheduler + Today View готов) и 2B (Coach Brain Orchestrator + Motivation Engine).

---

## 7 ФИНАЛЬНЫХ ОТВЕТОВ

### 1. Топ-3 сильных решения

**Решение A: Daily Coach как additive слой поверх Platform Pipeline**
Сохранение существующих P10-P80 и строгое добавление Coach Brain как отдельного сервиса — архитектурно зрелое решение. Не переписывает работающую платформу. Снижает risk of regression.

**Решение B: Детерминированные Decision Rules + LLM только для тела**
Чёткое разграничение: правила принятия решений (детерминированные) vs генерация текста (LLM). Это единственный способ сделать коуча надёжным. Полный LLM decision-making = непредсказуемость. Документ это понимает правильно.

**Решение C: Rolling windows в UserGraph (90/30 дней)**
Правильный компромисс между памятью и производительностью для localStorage. Архивирование старых данных в DB — разумная стратегия.

---

### 2. Топ-3 риска через год

**Риск A: Coach Brain не масштабируется на второго коуча (Alex/Finance)**
Если Coach Brain реализован под Mia/Health без CoachPersonaConfig, добавление Alex (Finance) потребует переписывания движка. Это нарушение P-12 и P-01. Через год это будет болезненно.

**Риск B: HeyGen unit economics**
При масштабировании до 10K Premium пользователей стоимость видео-генерации может превысить revenue. Документ не анализирует break-even point. Через год это может стать стоп-фактором роста.

**Риск C: Двойное управление PlannerEngine.adapt()**
Pipeline (P47) и Coach Brain оба управляют adapt(). Через год, когда будет много check-in сценариев, план будет адаптироваться непредсказуемо: два места вызова = два независимых условия активации, которые могут конфликтовать.

---

### 3. Противоречия между разделами

**Противоречие 1:** P-16 ("Coach Brain никогда не пишет в PlannerEngine") vs Planner Module ("адаптирует ActivePlan через PlannerEngine.adapt()"). Формулировка P-16 некорректна.

**Противоречие 2:** PolicyEngine = единственный слой с бизнес-логикой (P-04) vs Premium-gate в UI компонентах (Раздел 10, Chat Screen заблокирован). Кто принимает решение о блокировке — PolicyEngine или UI?

**Противоречие 3:** SyncEngine упомянут как "существующий" (Разделы 09, 05), но не включён в список "Есть в коде" (Раздел 03). Не ясно, реализован ли SyncEngine в production.

**Противоречие 4:** DailyHistoryNode.moodRating (нода 10) дублирует MoodEnergyNode.mood (нода 12). Два источника правды для одних данных.

**Противоречие 5:** platform-pipeline.ts (P47) вызывает PlannerEngine.adapt() по check-in. Coach Brain (Раздел 06) вызывает adapt() по energy_low. Нет координации двух путей активации.

---

### 4. Нарушения принципов масштабируемой архитектуры

**Нарушение N1: Coach Brain не Config-as-Data (нарушение P-02)**
Decision Rules в Разделе 06 — это бизнес-логика в коде, не в конфиге. При добавлении нового коуча нужно менять движок. Это нарушение P-01 и P-02.

**Нарушение N2: Coach Brain вызывает adapt() напрямую, минуя EventBus (нарушение P-15)**
Если Coach Brain orchestrates PlannerEngine.adapt() через прямой вызов, а не через событие в EventBus, нарушается P-15 (Event Driven Platform). Все изменения состояния должны идти через EventBus.

**Нарушение N3: NutritionContextNode — дублирование данных (аналог AP-07)**
Данные из ProfileEngine дублируются в UserGraph. Единственный источник истины для nutrition данных — ProfileEngine, не UserGraph.

**Нарушение N4: DailyHistoryNode.moodRating + MoodEnergyNode — два источника одних данных (аналог AP-07)**
При росте до 1M пользователей рассинхронизация этих нод создаст corrupted data в Motivation Engine.

**Нарушение N5: Scheduler не индексированные запросы (production risk)**
Без явного упоминания индексов на preferred_morning_time + timezone в DB, Scheduler на 1M пользователях будет работать некорректно.

---

### 5. Обязательные изменения ДО начала реализации

**ИЗМЕНЕНИЕ 1 (Критическое): Ввести CoachPersonaConfig**

Coach Brain должен читать коуч-специфичную логику из конфига, не из хардкода.

```typescript
interface CoachPersonaConfig {
  coachId: 'mia' | 'alex' | 'emma' | 'noah'
  cluster: IntentCluster | 'finance' | 'career' | 'productivity'
  personality: CoachPersonality
  decisionRules: CoachDecisionRule[]   // Config-as-Data, как AssessmentConfig
  toneByPhase: Record<CoachPhase, ToneConfig>
  videoTemplates: Record<ScriptType, VideoTemplate>
}
```

Это позволит добавить Finance Coach как конфиг, а не новый движок. (P-01, P-02, P-12)

**ИЗМЕНЕНИЕ 2 (Критическое): Решить противоречие PlannerEngine.adapt()**

Выбрать ONE path:
- ВАРИАНТ A: adapt() вызывается ТОЛЬКО через EventBus ('coach:plan_adapt'). Coach Brain dispatches событие. P47 и Coach Brain оба слушают эти события. (Соответствует P-15)
- ВАРИАНТ B: adapt() вызывается только Coach Brain. P47 убирается из Pipeline. PlannerEngine перестаёт быть частью Pipeline. (Упрощение, но изменение архитектуры)

Сейчас оба пути работают параллельно — это баг, не фича.

**ИЗМЕНЕНИЕ 3 (Критическое): Объединить MoodEnergyNode с DailyHistoryNode**

Убрать отдельную ноду 12. Добавить context: 'morning' | 'evening' в DailyHistoryNode.moodRating.

```typescript
interface DailyEntry {
  // ... existing ...
  readonly moodRating:    { value: number | null; context: 'morning' | 'evening' | null }
  readonly energyRating:  { value: number | null; context: 'morning' | 'evening' | null }
}
```

**ИЗМЕНЕНИЕ 4 (Важное): Удалить NutritionContextNode**

Данные питания хранятся в ProfileEngine. Coach Brain читает ProfileEngine. Не дублировать.

**ИЗМЕНЕНИЕ 5 (Важное): Уточнить P-16**

Переформулировать с "никогда не пишет в PlannerEngine" на:
"Coach Brain управляет планом только через единственный авторизованный channel: dispatching 'coach:plan_adapt' event в EventBus. Прямой вызов PlannerEngine.adapt() из Coach Brain запрещён."

**ИЗМЕНЕНИЕ 6 (Важное): Добавить анализ unit economics HeyGen**

До начала Фазы 1: подсчитать break-even при текущих ценах HeyGen API. Если стоимость 1 видео > $0.30, Premium экономика под угрозой. Возможные решения: script caching (упомянут), но не проанализирован полностью.

**ИЗМЕНЕНИЕ 7 (Важное): Указать, реализован ли SyncEngine**

Если SyncEngine не реализован — это зависимость Фазы 3, которую нужно вынести в отдельную задачу. Если реализован — добавить в список "Есть в коде" (Раздел 03).

---

### 6. Может ли архитектура поддерживать 1 млн пользователей без смены концепции?

**Ответ: ДА, но с тремя обязательными условиями.**

Условие 1: **DB индексы на Scheduler** — без них система не работает при 100K+ пользователей.

Условие 2: **HeyGen alternatives или caching стратегия** — нужен план B если HeyGen не выдерживает нагрузку или цены растут. Script caching по hash (упомянут в Разделе 08) — правильная мера, но недостаточная сама по себе.

Условие 3: **CoachPersonaConfig** — без этого при масштабировании на несколько доменов (Health, Finance, Career) будет 3 разных Coach Brain архитектуры вместо одной. Конвергенция обязательна.

Концептуально: additive слой поверх Pipeline, Config-as-Data, EventBus — всё это масштабируется. Проблемы технические, не концептуальные.

---

### 7. ИТОГОВЫЙ ВЕРДИКТ

## APPROVE WITH CHANGES

**Обоснование:**

Architecture Bible v2.0 демонстрирует зрелое архитектурное мышление по нескольким важным параметрам:
- Правильное понимание "что такое AI Coach" против "чат-бот".
- Чёткое разграничение детерминированных решений и LLM генерации.
- Additive подход к миграции — не переписывает работающее.
- Правильная иерархия Safety сигналов.
- Психологически обоснованная стратегия удержания.

**Причины отказа от APPROVE:**

Документ содержит 5 критических нарушений принципов, уже закреплённых в Core_Architecture_Bible_v1.md:
1. Coach Brain не Config-as-Data (нарушение P-02).
2. Двойное управление PlannerEngine.adapt() (нарушение P-15).
3. Дублирование данных в двух Graph нодах (аналог AP-07).
4. Неопределённость SyncEngine статуса.
5. Отсутствие анализа unit economics.

**Причины отказа от REJECT:**

Направление верное. Концептуальные решения (Daily Coach слой, UserGraph extension, детерминированные rules, additive migration) правильные и реализуемы. Проблемы — в деталях реализации, не в фундаменте.

**После внесения 7 обязательных изменений — документ готов к переходу в Sprint Spec.**

---

## СПИСОК ОБЯЗАТЕЛЬНЫХ ИЗМЕНЕНИЙ

| # | Изменение | Приоритет | Срок |
|---|---|---|---|
| C1 | Ввести CoachPersonaConfig — Config-as-Data для Decision Rules | Критический | До начала Фазы 1 |
| C2 | Решить противоречие двух путей вызова PlannerEngine.adapt() | Критический | До начала Фазы 1 |
| C3 | Объединить MoodEnergyNode с DailyHistoryNode | Критический | До начала Фазы 1 |
| C4 | Удалить NutritionContextNode из UserGraph | Важный | До начала Фазы 1 |
| C5 | Переформулировать P-16 без внутреннего противоречия | Важный | До начала Фазы 1 |
| C6 | Добавить анализ HeyGen unit economics в документ | Важный | До конца Фазы 1 |
| C7 | Прояснить статус SyncEngine (реализован / нет) | Важный | До начала Фазы 3 |

---

## ДОПОЛНИТЕЛЬНЫЕ НАБЛЮДЕНИЯ

**Положительная находка:** platform-pipeline.ts уже содержит P25 (CalculatorGraphSync.storeMiaFact) — это правильный шаг в направлении Coach Brain. Mia Fact уже пишется в UserGraph.coachMemory при каждом calculator result. Это нужно использовать в Memory Module.

**Положительная находка:** PlannerEngine.getRecommendedAction() уже реализован и возвращает action + urgency. Coach Brain может использовать это как готовый signal, не строить его с нуля.

**Находка для оптимизации:** SessionFlowEngine.advance() возвращает следующий state — это может быть основой для Today View state machine. Не нужно строить с нуля.

---

*Документ составлен: 2026-07-25*  
*Статус: FINAL*  
*Principal Architect — независимый рецензент*  
*Следующее действие: Автор Architecture Bible v2.0 вносит C1–C7 и создаёт Architecture Bible v2.1 для повторного review*
