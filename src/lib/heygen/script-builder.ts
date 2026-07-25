// ─────────────────────────────────────────────────────────────────────────────
// MiaScriptBuilder — converts UserGraph into Mia's first video script.
//
// Based on AI Coach Bible v1.0 (src/lib/coach/MIA_BIBLE.md).
// Structure: Name+Score (5s) → Insight (8s) → One Action (7s) → Hook (10s)
// Target: ~75 words, 30 seconds.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserGraph } from '../graph/types'

export interface MiaScript {
  readonly text:       string
  readonly wordCount:  number
  readonly estSeconds: number
}

export class MiaScriptBuilder {
  build(graph: UserGraph, name: string, lang = 'en'): MiaScript {
    const assessment = graph.assessments.items
      .find(a => a.clusterId === graph.journey.activeCluster)
      ?? graph.assessments.items[0]

    const score   = assessment?.score ?? null
    const cluster = graph.journey.activeCluster ?? 'health'
    const phase   = graph.journey.currentPhase ?? 'planning'
    const goal    = graph.goals.items.find(g => g.status === 'active' && g.priority === 'high')
      ?? graph.goals.items.find(g => g.status === 'active')

    const highFact = graph.coachMemory.facts.find(f => f.importance === 'high')

    const text = [
      this.openingLine(name, score, lang),
      this.insightLine(highFact?.text ?? null, cluster, phase, lang),
      this.actionLine(cluster, phase, lang),
      this.hookLine(name, score, lang),
    ].join(' ')

    const wordCount  = text.split(/\s+/).length
    const estSeconds = Math.round(wordCount / 2.5)

    return { text, wordCount, estSeconds }
  }

  private openingLine(name: string, score: number | null, lang: string): string {
    if (lang === 'uk') {
      if (score !== null) {
        return `Привіт, ${name}. Я щойно переглянула твою оцінку — ти набрав ${score} зі 100.`
      }
      return `Привіт, ${name}. Я щойно проаналізувала твої дані про здоров'я.`
    }
    if (score !== null) {
      return `Hey ${name}. I just reviewed your assessment — you scored ${score} out of 100.`
    }
    return `Hey ${name}. I just finished looking at your health data.`
  }

  private insightLine(fact: string | null, cluster: string, phase: string, lang: string): string {
    if (lang === 'uk') {
      const insights: Record<string, Record<string, string>> = {
        weight: {
          awareness:   'Твоє тіло зараз потребує одного — послідовності, а не досконалості.',
          planning:    'У тебе є міцна основа. Більшість людей на твоєму місці пропускають етап планування. Ти — ні.',
          action:      'Ти в фазі дії — тут відбуваються справжні зміни, а не просто наміри.',
          maintenance: 'Твої результати тримаються. Це важче, ніж більшість розуміє.',
        },
        sleep: {
          awareness:   'Твій режим сну впливає на все інше — енергію, настрій, метаболізм.',
          planning:    'Налагодити сон — значить змінити все наступне. Починаємо звідси.',
          action:      'Ти вже робиш прогрес у якості сну. Дані це підтверджують.',
          maintenance: 'Твій показник сну сильний. Переконаємось, що він таким залишиться.',
        },
      }
      return insights[cluster]?.[phase]
        ?? 'Те, що я бачу у твоїх даних — це чітка відправна точка. А це саме те, що нам потрібно.'
    }

    if (fact) {
      const clean = fact.split('.')[0]!.trim()
      return `Here's what stands out: ${clean.toLowerCase()}.`
    }

    const insights: Record<string, Record<string, string>> = {
      weight: {
        awareness:   "Your body is asking for one thing right now — consistency, not perfection.",
        planning:    "You have a solid foundation. Most people in your position skip the planning step. You didn't.",
        action:      "You're in the action phase — this is where real change happens, not just intention.",
        maintenance: "Your results are holding. That's harder than most people realise.",
      },
      sleep: {
        awareness:   "Your sleep patterns are affecting everything else — energy, mood, metabolism.",
        planning:    "Getting sleep right changes everything downstream. We start here.",
        action:      "You're already making progress on sleep quality. The data shows it.",
        maintenance: "Your sleep score is strong. Let's make sure it stays that way.",
      },
    }

    return insights[cluster]?.[phase]
      ?? "What I see in your data is a clear starting point — and that's exactly what we need."
  }

