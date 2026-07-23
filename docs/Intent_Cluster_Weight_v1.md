# Intent Cluster: Weight Management
### Version 1.0 — Gold Standard Blueprint
*SolviqLab Product Architecture · 2026-07-20*

---

> **Статус:** Эталонный документ.
> После утверждения — Sleep, Pregnancy, Finance, Nutrition, Fitness, Mental Health
> строятся по абсолютно идентичной архитектуре.

---

## 0. Что такое Intent Cluster

Intent Cluster — это не набор калькуляторов.

Это полная продуктовая вертикаль вокруг **одного намерения пользователя**.

Пользователь приходит не за "BMI калькулятором".
Он приходит с вопросом: **"Что мне делать со своим весом?"**

Все инструменты, продукты и переходы внутри кластера
обслуживают это одно намерение — от первого касания до привычки.

---

## 1. Существующие инструменты (что уже есть)

Реальные данные из `src/instruments/` и `src/lib/profile/domains.ts`:

| Инструмент | Slug | Domains | Conf. contribution |
|---|---|---|---|
| BMI Calculator | `bmi-calculator` | weight (30%), fitness (15%) | 45% total |
| Body Fat Calculator | `body-fat-calculator` | fitness (55%) | 55% total |
| BMR Calculator | `bmr-calculator` | metabolism (45%) | 45% total |
| TDEE Calculator | `tdee-calculator` | metabolism (55%), nutrition (25%), lifestyle (20%) | 100% total |
| Calorie Calculator | `calorie-calculator` | nutrition (35%) | 35% total |
| Calorie Deficit Calculator | `calorie-deficit-calculator` | nutrition (30%), weight (20%) | 50% total |
| Ideal Weight Calculator | `ideal-weight-calculator` | weight (20%) | 20% total |

**Итого: 7 инструментов** — самый насыщенный кластер на платформе.

### Существующие Journey

Из `src/lib/journey/config.ts`:

**Health Journey** (`health`): BMI → Calorie → TDEE → BMR → Body Fat → Ideal Weight

**Weight Management** (`weight-management`): BMI → Calorie Deficit → TDEE → Ideal Weight → Body Fat

**Проблема:** оба Journey конкурируют за одного пользователя, частично дублируют шаги,
и ни один не приводит к конкретному **плану действий**.

Пользователь получает числа — но не получает ответа на вопрос "что мне делать дальше?"

---

## 2. Отсутствующие продукты (что нужно построить)

Анализ Product Gap относительно полного намерения пользователя:

### Gap 1 — Body Shape Assessment (Skviz)

**Что делает:** Интерпретирует совокупность BMI + Body Fat + Ideal Weight в
один понятный вывод о типе телосложения и риск-профиле.

**Почему отсутствует это критично:** Пользователь сейчас получает три отдельных числа
и вынужден сам их интерпретировать. Это когнитивная нагрузка, которая убивает конверсию.

**Формат:** Не калькулятор. Это интерактивный Assessment с визуальным результатом.

---

### Gap 2 — Metabolism Assessment

**Что делает:** Сравнивает BMR + TDEE + возраст + активность с популяционными нормами.
Дает вывод: "Ваш метаболизм медленный / нормальный / быстрый для вашего профиля."

**Почему отсутствует это критично:** BMR и TDEE — сухие числа.
Пользователь не знает: "3 200 ккал TDEE — это много или мало для меня?"
Assessment дает контекст.

---

### Gap 3 — Weight Loss Planner

**Что делает:** Принимает целевой вес + текущие данные (BMI, TDEE, Deficit) →
строит конкретный план: сколько недель, сколько ккал в день, какой темп.

**Почему отсутствует это критично:** Сейчас Calorie Deficit Calculator дает одно число.
Плanner превращает это число в timeline с контрольными точками.

---

### Gap 4 — Meal Planner (Продукт V2)

**Что делает:** На основе TDEE + цели (дефицит / поддержание / набор)
предлагает распределение БЖУ и примерные шаблоны питания.

**Приоритет:** Wave 2. Требует контентных данных.

---

### Gap 5 — Habit Checklist

**Что делает:** 7 ежедневных привычек, напрямую влияющих на вес:
вода, шаги, сон, белок, овощи, тренировки, взвешивание.
Пользователь отмечает выполненные — система видит паттерны.

**Почему важно:** Переводит пользователя из "знаю" в "делаю".
Это первый продукт, который создает **ежедневный возврат**.

