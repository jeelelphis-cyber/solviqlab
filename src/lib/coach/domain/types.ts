// ─────────────────────────────────────────────────────────────────────────────
// Coach Platform — Domain Model
//
// All entities in this file are immutable by design (readonly everywhere).
// Branded IDs prevent accidental cross-entity ID assignment at compile time.
//
// Relationship to existing types:
//   - CoachDecision here is the Coach Brain output (WHAT to do next).
//     The existing CoachDecision in coach/types.ts is the v1 trigger/reason pair.
//     These are different layers: v1 = routing logic, v2 = Brain output.
//   - CoachMemory here is the platform-level abstract interface (see contracts/).
//     The existing CoachMemory in coach/types.ts is the v1 per-cluster shown_ids tracker.
//   - CoachPhase extends the journey concept from JourneyNode but is coach-specific.
// ─────────────────────────────────────────────────────────────────────────────

import type { IntentCluster } from '../../assessment/types'

// ── Branded ID types ──────────────────────────────────────────────────────────
// Each domain entity has its own opaque ID to prevent accidental substitution.

/** Identifies a specific coach persona (e.g. 'mia', 'alex'). */
export type CoachPersonaId = string & { readonly _brand: 'CoachPersonaId' }

/** Identifies one continuous user↔coach session (from open to explicit end). */
export type CoachSessionId = string & { readonly _brand: 'CoachSessionId' }

/** Identifies a coaching plan spanning 7, 30 or 90 days. */
export type CoachPlanId = string & { readonly _brand: 'CoachPlanId' }

/** Identifies a single user goal within the coaching context. */
export type CoachGoalId = string & { readonly _brand: 'CoachGoalId' }

/** Identifies a scheduled coaching task in a plan. */
export type CoachTaskId = string & { readonly _brand: 'CoachTaskId' }

/** Identifies a logged intervention event. */
export type CoachInterventionId = string & { readonly _brand: 'CoachInterventionId' }

/** Identifies a daily review record (morning or evening). */
export type DailyReviewId = string & { readonly _brand: 'DailyReviewId' }

/** Identifies a coach notification sent or queued. */
export type CoachNotificationId = string & { readonly _brand: 'CoachNotificationId' }

// ── Coach Phase ───────────────────────────────────────────────────────────────

/**
 * Represents where the user is in their coaching lifecycle.
 *
 * Transitions are driven by the CoachStateMachine (see state-machine/types.ts).
 * The phase determines the tone of every Mia message (Architecture Bible v2.1 §02).
 */
export type CoachPhase =
  | 'onboarding'      // Day 0 — quiz + assessment + welcome video
  | 'assessment'      // Awaiting or in-progress assessment
  | 'planning'        // Plan being built from assessment result
  | 'active'          // Daily coaching in progress (Day 1+)
  | 'review'          // Weekly / monthly review in focus
  | 'transformation'  // Day 90+ — goal achieved or near-achieved, next goal forming
  | 'paused'          // User explicitly paused, or weekendMode = 'off'

// ── Script and Motivation types used across domain entities ──────────────────

/**
 * The type of video/text script Coach Brain has selected to deliver.
 * Each type maps to a VideoTemplate in CoachPersonaConfig.videoTemplates.
 */
export type ScriptType =
  | 'morning_standard'
  | 'morning_milestone'
  | 'morning_intervention'
  | 'safety_modified_morning'
  | 'evening_standard'
  | 'intervention'
  | 'milestone'
  | 'celebration'
  | 'week_review'
  | 'month_review'
  | 'positive_reinforcement'
  | 'crisis_finance_coaching'

/**
 * Motivation state as assessed by the Motivation Engine.
 * Drives tone adjustment and intervention level selection.
 */
export type MotivationState = 'high' | 'medium' | 'low' | 'critical'

// ── CoachPersona ──────────────────────────────────────────────────────────────

/**
 * Minimal runtime identifier for an active coach persona.
 * Full configuration lives in CoachPersonaConfig (contracts/index.ts).
 *
 * Separated from config so session records can reference persona without
 * embedding the entire config blob.
 */
export interface CoachPersona {
  readonly id:        CoachPersonaId
  /** Canonical short name displayed to the user. */
  readonly name:      string
  /** The health/finance/etc cluster this coach operates in. */
  readonly cluster:   IntentCluster | 'finance' | 'career' | 'productivity'
  /** HeyGen avatar ID — stable reference to the visual identity. */
  readonly avatarId:  string
  /** HeyGen voice ID — stable reference to the audio identity. */
  readonly voiceId:   string
}

// ── CoachGoal ─────────────────────────────────────────────────────────────────

/**
 * A single user goal within the coaching context.
 *
 * Distinct from GoalEntry in the UserGraph — CoachGoal is coach-aware:
 * it carries the plan reference and knows its milestone progress.
 */
