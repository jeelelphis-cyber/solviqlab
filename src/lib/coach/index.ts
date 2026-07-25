// ─────────────────────────────────────────────────────────────────────────────
// Coach Platform — Public API (v1 + v2 combined barrel)
//
// v1 exports (engine.ts, types.ts, service.ts, etc.) are preserved untouched.
// v2 Coach Platform layer is added below with explicit aliasing where needed
// to avoid name collisions with v1 types.
//
// Name collision policy:
//   CoachDecision (v1) = routing decision {trigger, reason} from types.ts
//   CoachDecisionV2   = Brain output from domain/types.ts
//   CoachMemory (v1)  = per-cluster shown_ids tracker from types.ts
//   CoachMemoryInterface (v2) = abstract interface from contracts/index.ts
// ─────────────────────────────────────────────────────────────────────────────

// ── v1: existing Coach layer (preserved, no changes) ─────────────────────────
export type {
  CoachPriority,
  CoachTrigger,
  CoachReason,
  CoachDecision,       // v1: {trigger, reason} routing decision
  CoachMessageType,
  CoachAction,
  CoachTemplate,
  CoachRecommendation,
  CoachDataContext,
  CoachMessage,
  CoachMemory,         // v1: per-cluster shown_ids tracker
  CoachInput,
} from './types'

export { COACH_VERSION, emptyCoachMemory } from './types'
export { CoachEngine, coachEngine }        from './engine'
export { TextRenderer, textRenderer }      from './renderer'
export { CoachService, coachService }      from './service'
export type { CoachRuntime }               from './service'
export { CoachAnalytics, coachAnalytics }  from './analytics'
export { NavigationResolver, navigationResolver } from './navigation'
export type { CoachActionId }              from './navigation'
export { CoachHistoryRepository, buildHistoryEntry } from './history'
export type { CoachHistoryEntry }          from './history'

// ── v2: Coach Platform domain types ──────────────────────────────────────────
export type {
  CoachPersonaId,
  CoachSessionId,
  CoachPlanId,
  CoachGoalId,
  CoachTaskId,
  CoachInterventionId,
  DailyReviewId,
  CoachNotificationId,
  CoachPhase,
  ScriptType,
  MotivationState,
  CoachPersona,
  CoachGoal,
  CoachTask,
  CoachPlan,
  CoachSession,
  // Aliased to avoid collision with v1 CoachDecision
  CoachDecision  as CoachDecisionV2,
  DailyReview,
  DailyHistory,
  DailyMoodEnergyRecord,
  CoachIntervention,
  CoachRoutine,
  CoachNotification,
} from './domain/types'

// ── v2: Coach Platform events ─────────────────────────────────────────────────
export type {
  CoachSessionStartedEvent,
  CoachSessionEndedEvent,
  CoachPhaseChangedEvent,
  DailyReviewCompletedEvent,
  MorningRoutineStartedEvent,
  EveningRoutineStartedEvent,
  UserCheckedInEvent,
  GoalUpdatedEvent,
  PlanChangedEvent,
  SleepRecordedEvent,
  WeightRecordedEvent,
  MoodRecordedEvent,
  VideoGeneratedEvent,
  CoachMessageSentEvent,
  CoachInterventionTriggeredEvent,
  CoachDecisionMadeEvent,
  CoachEvent,
  CoachEventHandler,
} from './events/types'

// ── v2: Coach Platform contracts ──────────────────────────────────────────────
export type {
  CoachPersonaConfig,
  CoachDecisionRule,
  // CoachAction from contracts conflicts with v1 CoachAction — alias it
  CoachAction     as CoachPersonaAction,
  ToneConfig,
  VideoTemplate,
  MiaContext,
  VideoScript,
  VideoGenerationResult,
  DecisionEngine,
  CoachMemoryInterface,
  CoachPlanner,
  VideoProvider,
  NotificationProvider,
  ConversationProvider,
  ConversationTurn,
  ScriptGenerator,
} from './contracts/index'

// ── v2: State Machine ─────────────────────────────────────────────────────────
export type {
  CoachState,
  CoachStateTransition,
  CoachStateMachine,
} from './state-machine/types'

export { COACH_TRANSITIONS } from './state-machine/types'