**Приоритет:** Wave 2. Требует persistence layer.

---

### Gap 6 — Progress Tracker

**Что делает:** Пользователь вводит вес раз в неделю.
Система строит график прогресса vs. план из Weight Loss Planner.
Показывает: опережаете / по плану / отстаете.

**Почему важно:** Единственный продукт, который делает SolviqLab
**daily active product** вместо one-time utility.

**Приоритет:** Wave 2. Нужна авторизация и хранение данных.

---

### Gap 7 — AI Coach

**Что делает:** Получает PersonalHealthProfile (домены weight + nutrition + metabolism + fitness),
показывает пробелы, противоречия, и отвечает на вопросы пользователя
в контексте его реального профиля.

**Приоритет:** V3-08 (следующий sprint).
ProfileEngine уже готовит данные для этого продукта.

---

## 3. Полная Product Journey

### Принцип проектирования

Каждый переход обоснован одним вопросом:
**"Какой вопрос у пользователя прямо сейчас — после получения этого результата?"**

Переходы — это не функции продукта. Это психология момента.

---

```
[SEO Entry]
    │
    ├─── "bmi calculator" ─────────────────────── [BMI Calculator]
    │                                                     │
    ├─── "body fat percentage" ────────────── [Body Fat Calculator]
    │                                                     │
    ├─── "how many calories to lose weight" ── [Calorie Deficit]
    │                                                     │
    └─── "ideal weight for my height" ───── [Ideal Weight Calc]
                                                          │
                                           ┌──────────────┘
                                           ▼
                                   [BMI Calculator]
                                           │
                           ┌───────────────▼───────────────┐
                           │     Profile: weight domain     │
                           │     +30% confidence            │
                           │     Event: BMI_CALCULATED       │
                           └───────────────┬───────────────┘
                                           │
                              Recommendation Engine
                              Score: 85/100 → Body Fat
                                           │
                                           ▼
                               [Body Fat Calculator]
                                           │
                           ┌───────────────▼───────────────┐
                           │     Profile: fitness domain    │
                           │     +55% confidence            │
                           │     Event: BODY_FAT_CALCULATED  │
                           └───────────────┬───────────────┘
                                           │
                              Recommendation Engine
                              Score: 82/100 → BMR
                                           │
                                           ▼
                               [BMR Calculator]
                                           │
                           ┌───────────────▼───────────────┐
                           │   Profile: metabolism domain   │
                           │   +45% confidence              │
                           │   Event: BMR_CALCULATED         │
                           └───────────────┬───────────────┘
                                           │
                              Recommendation Engine
                              Score: 78/100 → TDEE
                                           │
                                           ▼
                               [TDEE Calculator]
                                           │
                           ┌───────────────▼───────────────┐
                           │  Profile: metabolism+nutrition │
                           │  +100% confidence total        │
                           │  Event: TDEE_CALCULATED         │
                           └───────────────┬───────────────┘
                                           │
                              Recommendation Engine
                              Score: 90/100 → Body Shape Assessment
                         [UNLOCK: 3 instruments complete]
                                           │
                                           ▼
                          ★ [Body Shape Assessment] ★        ← NEW PRODUCT
                                           │
                           ┌───────────────▼───────────────┐
                           │  Synthesizes: BMI + Body Fat  │
                           │  + BMR + TDEE → Risk Profile  │
                           │  Event: ASSESSMENT_COMPLETED   │
                           └───────────────┬───────────────┘
                                           │
                              Recommendation Engine
                              Score: 88/100 → Weight Loss Planner
                                           │
                                           ▼
                           ★ [Weight Loss Planner] ★         ← NEW PRODUCT
                                           │
                           ┌───────────────▼───────────────┐
                           │  Input: target weight + TDEE  │
                           │  Output: week-by-week plan     │
                           │  Event: PLAN_CREATED           │
                           └───────────────┬───────────────┘
                                           │
                              Recommendation Engine
                              Score: 85/100 → Ideal Weight
                                           │
                                           ▼
                             [Ideal Weight Calculator]
                                           │
                           ┌───────────────▼───────────────┐
                           │  Profile: weight domain        │
                           │  +20% confidence               │
                           │  Contradictions: checked       │
                           └───────────────┬───────────────┘
                                           │
                         [Registration Trigger: ≥5 results]
                                           │
                                           ▼
                              ★ [Registration] ★
                           "Save Your Weight Profile"
                                           │
                                           ▼
                               [Dashboard] ← weight domain
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                        Habit Checklist  Progress   AI Coach
                        (Wave 2)         Tracker    (V3-08)
                                         (Wave 2)
```

