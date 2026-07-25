// ─────────────────────────────────────────────────────────────────────────────
// QuizEngine — compute scores and look up configs
// ─────────────────────────────────────────────────────────────────────────────

import type { QuizConfig, QuizAnswer, QuizResult } from './types'
import { QUIZ_REGISTRY } from './registry'

export class QuizEngine {
  /** Sum all answer values → normalize 0–100 → find matching bucket → return QuizResult */
  compute(config: QuizConfig, answers: QuizAnswer[]): QuizResult {
    const rawSum = answers.reduce((acc, a) => acc + a.value, 0)
    const maxRaw = config.scoring.max

    // Normalize to 0–100
    const score = maxRaw > 0 ? Math.round((rawSum / maxRaw) * 100) : 0
    const clamped = Math.max(0, Math.min(100, score))

    // Find matching bucket (buckets defined high→low or low→high, handle both)
    const bucket = config.scoring.buckets.find(
      b => clamped >= b.min && clamped <= b.max
    ) ?? config.scoring.buckets[config.scoring.buckets.length - 1]!

    return {
      slug:        config.slug,
      score:       clamped,
      bucket:      bucket.label,
      description: bucket.description,
      miaHook:     bucket.miaHook,
      answeredAt:  new Date().toISOString(),
    }
  }

  getConfig(slug: string): QuizConfig | null {
    return QUIZ_REGISTRY[slug] ?? null
  }

  getAllSlugs(): string[] {
    return Object.keys(QUIZ_REGISTRY)
  }
}

export const quizEngine = new QuizEngine()
