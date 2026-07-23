import type { IntentCluster } from '../assessment/types'

export interface StrategyDecision {
  readonly decision_id: string            // UUID
  readonly cluster: IntentCluster
  readonly assessment_id: string          // which AssessmentResult triggered this
  readonly selected_strategy_id: string   // 'balanced' | 'fast-track' | 'muscle-preserve'
  readonly selected_strategy_name: string
  readonly available_strategies: readonly string[]
  readonly disqualified_strategies: readonly {
    readonly id: string
    readonly reason: string               // 'high_stress_detected' | 'sleep_deficit'
  }[]
  readonly decided_at: string             // ISO timestamp
}