---

## 4. Психология каждого перехода

### Переход 1: BMI → Body Fat

**Момент:** Пользователь видит своё число BMI.
Например: 26.2 — "Overweight".

**Психологический вопрос прямо сейчас:**
*"Но я же занимаюсь спортом. Это реально жир или мышцы?"*

BMI не различает жир и мышцы. Это самое распространенное возражение к BMI.

**Рекомендация системы:** Body Fat Calculator.

**Почему это работает:** Система не говорит "ваш BMI плохой".
Система говорит: "BMI — первый ответ. Body Fat — точный ответ."

---

### Переход 2: Body Fat → BMR

**Момент:** Пользователь знает: 22% body fat.

**Психологический вопрос прямо сейчас:**
*"Хорошо, но почему именно столько? Это мой метаболизм?"*

Первый раз в Journey появляется слово "метаболизм".
Это самообъяснение результата.

**Рекомендация системы:** BMR Calculator.

**Почему это работает:** BMR дает механистическое объяснение.
"Ваш организм сжигает 1680 ккал в покое — это ваш двигатель."

---

### Переход 3: BMR → TDEE

**Момент:** Пользователь знает свой базовый метаболизм.

**Психологический вопрос прямо сейчас:**
*"Окей, 1680 ккал в покое. Но я же двигаюсь. Сколько мне реально нужно?"*

BMR — это мотор в нейтральном режиме.
TDEE — это реальный расход с учетом жизни.

**Рекомендация системы:** TDEE Calculator.

**Почему это работает:** Это логическое завершение метаболической картины.
После TDEE пользователь впервые имеет **полный энергетический профиль**.

---

### Переход 4: TDEE → Body Shape Assessment ★

**Момент:** Пользователь завершил 3-4 инструмента.
У него есть: BMI, Body Fat %, BMR, TDEE.

**Психологический вопрос прямо сейчас:**
*"Я посчитал много цифр. Что это всё вместе означает про меня?"*

Это момент **когнитивного перегруза**.
Пользователь не хочет ещё один калькулятор.
Он хочет **синтез**.

**Рекомендация системы:** Body Shape Assessment — первый продукт-синтез в кластере.

**Почему это критический момент:**
Без Assessment пользователь бросает Journey, имея данные но не имея вывода.
С Assessment — он получает нарратив: "Вы — эктоморф с нормальным метаболизмом и
небольшим избытком висцерального жира. Вот что это значит для вас."

Это момент, когда продукт переходит от **инструментов** к **пониманию**.

---

### Переход 5: Body Shape Assessment → Weight Loss Planner ★

**Момент:** Пользователь получил свой профиль.
"У вас нормальный метаболизм. Для вашей цели (-8 кг) нужен дефицит 500 ккал/день."

**Психологический вопрос прямо сейчас:**
*"Хорошо, я понимаю. Но как именно? Дайте мне план."*

Это переход от понимания к **действию**.

**Рекомендация системы:** Weight Loss Planner.

**Почему это работает:** Assessment создал мотивацию.
Planner конвертирует мотивацию в структуру.
Пользователь выходит с конкретным планом: "12 недель, -667 г/неделю, 1 750 ккал/день."

---

### Переход 6: Weight Loss Planner → Ideal Weight

**Момент:** Пользователь знает план. Но план исходит из целевого веса.

**Психологический вопрос прямо сейчас:**
*"А мой целевой вес — он вообще реалистичный? Это правда идеальный вес для меня?"*

Сомнение в цели — самый частый момент отказа от планов.

**Рекомендация системы:** Ideal Weight Calculator.

**Почему это работает:** Идеальный вес, рассчитанный по 4 формулам (Devine, Robinson, Miller, Hamwi),
подтверждает цель объективно. Пользователь перестает сомневаться в цели
и начинает доверять плану.

---

### Переход 7: Ideal Weight → Registration

**Момент:** 5+ результатов. Полный вес-профиль.

**Психологический вопрос прямо сейчас:**
*"Я проделал огромную работу. Не хочу терять это."*

Это пик ценности — максимальный момент для конверсии в регистрацию.

**Рекомендация системы:** Не калькулятор. RegistrationPrompt.

