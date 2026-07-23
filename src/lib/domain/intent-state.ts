import type { IntentCluster } from '../assessment/types'
import type { AssessmentResult } from '../assessment/types'
import type { ResultRecord } from '../user/types'
import type { StrategyDecision } from './strategy-decision'
import type { ActivePlan } from './active-plan'

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
