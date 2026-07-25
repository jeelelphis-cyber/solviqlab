// ─────────────────────────────────────────────────────────────────────────────
// Coach Platform — Contracts (Provider & Engine Interfaces)
//
// This file defines the boundary between the Coach Brain (orchestrator) and all
// external capabilities it relies on. Every interface here is:
//   - Swappable: the Brain depends on the interface, not the implementation.
//   - Minimal: only the methods the Brain actually needs.
//   - Pure types: no implementation logic, no default values.
//
// Architecture Bible v2.1 P-17: the Brain must not know which persona it runs;
// CoachPersonaConfig carries all persona-specific data.
//
// P-16: the Brain NEVER calls PlannerEngine.adapt() directly.
//       It uses CoachPlanner.dispatchPlanAdapt() which emits 'coach:plan_adapt'.
// ─────────────────────────────────────────────────────────────────────────────

import type { IntentCluster } from '../../assessment/types'
import type { UserGraph }     from '../../graph/types'
import type { ActivePlan }    from '../../domain/active-plan'

import type {
  CoachPersonaId,
  CoachSessionId,
  CoachPlanId,
  CoachGoalId,
  CoachDecision,
  DailyReview,
  DailyHistory,
  CoachPhase,
  ScriptType,
  MotivationState,
  CoachRoutine,
  CoachNotification,
  CoachNotificationId,
} from '../domain/types'

import type { CoachEvent } from '../events/types'

// ── CoachPersonaConfig ────────────────────────────────────────────────────────
// Copied verbatim from Architecture Bible v2.1 §03 to be the canonical type.
// All persona configs (mia.ts, alex.ts) implement this interface.

/**
 * The complete configuration for a coach persona.
 * One engine, different configs — this is how Mia, Alex, Emma, Noah differ.
 * Adding a new coach = creating a new CoachPersonaConfig. Changing the engine = forbidden (P-17).
 */
export interface CoachPersonaConfig {
  readonly coachId:   'mia' | 'alex' | 'emma' | 'noah'
  readonly coachName: string
  readonly cluster:   IntentCluster | 'finance' | 'career' | 'productivity'

  readonly personality: {
    readonly tone:          'warm_direct' | 'analytical' | 'motivational' | 'calm'
    readonly style:         'coaching' | 'advisory' | 'mentoring'
    readonly languageLevel: 'simple' | 'professional' | 'expert'
    readonly emojiPolicy:   'never' | 'sparingly' | 'allowed'
  }

  /** Decision rules are evaluated in descending priority order. */
  readonly decisionRules: readonly CoachDecisionRule[]

  readonly toneByPhase: {
    readonly onboarding:     ToneConfig
    readonly firstWeek:      ToneConfig
    readonly firstMonth:     ToneConfig
    readonly transformation: ToneConfig
    readonly partnership:    ToneConfig
  }

  readonly videoTemplates: {
    readonly morning:      VideoTemplate
    readonly evening:      VideoTemplate
    readonly intervention: Record<'L1' | 'L2' | 'L3' | 'L4' | 'L5', VideoTemplate>
    readonly milestone:    VideoTemplate
    readonly celebration:  VideoTemplate
    readonly weekReview:   VideoTemplate
    readonly monthReview:  VideoTemplate
  }

  readonly domainConfig: {
    readonly primaryMetric:    string
    readonly secondaryMetrics: readonly string[]
    readonly taskCategories:   readonly string[]
    readonly interventionThresholds: {
      readonly skipDaysL1:        number
      readonly skipDaysL2:        number
      readonly skipDaysL3:        number
      readonly offTrackWeeksL4:   number
      readonly trendDownWeeksL5:  number
    }
  }

  readonly safetyRules: {
    readonly neverMentionTopics: readonly string[]
    readonly requiresDisclaimer: readonly string[]
    readonly escalateToHuman:    readonly string[]
  }
}

/**
 * A single entry in CoachPersonaConfig.decisionRules.
 * The engine evaluates condition descriptions — exact evaluation format is
 * specified in the Rule Engine Spec (required before Phase 2B per AR-1).
 */
export interface CoachDecisionRule {
  readonly ruleId:    string
  /** Human-readable condition. Will be replaced by DSL in Rule Engine Spec. */
  readonly condition: string
  readonly action:    CoachAction
  /** Higher number = evaluated first. The first matching rule wins. */
  readonly priority:  number
}

/** The action a coach decision rule produces when its condition matches. */
export type CoachAction =
  | { readonly type: 'set_script_type';       readonly value: ScriptType }
  | { readonly type: 'set_motivation_state';  readonly value: MotivationState }
  | { readonly type: 'set_intervention_level'; readonly value: 1 | 2 | 3 | 4 | 5 }
  | { readonly type: 'dispatch_event';        readonly eventName: string }
  | { readonly type: 'silence' }