**Почему это работает:** Пользователь видит:
"Ваш Weight Profile: 87% полноты. Сохраните его бесплатно."

Он регистрируется не ради функции. Он регистрируется, чтобы не потерять себя.

---

### Переход 8: Registration → Dashboard

**Момент:** Первый визит в Dashboard.

**Психологический вопрос прямо сейчас:**
*"Что мне делать дальше?"*

Dashboard показывает: weight domain confidence, план прогресса, следующий шаг.

**Рекомендация системы:** Progress Tracker (Wave 2) / AI Coach (V3-08).

---

## 5. Спецификация каждого продукта

### 5.1 BMI Calculator (существующий)

```
INPUT:
  weight: number (kg / lbs)
  height: number (cm / ft+in)
  age: number (optional, для контекста)
  gender: 'male' | 'female' (optional)

OUTPUT:
  bmi: number               // напр. 26.2
  category: string          // 'overweight'
  bmi_prime: number         // 1.05
  ponderal_index: number    // 12.8
  healthy_range: [min, max] // [58.5, 79.2] кг

PROFILE SIGNALS:
  domain: 'weight', contribution: 30
  domain: 'fitness', contribution: 15
  status: optimal | normal | warning | critical
  metric: 'bmi'

JOURNEY EVENTS:
  JourneyStepCompleted { journey: 'health', step: 'bmi-calculator' }
  JourneyStepCompleted { journey: 'weight-management', step: 'bmi-calculator' }

RECOMMENDATION EVENTS:
  → Body Fat Calculator (score: 85)  [reason: composition_detail]
  → Calorie Deficit Calculator (score: 78) [reason: action_path]

ANALYTICS EVENTS:
  bmi_calculated { bmi, category, unit_system }
  journey_step { journey_id: 'health', step: 1 }
```

---

### 5.2 Body Fat Calculator (существующий)

```
INPUT:
  weight: number
  height: number
  age: number
  gender: 'male' | 'female'
  neck_cm: number (US Navy method)
  waist_cm: number
  hip_cm: number (female only)

OUTPUT:
  body_fat_percent: number    // напр. 22.4
  fat_mass_kg: number         // напр. 17.8
  lean_mass_kg: number        // напр. 61.6
  category: string            // 'fitness' | 'acceptable' | 'obese'
  visceral_fat_indicator: 'low' | 'moderate' | 'high'

PROFILE SIGNALS:
  domain: 'fitness', contribution: 55
  status: optimal | normal | warning | critical
  metric: 'body_fat_percent'

JOURNEY EVENTS:
  JourneyStepCompleted { journey: 'health', step: 'body-fat-calculator' }

RECOMMENDATION EVENTS:
  → BMR Calculator (score: 78) [reason: metabolic_explanation]
  → Body Shape Assessment (score: 82) [reason: synthesis_needed]

ANALYTICS EVENTS:
  body_fat_calculated { percent, category, method: 'navy' }
```

---

### 5.3 BMR Calculator (существующий)

```
INPUT:
  weight: number
  height: number
  age: number
  gender: 'male' | 'female'

OUTPUT:
  bmr_kcal: number           // Mifflin-St Jeor
  bmr_harris: number         // Harris-Benedict (для сравнения)
  bmr_kj: number
  what_it_means: string      // контекстуализация

PROFILE SIGNALS:
  domain: 'metabolism', contribution: 45
  metric: 'bmr_kcal'

JOURNEY EVENTS:
  JourneyStepCompleted { journey: 'health', step: 'bmr-calculator' }

RECOMMENDATION EVENTS:
  → TDEE Calculator (score: 90) [reason: activity_factor_needed]

ANALYTICS EVENTS:
  bmr_calculated { kcal, formula: 'mifflin' }
```

---

### 5.4 TDEE Calculator (существующий)

```
INPUT:
  weight, height, age, gender
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  bmr_override?: number (если уже посчитан)

OUTPUT:
  tdee_kcal: number          // напр. 2 350
  bmr_kcal: number
  activity_multiplier: number // 1.55
  maintenance_kcal: number
  macros_suggestion: {
    protein_g: number
    carbs_g: number
    fat_g: number
  }

PROFILE SIGNALS:
  domain: 'metabolism', contribution: 55
  domain: 'nutrition', contribution: 25
  domain: 'lifestyle', contribution: 20
  metric: 'tdee_kcal'

JOURNEY EVENTS:
  JourneyStepCompleted { journey: 'health', step: 'tdee-calculator' }
  JourneyStepCompleted { journey: 'weight-management', step: 'tdee-calculator' }

RECOMMENDATION EVENTS:
  → Body Shape Assessment (score: 92) [reason: synthesis_unlocked]
  AI_READINESS_CHECK { score: если ≥3 инструмента → propose Assessment }

ANALYTICS EVENTS:
  tdee_calculated { kcal, activity_level }
  journey_milestone { milestone: 'metabolic_profile_complete' }
```