export interface CoachGoal {
  readonly id:              CoachGoalId
  readonly userId:          string
  readonly planId:          CoachPlanId
  /** Human-readable description of what the user wants to achieve. */
  readonly description:     string
  /** The primary measurable metric (e.g. 'weight_kg', 'savings_amount'). */
  readonly primaryMetric:   string
  readonly targetValue:     number
  readonly currentValue:    number
  readonly unit:            string
  readonly status:          'active' | 'achieved' | 'revised' | 'abandoned'
  /** Percentage progress toward target, 0–100. */
  readonly progressPercent: number
  readonly startedAt:       string  // ISO-8601
  readonly targetDate:      string  // ISO-8601
  readonly achievedAt:      string | null
}

// ── CoachTask ─────────────────────────────────────────────────────────────────

/**
 * A single actionable task assigned to the user as part of their coaching plan.
 *
 * Tasks are generated by the Coach Brain each morning based on the active plan
 * and the user's current state (energy, motivation, streak).
 */
export interface CoachTask {
  readonly id:          CoachTaskId
  readonly planId:      CoachPlanId
  readonly date:        string        // 'YYYY-MM-DD' — the day this task is for
  /** Short description of what the user should do. */
  readonly description: string
  /** Category drives safety rule lookups in CoachPersonaConfig. */
  readonly category:    string        // e.g. 'movement' | 'nutrition' | 'sleep'
  /** Estimated time commitment in minutes — intentionally kept small. */
  readonly estimatedMinutes: number
  readonly status:      'assigned' | 'completed' | 'skipped' | 'modified'
  readonly completedAt: string | null
}

// ── CoachPlan ─────────────────────────────────────────────────────────────────

/**
 * A coaching plan spanning a fixed period (7, 30, or 90 days).
 *
 * Wraps the PlannerEngine's ActivePlan with coach-level metadata.
 * Never modified directly — adapt() via EventBus is the only mutation path (P-16).
 */
export interface CoachPlan {
  readonly id:               CoachPlanId
  readonly userId:           string
  readonly personaId:        CoachPersonaId
  /** Reference to the underlying PlannerEngine plan. */
  readonly activePlanId:     string
  readonly goalId:           CoachGoalId
  readonly durationDays:     7 | 30 | 90
  readonly phase:            CoachPhase
  readonly status:           'building' | 'active' | 'paused' | 'completed' | 'abandoned'
  readonly tasks:            readonly CoachTask[]
  readonly startedAt:        string  // ISO-8601
  readonly endsAt:           string  // ISO-8601
  readonly lastAdaptedAt:    string | null
  /** How many times the plan has been adapted via 'coach:plan_adapt'. */
  readonly adaptationCount:  number
  readonly createdAt:        string
}

// ── CoachSession ──────────────────────────────────────────────────────────────

/**
 * One discrete interaction session between the user and the coach.
 *
 * A session starts when the user opens the Today View (or receives a video)
 * and ends on explicit close or after a timeout. Sessions are the unit of
 * engagement measurement for retention analysis.
 */
export interface CoachSession {
  readonly id:              CoachSessionId
  readonly userId:          string
  readonly personaId:       CoachPersonaId
  readonly planId:          CoachPlanId | null
  readonly phase:           CoachPhase
  /** The trigger that initiated this session (scheduler, user action, etc.). */
  readonly trigger:         string
  readonly startedAt:       string  // ISO-8601
  readonly endedAt:         string | null
  /** Duration in seconds, null if session still open. */
  readonly durationSeconds: number | null
  /** The primary output the user received in this session. */
  readonly scriptType:      ScriptType | null
  readonly videoJobId:      string | null
  readonly videoWatched:    boolean
}

// ── CoachDecision ─────────────────────────────────────────────────────────────

/**
 * The output of the Coach Brain's decision process for a given user+trigger.
 *
 * This is a value object: it captures WHAT the Brain decided and WHY,
 * but has no behaviour. The Brain produces it; providers consume it.
 *
 * Different from the v1 CoachDecision (trigger/reason) which is the routing
 * model in coach/types.ts — this is the full Brain output for v2.
 */
export interface CoachDecision {
  /** Unique ID for deduplication and audit logging in CoachDecisionsNode. */
  readonly decisionId:        string
  readonly userId:            string
  readonly personaId:         CoachPersonaId
  readonly trigger:           string
  readonly scriptType:        ScriptType
  readonly motivationState:   MotivationState
  /** Intervention level 1–5, null if no intervention warranted. */
  readonly interventionLevel: 1 | 2 | 3 | 4 | 5 | null
  /** Human-readable explanation of why this decision was reached. */
  readonly rationale:         string
  /** The decision rule ID from CoachPersonaConfig that fired (highest priority match). */
  readonly firedRuleId:       string
  readonly decidedAt:         string  // ISO-8601
}

// ── DailyReview ───────────────────────────────────────────────────────────────

/**
 * The result of the Daily Review Module analysing the past 24 hours.
 *
 * Produced once per day (morning or on-demand), consumed by Coach Brain
 * to determine today's script type and task difficulty.
 */
