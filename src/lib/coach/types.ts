import type { IntentCluster } from '../assessment/types'
import type { IntentPhase } from '../domain/intent-state'

// ─────────────────────────────────────────────────────────────────────────────
// Coach Architecture v1.2 — Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export const COACH_VERSION = '1.2'

// ── Priority ──────────────────────────────────────────────────────────────────

export type CoachPriority = 'critical' | 'high' | 'normal' | 'low'
// critical → warning (off-track, overdue)
// high     → celebration / milestone
// normal   → guidance
// low      → reflection

// ── Triggers ─────────────────────────────────────────────────────────────────

export type CoachTrigger =
  | 'assessment:completed'
  | 'assessment:strategy_ready'
  | 'plan:created'
  | 'plan:check_in'
  | 'plan:check_in_overdue'
  | 'plan:milestone_reached'
  | 'plan:adapted'
  | 'plan:completed'
  | 'journey:first_result'
  | 'journey:assessment_unlocked'
  | 'dashboard:viewed'

// ── Reason ───────────────────────────────────────────────────────────────────

export type CoachReason =
  // assessment:completed
  | 'excellent_score'
  | 'good_score'
  | 'missing_dimension'
  | 'low_score'
  // plan:created
  | 'strategy_match'       // plan directly follows assessed strategy
  | 'first_plan'           // no prior plan existed for this cluster
  | 'high_confidence_plan' // assessment confidence was established/comprehensive
  | 'conservative_start'   // goal is within 5% of current value
  | 'aggressive_start'     // goal requires >20% change from current value
  // plan:check_in (Sprint 3)
  | 'on_track'
  | 'off_track'
  | 'milestone_approaching'
  | 'check_in_overdue'
  // plan:milestone_reached / plan:completed
  | 'milestone_reached'
  | 'goal_achieved'
  // journey
  | 'first_result'
  | 'assessment_unlocked'
  | 'no_context'

// ── Decision ─────────────────────────────────────────────────────────────────

export interface CoachDecision {
  readonly trigger: CoachTrigger
  readonly reason:  CoachReason
}

// ── Message Types ─────────────────────────────────────────────────────────────

export type CoachMessageType = 'insight' | 'warning' | 'celebration' | 'explanation' | 'reflection' | 'preparation'

// ── Actions ──────────────────────────────────────────────────────────────────

// Renderer returns actionId — NavigationResolver converts to URL
export interface CoachAction {
  readonly label:    string
  readonly actionId: import('./navigation').CoachActionId
  readonly type:     'primary' | 'secondary'
}

// ── Template ─────────────────────────────────────────────────────────────────

export interface CoachTemplate {
  readonly title:   string
  readonly body:    string
  readonly actions: readonly CoachAction[]
}

// ── Recommendation (data layer — no rendered text) ───────────────────────────

export interface CoachRecommendation {
  readonly recommendation_id: string
  readonly cluster:           IntentCluster
  readonly phase:             IntentPhase
  readonly decision:          CoachDecision
  readonly type:              CoachMessageType
  readonly priority:          CoachPriority
  readonly template_id:       CoachReason
  readonly data:              CoachDataContext
  readonly coach_version:     string
  readonly generated_at:      string
}

export interface CoachDataContext {
  readonly score?:            number
  readonly strategy?:         string
  readonly week?:             number
  readonly progress_pct?:     number
  readonly deviation?:        number
  readonly dimension?:        string
  readonly goal?:             string
  readonly goal_value?:       number
  readonly current_value?:    number
  readonly duration_weeks?:   number
  readonly check_in_count?:   number
  readonly on_track_weeks?:   number
  readonly milestone_week?:   number
}

// ── Message (presentation layer — text + actions) ────────────────────────────

export interface CoachMessage {
  readonly message_id:    string
  readonly cluster:       IntentCluster
  readonly phase:         IntentPhase
  readonly decision:      CoachDecision
  readonly type:          CoachMessageType
  readonly priority:      CoachPriority
  readonly title:         string
  readonly body:          string
  readonly actions:       readonly CoachAction[]
  readonly generated_at:  string
  readonly data_snapshot: CoachDataContext
}

// ── Memory ───────────────────────────────────────────────────────────────────

export interface CoachMemory {
  readonly cluster:             IntentCluster
  readonly shown_message_ids:   readonly string[]
  readonly acknowledged_ids:    readonly string[]
  readonly last_shown_at:       Record<CoachMessageType, string | null>
  readonly last_category_shown: string | null
}

export function emptyCoachMemory(cluster: IntentCluster): CoachMemory {
  return {
    cluster,
    shown_message_ids:   [],
    acknowledged_ids:    [],
    last_shown_at: {
      insight:     null,
      warning:     null,
      celebration: null,
      explanation: null,
      reflection:  null,
      preparation: null,
    },
    last_category_shown: null,
  }
}

// ── Input ─────────────────────────────────────────────────────────────────────

export interface CoachInput {
  readonly intent:   import('../domain/intent-state').IntentState
  readonly trigger:  CoachTrigger
  readonly lang:     string
}

// re-export for convenience
export type { IntentCluster }