---

### 5.5 Body Shape Assessment ★ (новый продукт — Wave 1)

```
INPUT:
  // Берет из Profile Engine автоматически:
  bmi: number
  body_fat_percent: number
  bmr_kcal: number
  tdee_kcal: number
  age: number
  gender: 'male' | 'female'
  // + пользователь указывает:
  goal: 'lose_weight' | 'maintain' | 'build_muscle'
  activity_preference: 'gym' | 'home' | 'outdoor' | 'none'

OUTPUT:
  body_type: 'ectomorph' | 'mesomorph' | 'endomorph' | 'mixed'
  risk_profile: {
    weight_risk: 'low' | 'moderate' | 'high'
    metabolic_risk: 'low' | 'moderate' | 'high'
    cardiovascular_indicator: 'low' | 'moderate' | 'elevated'
  }
  interpretation: string      // нарратив на языке пользователя
  key_insights: string[]      // 3 главных вывода
  priority_focus: string[]    // что нужно улучшить в первую очередь
  encouragement: string       // мотивационный вывод

PROFILE SIGNALS:
  domain: 'weight', contribution: 15 (дополнительно)
  domain: 'fitness', contribution: 10 (дополнительно)
  metric: 'risk_profile'
  special_event: 'SynthesisCompleted'

JOURNEY EVENTS:
  JourneyMilestoneReached { milestone: 'first_assessment', cluster: 'weight' }
  ClusterUnlocked { cluster: 'weight', product: 'body-shape-assessment' }

RECOMMENDATION EVENTS:
  → Weight Loss Planner (score: 88) [reason: action_ready]
  → Registration (score: 95) [reason: high_value_moment]

ANALYTICS EVENTS:
  assessment_completed { body_type, risk_level: risk_profile.weight_risk }
  cluster_milestone { cluster: 'weight', milestone: 'synthesis' }
```

---

### 5.6 Calorie Deficit Calculator (существующий)

```
INPUT:
  current_weight: number
  target_weight: number
  height: number
  age: number
  gender: 'male' | 'female'
  activity_level: string
  weeks_to_goal?: number     // или задает пользователь
  deficit_preference: 'conservative' | 'moderate' | 'aggressive'

OUTPUT:
  daily_deficit_kcal: number   // напр. 500
  daily_calories_target: number // напр. 1 850
  weekly_loss_kg: number        // напр. 0.45
  weeks_to_goal: number         // напр. 18
  calorie_range: [min, max]     // safe range
  warning?: string              // если дефицит слишком агрессивный

PROFILE SIGNALS:
  domain: 'nutrition', contribution: 30
  domain: 'weight', contribution: 20
  metric: 'daily_deficit_kcal'

JOURNEY EVENTS:
  JourneyStepCompleted { journey: 'weight-management', step: 'calorie-deficit-calculator' }

RECOMMENDATION EVENTS:
  → TDEE Calculator (score: 88) [reason: deficit_calibration]
  → Weight Loss Planner (score: 82) [reason: plan_structuring]
```

---

### 5.7 Ideal Weight Calculator (существующий)

```
INPUT:
  height: number
  gender: 'male' | 'female'
  frame_size?: 'small' | 'medium' | 'large'

OUTPUT:
  ideal_weight_devine: number    // напр. 70.5 кг
  ideal_weight_robinson: number  // напр. 68.2 кг
  ideal_weight_miller: number    // напр. 67.9 кг
  ideal_weight_hamwi: number     // напр. 71.2 кг
  consensus_range: [min, max]    // напр. [67, 72]
  bmi_at_ideal: number           // напр. 22.1

PROFILE SIGNALS:
  domain: 'weight', contribution: 20
  metric: 'ideal_weight_consensus_min', 'ideal_weight_consensus_max'

JOURNEY EVENTS:
  JourneyStepCompleted { journey: 'weight-management', step: 'ideal-weight-calculator' }

RECOMMENDATION EVENTS:
  → Calorie Deficit Calculator (score: 85) [reason: deficit_from_goal]
  → Registration (score: 90) [reason: profile_near_complete]
```

