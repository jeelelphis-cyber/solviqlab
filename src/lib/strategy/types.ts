import type { IntentCluster } from '../assessment/types'

// ── StrategyOption ────────────────────────────────────────────────────────────
// A single available strategy for a cluster.
// Defined in cluster configs — engine never hardcodes strategies.

export interface StrategyOption {
  readonly id: string                    // 'balanced' | 'fast-track' | 'muscle-preserve'
  readonly name: string
  readonly description: string
  readonly weeklyChangeRate: number      // absolute change per week (e.g. -0.5 kg)
  readonly durationHint: string          // "16–24 weeks"
  readonly riskLevel: 'low' | 'medium' | 'high'
  readonly recommendedWhen: {
    readonly minAssessmentScore?: number // recommend when score >= this
    readonly maxAssessmentScore?: number // recommend when score <= this
    readonly requiresHighConfidence?: boolean
  }
  readonly disqualifiedWhen?: {
    readonly minAssessmentScore?: number // disqualify when score < this
    readonly reason: string              // 'insufficient_data' | 'health_risk'
  }
}

// ── ClusterStrategyConfig ─────────────────────────────────────────────────────
// Per-cluster strategy configuration.
// Add a new cluster = add one config file.

export interface ClusterStrategyConfig {
  readonly cluster: IntentCluster
  readonly strategies: readonly StrategyOption[]
  readonly defaultStrategyId: string    // used when score is ambiguous
  readonly goalInputRequired: boolean   // does user need to input a goal value?
  readonly goalUnit: string             // 'kg' | 'bmi' | 'hours'
  readonly goalDescription: string      // "Target weight in kg"
}

// ── StrategyEvaluation (input) ────────────────────────────────────────────────

export interface StrategyEvaluation {
  readonly userId: string
  readonly cluster: IntentCluster
  readonly assessmentId: string
  readonly assessmentScore: number      // 0–100 (from assessment result)
  readonly profileConfidence: number   // overall profile confidence 0–100
  readonly currentValue: number        // current metric (e.g. 85 kg)
  readonly goalValue: number | null    // user-stated goal (null = auto-compute)
  readonly userPacePreference?: 'slow' | 'balanced' | 'fast'
}
