import type { IntentCluster } from '../assessment/types'

export type PlanStatus = 'active' | 'paused' | 'completed' | 'abandoned'

// Milestone: a checkpoint in the plan at a specific week
// Built by PlannerEngine.build(), revised by PlannerEngine.adapt()
export interface Milestone {
  readonly milestone_id: string           // UUID
  readonly plan_id: string
  readonly week: number                   // target week (1-based)
  readonly target_value: number           // e.g. 82.5 kg
  readonly description: string           // "Week 4: Reduce by 0.5 kg/week"
  readonly is_completed: boolean
  readonly completed_at: string | null
  readonly actual_value: number | null   // filled when completed
}

// CheckIn is a Value Object — immutable after creation, append-only to the plan
export interface CheckIn {
  readonly check_in_id: string            // UUID
  readonly plan_id: string
  readonly week: number                   // 1-based
  readonly actual_value: number           // e.g. actual weight this week
  readonly subjective_score: number       // 1-10 self-reported adherence
  readonly notes: string | null
  readonly on_track: boolean              // computed by PlannerEngine at check-in
  readonly deviation_percent: number      // how far from milestone target
  readonly recorded_at: string            // ISO timestamp
}

export interface ActivePlan {
  readonly plan_id: string                // UUID
  readonly cluster: IntentCluster
  readonly strategy_id: string            // 'balanced' | 'fast-track'
  readonly assessment_id: string          // which assessment this is based on
  readonly goal: string                   // 'Lose 8kg by March 2027'
  readonly goal_value: number             // target metric value (e.g. 72 kg)
  readonly current_value: number          // starting metric value
  readonly start_date: string             // ISO date
  readonly target_date: string            // ISO date (projected)
  readonly duration_weeks: number
  readonly status: PlanStatus
  readonly milestones: readonly Milestone[]  // checkpoints — rebuilt on adapt()
  readonly check_ins: readonly CheckIn[]    // append-only, never mutated
  readonly last_adapted_at: string | null
  readonly created_at: string
  readonly adaptation_count: number          // how many times adapt() was called
}