---

### 5.8 Weight Loss Planner ★ (новый продукт — Wave 1)

```
INPUT:
  // Из Profile Engine:
  current_weight: number
  tdee_kcal: number
  body_fat_percent: number
  // Пользователь указывает:
  target_weight: number
  target_date?: Date          // или система считает сама
  pace: 'slow' | 'moderate' | 'fast'  // -250 / -500 / -750 ккал

OUTPUT:
  plan: {
    daily_calories: number
    daily_deficit: number
    weekly_loss_kg: number
    total_weeks: number
    target_date: Date
    milestones: Array<{
      week: number
      expected_weight: number
      milestone_label?: string   // напр. "-5 кг", "halfway"
    }>
  }
  macros: {
    protein_g: number    // приоритет — сохранение мышц
    carbs_g: number
    fat_g: number
  }
  warnings: string[]     // если темп опасный
  tips: string[]         // 3 персональных совета

PROFILE SIGNALS:
  domain: 'weight', contribution: 25 (дополнительно)
  domain: 'nutrition', contribution: 15
  special_event: 'PlanCreated'

JOURNEY EVENTS:
  ClusterMilestoneReached { cluster: 'weight', milestone: 'plan_created' }

RECOMMENDATION EVENTS:
  → Ideal Weight (score: 80) [reason: goal_validation]
  → Registration (score: 95) [reason: plan_save_intent]

ANALYTICS EVENTS:
  plan_created { pace, weeks, daily_deficit }
  high_intent_signal { product: 'weight-loss-planner', action: 'plan_created' }
```

---

## 6. Данные между продуктами (Data Contract)

Все данные передаются через **ProfileEngine** — никаких прямых передач между калькуляторами.

```
Каждый инструмент при завершении:
  1. Dispatches solviqlab:result CustomEvent
  2. UserEngine.storeResult() сохраняет результат
  3. ProfileEngine.processResult() извлекает сигналы
  4. RecommendationEngine читает ProfileEngine → рекомендует следующее

Данные, которые ProfileEngine хранит и передает:

HealthSignal {
  instrument_slug: string
  domain: ProfileDomain
  metric: string
  value: number | null
  label: string | null
  unit: string | null
  status: SignalStatus
  recorded_at: string
}

Конкретные ключевые метрики по кластеру Weight:

From bmi-calculator:
  metric: 'bmi', value: 26.2, unit: 'kg/m²'
  metric: 'bmi_category', value: null, label: 'overweight'

From body-fat-calculator:
  metric: 'body_fat_percent', value: 22.4, unit: '%'
  metric: 'lean_mass_kg', value: 61.6, unit: 'kg'

From bmr-calculator:
  metric: 'bmr_kcal', value: 1680, unit: 'kcal'

From tdee-calculator:
  metric: 'tdee_kcal', value: 2350, unit: 'kcal'
  metric: 'activity_level', value: null, label: 'moderate'

From calorie-deficit-calculator:
  metric: 'daily_deficit_kcal', value: 500, unit: 'kcal'
  metric: 'daily_calories_target', value: 1850, unit: 'kcal'

From ideal-weight-calculator:
  metric: 'ideal_weight_min', value: 67.0, unit: 'kg'
  metric: 'ideal_weight_max', value: 72.0, unit: 'kg'
```

### Правило передачи данных

Body Shape Assessment и Weight Loss Planner **не принимают input от предыдущего калькулятора напрямую**.

Они вызывают `getProfileEngineFromUser().getProfile()` → читают domain signals → берут нужные метрики.

Это означает:
- Если пользователь открыл BMI 3 дня назад, а сейчас открыл Assessment — данные всё равно доступны
- Порядок прохождения инструментов не фиксирован
- Assessment всегда работает с **самыми последними** данными пользователя

---

## 7. Intent Graph

Граф не линейный. У каждого продукта — несколько точек входа.