  private actionLine(cluster: string, phase: string, lang: string): string {
    if (lang === 'uk') {
      const actions: Record<string, Record<string, string>> = {
        weight: {
          awareness:   'Завтра вранці, до їжі — десять хвилин на вулиці. Це твоє єдине завдання.',
          planning:    'Завтра: запиши, що їси на обід. Просто спостерігай. Поки без змін.',
          action:      'Завтра вранці, до сніданку — десять хвилин ходьби. Час важливіший за тривалість.',
          maintenance: 'Продовжуй те, що робиш цього тижня. Одне невелике доповнення: п\'ять хвилин розтяжки перед сном.',
        },
        sleep: {
          awareness:   'Сьогодні ввечері — жодних екранів за тридцять хвилин до сну. Лише ця одна зміна.',
          planning:    'Встанови стабільний час підйому цього тижня — однаковий щодня, навіть у вихідні.',
          action:      'Сьогодні ввечері запиши одну річ, за яку вдячний, перед сном. Це змінює рівень кортизолу.',
          maintenance: 'Зберігай своє вікно сну. Додай п\'ять хвилин ранкового світла одразу після пробудження.',
        },
      }
      return actions[cluster]?.[phase]
        ?? 'Завтра зроби одну маленьку річ для свого здоров\'я. Лише одну. Розкажи мені, що це було, коли повернешся.'
    }

    const actions: Record<string, Record<string, string>> = {
      weight: {
        awareness:   "Tomorrow morning, before you eat anything — ten minutes outside. That's your only task.",
        planning:    "Tomorrow: write down what you eat at lunch. Just observe. No changes yet.",
        action:      "Tomorrow morning, before breakfast — ten minutes of walking. Timing matters more than duration.",
        maintenance: "Keep doing what you're doing this week. One small add: five minutes of stretching before bed.",
      },
      sleep: {
        awareness:   "Tonight, no screens thirty minutes before bed. Just that one change.",
        planning:    "Set a consistent wake time this week — same time every day, even weekends.",
        action:      "Tonight, write down one thing you're grateful for before sleeping. It changes your cortisol.",
        maintenance: "Keep your current sleep window. Add five minutes of morning light right after you wake.",
      },
    }

    return actions[cluster]?.[phase]
      ?? "Tomorrow, do one small thing for your health. Just one. Tell me what it was when you come back."
  }

  private hookLine(name: string, score: number | null, lang: string): string {
    if (lang === 'uk') {
      const hooks = [
        `Повертайся завтра, ${name}. Я вже готую щось конкретне для твого наступного кроку.`,
        `Я бачу дещо у твоїх даних, що більшість людей пропускають. Повертайся завтра — покажу.`,
        `Є одна річ, яку я ще не сказала тобі, ${name}. Завтра.`,
        score !== null && score < 60
          ? `Ти ближче до ${score + 12}, ніж думаєш, ${name}. Повертайся завтра.`
          : `Твій перший тижневий план буде готовий, коли ти повернешся, ${name}.`,
      ].filter(Boolean) as string[]
      return hooks[Math.floor(Math.random() * hooks.length)]!
    }

    const hooks = [
      `Come back tomorrow, ${name}. I'm already preparing something specific for your next step.`,
      `I'm looking at something in your data that most people miss. Come back tomorrow and I'll show you.`,
      `There's one thing I haven't told you yet, ${name}. Tomorrow.`,
      score !== null && score < 60
        ? `You're closer to ${score + 12} than you think, ${name}. Come back tomorrow.`
        : `I'll have your first weekly plan ready when you return, ${name}.`,
    ].filter(Boolean) as string[]

    return hooks[Math.floor(Math.random() * hooks.length)]!
  }
}
