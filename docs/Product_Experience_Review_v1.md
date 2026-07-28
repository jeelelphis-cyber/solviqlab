# Product Experience Review v1.0
*SolviqLab — Code-Level UX Audit*

*Status: First review. All V4 work reviewed against Journey UX Bible v1.0*
*Reviewed by: Claude (Product Director direction)*
*Date: 2026-07-23*

---

## Methodology

Каждый экран проверен по коду против Journey UX Bible v1.0 по 8 измерениям:
Copy · CTA · Visual Hierarchy · Typography · Motion · Mobile · Accessibility · Empty/Loading/Error States

Вердикты: ✅ Отлично · ⚠️ Нужна доработка · ❌ Критично — блокирует хороший UX

---

## Screen 1 — Calculator + JourneyExperience

### ✅ Отлично

| Что | Почему |
|-----|--------|
| CTA copy | "Continue My Journey" / "Start My Assessment" / "Build My Plan" — строго по формуле |
| Progress | "You're 33% closer to your personal plan." — не "Step N of M" ✅ UX Bible Part III |
| Why-this | `buildWhyThis()` использует реальные данные из IntentState |
| Hero hierarchy | 22px/700 hero + 14px/400 sub — строго по Typography Scale |
| Dark mode | Полная поддержка |
| Entry animation | `fade-in slide-in-from-bottom-2 duration-500` |

### ⚠️ Нужна доработка

| # | Что | UX Bible | Приоритет |
|---|-----|----------|-----------|
| 1 | Progress bar заполнение: `transition-all duration-600` без `delay`. Сегменты должны заполняться staggered (80ms per segment, delay 500ms после entry animation) | Part VI — Entry Animation sequence | Medium |
| 2 | `JourneyProgress.tsx` использует `duration-600` — это не валидный Tailwind класс. Нужно `duration-[600ms]` или стандартный `duration-500`. Анимация сейчас не работает | Part VI | High |
| 3 | JourneyCard не имеет `role` атрибута — screen reader не понимает структуру | Part IX | Low |

### ✅ Вердикт: Хороший экран. Один технический баг с анимацией (критичный для эффекта).

---

## Screen 2 — Assessment (AssessmentClient.tsx)

### ✅ Отлично

| Что | Почему |
|-----|--------|
| InsightChip | Цветовое кодирование по типу (achievement/warning/opportunity) |
| DimensionBar | `transition-all duration-500`, цвет по score — чёткая иерархия |
| ScoreBadge | Крупный, заметный. Главный результат — первое что видит пользователь |
| Profile type block | Персональный профиль ("Metabolically Slow") — чувство "это про меня" |

### ❌ Критично

| # | Что | Проблема | UX Bible |
|---|-----|----------|----------|
| **A** | **Running state** | `<div className="animate-spin text-4xl">⚙️</div>` — ЗАПРЕЩЕНО. Spinning loaders > 1s убивают ощущение скорости | Part VI: "Forbidden: Spinning loaders that last > 1s" |
| **B** | **GateScreen copy** | "Assessment not ready yet" — холодно, не companion tone. Ощущение "ты не готов" вместо "давай дополним профиль" | Part II Phase 1: "Warm acknowledgment → gentle forward momentum" |
| **C** | **GateScreen CTA links** | Slug как текст кнопки: `slug.replace(/-/g, ' ')` — не по формуле. "Bmi Calculator" вместо "Add BMI" | Part IV: "[Action verb] + [Personal benefit]" |
| **D** | **ResultScreen CTA** | Берёт `result.narrative.cta_label` из конфига напрямую — строка не прошла через UX Bible | Part IV: All CTAs must follow formula |
| **E** | **ResultScreen secondary CTA** | "View my dashboard →" — plain text link без достаточного tap target | Part VIII: min 44px height |

### ⚠️ Нужна доработка

| # | Что | Проблема | Приоритет |
|---|-----|----------|-----------|
| 6 | GapQuestionsForm submit: "Run My Assessment →" — допустимо, но нет personal benefit | Medium |
| 7 | GapQuestionsForm option buttons: нет `role="radio"`, нет `aria-checked` — не accessible | Medium |
| 8 | ResultScreen: 2 CTA одного визуального веса. Вторичный должен быть в 2× меньше | High |
| 9 | Copy strings захардкожены в JSX (`<h2>A couple of quick questions</h2>`) — не в constants | Low |
| 10 | Loading state: две одинаковых `animate-pulse h-64` — нет разницы между "ещё не готово" и "считается" | Medium |

### ✅ Вердикт: Сильный результат (DimensionBar, ScoreBadge). Два критических блокера: spinning animation и Gate copy.

---

