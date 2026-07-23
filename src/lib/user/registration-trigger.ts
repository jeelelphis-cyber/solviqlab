// ─────────────────────────────────────────────────────────────────────────────
// Registration Trigger
//
// Determines WHEN to suggest registration to anonymous users.
// Rule: never interrupt. Only suggest after meaningful value exists.
//
// Trigger conditions (any one sufficient):
//   1. Journey progress ≥ 35% in any active journey
//   2. 3+ instruments completed
//   3. AI Readiness ≥ 60% in any journey
//   4. One step away from a reward unlock
//   5. Approaching the anonymous result history limit (8/10)
//
// The order matters — first matching condition wins (highest urgency first).
// ─────────────────────────────────────────────────────────────────────────────

import type { AnonymousUser, RegistrationTriggerResult } from './types'

const ANONYMOUS_RESULT_LIMIT = 10
const APPROACHING_LIMIT      = 8

const TRIGGER_MESSAGES: Record<string, string> = {
  journey_progress_35:   'Save your journey progress — you\'re more than a third of the way through.',
  three_instruments:     'You\'ve completed 3 instruments. Create a free account to keep your results.',
  ai_nearly_unlocked:    'Your AI Consultation is almost ready. Save your progress to unlock it.',
  reward_unlock_pending: 'You\'re one step from unlocking a reward. Save it to your profile.',
  result_history_limit:  'You\'re approaching the save limit. Create a free account for unlimited history.',
}

export function checkRegistrationTrigger(user: AnonymousUser): RegistrationTriggerResult {
  const completedCount = user.completed_slugs.length

  // ── P0: approaching result history limit ────────────────────────────────────
  if (user.result_history.length >= APPROACHING_LIMIT) {
    return {
      shouldSuggest: true,
      reason: 'result_history_limit',
      message: TRIGGER_MESSAGES['result_history_limit']!,
      urgency: 'high',
    }
  }

  // ── P1: AI nearly unlocked ──────────────────────────────────────────────────
  const maxAI = user.journey_states.reduce((max, j) => Math.max(max, j.ai_readiness), 0)
  if (maxAI >= 60) {
    return {
      shouldSuggest: true,
      reason: 'ai_nearly_unlocked',
      message: TRIGGER_MESSAGES['ai_nearly_unlocked']!,
      urgency: 'high',
    }
  }

  // ── P2: one step from reward ────────────────────────────────────────────────
  const nearReward = user.journey_states.some(j => {
    const stepsLeft = j.total_steps - j.completed_count
    return stepsLeft === 1
  })
  if (nearReward) {
    return {
      shouldSuggest: true,
      reason: 'reward_unlock_pending',
      message: TRIGGER_MESSAGES['reward_unlock_pending']!,
      urgency: 'medium',
    }
  }

  // ── P3: journey progress ≥ 35% ──────────────────────────────────────────────
  const maxProgress = user.journey_states.reduce((max, j) => Math.max(max, j.progress_percent), 0)
  if (maxProgress >= 35) {
    return {
      shouldSuggest: true,
      reason: 'journey_progress_35',
      message: TRIGGER_MESSAGES['journey_progress_35']!,
      urgency: 'medium',
    }
  }

  // ── P4: 3+ instruments completed ───────────────────────────────────────────
  if (completedCount >= 3) {
    return {
      shouldSuggest: true,
      reason: 'three_instruments',
      message: TRIGGER_MESSAGES['three_instruments']!,
      urgency: 'low',
    }
  }

  return { shouldSuggest: false, reason: null, message: null, urgency: 'low' }
}

export { ANONYMOUS_RESULT_LIMIT }
