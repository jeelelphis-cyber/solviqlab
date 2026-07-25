'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TodaysPlan — 3 personalized tasks generated deterministically from UserGraph.
// Sprint M-1
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph }      from '@/lib/graph/types'

interface Task {
  title:    string
  why:      string
  duration: string
}

interface TodaysPlanProps {
  graph:      UserGraph
  lang:       'en' | 'uk'
  onRegister: () => void
}

// ── Task generation ───────────────────────────────────────────────────────────

function generateTasks(graph: UserGraph, lang: 'en' | 'uk'): Task[] {
  const cluster = graph.journey.activeCluster ?? 'weight'
  const facts   = graph.coachMemory.facts
  const quizItems = graph.quizResults?.items ?? []

  // Pull any relevant quiz score for personalization
  const sleepResult    = quizItems.find(r => r.slug === 'sleep-quiz')
  const stressResult   = quizItems.find(r => r.slug === 'stress-quiz')
  const energyResult   = quizItems.find(r => r.slug === 'energy-quiz')
  const hydration      = quizItems.find(r => r.slug === 'hydration-quiz')

  // Pull BMI-like fact from coachMemory
  const bmiFact = facts.find(f => f.text.includes('BMI') || f.text.includes('bmi'))
  const bmiVal  = bmiFact?.text.match(/[\d.]+/)?.[0]

  // Low sleep → recovery task
  const lowSleep  = sleepResult && sleepResult.score < 50
  // High stress → wind-down task
  const highStress = stressResult && stressResult.score < 50
  // Low energy → movement task
  const lowEnergy  = energyResult && energyResult.score < 60
  // Low hydration
  const lowHydration = hydration && hydration.score < 60

  const tasks: Task[] = []

  // ── Cluster-specific primary task ─────────────────────────────────────────

  if (cluster === 'sleep' || lowSleep) {
    tasks.push(lang === 'uk'
      ? {
          title:    'Ляж спати сьогодні на 30 хвилин раніше',
          why:      'Навіть одна ніч якіснішого сну зменшує кортизол і покращує рішення завтра.',
          duration: '30 хв',
        }
      : {
          title:    'Go to bed 30 minutes earlier tonight',
          why:      'Even one better night of sleep reduces cortisol and sharpens your decisions tomorrow.',
          duration: '30 min',
        }
    )
  } else if (cluster === 'mental' || highStress) {
    tasks.push(lang === 'uk'
      ? {
          title:    '5-хвилинний дихальний ритуал прямо зараз',
          why:      'Повільне дихання активує парасимпатичну нервову систему та знижує стрес за хвилини.',
          duration: '5 хв',
        }
      : {
          title:    '5-minute breathing ritual right now',
          why:      'Slow breathing activates your parasympathetic system and reduces stress in minutes.',
          duration: '5 min',
        }
    )
  } else {
    // default: weight / movement
    tasks.push(lang === 'uk'
      ? {
          title:    '10-хвилинна прогулянка перед сніданком',
          why:      bmiVal
            ? `При BMI ${bmiVal} ходьба перед їжею прискорює метаболізм жирів на 20%.`
            : 'Прогулянка перед їжею прискорює метаболізм жирів і знижує тягу до солодкого.',
          duration: '10 хв',
        }
      : {
          title:    '10-minute walk before breakfast',
          why:      bmiVal
            ? `At BMI ${bmiVal}, walking before eating boosts fat metabolism by up to 20%.`
            : 'Walking before eating boosts fat metabolism and reduces sugar cravings throughout the day.',
          duration: '10 min',
        }
    )
  }

  // ── Secondary task — hydration or food awareness ──────────────────────────

  if (lowHydration) {
    tasks.push(lang === 'uk'
      ? {
          title:    'Випий 500 мл води прямо зараз',
          why:      'Твій результат квізу показує зневоднення. Навіть легке впливає на фокус і настрій.',
          duration: 'відразу',
        }
      : {
          title:    'Drink 500ml of water right now',
          why:      'Your quiz result signals mild dehydration — even slight dehydration affects focus and mood.',
          duration: 'instant',
        }
    )
  } else if (cluster === 'weight' || !lowSleep) {
    tasks.push(lang === 'uk'
      ? {
          title:    'Запиши свій обід',
          why:      'Усвідомлення того, що ти їси, знижує калорії на 15% без дієти.',
          duration: '2 хв',
        }
      : {
          title:    'Log your lunch today',
          why:      'Awareness of what you eat reduces caloric intake by ~15% — no dieting required.',
          duration: '2 min',
        }
    )
  } else {
    tasks.push(lang === 'uk'
      ? {
          title:    'Зроби 10 хвилин легкого розтягування',
          why:      'Розтягування ввечері знижує напругу м\'язів і покращує якість сну.',
          duration: '10 хв',
        }
      : {
          title:    'Do 10 minutes of light stretching tonight',
          why:      'Evening stretching reduces muscle tension and measurably improves sleep quality.',
          duration: '10 min',
        }
    )
  }

  // ── Tertiary task — energy or mindset ────────────────────────────────────

  if (lowEnergy) {
    tasks.push(lang === 'uk'
      ? {
          title:    'Замінити одне перекушування на горіхи або фрукт',
          why:      'Стабільний рівень цукру у крові запобігає енергетичним провалам після обіду.',
          duration: '1 хв',
        }
      : {
          title:    'Swap one snack for nuts or fruit',
          why:      'Stable blood sugar prevents the afternoon energy crash that affects productivity.',
          duration: '1 min',
        }
    )
  } else {
    tasks.push(lang === 'uk'
      ? {
          title:    'Запиши одну річ, яка добре пройшла сьогодні',
          why:      'Позитивне підкріплення тренує мозок помічати прогрес — це ключ до підтримки мотивації.',
          duration: '2 хв',
        }
      : {
          title:    'Write down one thing that went well today',
          why:      'Positive reinforcement trains your brain to notice progress — the foundation of lasting motivation.',
          duration: '2 min',
        }
    )
  }

  return tasks.slice(0, 3)
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodaysPlan({ graph, lang, onRegister }: TodaysPlanProps) {
  const tasks = generateTasks(graph, lang)
  const name  = graph.identity.name

  const headerText = lang === 'uk'
    ? `Твій план на сьогодні${name ? `, ${name}` : ''}`
    : `Your plan for today${name ? `, ${name}` : ''}`

  const footerText = lang === 'uk'
    ? 'Хочеш це щодня?'
    : 'Want this every day?'

  const registerLabel = lang === 'uk'
    ? 'Отримувати щоденний план →'
    : 'Get your daily plan →'

  const freeLabel = lang === 'uk'
    ? 'Безкоштовно · Без карти'
    : 'Free · No credit card'

  return (
    <div className="flex flex-col gap-6 py-6 px-2">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{headerText}</h2>
        <p className="text-sm text-gray-400">
          {lang === 'uk'
            ? 'На основі твоїх результатів і цілей.'
            : 'Based on your results and goals.'}
        </p>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-3">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          >
            {/* Number circle */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-sm font-bold text-violet-600 dark:text-violet-400 mt-0.5">
              {i + 1}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{task.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-2">{task.why}</div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-full">
                ⏱ {task.duration}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Register CTA */}
      <div className="flex flex-col items-center gap-2 pt-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{footerText}</p>
        <button
          onClick={onRegister}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 px-6 hover:opacity-90 active:scale-95 transition-all"
        >
          {registerLabel}
        </button>
        <p className="text-xs text-gray-400 dark:text-gray-500">{freeLabel}</p>
      </div>
    </div>
  )
}