```
                     ┌─────────────────────────────────────┐
                     │         SEO Traffic Sources          │
                     └──────────────┬──────────────────────┘
                                    │
          ┌─────────────────────────┼───────────────────────┐
          ▼                         ▼                         ▼
  [BMI Calculator]       [Body Fat Calculator]    [Calorie Deficit Calc]
  "bmi calculator"       "body fat percentage"    "calorie deficit"
  "bmi chart"            "navy body fat"          "how to lose weight"
  "am i overweight"      "body composition"       "calorie deficit calculator"
          │                         │                         │
          │                         │                         │
          └──────────────┬──────────┘                         │
                         │                                    │
                         ▼                                    ▼
                 [BMR Calculator]                    [TDEE Calculator]
                 "basal metabolic rate"              "total daily energy"
                 "bmr formula"                       "tdee calculator"
                         │                                    │
                         └────────────┬───────────────────────┘
                                      │
                                      ▼
                     [Ideal Weight Calculator]
                     "ideal weight for height"
                     "healthy weight calculator"
                                      │
                          ┌───────────┼───────────┐
                          │           │           │
                          ▼           ▼           ▼
                   (from BMI)   (from TDEE)  (direct SEO)
                          │           │           │
                          └───────────┼───────────┘
                                      │
                         ┌────────────▼────────────┐
                         │                          │
                         │  ★ Body Shape Assessment  │  ← Synthesis Point
                         │  (internal only — no SEO) │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │                          │
                         │  ★ Weight Loss Planner    │  ← Action Point
                         │  (internal only — no SEO) │
                         └────────────┬─────────────┘
                                      │
                              ┌───────┴───────┐
                              ▼               ▼
                       [Registration]    [Dashboard]
                       (conversion)      (retention)
                              │               │
                         ┌────┴───┐     ┌─────┴──────┐
                         ▼        ▼     ▼             ▼
                    AI Coach   Progress Habit      (next cluster)
                    (V3-08)    Tracker  Checklist
                               (Wave 2) (Wave 2)
```

### Ключевое свойство графа

**Все внешние входы** (BMI, Body Fat, Calorie Deficit, TDEE, Ideal Weight) ведут к одному Intent.

Неважно, с какого продукта начал пользователь —
через 3-4 шага он оказывается в **Body Shape Assessment → Weight Loss Planner → Registration**.

Это и есть Intent Cluster: любая точка входа → один destination.

---

## 8. SEO Strategy

### Принцип разделения

| Тип страницы | SEO роль | Трафик |
|---|---|---|
| **SEO Entry Pages** | Привлекают органический трафик | Внешний |
| **Internal Products** | Конвертируют пользователей | Внутренний |
| **Conversion Pages** | Registration, Dashboard | Без индексации |

### SEO Entry Pages (индексируются, получают трафик)

**[1] `/en/calculators/bmi-calculator`**
- Primary keyword: "bmi calculator" (объём: ~2.7M/мес)
- Secondary: "bmi chart by age", "am i overweight", "bmi formula"
- Intent: Informational + Transactional
- Роль в кластере: **Главный входной узел**
- SEO score target: 95+

**[2] `/en/calculators/body-fat-calculator`**
- Primary: "body fat calculator" (~500K/мес)
- Secondary: "navy body fat method", "body fat percentage chart"
- Intent: Transactional
- Роль: **Второй по важности входной узел**

**[3] `/en/calculators/bmr-calculator`**
- Primary: "bmr calculator" (~300K/мес)
- Secondary: "basal metabolic rate", "bmr formula mifflin"
- Intent: Informational + Transactional
- Роль: **Метаболический входной узел**

**[4] `/en/calculators/tdee-calculator`**
- Primary: "tdee calculator" (~400K/мес)
- Secondary: "total daily energy expenditure", "calorie maintenance"
- Intent: Transactional
- Роль: **Nutrition входной узел**

**[5] `/en/calculators/calorie-deficit-calculator`**
- Primary: "calorie deficit calculator" (~250K/мес)
- Secondary: "how many calories to lose weight", "calorie deficit"
- Intent: Transactional (высокий коммерческий Intent)
- Роль: **Action-intent входной узел** (самый высокий Intent = быстрее конвертирует)

**[6] `/en/calculators/ideal-weight-calculator`**
- Primary: "ideal weight calculator" (~180K/мес)
- Secondary: "healthy weight for my height", "ideal body weight formula"
- Intent: Informational + Transactional
- Роль: **Goal-setting входной узел**

### Internal Products (не индексируются)

**Body Shape Assessment:** `robots: { index: false }`
Доступен только через Recommendation Engine после ≥3 инструментов.
Причина: assessment без контекста (профиля) не имеет ценности для пользователя,
а как SEO-страница конкурировал бы с собственными входными узлами.

