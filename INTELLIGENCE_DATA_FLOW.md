# Intelligence Data Flow — SolviqLab

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER ACTION                              │
│          Calculator / Quiz / Assessment / Coach Chat             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                       EventBus (P10→P80)                         │
│          solviqlab:result → pipeline stages fire                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      GraphService                                │
│                    (= GraphUpdater)                              │
│                                                                  │
│   updateIdentity()    upsertAssessment()   updateJourney()       │
│   upsertGoal()        appendCoachMemory()  completeStep()        │
│   updatePremium()     saveQuizResult()     updateRetention()     │
│                                                                  │
│   ← ЕДИНСТВЕННАЯ ТОЧКА ЗАПИСИ в UserGraph                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
               ┌─────────────┴──────────────┐
               │                            │
               ▼                            ▼
┌──────────────────────┐      ┌─────────────────────────────────┐
│  localStorage        │      │  Supabase user_graphs           │
│  (immediate, sync)   │─────▶│  (async, 60s interval + hide)  │
│  GraphRepository     │      │  /api/graph/sync POST           │
└──────────────────────┘      └─────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       GraphGateway                               │
│              (единственная точка ЧТЕНИЯ из UserGraph)            │
│                                                                  │
│   .recommendation(slug)  → RecommendationContext                 │
│   .journey()             → JourneyState[]                        │
│   .aiContext()           → AIContext                             │
│   .analytics()           → AnalyticsProjection                  │
└──────┬───────────────┬──────────────────┬────────────────────────┘
       │               │                  │
       ▼               ▼                  ▼
┌────────────┐  ┌────────────┐   ┌─────────────────────┐
│ Recomm-    │  │ Journey    │   │  AIContextBuilder   │
│ endation   │  │ Engine     │   │  (pure data,        │
│ Engine     │  │            │   │   no text)          │
└─────┬──────┘  └─────┬──────┘   └──────────┬──────────┘
      │               │                     │
      └───────────────┴──────────┬──────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   CoachPromptBuilder   │
                    │   AIContext → prompt   │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │        LLM             │
                    │   (DeepSeek / GPT)     │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │       Coach            │
                    │   Mia / Alex / ...     │
                    └────────────────────────┘
```

---

## Правила (нарушение = Pull Request отклоняется)

| # | Правило |
|---|---------|
| 1 | **GraphService** — единственная точка записи в UserGraph |
| 2 | **GraphGateway** — единственная точка чтения из UserGraph для intelligence |
| 3 | `AIContextBuilder` не знает о Coach. Возвращает `AIContext`, не текст |
| 4 | `CoachPromptBuilder` не знает об источнике данных. Получает `AIContext`, возвращает string |
| 5 | Ни один компонент не импортирует `UserEngine` напрямую (кроме самого GraphGateway) |
| 6 | UI state (theme, currency, video_watched) — localStorage. Не в UserGraph |
| 7 | `UserGraph.completedSteps` — только union, никогда не уменьшается |

---

## Стратегия разрешения конфликтов (два устройства)

**Принцип:** Field-level Last-Write-Wins по `updatedAt` каждого node.

```
Телефон:   identity.updatedAt = 10:05  BMI→age=25
Ноутбук:   identity.updatedAt = 10:07  BMI→age=27

Merge → берём ноутбук (10:07 > 10:05)
```

**Для массивов (goals, assessments, facts):** union + deduplicate by `id`.  
**Для completedSteps:** всегда union, удаление запрещено.  
**Для quizResults:** последний результат по `slug` побеждает.

Pull происходит при логине (один раз). Push — каждые 60 сек + при закрытии вкладки.  
Офлайн → онлайн: при восстановлении соединения следующий 60-секундный push отправит накопленные изменения.

---

## Переходный период (Sprint 4A → 4B)

```
Sprint 4A:  GraphGateway читает UserGraph (Supabase)
            GraphGateway.getCompletedSteps() — временно читает UserEngine (Legacy)
            
Sprint 4B:  completedSteps → UserGraph.journey.completedSteps
            UserEngine как источник бизнес-данных удаляется
```
