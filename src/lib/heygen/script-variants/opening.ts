// ─────────────────────────────────────────────────────────────────────────────
// Opening variants — Mia speaks in first person, empathetic not medical.
// 3 variants per language.
// ─────────────────────────────────────────────────────────────────────────────

import type { ScriptVariant } from './types'

export const OPENING_VARIANTS: Record<string, ScriptVariant[]> = {
  en: [
    {
      id:   'opening_mirror_A',
      text: "Hey [name]. I just looked at everything you shared. And I want you to know — I see exactly where you are right now. Not just the numbers. You.",
    },
    {
      id:   'opening_reframe_B',
      text: "Hey [name]. [bmiText or score]. That number isn't a verdict — it's a starting point. And I already know what to do with it.",
    },
    {
      id:   'opening_validation_C',
      text: "Hey [name]. First — what you're going through is real. And it's not about willpower. I see it clearly in your data, and I know exactly where to begin.",
    },
  ],
  uk: [
    {
      id:   'opening_mirror_A',
      text: "Привіт, [name]. Я щойно переглянула все, що ти поділився. І хочу, щоб ти знав — я бачу де ти зараз. Не просто цифри. Тебе.",
    },
    {
      id:   'opening_reframe_B',
      text: "Привіт, [name]. [bmiText or score]. Це не вирок — це точка відліку. І я вже знаю що з цим робити.",
    },
    {
      id:   'opening_validation_C',
      text: "Привіт, [name]. Передусім — те, з чим ти стикаєшся, реальне. Це не про силу волі. Я чітко бачу це в твоїх даних і знаю з чого почати.",
    },
  ],
}
