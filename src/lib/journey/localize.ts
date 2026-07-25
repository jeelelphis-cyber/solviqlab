// ─────────────────────────────────────────────────────────────────────────────
// Journey Localization
//
// Per-language overrides for journey config strings (nextName, reason, benefits)
// and reward strings (completionLabel, profileInsight).
//
// English (EN) is defined in config.ts / rewards.ts (source of truth).
// This file overrides for other languages.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextStepData } from './config'
import type { StepReward }   from './rewards'

type Lang = string

// ── Next Step overrides ───────────────────────────────────────────────────────

type NextStepOverride = Pick<NextStepData, 'nextName' | 'reason' | 'benefits' | 'profileLabel'>

const NEXT_STEP_OVERRIDES: Partial<Record<Lang, Partial<Record<string, NextStepOverride>>>> = {

  uk: {
    'bmi-calculator': {
      nextName:     'Калькулятор калорій',
      reason:       'ІМТ показує, де ви стоїте. Тепер дізнайтесь, скільки калорій потребує ваш організм для досягнення цільової ваги.',
      benefits:     ['Дізнайтесь точну добову норму калорій', 'Персоналізуйте план харчування', 'Перетворіть результати ІМТ на дію'],
      profileLabel: 'Профіль здоров\'я',
    },
    'calorie-calculator': {
      nextName:     'Калькулятор TDEE',
      reason:       'Потреба в калоріях залежить від вашої активності. TDEE дає повну картину енергетичного балансу.',
      benefits:     ['Врахуйте рівень фізичної активності', 'Дізнайтесь справжні витрати енергії', 'Встановіть реалістичну норму калорій'],
      profileLabel: 'Профіль здоров\'я',
    },
    'tdee-calculator': {
      nextName:     'Калькулятор BMR',
      reason:       'BMR — основа метаболізму: калорії, які ви спалюєте просто існуючи. Необхідно для точного харчування.',
      benefits:     ['Зрозумійте свій метаболічний базис', 'Налаштуйте дефіцит або профіцит калорій', 'Досягніть точніших результатів'],
      profileLabel: 'Профіль здоров\'я',
    },
    'bmr-calculator': {
      nextName:     'Калькулятор жиру',
      reason:       'BMR розповідає про метаболізм. Відсоток жиру розкриває склад тіла — набагато точніший показник здоров\'я, ніж вага.',
      benefits:     ['Відстежуйте реальний показник форми', 'Відрізніть втрату жиру від втрати м\'язів', 'Ставте цілі за складом тіла'],
      profileLabel: 'Профіль здоров\'я',
    },
    'body-fat-calculator': {
      nextName:     'Калькулятор ідеальної ваги',
      reason:       'Знаючи склад тіла, розрахуйте ідеальну вагу — персоналізовану ціль на основі вашого зросту та статури.',
      benefits:     ['Визначте науково обґрунтовану цільову вагу', 'Зрозумійте свій здоровий діапазон', 'Завершіть Профіль здоров\'я'],
      profileLabel: 'Профіль здоров\'я',
    },
    'ideal-weight-calculator': {
      nextName:     'Калькулятор дефіциту калорій',
      reason:       'Ви знаєте ідеальну вагу. Тепер розрахуйте точний дефіцит калорій для досягнення її здоровим темпом.',
      benefits:     ['Розрахуйте персональний дефіцит калорій', 'Встановіть реалістичні терміни', 'Уникніть втрати м\'язів при схудненні'],
      profileLabel: 'Профіль здоров\'я',
    },
    'calorie-deficit-calculator': {
      nextName:     'Калькулятор TDEE',
      reason:       'Дефіцит діє лише при точних витратах енергії. TDEE враховує вашу активність — пропущена частина картини.',
      benefits:     ['Точно відкалібруйте дефіцит', 'Уникніть недо- або переїдання', 'Побудуйте план, який справді працює'],
      profileLabel: 'Профіль ваги',
    },
    'sleep-calculator': {
      nextName:     'Калькулятор ІМТ',
      reason:       'Якість сну і склад тіла тісно пов\'язані. Люди, які добре сплять, підтримують здорову вагу — перевірте себе.',
      benefits:     ['Зрозумійте зв\'язок сну та ваги', 'Складіть повну картину здоров\'я', 'Визначте зони для покращення'],
      profileLabel: 'Профіль оздоровлення',
    },
    'savings-calculator': {
      nextName:     'Калькулятор складних відсотків',
      reason:       'Заощадження ростуть експоненційно при нарахуванні відсотків. Побачте, як ваші гроші примножуються.',
      benefits:     ['Оцініть силу складного росту', 'Прорахуйте заощадження на 10, 20, 30 років', 'Зрозумійте, як відсотки працюють на вас'],
      profileLabel: 'Фінансовий профіль',
    },
    'compound-interest-calculator': {
      nextName:     'Калькулятор інвестицій',
      reason:       'Складні відсотки — основа. Тепер побачте, як регулярні інвестиції примножують статки через ринкову дохідність.',
      benefits:     ['Моделюйте різні інвестиційні сценарії', 'Порівняйте стратегії внесків', 'Перегляньте прогноз чистого капіталу'],
      profileLabel: 'Фінансовий профіль',
    },
    'investment-calculator': {
      nextName:     'Калькулятор пенсії',
      reason:       'Інвестування — спосіб накопичити капітал. Пенсійне планування — спосіб захистити його. Завершіть фінансову картину.',
      benefits:     ['Оцініть готовність до пенсії', 'Визначте дефіцит заощаджень', 'Сплануйте фінансову незалежність'],
      profileLabel: 'Фінансовий профіль',
    },
    'retirement-calculator': {
      nextName:     'Калькулятор інфляції',
      reason:       'Ваша пенсійна сума виглядає добре сьогодні — але інфляція знецінює купівельну спроможність. Врахуйте це в плані.',
      benefits:     ['Захистіть від знецінення купівельної спроможності', 'Реалістично скоригуйте пенсійну ціль', 'Завершіть Фінансовий профіль'],
      profileLabel: 'Фінансовий профіль',
    },
    'mortgage-calculator': {
      nextName:     'Кредитний калькулятор',
      reason:       'Іпотека — лише одна позика. Але купівля житла часто потребує додаткових кредитів. Зрозумійте повну вартість.',
      benefits:     ['Моделюйте загальну вартість кредитування', 'Порівняйте варіанти позик', 'Уникніть прихованих фінансових прогалин'],
      profileLabel: 'Профіль покупця житла',
    },
    'loan-calculator': {
      nextName:     'Калькулятор заощаджень',
      reason:       'Знати платежі за кредитом — одна сторона. Знати, як заощадити на першому внеску — інша.',
      benefits:     ['Сплануйте терміни першого внеску', 'Встановіть місячну ціль заощаджень', 'Досягніть дати купівлі житла'],
      profileLabel: 'Профіль покупця житла',
    },
    'due-date-calculator': {
      nextName:     'Калькулятор вагітності',
      reason:       'Дата пологів визначена. Тепер відстежуйте вагітність тиждень за тижнем — що відбувається і чого очікувати.',
      benefits:     ['Відстежуйте розвиток тиждень за тижнем', 'Знайте, що очікувати на кожному етапі', 'Готуйтесь до ключових моментів'],
      profileLabel: 'Сімейний профіль',
    },
    'pregnancy-calculator': {
      nextName:     'Калькулятор овуляції',
      reason:       'Відстежуйте вікно фертильності для планування або підготовки. Завершіть профіль сімейного планування.',
      benefits:     ['Дізнайтесь свої фертильні дні', 'Оптимізуйте терміни з точністю', 'Завершіть Сімейний профіль'],
      profileLabel: 'Сімейний профіль',
    },
  },

  es: {
    'bmi-calculator': {
      nextName:     'Calculadora de Calorías',
      reason:       'Tu IMC revela dónde estás. Ahora descubre exactamente cuántas calorías necesita tu cuerpo para alcanzar tu peso objetivo.',
      benefits:     ['Conoce tu objetivo calórico diario exacto', 'Personaliza tu plan nutricional', 'Convierte tu resultado de IMC en acción'],
      profileLabel: 'Perfil de Salud',
    },
  },

}

