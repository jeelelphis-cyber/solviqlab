// ─────────────────────────────────────────────────────────────────────────────
// QuizEngine — Sprint M-2 (branching + clinical scoring)
// ─────────────────────────────────────────────────────────────────────────────

import type { QuizConfig, QuizAnswer, QuizResult, QuizQuestion } from './types'
import { QUIZ_REGISTRY } from './registry'

export class QuizEngine {
  /**
   * Given current answers, return the next QuizQuestion to show.
   * Supports branching (option.next) and linear (question.next).
   * Returns null when quiz is complete.
   */
  getNextQuestion(
    config:    QuizConfig,
    answered:  QuizAnswer[],
  ): QuizQuestion | null {
    if (answered.length === 0) return config.questions[0] ?? null

    const lastAnswer  = answered[answered.length - 1]!
    const lastQ       = config.questions.find(q => q.id === lastAnswer.questionId)
    if (!lastQ) return null

    // Check if the chosen option has a branch target
    const chosenOption = lastQ.options?.find(o => o.value === lastAnswer.value)
    const branchTarget = chosenOption?.next ?? lastQ.next

    if (branchTarget) {
      return config.questions.find(q => q.id === branchTarget) ?? null
    }

    // Linear: next in array
    const idx = config.questions.findIndex(q => q.id === lastQ.id)
    return config.questions[idx + 1] ?? null
  }

  /** Compute score and result from all answers */
  compute(config: QuizConfig, answers: QuizAnswer[]): QuizResult {
    const rawSum  = answers.reduce((acc, a) => acc + a.value, 0)
    const maxRaw  = config.scoring.max
    const normalize = config.scoring.normalize !== false  // default true

    const score   = normalize
      ? (maxRaw > 0 ? Math.round((rawSum / maxRaw) * 100) : 0)
      : rawSum

    const clamped = normalize
      ? Math.max(0, Math.min(100, score))
      : score

    const bucket  = config.scoring.buckets.find(
      b => clamped >= b.min && clamped <= b.max,
    ) ?? config.scoring.buckets[config.scoring.buckets.length - 1]!

    return {
      slug:        config.slug,
      score:       normalize ? clamped : Math.round((rawSum / maxRaw) * 100),
      rawScore:    normalize ? undefined : rawSum,
      bucket:      bucket.label,
      severity:    bucket.severity,
      description: bucket.description,
      actions:     bucket.actions,
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