export interface DailyReview {
  readonly id:               DailyReviewId
  readonly userId:           string
  readonly date:             string        // 'YYYY-MM-DD'
  readonly period:           'morning' | 'evening'
  readonly completedTasks:   readonly string[]    // CoachTaskId values
  readonly skippedTasks:     readonly string[]
  /** Average mood rating 1–5, null if no data for period. */
  readonly avgMoodRating:    number | null
  /** Average energy rating 1–5, null if no data for period. */
  readonly avgEnergyRating:  number | null
  /** Fraction of assigned tasks completed (0–1). */
  readonly adherenceRate:    number
  /** Whether the morning video was watched. */
  readonly videoWatched:     boolean
  /** Watch duration in seconds, null if not watched. */
  readonly videoDuration:    number | null
  /** Signal to the Planner Adapter — may trigger 'coach:plan_adapt'. */
  readonly adaptationNeeded: boolean
  readonly generatedAt:      string  // ISO-8601
}

// ── DailyHistory ─────────────────────────────────────────────────────────────

/**
 * Snapshot of a single calendar day, stored in DailyHistoryNode.
 *
 * Acts as the primary source of truth for mood, energy, and task completion
 * per Architecture Bible v2.1 §05 (C3). No other node stores mood/energy.
 */
export interface DailyHistory {
  readonly date:                string  // 'YYYY-MM-DD'
  readonly userId:              string
  readonly morningVideoWatched: boolean
  readonly eveningCheckinDone:  boolean
  readonly tasksAssigned:       readonly string[]   // CoachTaskId values
  readonly tasksCompleted:      readonly string[]
  /** Mood recorded at morning or evening check-in. */
  readonly moodRating:          DailyMoodEnergyRecord
  /** Energy recorded at morning or evening check-in. */
  readonly energyRating:        DailyMoodEnergyRecord
  readonly notes:               string | null
  /** Seconds the morning video was watched, null if not opened. */
  readonly videoWatchDuration:  number | null
}

/**
 * A single mood or energy observation within a day.
 * Context field prevents ambiguity between morning and evening self-reports.
 */
export interface DailyMoodEnergyRecord {
  readonly value:   number | null   // 1–5, null if not recorded
  readonly context: 'morning' | 'evening' | null
}

// ── CoachIntervention ────────────────────────────────────────────────────────

/**
 * A recorded intervention event — triggered when the user deviates from plan.
 *
 * Levels 1–5 map to increasing intensity of Coach Brain response,
 * configured per persona in CoachPersonaConfig.domainConfig.interventionThresholds.
 */
export interface CoachIntervention {
  readonly id:          CoachInterventionId
  readonly userId:      string
  readonly personaId:   CoachPersonaId
  /** L1 = soft check (1 missed day), L5 = sustained downward trend. */
  readonly level:       1 | 2 | 3 | 4 | 5
  readonly reason:      string              // human-readable trigger description
  readonly scriptType:  ScriptType
  /** Was a video generated for this intervention (vs. text-only for L1). */
  readonly videoUsed:   boolean
  readonly triggeredAt: string              // ISO-8601
  /** User response: did they return within 24h? */
  readonly userReturned:boolean | null
}

// ── CoachRoutine ─────────────────────────────────────────────────────────────

/**
 * A user's configured morning or evening coaching routine.
 *
 * Drives the Scheduler (preferred delivery time, weekends, intensity).
 * Separate from IdentityNode.preferredMorningTime to avoid bloating the graph.
 */
export interface CoachRoutine {
  readonly userId:             string
  readonly type:               'morning' | 'evening'
  /** Local time as 'HH:MM', e.g. '07:00'. Scheduler converts to UTC. */
  readonly preferredTime:      string
  readonly timezone:           string
  readonly weekendMode:        'same' | 'lighter' | 'off'
  readonly coachingIntensity:  'light' | 'standard' | 'intensive'
  /** Whether the user has opted in to evening video (Pro tier only). */
  readonly eveningVideoOptIn:  boolean
  readonly enabled:            boolean
  readonly updatedAt:          string  // ISO-8601
}

// ── CoachNotification ────────────────────────────────────────────────────────

/**
 * A notification queued or sent to the user by the Coach platform.
 *
 * Anti-spam rules (Architecture Bible v2.1 §07) are enforced at creation time
 * by NotificationProvider, not by this type.
 */
export interface CoachNotification {
  readonly id:        CoachNotificationId
  readonly userId:    string
  readonly channel:   'push' | 'email' | 'in_app'
  /** Single-line text. Name included. No exclamation marks (per anti-spam rule). */
  readonly body:      string
  readonly trigger:   string          // what caused this notification
  readonly status:    'queued' | 'sent' | 'failed' | 'suppressed'
  readonly sentAt:    string | null
  readonly expiresAt: string          // notifications expire after 24h if not opened
  readonly createdAt: string
}