// ── Reward overrides ──────────────────────────────────────────────────────────

type RewardOverride = Pick<StepReward, 'completionLabel' | 'profileInsight' | 'dimensionUnlocked'>

const REWARD_OVERRIDES: Partial<Record<Lang, Partial<Record<string, RewardOverride>>>> = {

  uk: {
    'bmi-calculator': {
      completionLabel: 'Базовий ІМТ встановлено',
      profileInsight:  'Вимір маси тіла додано до Профілю здоров\'я',
      dimensionUnlocked: 'Маса тіла',
    },
    'calorie-calculator': {
      completionLabel: 'Добову норму калорій розраховано',
      profileInsight:  'Вимір харчування додано до Профілю здоров\'я',
      dimensionUnlocked: 'Харчування',
    },
    'tdee-calculator': {
      completionLabel: 'Витрати енергії визначено',
      profileInsight:  'Вимір рівня активності додано до Профілю здоров\'я',
      dimensionUnlocked: 'Рівень активності',
    },
    'bmr-calculator': {
      completionLabel: 'Базальний метаболізм виміряно',
      profileInsight:  'Вимір метаболізму додано до Профілю здоров\'я',
      dimensionUnlocked: 'Метаболізм',
    },
    'body-fat-calculator': {
      completionLabel: 'Склад тіла проаналізовано',
      profileInsight:  'Вимір складу тіла додано до Профілю здоров\'я',
      dimensionUnlocked: 'Склад тіла',
    },
    'ideal-weight-calculator': {
      completionLabel: 'Цільову вагу встановлено',
      profileInsight:  'Вимір цільової ваги додано до Профілю здоров\'я',
      dimensionUnlocked: 'Цільова вага',
    },
    'calorie-deficit-calculator': {
      completionLabel: 'Стратегію дефіциту визначено',
      profileInsight:  'Вимір плану схуднення додано',
      dimensionUnlocked: 'План схуднення',
    },
    'sleep-calculator': {
      completionLabel: 'Розклад сну оптимізовано',
      profileInsight:  'Вимір якості сну додано до Профілю оздоровлення',
      dimensionUnlocked: 'Якість сну',
    },
    'savings-calculator': {
      completionLabel: 'Ціль заощаджень встановлено',
      profileInsight:  'Вимір заощаджень додано до Фінансового профілю',
      dimensionUnlocked: 'Заощадження',
    },
    'compound-interest-calculator': {
      completionLabel: 'Прогноз зростання розраховано',
      profileInsight:  'Вимір інвестиційного зростання додано',
      dimensionUnlocked: 'Інвестиційне зростання',
    },
    'investment-calculator': {
      completionLabel: 'Інвестиційну стратегію змодельовано',
      profileInsight:  'Вимір портфеля додано до Фінансового профілю',
      dimensionUnlocked: 'Портфель',
    },
    'retirement-calculator': {
      completionLabel: 'Готовність до пенсії оцінено',
      profileInsight:  'Вимір пенсії додано до Фінансового профілю',
      dimensionUnlocked: 'Пенсія',
    },
    'mortgage-calculator': {
      completionLabel: 'Сценарій іпотеки змодельовано',
      profileInsight:  'Вимір фінансування житла додано',
      dimensionUnlocked: 'Фінансування житла',
    },
    'loan-calculator': {
      completionLabel: 'Умови кредиту проаналізовано',
      profileInsight:  'Вимір управління боргом додано',
      dimensionUnlocked: 'Управління боргом',
    },
    'due-date-calculator': {
      completionLabel: 'Дату пологів розраховано',
      profileInsight:  'Вимір терміну вагітності додано',
      dimensionUnlocked: 'Термін вагітності',
    },
    'pregnancy-calculator': {
      completionLabel: 'Тиждень вагітності відстежено',
      profileInsight:  'Вимір розвитку додано до Сімейного профілю',
      dimensionUnlocked: 'Розвиток',
    },
    'ovulation-calculator': {
      completionLabel: 'Вікно фертильності визначено',
      profileInsight:  'Вимір фертильності додано до Сімейного профілю',
      dimensionUnlocked: 'Фертильність',
    },
  },

}

// ── Public API ────────────────────────────────────────────────────────────────

export function localizeNextStep(step: NextStepData, lang: string): NextStepData {
  const override = NEXT_STEP_OVERRIDES[lang]?.[step.journeyId ? step.nextSlug : '']
    ?? NEXT_STEP_OVERRIDES[lang]?.[step.nextSlug]
  if (!override) return step
  return { ...step, ...override }
}

export function localizeReward(slug: string, reward: StepReward, lang: string): StepReward {
  const override = REWARD_OVERRIDES[lang]?.[slug]
  if (!override) return reward
  return { ...reward, ...override }
}
