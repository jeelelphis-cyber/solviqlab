// ─────────────────────────────────────────────────────────────────────────────
// Coach Platform — Event Types
//
// These events are coach-specific additions to the platform EventBus.
// They complement (never replace) the platform events in lib/events/types.ts.
//
// Naming convention: 'coach:<domain>_<verb>' mirrors platform's 'platform:<x>'.
// All events are readonly structs with no behaviour — pure data contracts.
//
// The EventBus (lib/events/) dispatches these the same way as ResultEvent.
// Coach Brain is the primary emitter; UI and Analytics are consumers.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  CoachPersonaId,
  CoachSessionId,
  CoachPlanId,
  CoachGoalId,
  CoachPhase,
  ScriptType,
  MotivationState,
} from '../domain/types'

// ── Shared event shape ────────────────────────────────────────────────────────

/**
 * Every coach event carries these base fields.
 * eventId is the idempotency key — consumers must deduplicate on it.
 */
interface CoachBaseEvent {
  readonly eventId:   string   // UUID
  readonly userId:    string
  readonly timestamp: number   // Date.now()
}

// ── Coach Session lifecycle ───────────────────────────────────────────────────

/** Fired when the user opens Today View or receives a scheduled video. */
export interface CoachSessionStartedEvent extends CoachBaseEvent {
  readonly type:      'coach:session_started'
  readonly payload: {
    readonly sessionId:  CoachSessionId
    readonly personaId:  CoachPersonaId
    readonly planId:     CoachPlanId | null
    readonly phase:      CoachPhase
    readonly trigger:    string
  }
}

/** Fired when the session ends (explicit close or timeout). */
export interface CoachSessionEndedEvent extends CoachBaseEvent {
  readonly type:      'coach:session_ended'
  readonly payload: {
    readonly sessionId:       CoachSessionId
    readonly durationSeconds: number
    readonly videoWatched:    boolean
    readonly videoDuration:   number | null
  }
}

/** Fired when the user transitions between coaching phases. */
export interface CoachPhaseChangedEvent extends CoachBaseEvent {
  readonly type:    'coach:phase_changed'
  readonly payload: {
    readonly fromPhase:  CoachPhase
    readonly toPhase:    CoachPhase
    readonly reason:     string
    readonly personaId:  CoachPersonaId
  }
}

// ── Daily lifecycle ───────────────────────────────────────────────────────────

/** Fired when a daily review (morning or evening) is computed and stored. */
export interface DailyReviewCompletedEvent extends CoachBaseEvent {
  readonly type:    'coach:daily_review_completed'
  readonly payload: {
    readonly date:            string   // 'YYYY-MM-DD'
    readonly period:          'morning' | 'evening'
    readonly adherenceRate:   number   // 0–1
    readonly adaptationNeeded: boolean
  }
}

/** Fired at the start of the user's morning coaching routine. */
export interface MorningRoutineStartedEvent extends CoachBaseEvent {
  readonly type:    'coach:morning_routine_started'
  readonly payload: {
    readonly sessionId:  CoachSessionId
    readonly personaId:  CoachPersonaId
    readonly scriptType: ScriptType
    readonly videoJobId: string | null
  }
}

/** Fired at the start of the user's evening coaching routine. */
export interface EveningRoutineStartedEvent extends CoachBaseEvent {
  readonly type:    'coach:evening_routine_started'
  readonly payload: {
    readonly sessionId:  CoachSessionId
    readonly personaId:  CoachPersonaId
    readonly scriptType: ScriptType
  }
}

// ── User actions ──────────────────────────────────────────────────────────────

/**
 * Fired when a user submits their daily check-in (task completion + mood).
 * Triggers DailyHistoryNode update and Daily Review Module.
 */
export interface UserCheckedInEvent extends CoachBaseEvent {
  readonly type:    'coach:user_checked_in'
  readonly payload: {
    readonly date:          string   // 'YYYY-MM-DD'
    readonly period:        'morning' | 'evening'
    readonly taskCompleted: boolean
    readonly moodRating:    number | null   // 1–5
    readonly energyRating:  number | null   // 1–5
    readonly notes:         string | null
  }
}

/** Fired when the user modifies an active goal. */
export interface GoalUpdatedEvent extends CoachBaseEvent {
  readonly type:    'coach:goal_updated'
  readonly payload: {
    readonly goalId:     CoachGoalId
    readonly field:      'targetValue' | 'description' | 'status' | 'targetDate'
    readonly oldValue:   unknown
    readonly newValue:   unknown
  }
}

/**
 * Fired when Coach Brain dispatches 'coach:plan_adapt' to trigger
 * PlannerEngine.adapt() via Pipeline stage P48 (Architecture Bible v2.1 §04, C2).
 *
 * This is the ONLY authorised path for plan mutation from Coach Brain (P-16).
 */