## Screen 3 — Plan (PlannerClient → GoalInputForm → ActivePlanView)

### Sub-screen 3A: NoPlanState

### ❌ Критично

| # | Что | Проблема | UX Bible |
|---|-----|----------|----------|
| **F** | **Copy tone** | "Complete your Weight Loss Assessment first." — императив, не companion. Чувство задания, не приглашения | Part II Phase 1: "Wrong: 'Complete assessment to continue'" |
| **G** | **CTA copy** | "Start Weight Loss Assessment →" — нет personal benefit | Part IV formula |

### ⚠️ Нужна доработка

| # | Что | Проблема | Приоритет |
|---|-----|----------|-----------|
| 11 | `text-5xl` emoji 🎯 — слишком large, ощущение "childish tool" | Medium |
| 12 | Нет Why-now hook перед CTA | High |

---

### Sub-screen 3B: GoalInputForm

### ✅ Отлично

| Что | Почему |
|-----|--------|
| Strategy banner | Показывает выбранную стратегию — пользователь видит что план персонален |
| CTA "Build My Plan →" | Полное соответствие UX Bible формуле ✅ |
| Form validation | Ясные error messages |

### ❌ Критично

| # | Что | Проблема | UX Bible |
|---|-----|----------|----------|
| **H** | **No suggested value** | Пользователь видит пустое поле `placeholder: 'e.g. 74'`. UX Bible: "Based on your profile, a realistic target is 74 kg. Does that feel right?" | Part II Phase 3: "Wrong: 'Enter your goal weight.' Right: 'Based on your profile, a realistic target is 74 kg. Does that feel right?'" |

### ⚠️ Нужна доработка

| # | Что | Проблема | Приоритет |
|---|-----|----------|-----------|
| 13 | `config.hint` — generic text, не использует данные из assessment | Medium |
| 14 | Нет предложения от системы — только ввод | High |

---

### Sub-screen 3C: ActivePlanView

### ✅ Отлично

| Что | Почему |
|-----|--------|
| Progress % | `{progressPercent}%` крупно — пользователь сразу видит прогресс |
| Milestone timeline | Чёткая структура, визуально отличаются completed / next / future |
| Check-in history | Последние 5 записей, reversed — правильный порядок |
| Dark mode | Полная поддержка |

### ❌ Критично

| # | Что | Проблема | UX Bible |
|---|-----|----------|----------|
| **I** | **CompletedState copy** | "Goal Achieved! You completed your [plan.goal]" — пустое. UX Bible прямо: "Wrong: 'Goal achieved.' Right: 'You did it. That took discipline. Ready to explore what's next?'" | Part II Phase 5 |
| **J** | **CompletedState CTA** | "View Dashboard →" — нет action verb + benefit formula | Part IV |

### ⚠️ Нужна доработка

| # | Что | Проблема | Приоритет |
|---|-----|----------|-----------|
| 15 | Check-in trigger CTA: "Check In" → должно быть "Log My Check-In" | High |
| 16 | Check-in trigger copy: "Record your progress so your plan can adapt." — generic. Добавить неделю и контекст | Medium |
| 17 | Milestone emoji ✅ 🎯 ○ без `aria-hidden` — screen reader читает "checkmark emoji" | Medium |
| 18 | Check-in history emoji ✅ ⚠️ без `aria-hidden` | Medium |
| 19 | `plan.cluster === 'weight' ? 'kg' : ''` — хардкод в JSX, не через config | Low |

---

## Screen 4 — Dashboard (JourneyDashboard — только что написан)

### ✅ Отлично

| Что | Почему |
|-----|--------|
| `DashboardNextAction` | Синий блок с белой CTA — самый заметный элемент страницы |
| `selectPrimaryCluster()` | Выбирает кластер по phase × count — правильная логика |
| Empty state | Ведёт на BMI Calculator — правильный entry point |
| Loading skeleton | 3 pulse блока пока данные грузятся |
| "Other Journeys" | Cross-cluster links для мульти-кластерных пользователей |
| Coach Insight с типами | success / focus / info с разными цветами |

### ⚠️ Нужна доработка

| # | Что | Проблема | Приоритет |
|---|-----|----------|-----------|
| 20 | `greeting()` и `heroSubStatement()` используют `new Date()` на сервере: SSG страница. Нужен `useEffect` + `useState` для времени | High (hydration error risk) |
| 21 | "Other Journeys" cluster names: `capitalize` → "weight journey" вместо "Weight Journey" — CSS capitalize работает только для первой буквы | Medium |
| 22 | `DashboardAchievements`: `formatDate` использует `new Date()` без locale → разные форматы на разных устройствах | Low |
| 23 | `DashboardActivePlan` прогресс-бар: `Math.max(pct, 4)` — min 4% width для нулевого прогресса. Визуально вводит в заблуждение | Medium |

