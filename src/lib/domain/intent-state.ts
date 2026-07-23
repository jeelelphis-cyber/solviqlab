import type { IntentCluster, AssessmentResult } from '../assessment/types'
import type { ResultRecord, SolviqUser } from '../user/types'
import type { StrategyDecision } from './strategy-decision'
import type { ActivePlan } from './active-plan'
import type { RecommendationDecision } from '../recommendation/decision'

// The phase a user is in for a given Intent Cluster
export type IntentPhase =
  | 'discovery'    // using entry instruments (calculators), no assessment yet
  | 'assessment'   // assessment triggered, waiting for user to complete it
  | 'planning'     // assessment done, strategy selected, building a plan
  | 'execution'    // active plan, doing weekly check-ins
  | 'habit'        // plan complete, maintaining results

// IntentState is the main platform object — one per user per cluster.
// UserEngine is the ONLY writer.
// All other engines read this object.
export interface IntentState {
  readonly userId: string
  readonly clusterId: IntentCluster
  readonly createdAt: string              // ISO timestamp
  readonly updatedAt: string              // ISO timestamp

  // Aggregate: grows over time, never shrinks
  readonly completedInstruments: readonly ResultRecord[]

  // Value Objects: each replaced entirely when updated, never patched
  readonly latestAssessment: AssessmentResult | null
  readonly latestStrategy: StrategyDecision | null

  // Entity: mutable (status changes, check_ins append), replaced as whole
  readonly activePlan: ActivePlan | null

  // Intent context
  readonly primaryGoal: string | null     // user-stated goal
  readonly currentPhase: IntentPhase
  readonly lastActiveAt: string           // ISO timestamp

  // P-16 + P-17: stored by EventBus P60 with full provenance (slug, score, reasons, alternatives)
  readonly recommendationDecision: import('../recommendation/decision').RecommendationDecision | null
}

// Commands — the only way to create a new IntentState (UserEngine applies these)
export interface StoreResultCommand {
  readonly type: 'store_result'
  readonly result: ResultRecord
}

export interface SetAssessmentCommand {
  readonly type: 'set_assessment'
  readonly assessment: AssessmentResult
}

export interface SetStrategyCommand {
  readonly type: 'set_strategy'
  readonly strategy: StrategyDecision
}

export interface SetPlanCommand {
  readonly type: 'set_plan'
  readonly plan: ActivePlan
}

export interface SetGoalCommand {
  readonly type: 'set_goal'
  readonly goal: string
}

export type IntentStateCommand =
  | StoreResultCommand
  | SetAssessmentCommand
  | SetStrategyCommand
  | SetPlanCommand
  | SetGoalCommand

// ── Assessment slugs (canonical list for phase computation) ───────────────────
export const ASSESSMENT_SLUGS = new Set([
  'weight-assessment',
  'sleep-assessment',
  'finance-assessment',
])

// ── Phase computation ─────────────────────────────────────────────────────────
// Derives the user's current intent phase from observable state.
// Deterministic — no side effects.
export function computePhase(
  completedSlugs: readonly string[],
  latestAssessment: AssessmentResult | null,
  latestStrategy: StrategyDecision | null,
  activePlan: ActivePlan | null,
): IntentPhase {
  if (activePlan?.status === 'completed') return 'habit'
  if (activePlan && activePlan.check_ins.length > 0) return 'execution'
  if (activePlan) return 'planning'
  if (latestStrategy) return 'planning'
  if (latestAssessment) return 'assessment'
  if (completedSlugs.some(s => ASSESSMENT_SLUGS.has(s))) return 'assessment'
  return 'discovery'
}

// ── Aggregate Read Model builder ──────────────────────────────────────────────
// Assembles IntentState from scattered storage keys.
// This is a pure projection — no storage writes.
export function buildIntentState(
  clusterId: IntentCluster,
  user: SolviqUser,
  latestAssessment: AssessmentResult | null,
  latestStrategy: StrategyDecision | null,
  activePlan: ActivePlan | null,
  recommendationDecision: RecommendationDecision | null,
): IntentState {
  const currentPhase = computePhase(
    user.completed_slugs,
    latestAssessment,
    latestStrategy,
    activePlan,
  )
  return {
    userId:               user.id,
    clusterId,
    createdAt:            user.created_at,
    updatedAt:            user.last_active_at,
    completedInstruments: user.result_history,
    latestAssessment,
    latestStrategy,
    activePlan,
    primaryGoal:          activePlan?.goal ?? null,
    currentPhase,
    lastActiveAt:         user.last_active_at,
    recommendationDecision,
  }
}