/** Instruction set for a specific coaching phase's tone. */
export interface ToneConfig {
  readonly key:         string   // e.g. 'calm_trust', 'observational'
  readonly instruction: string   // fed to LLM or template renderer
}

/** Template that defines the structure of a video script. */
export interface VideoTemplate {
  readonly structure:    readonly string[]   // ordered section names
  readonly maxDuration:  number              // seconds
  readonly requiredVars: readonly string[]   // MiaContext variables that MUST be filled
  readonly fallbackText: string             // shown if VideoProvider unavailable
}

// ── MiaContext ────────────────────────────────────────────────────────────────

/**
 * Assembled context the Coach Brain uses for every decision.
 * Built by the Memory Module from UserGraph — never stored, always rebuilt.
 */
export interface MiaContext {
  readonly name:                      string | null
  readonly daysSinceStart:            number
  readonly currentStreak:             number
  readonly lastAction:                string | null
  readonly lastMoodRating:            number | null
  readonly lastEnergyRating:          number | null
  readonly currentGoal:               string | null
  readonly recentVictories:           readonly string[]
  readonly recentFailures:            readonly string[]
  readonly coachNotes:                readonly string[]
  readonly nextMilestone:             string | null
  readonly coachPhase:                CoachPhase
  readonly lastVideoWatchedAt:        string | null
  readonly preferredCommunicationTime: string | null
}

// ── VideoScript ───────────────────────────────────────────────────────────────

/** The fully resolved script that VideoProvider turns into a video. */
export interface VideoScript {
  readonly scriptType:   ScriptType
  readonly personaId:    CoachPersonaId
  readonly opening:      string
  readonly body:         string
  readonly hook:         string
  readonly maxDuration:  number   // seconds — from VideoTemplate
  readonly variables:    Readonly<Record<string, string>>   // interpolated MiaContext values
}

/** Result returned by VideoProvider.generate(). */
export interface VideoGenerationResult {
  readonly jobId:             string
  readonly status:            'queued' | 'ready'
  readonly estimatedSeconds:  number
}

// ── Core Engine Interfaces ────────────────────────────────────────────────────

/**
 * The Coach Brain's decision engine.
 * Given a user's assembled context and a trigger, produces a CoachDecision.
 *
 * Deterministic: same context + same trigger = same decision (unless rules changed).
 * No side effects — the caller writes the decision to CoachDecisionsNode.
 */
export interface DecisionEngine {
  /**
   * Evaluate CoachPersonaConfig.decisionRules against the current context.
   * Returns the first matching CoachDecision (highest priority rule wins).
   */
  decide(
    context:  MiaContext,
    config:   CoachPersonaConfig,
    trigger:  string,
  ): Promise<CoachDecision>
}

/**
 * Abstraction over UserGraph for Coach Brain reads and writes.
 *
 * The Brain should never import UserGraph directly — it reads through this
 * interface so the memory layer can be swapped (e.g. DB vs localStorage).
 *
 * Writes go through UserEngine (authorised mutations only, per P-16).
 */
export interface CoachMemoryInterface {
  /** Build a fully resolved MiaContext from the current UserGraph state. */
  buildContext(userId: string): Promise<MiaContext>

  /** Read the raw UserGraph — for cases where MiaContext is insufficient. */
  readGraph(userId: string): Promise<UserGraph>

  /** Append a decision to CoachDecisionsNode (audit log). */
  recordDecision(userId: string, decision: CoachDecision): Promise<void>

  /** Update DailyHistoryNode with today's check-in data. */
  recordDailyHistory(userId: string, entry: DailyHistory): Promise<void>

  /** Read rolling DailyHistory entries (up to 90 days). */
  getDailyHistory(userId: string, days: number): Promise<readonly DailyHistory[]>

  /** Read the user's active coaching routine config. */
  getRoutine(userId: string, type: 'morning' | 'evening'): Promise<CoachRoutine | null>

  /** Retrieve the daily review for a specific date and period. */
  getDailyReview(userId: string, date: string, period: 'morning' | 'evening'): Promise<DailyReview | null>
}

/**
 * Adapter between Coach Brain and PlannerEngine.
 *
 * Per P-16, Coach Brain NEVER calls PlannerEngine.adapt() directly.
 * This adapter's only job is to dispatch 'coach:plan_adapt' to the EventBus,
 * which Pipeline stage P48 then handles.
 */
