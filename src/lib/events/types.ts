import type { IntentCluster } from '../assessment/types'

// ── Tier 1: Instrument Events ─────────────────────────────────────────────────
// Emitted by instruments (calculators, assessments, planners).
// The only event instruments ever produce.

export interface ResultEvent {
  readonly type: 'solviqlab:result'
  readonly eventId: string            // UUID — idempotency key
  readonly slug: string               // 'bmi-calculator'
  readonly name: string               // 'BMI Calculator'
  readonly value: number | null       // primary numeric value
  readonly label: string | null       // 'Normal Weight'
  readonly category: string | null    // 'normal'
  readonly unit: string | null        // 'kg/m²'
  readonly metadata: Readonly<Record<string, unknown>>
  readonly timestamp: number          // Date.now()
  readonly sessionId?: string
}

// ── Tier 2: Platform State Events ────────────────────────────────────────────
// Emitted by platform handlers. UI listens to these, not to ResultEvent.

export interface IntentStateUpdatedEvent {
  readonly type: 'platform:intent_state_updated'
  readonly eventId: string
  readonly userId: string
  readonly clusterId: string | null
  readonly changedFields: readonly string[]
  readonly timestamp: number
}

export interface ProfileRecalculatedEvent {
  readonly type: 'platform:profile_recalculated'
  readonly eventId: string
  readonly userId: string
  readonly domainsChanged: readonly string[]
  readonly overallConfidenceDelta: number
  readonly timestamp: number
}

export interface AssessmentTriggeredEvent {
  readonly type: 'platform:assessment_triggered'
  readonly eventId: string
  readonly userId: string
  readonly cluster: IntentCluster
  readonly reason: 'threshold_met' | 'instruments_complete' | 'user_requested'
  readonly timestamp: number
}

export interface RecommendationUpdatedEvent {
  readonly type: 'platform:recommendation_updated'
  readonly eventId: string
  readonly userId: string
  readonly topSlug: string | null
  readonly timestamp: number
}

export interface JourneyStepCompletedEvent {
  readonly type: 'platform:journey_step_completed'
  readonly eventId: string
  readonly userId: string
  readonly journeyId: string
  readonly stepSlug: string
  readonly progress: number           // 0.0 – 1.0
  readonly journeyComplete: boolean
  readonly timestamp: number
}

// Union of all platform events
export type PlatformEvent =
  | IntentStateUpdatedEvent
  | ProfileRecalculatedEvent
  | AssessmentTriggeredEvent
  | RecommendationUpdatedEvent
  | JourneyStepCompletedEvent

// ── Handler ───────────────────────────────────────────────────────────────────

export interface HandlerContext {
  // Platform events emitted during this handler run
  // Other handlers (and UI) will receive them after the chain completes
  emit(event: PlatformEvent): void
}

export interface EventHandler {
  readonly name: string
  readonly priority: number           // 10=UserEngine, 20=ProfileEngine, etc.
  readonly async?: boolean            // if true: fire-and-forget (P80 Analytics)
  handle(event: ResultEvent, ctx: HandlerContext): void | Promise<void>
}