**Weight Loss Planner:** `robots: { index: false }`
Аналогично — требует данных из ProfileEngine.

**Dashboard, Registration:** `robots: { index: false }` (уже реализовано в V3-06).

### SEO Cluster Strategy

Все 6 Entry Pages должны ссылаться друг на друга через блок "Related Calculators".

Внутренняя перелинковка:
```
BMI ↔ Body Fat ↔ BMR ↔ TDEE ↔ Ideal Weight ↔ Calorie Deficit
```

Это создает **Topic Cluster** — Google видит, что платформа покрывает
полный топик "weight management", а не отдельные страницы.

Ожидаемый эффект: +30-50% organic traffic к каждому инструменту
за счет Authority от соседних страниц кластера.

---

## 9. Что делает этот кластер уникальным

### Против обычного сайта с калькуляторами

| Обычный сайт | SolviqLab Weight Cluster |
|---|---|
| 7 независимых инструментов | 7 инструментов + 2 продукта-синтеза |
| Пользователь считает и уходит | Пользователь получает профиль |
| Нет рекомендаций | Recommendation Engine направляет |
| Нет памяти | ProfileEngine хранит историю |
| Нет плана | Weight Loss Planner создает план |
| Нет возврата | Progress Tracker создает привычку |
| Нет AI | AI Coach персонализирует опыт |

### Moat (защитный ров)

После того как пользователь прошел 5+ инструментов, получил Assessment и создал план —
**его профиль хранится только здесь**.

Ни один конкурент не может предложить ему "просто тот же калькулятор" —
потому что здесь не калькуляторы. Здесь его персональный Weight Profile.

---

## 10. Roadmap реализации

### Wave 1 (следующий sprint после V3-08)

**Новые продукты:**
1. Body Shape Assessment
   - Читает данные из ProfileEngine
   - Визуальный вывод (body type + risk profile)
   - Не требует авторизации
   - Триггерит Registration Prompt

2. Weight Loss Planner
   - Принимает цель от пользователя + данные из Profile
   - Генерирует timeline с милестонами
   - Сохраняет план в ProfileEngine

**Доработки существующих:**
3. Объединить Journey `health` и `weight-management` в единый `weight-cluster`
   с 8 шагами и явным synthesis point после шага 4.

4. Добавить в Calorie Deficit Calculator поле "target_weight" как опциональный вход
   (данные из Ideal Weight Calculator через ProfileEngine).

### Wave 2 (после Public Beta)

5. Progress Tracker — требует авторизацию + persistent storage
6. Habit Checklist — требует daily engagement механику
7. Meal Planner — требует контентную базу данных

### V3-08 (параллельно)

8. AI Coach — PersonalHealthProfile уже готов как контекст
   Weight cluster — первый cluster, который получит AI Coach

---

## 11. Эталон для следующих кластеров

После утверждения этого документа, каждый следующий Intent Cluster строится по схеме:

```
[Intent Cluster Template]

1. Existing Instruments Audit     ← что уже есть
2. Gap Analysis                   ← что отсутствует
3. Full Product Journey           ← с психологией каждого перехода
4. Per-Product Specification      ← INPUT / OUTPUT / SIGNALS / EVENTS
5. Data Contract                  ← как данные передаются через ProfileEngine
6. Intent Graph                   ← все входы → один destination
7. SEO Strategy                   ← Entry Pages vs Internal Products
8. Implementation Roadmap         ← Wave 1 / Wave 2 / AI
```

**Следующие кластеры к проектированию:**

| Кластер | Primary Entry | Synthesis Product | Retention Product |
|---|---|---|---|
| **Sleep** | sleep-calculator | Sleep Assessment | Sleep Diary |
| **Pregnancy** | due-date-calculator | Pregnancy Timeline | Weekly Check-in |
| **Finance** | savings-calculator | Financial Health Score | Savings Tracker |
| **Nutrition** | calorie-calculator | Nutrition Profile | Meal Planner |
| **Fitness** | body-fat-calculator | Fitness Assessment | Workout Tracker |
| **Mental Health** | (new) stress-calculator | Wellness Score | Daily Check-in |

Каждый из них будет строиться точно по этой архитектуре.

---

*Документ утверждён: [дата]*
*Следующий шаг: V3-08A разработка Body Shape Assessment (Skviz)*
