// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Scoring Model
//
// Composite score = Need × Confidence × JourneyImportance × CompletionProbability
// Each factor: 0.0–1.0
// Composite: 0–100
//
// Every factor function is pure and unit-testable.
// The scoring model is intentionally transparent — AI Coach reads
// scoring.factors[] to generate natural-language explanations.
// ─────────────────────────────────────────────────────────────────────────────

import type { Candidate, ScoringBreakdown } from './types'

// ── Score a Candidate ─────────────────────────────────────────────────────────

export function scoreCandidate(c: Candidate): ScoringBreakdown {
  const composite = Math.round(
    c.need * c.confidence * c.journey_importance * c.completion_probability * 100
  )

  return {
    need:                   c.need,
    confidence:             c.confidence,
    journey_importance:     c.journey_importance,
    completion_probability: c.completion_probability,
    composite,
    factors:                c.factors,
  }
}

// ── Need Score ────────────────────────────────────────────────────────────────

/**
 * How much does the user need this recommendation right now?
 *
 * High need (0.8–1.0):
 *   - Next step in active journey
 *   - One step from reward unlock
 *   - AI nearly unlocked
 *   - Registration urgently needed (result limit)
 *
 * Medium need (0.5–0.7):
 *   - Step in a secondary journey
 *   - Useful but not critical
 *
 * Low need (0.2–0.4):
 *   - Cross-journey suggestion
 *   - Return/check-in
 */
export function needScore(params: {
  isNextInPrimaryJourney: boolean
  isOneStepFromReward:    boolean
  isAIUnlockable:         boolean
  isRegistrationUrgent:   boolean
  isInSecondaryJourney:   boolean
  isCrossJourney:         boolean
}): { score: number; factors: string[] } {
  const factors: string[] = []
  let score = 0.3  // baseline

  if (params.isRegistrationUrgent) {
    score = Math.max(score, 0.95)
    factors.push('result history approaching limit')
  }
  if (params.isAIUnlockable) {
    score = Math.max(score, 0.90)
    factors.push('AI consultation is unlockable')
  }
  if (params.isOneStepFromReward) {
    score = Math.max(score, 0.88)
    factors.push('one step away from reward unlock')
  }
  if (params.isNextInPrimaryJourney) {
    score = Math.max(score, 0.85)
    factors.push('next step in active journey')
  }
  if (params.isInSecondaryJourney) {
    score = Math.max(score, 0.60)
    factors.push('part of a secondary journey')
  }
  if (params.isCrossJourney) {
    score = Math.max(score, 0.35)
    factors.push('opens a new journey category')
  }

  return { score, factors }
}

// ── Confidence Score ──────────────────────────────────────────────────────────

/**
 * How confident are we in this recommendation?
 *
 * High (0.85–0.95): based on journey config (known good path)
 * Medium (0.60–0.80): based on user's prior pattern
 * Low (0.40–0.55): fallback / generic
 */
export function confidenceScore(params: {
  source: 'journey_config' | 'user_pattern' | 'category_default' | 'fallback'
  journeyStepsCompleted: number
}): { score: number; factors: string[] } {
  const factors: string[] = []
  let score: number

  switch (params.source) {
    case 'journey_config':
      score = params.journeyStepsCompleted >= 2 ? 0.93 : 0.85
      factors.push('recommendation from validated journey path')
      break
    case 'user_pattern':
      score = 0.72
      factors.push('based on your previous activity pattern')
      break
    case 'category_default':
      score = 0.58
      factors.push('popular in your health category')
      break
    case 'fallback':
    default:
      score = 0.44
      factors.push('general recommendation')
  }

  if (params.journeyStepsCompleted >= 3) {
    score = Math.min(score + 0.05, 1.0)
    factors.push('strong journey history increases accuracy')
  }

  return { score, factors }
}

// ── Journey Importance Score ──────────────────────────────────────────────────

/**
 * How important is this step to the user's journey progress?
 */
export function journeyImportanceScore(params: {
  isOnPrimaryJourney: boolean
  isOnSecondaryJourney: boolean
  completionPercent: number        // current journey completion %
  stepsUntilUnlock: number
}): { score: number; factors: string[] } {
  const factors: string[] = []
  let score = 0.25  // not in any journey

  if (params.isOnPrimaryJourney) {
    // Importance grows as the user gets closer to completion
    const proximity = params.completionPercent / 100
    score = 0.65 + (proximity * 0.30)  // 0.65 → 0.95
    factors.push(`${params.completionPercent}% through primary journey`)

    if (params.stepsUntilUnlock <= 1) {
      score = Math.min(score + 0.10, 1.0)
      factors.push('final step before reward unlock')
    }
  } else if (params.isOnSecondaryJourney) {
    score = 0.55
    factors.push('continues a secondary journey')
  }

  return { score, factors }
}

// ── Completion Probability Score ──────────────────────────────────────────────

/**
 * How likely is this user to actually complete this action right now?
 * Based on cognitive load, time, and user momentum.
 */
export function completionProbabilityScore(params: {
  estimatedMinutes: number
  userHasMomentum: boolean   // completed something recently (within this session)
  isRegistrationRequired: boolean
  typeIsCalculator: boolean
}): { score: number; factors: string[] } {
  const factors: string[] = []
  let score: number

  // Base: time estimate
  if (params.estimatedMinutes <= 1)       { score = 0.90; factors.push('takes only 1 minute') }
  else if (params.estimatedMinutes <= 2)  { score = 0.85; factors.push('takes 2 minutes') }
  else if (params.estimatedMinutes <= 3)  { score = 0.75; factors.push('takes about 3 minutes') }
  else if (params.estimatedMinutes <= 5)  { score = 0.60; factors.push('takes 5 minutes') }
  else                                    { score = 0.40; factors.push(`takes ${params.estimatedMinutes} minutes`) }

  if (params.userHasMomentum) {
    score = Math.min(score + 0.10, 1.0)
    factors.push('you are in an active session')
  }
  if (params.typeIsCalculator) {
    score = Math.min(score + 0.05, 1.0)
    factors.push('familiar calculator format')
  }
  if (params.isRegistrationRequired) {
    score = Math.max(score - 0.20, 0.10)
    factors.push('requires account creation')
  }

  return { score, factors }
}

// ── Composite ─────────────────────────────────────────────────────────────────

export function computeComposite(
  need: number,
  confidence: number,
  journeyImportance: number,
  completionProbability: number
): number {
  return Math.round(need * confidence * journeyImportance * completionProbability * 100)
}