export interface PlanChangedEvent extends CoachBaseEvent {
  readonly type:    'coach:plan_adapt'
  readonly payload: {
    readonly planId:          CoachPlanId
    readonly reason:          'energy_low' | 'motivation_critical' | 'off_track_sustained'
    readonly week:            number
    readonly actualValue:     number
    readonly subjectiveScore: number
    readonly notes:           string | null
  }
}

// ── Biometric metrics ─────────────────────────────────────────────────────────

/** Fired when the user logs a sleep record. */
export interface SleepRecordedEvent extends CoachBaseEvent {
  readonly type:    'coach:sleep_recorded'
  readonly payload: {
    readonly date:         string   // 'YYYY-MM-DD'
    readonly hoursSlept:   number
    readonly quality:      1 | 2 | 3 | 4 | 5 | null
  }
}

/** Fired when the user logs a weight measurement. */
export interface WeightRecordedEvent extends CoachBaseEvent {
  readonly type:    'coach:weight_recorded'
  readonly payload: {
    readonly date:     string   // 'YYYY-MM-DD'
    readonly valueKg:  number
    readonly unit:     'kg' | 'lbs'
  }
}

/** Fired when the user submits a mood/energy self-report. */
export interface MoodRecordedEvent extends CoachBaseEvent {
  readonly type:    'coach:mood_recorded'
  readonly payload: {
    readonly date:          string
    readonly period:        'morning' | 'evening'
    readonly moodRating:    number    // 1–5
    readonly energyRating:  number    // 1–5
    readonly context:       string | null
  }
}

// ── Coach outputs ─────────────────────────────────────────────────────────────

/** Fired when VideoProvider successfully queues or delivers a video. */
export interface VideoGeneratedEvent extends CoachBaseEvent {
  readonly type:    'coach:video_generated'
  readonly payload: {
    readonly jobId:      string
    readonly scriptType: ScriptType
    readonly provider:   string     // 'heygen' | 'synthesia' | 'text_fallback'
    readonly status:     'queued' | 'ready'
    readonly estimatedSeconds: number
  }
}

/** Fired when Coach Brain sends a text message to the user. */
export interface CoachMessageSentEvent extends CoachBaseEvent {
  readonly type:    'coach:message_sent'
  readonly payload: {
    readonly channel:    'push' | 'email' | 'in_app'
    readonly scriptType: ScriptType
    readonly trigger:    string
  }
}

/** Fired when the Intervention Engine determines an intervention is needed. */
export interface CoachInterventionTriggeredEvent extends CoachBaseEvent {
  readonly type:    'coach:intervention_triggered'
  readonly payload: {
    readonly level:      1 | 2 | 3 | 4 | 5
    readonly reason:     string
    readonly scriptType: ScriptType
    readonly videoUsed:  boolean
  }
}

/**
 * Fired by Coach Brain each time it completes a decision cycle.
 * Consumers use this for audit logging and analytics.
 */
export interface CoachDecisionMadeEvent extends CoachBaseEvent {
  readonly type:    'coach:decision_made'
  readonly payload: {
    readonly decisionId:        string
    readonly trigger:           string
    readonly scriptType:        ScriptType
    readonly motivationState:   MotivationState
    readonly interventionLevel: 1 | 2 | 3 | 4 | 5 | null
    readonly firedRuleId:       string
  }
}

// ── Union type & handler ──────────────────────────────────────────────────────

/**
 * Union of all coach-specific events.
 * Consumers switch on `event.type` — exhaustiveness is enforced by TypeScript.
 */
export type CoachEvent =
  | CoachSessionStartedEvent
  | CoachSessionEndedEvent
  | CoachPhaseChangedEvent
  | DailyReviewCompletedEvent
  | MorningRoutineStartedEvent
  | EveningRoutineStartedEvent
  | UserCheckedInEvent
  | GoalUpdatedEvent
  | PlanChangedEvent
  | SleepRecordedEvent
  | WeightRecordedEvent
  | MoodRecordedEvent
  | VideoGeneratedEvent
  | CoachMessageSentEvent
  | CoachInterventionTriggeredEvent
  | CoachDecisionMadeEvent

/**
 * Contract for any module that reacts to coach events.
 *
 * Mirrors EventHandler from lib/events/types.ts for structural consistency,
 * but typed to CoachEvent so coaches never accidentally handle platform events.
 */
export interface CoachEventHandler {
  readonly name:     string
  /** Lower = higher priority. Aligns with platform EventHandler.priority convention. */
  readonly priority: number
  readonly async?:   boolean
  handle(event: CoachEvent): void | Promise<void>
}
