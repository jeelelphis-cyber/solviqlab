// ── Insight Condition DSL Evaluator ───────────────────────────────────────────
// Evaluates InsightCondition (pure data) against scores and signals.
// Returns boolean — condition is met or not.

import type { InsightCondition, ResolvedSignals } from './types'
import type { SignalStatus } from '../profile/types'

/**
 * Evaluate an InsightCondition.
 *
 * @param condition  - the rule to evaluate
 * @param dimScores  - Map of dimension_id → score (0–100)
 * @param signals    - resolved signal map from ProfileEngine
 * @param overall    - overall assessment score (0–100)
 */
export function evaluateCondition(
  condition: InsightCondition,
  dimScores: ReadonlyMap<string, number>,
  signals: ResolvedSignals,
  overall: number
): boolean {
  switch (condition.type) {
    case 'dimension_score_below':
      return (dimScores.get(condition.dimension) ?? 0) < condition.threshold

    case 'dimension_score_above':
      return (dimScores.get(condition.dimension) ?? 0) > condition.threshold

    case 'overall_score_below':
      return overall < condition.threshold

    case 'overall_score_above':
      return overall > condition.threshold

    case 'signal_status': {
      const signal = signals[condition.metric]
      const status: SignalStatus = signal?.status ?? 'unknown'
      return status === condition.status
    }

    case 'signal_value_below': {
      const value = signals[condition.metric]?.value
      return value != null && value < condition.value
    }

    case 'signal_value_above': {
      const value = signals[condition.metric]?.value
      return value != null && value > condition.value
    }

    case 'signal_value_range': {
      const value = signals[condition.metric]?.value
      if (value == null) return false
      const aboveMin = condition.min == null || value >= condition.min
      const belowMax = condition.max == null || value <= condition.max
      return aboveMin && belowMax
    }

    case 'signal_present':
      return condition.metric in signals && signals[condition.metric] != null

    case 'signal_absent':
      return !(condition.metric in signals) || signals[condition.metric] == null

    case 'and':
      return condition.conditions.every(c =>
        evaluateCondition(c, dimScores, signals, overall)
      )

    case 'or':
      return condition.conditions.some(c =>
        evaluateCondition(c, dimScores, signals, overall)
      )

    case 'not':
      return !evaluateCondition(condition.condition, dimScores, signals, overall)
  }
}
