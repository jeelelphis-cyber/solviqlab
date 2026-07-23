// ─────────────────────────────────────────────────────────────────────────────
// StrategyEngine — Selects the optimal strategy for a given IntentCluster.
//
// Reads: assessment score + profile confidence
// Writes: StrategyDecision (via UserEngine — never directly)
//
// Design:
//   - Pure function evaluate() — deterministic, testable, no side effects
//   - Config-as-data: each cluster has a ClusterStrategyConfig
//   - Never hardcodes strategy names — reads from config
//   - Always returns a decision, even with minimal data (falls back to default)
// ─────────────────────────────────────────────────────────────────────────────

import type { StrategyDecision } from '../domain/strategy-decision'
import type { StrategyEvaluation, StrategyOption, ClusterStrategyConfig } from './types'
import { weightStrategyConfig } from './configs/weight'

// ── Config Registry ───────────────────────────────────────────────────────────

const STRATEGY_REGISTRY: Record<string, ClusterStrategyConfig> = {
  weight: weightStrategyConfig,
}

// ── ID ────────────────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

// ── StrategyEngine ────────────────────────────────────────────────────────────

export class StrategyEngine {

  evaluate(input: StrategyEvaluation): StrategyDecision {
    const config = STRATEGY_REGISTRY[input.cluster]
    if (!config) return this.unknownClusterDecision(input)

    const { available, disqualified, recommended } = this.classify(config, input)

    return {
      decision_id:              uid(),
      cluster:                  input.cluster,
      assessment_id:            input.assessmentId,
      selected_strategy_id:     recommended.id,
      selected_strategy_name:   recommended.name,
      available_strategies:     available.map(s => s.id),
      disqualified_strategies:  disqualified.map(s => ({
        id:     s.strategy.id,
        reason: s.reason,
      })),
      decided_at: new Date().toISOString(),
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private classify(
    config: ClusterStrategyConfig,
    input: StrategyEvaluation,
  ): {
    available: StrategyOption[]
    disqualified: Array<{ strategy: StrategyOption; reason: string }>
    recommended: StrategyOption
  } {
    const available: StrategyOption[] = []
    const disqualified: Array<{ strategy: StrategyOption; reason: string }> = []

    for (const strategy of config.strategies) {
      if (strategy.disqualifiedWhen) {
        const minScore = strategy.disqualifiedWhen.minAssessmentScore ?? 0
        if (input.assessmentScore < minScore) {
          disqualified.push({ strategy, reason: strategy.disqualifiedWhen.reason })
          continue
        }
      }
      available.push(strategy)
    }

    // Pick recommended: highest-scoring strategy that the user qualifies for
    // If user stated pace preference, honor it
    let recommended = available.find(s => s.id === input.userPacePreference)
      ?? this.selectByScore(available, input)
      ?? available.find(s => s.id === config.defaultStrategyId)
      ?? available[0]
      ?? config.strategies[0]!

    return { available, disqualified, recommended }
  }

  private selectByScore(
    available: StrategyOption[],
    input: StrategyEvaluation,
  ): StrategyOption | undefined {
    // Filter to strategies where recommendedWhen conditions are met
    const eligible = available.filter(s => {
      const min = s.recommendedWhen.minAssessmentScore ?? 0
      const max = s.recommendedWhen.maxAssessmentScore ?? 100
      return input.assessmentScore >= min && input.assessmentScore <= max
    })

    // Prefer highest riskLevel that the data supports
    // (high confidence → fast-track ok; low confidence → conservative)
    if (input.profileConfidence >= 60 && eligible.some(s => s.riskLevel === 'medium')) {
      return eligible.find(s => s.riskLevel === 'medium')
    }
    return eligible.find(s => s.riskLevel === 'low') ?? eligible[0]
  }

  private unknownClusterDecision(input: StrategyEvaluation): StrategyDecision {
    return {
      decision_id:              uid(),
      cluster:                  input.cluster,
      assessment_id:            input.assessmentId,
      selected_strategy_id:     'balanced',
      selected_strategy_name:   'Balanced Approach',
      available_strategies:     ['balanced'],
      disqualified_strategies:  [],
      decided_at:               new Date().toISOString(),
    }
  }
}

let _strategyEngine: StrategyEngine | null = null
export function getStrategyEngine(): StrategyEngine {
  _strategyEngine ??= new StrategyEngine()
  return _strategyEngine
}
