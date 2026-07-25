// ─────────────────────────────────────────────────────────────────────────────
// Coach Platform — State Machine Types
//
// The CoachStateMachine governs the user's position within the coaching
// lifecycle. State is persisted in JourneyNode / CoachPhase and read by
// Coach Brain on every decision cycle.
//
// Design: state transitions are driven by triggers (event names from the
// EventBus). Guard conditions are string descriptions — actual evaluation
// happens in the DecisionEngine when it processes CoachPersonaConfig.decisionRules.
//
// This file is types-only. The implementation lives in brain/ (Sprint C-1.1).
// ─────────────────────────────────────────────────────────────────────────────

// ── CoachState ────────────────────────────────────────────────────────────────

/**
 * All possible states a user can be in within the coaching flow.
 *
 * States map to CoachPhase in domain/types.ts but are more granular —
 * CoachPhase is the strategic phase (displayed to user), CoachState is the
 * operational state (internal to the state machine).
 */
export type CoachState =
  | 'onboarding'        // Quiz in progress — no plan yet
  | 'assessment'        // Assessment form being completed
  | 'planning'          // Plan being built from assessment result
  | 'active_coaching'   // Normal daily rhythm: morning video + check-in
  | 'morning_routine'   // Morning video currently being delivered
  | 'evening_routine'   // Evening check-in currently active
  | 'check_in'          // Mid-day task completion check-in
  | 'review'            // Week or month review in progress
  | 'plan_update'       // Plan being adapted via coach:plan_adapt + P48
  | 'intervention'      // Intervention script being delivered (L1–L5)
  | 'transformation'    // Goal achieved, new goal being formed
  | 'paused'            // User or weekend mode paused coaching

// ── CoachStateTransition ──────────────────────────────────────────────────────

/**
 * A single allowed transition in the state machine.
 *
 * trigger is the EventBus event name or internal signal that causes the move.
 * condition is a human-readable guard — evaluated by DecisionEngine at runtime.
 * Null condition means the transition is unconditional when trigger fires.
 */
export interface CoachStateTransition {
  readonly from:       CoachState
  readonly to:         CoachState
  /** EventBus event name or internal trigger string. */
  readonly trigger:    string
  /** Optional guard condition description (see Rule Engine Spec for evaluation format). */
  readonly condition?: string
}

// ── Transition Map ────────────────────────────────────────────────────────────

/**
 * Complete authorised transition map for the Coach platform.
 *
 * Only transitions listed here are valid. Any attempt to move between states
 * not in this list must throw (CoachStateMachine.transition() must validate).
 *
 * Ordering: critical/safety transitions first, then lifecycle, then fallbacks.
 */
