// ─────────────────────────────────────────────────────────────────────────────
// Insight variants — Mia shows she understands the REAL problem (accountability).
// 2 variants per cluster per language.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScriptVariant } from './types'

export const INSIGHT_VARIANTS: Record<string, Record<string, ScriptVariant[]>> = {
  en: {
    weight: [
      {
        id:   'insight_accountability_A',
        text: "People with your numbers don't fail because of food or exercise. They fail because there's no one holding them accountable every single day. That's exactly why I'm here.",
      },
      {
        id:   'insight_pattern_B',
        text: "I've seen this pattern many times. The issue isn't what you eat — it's that no one is watching your progress with you. Until now.",
      },
    ],
    sleep: [
      {
        id:   'insight_accountability_A',
        text: "Poor sleep isn't a discipline problem. It's a system problem. And systems need someone to build them with you — not just hand you a checklist.",
      },
      {
        id:   'insight_pattern_B',
        text: "Your sleep data tells me one specific thing: you need a consistent structure, not more advice. I'm going to build that with you.",
      },
    ],
  },
  uk: {
    weight: [
      {
        id:   'insight_accountability_A',
        text: "Люди з твоїми показниками зазнають невдачі не через їжу чи фізичні вправи. Вони зазнають невдачі тому, що немає нікого, хто тримав би їх підзвітними щодня. Саме тому я тут.",
      },
      {
        id:   'insight_pattern_B',
        text: "Я бачила цей паттерн багато разів. Проблема не в тому, що ти їси — а в тому, що ніхто не спостерігав за твоїм прогресом разом з тобою. До цього моменту.",
      },
    ],
    sleep: [
      {
        id:   'insight_accountability_A',
        text: "Поганий сон — це не проблема дисципліни. Це проблема системи. А системи потребують когось, хто побудує їх разом з тобою — а не просто дасть чекліст.",
      },
      {
        id:   'insight_pattern_B',
        text: "Твої дані про сон говорять мені одну конкретну річ: тобі потрібна стабільна структура, а не більше порад. Я збираюся побудувати її разом з тобою.",
      },
    ],
  },
}

/** Fallback when cluster has no variants. */
export const INSIGHT_FALLBACK: Record<string, ScriptVariant> = {
  en: {
    id:   'insight_accountability_A',
    text: "The data is clear — you don't need more information. You need someone in your corner every single day. That's what I'm here for.",
  },
  uk: {
    id:   'insight_accountability_A',
    text: "Дані чіткі — тобі не потрібно більше інформації. Тобі потрібен хтось поруч кожен день. Саме для цього я тут.",
  },
}