export interface CoachPlanner {
  /**
   * Retrieve the active plan for context assembly.
   * Read-only — does not trigger adaptation.
   */
  getActivePlan(userId: string): Promise<ActivePlan | null>

  /**
   * Dispatch 'coach:plan_adapt' to EventBus.
   * P48 in platform-pipeline.ts is the only handler for this event.
   * This method must NOT call PlannerEngine.adapt() directly.
   */
  dispatchPlanAdapt(
    userId:         string,
    planId:         CoachPlanId,
    reason:         'energy_low' | 'motivation_critical' | 'off_track_sustained',
    week:           number,
    actualValue:    number,
    subjectiveScore: number,
    notes:          string | null,
  ): Promise<void>
}

// ── Provider Interfaces ───────────────────────────────────────────────────────

/**
 * Abstraction over video generation services (HeyGen, Synthesia, D-ID, fallback).
 *
 * Coach Brain knows only VideoProvider — never the concrete vendor.
 * Switching from HeyGen to Synthesia = swapping the implementation, not changing the Brain.
 */
export interface VideoProvider {
  /** The canonical provider name used in UserVideoQueue.provider field. */
  readonly providerName: string
  /** Cost per minute in USD — for operational cost monitoring. */
  readonly costPerMinute: number

  /** Queue a video generation job. Async — use getStatus() to poll. */
  generate(script: VideoScript): Promise<VideoGenerationResult>

  /** Poll the current status of a generation job. */
  getStatus(jobId: string): Promise<'queued' | 'generating' | 'ready' | 'failed'>

  /** Retrieve the playback URL once status = 'ready'. Null if not ready or failed. */
  getUrl(jobId: string): Promise<string | null>
}

/**
 * Abstraction over push / email / in-app notification delivery.
 * Anti-spam rules from Architecture Bible v2.1 §07 are enforced here.
 */
export interface NotificationProvider {
  /**
   * Queue a notification for delivery.
   * Implementation must enforce anti-spam: max 2 push/day, 1 email/week.
   */
  send(notification: Omit<CoachNotification, 'id' | 'status' | 'sentAt' | 'createdAt'>): Promise<CoachNotification>

  /** Check whether a notification channel is available (opt-in/opt-out state). */
  isChannelEnabled(userId: string, channel: 'push' | 'email' | 'in_app'): Promise<boolean>

  /** Retrieve the last sent notification of a given channel for deduplication. */
  getLastSent(userId: string, channel: 'push' | 'email' | 'in_app'): Promise<CoachNotification | null>

  /** Mark a notification as delivered (e.g. after HeyGen webhook). */
  markDelivered(notificationId: CoachNotificationId): Promise<void>
}

/**
 * Abstraction over the conversational AI layer (AICompanion integration).
 *
 * AICompanion is the unchanged core — this interface is the Coach layer's
 * boundary. The Brain hands off conversation context; AICompanion handles
 * the dialogue. No duplication of conversation logic in the Coach layer.
 */
export interface ConversationProvider {
  /**
   * Generate a text response to a user message, using Mia's context and tone.
   * Free/Premium: template-based. Pro: LLM-powered.
   */
  respond(
    userId:    string,
    message:   string,
    context:   MiaContext,
    config:    CoachPersonaConfig,
  ): Promise<string>

  /**
   * Whether LLM-powered responses are available for this user.
   * Determined by PremiumNode.tier — implementation reads the graph.
   */
  isLLMEnabled(userId: string): Promise<boolean>

  /**
   * Retrieve recent conversation history (for context window in LLM calls).
   * Returns most recent N exchanges.
   */
  getHistory(userId: string, limit: number): Promise<readonly ConversationTurn[]>
}

/** A single exchange in conversation history. */
export interface ConversationTurn {
  readonly role:      'user' | 'coach'
  readonly content:   string
  readonly timestamp: string  // ISO-8601
}

/**
 * Generates the text script that VideoProvider will render into a video.
 *
 * Reads MiaContext + VideoTemplate from CoachPersonaConfig, interpolates
 * variables, and produces a VideoScript ready for VideoProvider.generate().
 */
export interface ScriptGenerator {
  /**
   * Build a VideoScript for the given script type and user context.
   * Must check CoachPersonaConfig.safetyRules before interpolation.
   */
  generate(
    scriptType: ScriptType,
    context:    MiaContext,
    config:     CoachPersonaConfig,
  ): Promise<VideoScript>

  /**
   * Validate that a script satisfies safety rules before generation.
   * Returns list of violated rule IDs, empty if all clear.
   */
  validateSafety(
    script: VideoScript,
    config: CoachPersonaConfig,
  ): readonly string[]
}
