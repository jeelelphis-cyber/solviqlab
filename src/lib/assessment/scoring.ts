// ── Scoring DSL Evaluator ─────────────────────────────────────────────────────
// Evaluates ScoringRule (pure data) against a ResolvedSignals map.
// Returns a score 0–100. Missing signals degrade gracefully (return ~50).

import type { ScoringRule, ScoreThreshold, ResolvedSignals } from './types'
import type { SignalStatus } from '../profile/types'

// ── Threshold Lookup ──────────────────────────────────────────────────────────

function applyThresholds(value: number, thresholds: readonly ScoreThreshold[]): number {
  const sorted = [...thresholds].sort((a, b) => a.max - b.max)
  for (const t of sorted) {
    if (value <= t.max) return t.score
  }
  // value exceeds all thresholds → use last (highest max) score
  return sorted[sorted.length - 1]?.score ?? 50
}

function averageThresholds(
  value: number,
  male: readonly ScoreThreshold[],
  female: readonly ScoreThreshold[]
): number {
  return Math.round((applyThresholds(value, male) + applyThresholds(value, female)) / 2)
}

// ── Main Evaluator ────────────────────────────────────────────────────────────

/**
 * Evaluate a ScoringRule given resolved signals and an optional gender.
 * Never throws — missing/unknown signals return a neutral score.
 */
export function evaluateScoringRule(
  rule: ScoringRule,
  signals: ResolvedSignals,
  gender?: 'male' | 'female'
): number {
  switch (rule.type) {
    case 'signal_value_threshold': {
      const signal = signals[rule.metric]
      const value = signal?.value

      if (value == null) return 50 // missing data → neutral

      if (rule.gender_variant) {
        if (gender === 'male')   return applyThresholds(value, rule.gender_variant.male)
        if (gender === 'female') return applyThresholds(value, rule.gender_variant.female)
        // gender unknown → average both
        return averageThresholds(value, rule.gender_variant.male, rule.gender_variant.female)
      }

      if (rule.thresholds && rule.thresholds.length > 0) {
        return applyThresholds(value, rule.thresholds)
      }

      return 50 // config error: no thresholds provided
    }

    case 'signal_status_map': {
      const signal = signals[rule.metric]
      const status: SignalStatus = signal?.status ?? 'unknown'
      return rule.status_scores[status] ?? 50
    }

    case 'signal_presence': {
      const present = rule.metric in signals && signals[rule.metric] != null
      return present ? rule.score_if_present : rule.score_if_absent
    }

    case 'composite_weighted': {
      if (rule.rules.length === 0) return 50

      let totalWeight = 0
      let weightedSum = 0

      for (const { rule: subRule, weight } of rule.rules) {
        const score = evaluateScoringRule(subRule, signals, gender)
        weightedSum += score * weight
        totalWeight += weight
      }

      return totalWeight === 0 ? 50 : Math.round(weightedSum / totalWeight)
    }
  }
}

/** Extract all metric names referenced by a ScoringRule (for display/debug). */
export function extractMetrics(rule: ScoringRule): readonly string[] {
  switch (rule.type) {
    case 'signal_value_threshold':
    case 'signal_status_map':
    case 'signal_presence':
      return [rule.metric]
    case 'composite_weighted':
      return rule.rules.flatMap(({ rule: r }) => extractMetrics(r))
  }
}