---

## Cross-Screen Observations

### Mobile / Touch Targets

| Screen | Элемент | Статус |
|--------|---------|--------|
| JourneyExperience | CTA кнопка: `min-h-[44px]` ✅ | ✅ |
| AssessmentClient | GapQuestionsForm options: `py-3` (~48px) ✅ | ✅ |
| AssessmentClient | ResultScreen secondary "View dashboard": plain `<a>` без height | ❌ |
| ActivePlanView | "Check In" button: `py-2` (~32px) | ❌ |
| NoPlanState | CTA: `py-3 px-8` inline-block (~48px) ✅ | ✅ |

### Dark Mode

Все экраны имеют `dark:` классы. ✅

### Copy Centralization

| Компонент | Copy в JSX | Нарушение |
|-----------|-----------|-----------|
| JourneyExperience | 0 — всё в journey-copy.ts | ✅ |
| AssessmentClient | Много хардкода | ❌ |
| PlannerClient | CLUSTER_LABELS, NoPlanState text | ❌ |
| ActivePlanView | Check-in text, history labels | ❌ |
| GoalInputForm | CLUSTER_CONFIG.hint | ⚠️ |

### Animation

| Что | Статус |
|-----|--------|
| JourneyExperience entry | `fade-in slide-in-from-bottom-2 duration-500` ✅ |
| JourneyProgress bar | `duration-600` невалидный класс ❌ |
| DimensionBar | `duration-500` ✅ |
| AssessmentClient running | `animate-spin` на emoji — FORBIDDEN ❌ |
| ActivePlanView progress | `duration-500` ✅ |

---

## Priority Matrix — Что исправить первым

### 🔴 P0 — Блокирует UX (исправить до любого запуска)

| # | Экран | Проблема |
|---|-------|----------|
| A | Assessment | `animate-spin` на running state |
| B | Assessment | GateScreen: cold copy "Assessment not ready yet" |
| H | GoalInputForm | Нет suggested value из assessment данных |
| I | Plan/Completed | "Goal Achieved!" — пустое торжество |
| 2 | JourneyExperience | `duration-600` невалидный Tailwind класс |

### 🟡 P1 — Ухудшает опыт (исправить в V4-2.5)

| # | Экран | Проблема |
|---|-------|----------|
| C | Assessment | GateScreen CTA links: slug names вместо формулы |
| D | Assessment | ResultScreen CTA: raw cta_label из конфига |
| E | Assessment | Secondary CTA без 44px tap target |
| F | Plan/No Plan | Imperative copy "Complete first" |
| G | Plan/No Plan | CTA без personal benefit |
| J | Plan/Completed | "View Dashboard →" без formula |
| 8 | Assessment | 2 CTAs одного веса |
| 15 | ActivePlanView | "Check In" → "Log My Check-In" |
| 20 | Dashboard | `greeting()` с `new Date()` в SSG — hydration risk |

### 🟢 P2 — Полировка (после P1)

| # | Экран | Проблема |
|---|-------|----------|
| 1 | JourneyExperience | Progress bar stagger animation delay |
| 6 | Assessment | GapQuestionsForm submit copy |
| 7 | Assessment | aria-checked на option buttons |
| 11 | Plan/NoPlan | 5xl emoji — слишком large |
| 17-18 | ActivePlanView | emoji без aria-hidden |
| 16 | ActivePlanView | Check-in trigger copy generic |
| 21-23 | Dashboard | Мелкие copy/display bugs |

---

## Итоговая оценка по экранам

| Экран | Оценка | Главная проблема |
|-------|--------|-----------------|
| Calculator + JourneyExperience | **8/10** | Один технический баг с анимацией |
| Assessment | **5/10** | Spinning animation, Gate copy, ResultScreen CTA |
| Plan / GoalInput | **6/10** | Нет suggested value, NoPlan copy |
| Plan / ActivePlan | **7/10** | Completed copy, check-in button copy |
| Dashboard | **7/10** | hydration risk, новый компонент |

**Общая оценка Product Experience: 6.5/10**

Фундамент сильный. Критические проблемы локализованы в 3 местах: Assessment running state, Gate copy, GoalInputForm no suggestion. Они решаются за 1 спринт.

---

## Следующий шаг

Исправить все P0 и P1 дефекты (10 fixes) — это и есть настоящий V4-2.5.

После этого Product Experience поднимается до **8.5/10** и можно переходить к Dashboard.

---

*Этот документ — результат code-level аудита против Journey UX Bible v1.0.*
*Следующий review — после исправления P0/P1 и первого пользовательского теста.*