export const COACH_TRANSITIONS: readonly CoachStateTransition[] = [
  // ── Onboarding flow ──────────────────────────────────────────────────────
  {
    from:    'onboarding',
    to:      'assessment',
    trigger: 'coach:session_started',
    condition: 'Quiz completed — at least 3 questions answered',
  },
  {
    from:    'assessment',
    to:      'planning',
    trigger: 'platform:assessment_completed',
  },
  {
    from:    'planning',
    to:      'active_coaching',
    trigger: 'plan:created',
    condition: 'ActivePlan exists and status = active',
  },

  // ── Daily rhythm ──────────────────────────────────────────────────────────
  {
    from:    'active_coaching',
    to:      'morning_routine',
    trigger: 'daily:morning_scheduled',
    condition: 'weekendMode != off AND preferredMorningTime within 15 min window',
  },
  {
    from:    'morning_routine',
    to:      'active_coaching',
    trigger: 'coach:session_ended',
  },
  {
    from:    'active_coaching',
    to:      'evening_routine',
    trigger: 'daily:evening_scheduled',
    condition: 'EveningVideoOptIn = true (Pro) OR text check-in enabled',
  },
  {
    from:    'evening_routine',
    to:      'active_coaching',
    trigger: 'coach:user_checked_in',
  },
  {
    from:    'active_coaching',
    to:      'check_in',
    trigger: 'daily:check_in_submitted',
  },
  {
    from:    'check_in',
    to:      'active_coaching',
    trigger: 'coach:daily_review_completed',
  },

  // ── Review cycles ─────────────────────────────────────────────────────────
  {
    from:    'active_coaching',
    to:      'review',
    trigger: 'plan:week_1_review',
  },
  {
    from:    'active_coaching',
    to:      'review',
    trigger: 'plan:month_1_review',
  },
  {
    from:    'review',
    to:      'active_coaching',
    trigger: 'coach:session_ended',
  },

  // ── Plan adaptation ───────────────────────────────────────────────────────
  {
    from:    'active_coaching',
    to:      'plan_update',
    trigger: 'coach:plan_adapt',
    condition: 'P48 handler invoked — PlannerEngine.adapt() called via Pipeline',
  },
  {
    from:    'plan_update',
    to:      'active_coaching',
    trigger: 'platform:intent_state_updated',
    condition: 'changedFields includes activePlan',
  },

  // ── Interventions ─────────────────────────────────────────────────────────
  {
    from:    'active_coaching',
    to:      'intervention',
    trigger: 'intervention:l1',
    condition: 'DailyHistoryNode: missed skipDaysL1 consecutive days',
  },
  {
    from:    'active_coaching',
    to:      'intervention',
    trigger: 'intervention:l2',
    condition: 'DailyHistoryNode: missed skipDaysL2 consecutive days',
  },
  {
    from:    'active_coaching',
    to:      'intervention',
    trigger: 'intervention:l3',
    condition: 'DailyHistoryNode: missed skipDaysL3 consecutive days',
  },
  {
    from:    'active_coaching',
    to:      'intervention',
    trigger: 'motivation:low_detected',
    condition: 'MotivationEngine.state = low AND offTrackWeeks >= offTrackWeeksL4',
  },
  {
    from:    'active_coaching',
    to:      'intervention',
    trigger: 'motivation:critical',
    condition: 'MotivationEngine.state = critical AND trendDownWeeks >= trendDownWeeksL5',
  },
  {
    from:    'intervention',
    to:      'active_coaching',
    trigger: 'coach:user_checked_in',
    condition: 'User returned within 24h after intervention delivery',
  },
  {
    from:    'intervention',
    to:      'paused',
    trigger: 'coach:session_ended',
    condition: 'User did not return — intervention L3+ and 48h elapsed',
  },

  // ── Transformation ────────────────────────────────────────────────────────
  {
    from:    'active_coaching',
    to:      'transformation',
    trigger: 'plan:goal_achieved',
  },
  {
    from:    'active_coaching',
    to:      'transformation',
    trigger: 'plan:quarter_review',
    condition: 'Day 90+ reached',
  },
  {
    from:    'transformation',
    to:      'onboarding',
    trigger: 'coach:session_started',
    condition: 'User accepted new goal in Quiz',
  },
  {
    from:    'transformation',
    to:      'active_coaching',
    trigger: 'plan:created',
    condition: 'New plan created from new goal — same cluster',
  },

  // ── Pause / resume ────────────────────────────────────────────────────────
  {
    from:    'active_coaching',
    to:      'paused',
    trigger: 'daily:morning_scheduled',
    condition: 'weekendMode = off AND current day is weekend',
  },
  {
    from:    'paused',
    to:      'active_coaching',
    trigger: 'daily:morning_scheduled',
    condition: 'weekendMode != off OR weekday resumed',
  },
  {
    from:    'morning_routine',
    to:      'paused',
    trigger: 'coach:phase_changed',
    condition: 'User disabled coaching in settings',
  },
] as const

// ── CoachStateMachine ─────────────────────────────────────────────────────────

/**
 * Interface for the runtime state machine that governs coach flow.
 *
 * Implementations must validate all transitions against COACH_TRANSITIONS
 * before writing to storage — invalid transitions must throw, not silently fail.
 */
export interface CoachStateMachine {
  /**
   * Read the current CoachState for the user.
   * State is persisted in JourneyNode.currentPhase (mapped to CoachState).
   */
  currentState(userId: string): Promise<CoachState>

  /**
   * Check whether a transition from `from` is legal for the given trigger.
   * Does not check guard conditions — only validates the transition map.
   * Use this for fast UI gating before attempting a full transition.
   */
  canTransition(from: CoachState, trigger: string): boolean

  /**
   * Attempt a state transition for the user.
   * Validates against COACH_TRANSITIONS, evaluates guard condition if present,
   * persists the new state, and emits 'coach:phase_changed' via EventBus.
   *
   * Throws if: transition not found in map, guard condition fails, or persistence fails.
   * Returns the new CoachState on success.
   */
  transition(userId: string, trigger: string): Promise<CoachState>
}
