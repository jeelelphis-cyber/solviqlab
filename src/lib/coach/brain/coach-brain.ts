// ─────────────────────────────────────────────────────────────────────────────
// CoachBrain — Central orchestrator for the AI Coach platform.
//
// Public API for the Coach Brain layer. All coaching decisions flow through here.
// Brain depends on interfaces (CoachMemoryInterface, DecisionEngineImpl) — never
// on concrete implementations like GraphRepository or PlannerEngine.
//
// Architecture Bible v2.1 §03:
//   P-17: Brain never knows which persona it runs. Persona config carries all data.
//   P-16: Brain never calls PlannerEngine.adapt() directly — only emits events.
// ─────────────────────────────────────────────────────────────────────────────

import type { CoachMemoryInterface, CoachPersonaConfig } from '../contracts'
import type {
  CoachDecision,
  CoachPhase,
  CoachIntervention,
  CoachInterventionId,
  CoachPersonaId,
  DailyHistory,
} from '../domain/types'
import type { CoachDecisionMadeEvent } from '../events/types'
import type { DecisionEngineImpl }     from './decision-engine'
import type { CoachPersonaConfigWithEvaluableRules } from './decision-engine'
import { CoachMemoryService }          from '../memory/coach-memory-service'

// ── DailyCheckIn ─────────────────────────────────────────────────────────────

/**
 * Data submitted by the user at a daily check-in (morning or evening).
 * Captured by CoachBrain.recordCheckIn() and stored in DailyHistoryNode.
 */
export interface DailyCheckIn {
  readonly userId:         string
  readonly date:           string             // ISO date 'YYYY-MM-DD'
  readonly mood:           number             // 1–5
  readonly energy:         number             // 1–5
  readonly completedTasks: readonly string[]  // CoachTask IDs
  readonly notes?:         string
}

// ── Intervention types ────────────────────────────────────────────────────────

type InterventionType = 'missed_days' | 'regression'

// ── EventBus dispatch ─────────────────────────────────────────────────────────

/** Dispatch a coach event. Uses window.dispatchEvent in browser; falls back to callback. */
function dispatchCoachEvent(event: CoachDecisionMadeEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(event.type, { detail: event }))
  }
  // Server-side: events are no-op until an EventBus adapter is wired up (Sprint C-2).
}

// ── CoachBrain ────────────────────────────────────────────────────────────────

export class CoachBrain {
  private readonly memoryService: CoachMemoryService

  constructor(
    private readonly memory:         CoachMemoryInterface,
    private readonly decisionEngine: DecisionEngineImpl,
  ) {
    // CoachMemoryService wraps the memory interface to expose high-level analytics.
    // Sprint C-1.3: Brain delegates intervention logic to the memory service layer.
    this.memoryService = new CoachMemoryService(memory)
  }

  // ── analyze() ─────────────────────────────────────────────────────────────

  /**
   * Core method: load user's graph, evaluate decision rules, emit events.
   *
   * @param userId  - User to analyse.
   * @param persona - Persona config whose rules to evaluate.
   * @returns       - Ordered array of decisions produced (usually 0 or 1).
   */
  async analyze(
    userId:  string,
    persona: CoachPersonaConfig | CoachPersonaConfigWithEvaluableRules,
  ): Promise<readonly CoachDecision[]> {
    const graph     = await this.memory.readGraph(userId)
    const decisions = await this.decisionEngine.evaluate(graph, persona, userId, 'analyze')

    for (const decision of decisions) {
      // Audit log
      await this.memory.recordDecision(userId, decision)

      // Emit event so analytics, UI, and other consumers can react without
      // the Brain coupling directly to them (EventBus pattern, P-16).
      const event: CoachDecisionMadeEvent = {
        eventId:   crypto.randomUUID(),
        userId,
        timestamp: Date.now(),
        type:      'coach:decision_made',
        payload: {
          decisionId:        decision.decisionId,
          trigger:           decision.trigger,
          scriptType:        decision.scriptType,
          motivationState:   decision.motivationState,
          interventionLevel: decision.interventionLevel,
          firedRuleId:       decision.firedRuleId,
        },
      }
      dispatchCoachEvent(event)
    }

    return decisions
  }

  // ── recordCheckIn() ───────────────────────────────────────────────────────

  /**
   * Save a user's daily check-in to DailyHistoryNode.
   * This is the only authorised write path for mood/energy data (C3).
   */
  async recordCheckIn(userId: string, checkIn: DailyCheckIn): Promise<void> {
    const entry: DailyHistory = {
      date:                checkIn.date,
      userId,
      morningVideoWatched: false,   // updated by VideoProvider webhook
      eveningCheckinDone:  true,
      tasksAssigned:       [],      // populated by PlannerEngine
      tasksCompleted:      checkIn.completedTasks,
      moodRating: {
        value:   checkIn.mood,
        context: 'evening',
      },
      energyRating: {
        value:   checkIn.energy,
        context: 'evening',
      },
      notes:              checkIn.notes ?? null,
      videoWatchDuration: null,
    }

    await this.memory.recordDailyHistory(userId, entry)
  }

  // ── getCurrentPhase() ─────────────────────────────────────────────────────

  /**
   * Return the user's current coaching phase from their graph.
   * New users with no journey data are in 'onboarding'.
   */
  async getCurrentPhase(userId: string): Promise<CoachPhase> {
    const context = await this.memory.buildContext(userId)
    return context.coachPhase
  }

  // ── checkIntervention() ───────────────────────────────────────────────────

  /**
   * Determine whether the user needs an intervention based on their recent history.
   *
   * Delegates to CoachMemoryService.needsIntervention() (Sprint C-1.3).
   * Maps the returned InterventionReason to a CoachIntervention value object.
   *
   * Thresholds are derived from persona.domainConfig.interventionThresholds:
   *   - missedDays: max(skipDaysL1, 3) — never below 3 to avoid over-intervention
   *   - lowMoodThreshold: 2.5 (platform default)
   *   - lowMoodDays: 2 (platform default)
   */
  async checkIntervention(
    userId:  string,
    persona: CoachPersonaConfig | CoachPersonaConfigWithEvaluableRules,
  ): Promise<CoachIntervention | null> {
    const personaId  = persona.coachId as unknown as CoachPersonaId
    const thresholds = persona.domainConfig.interventionThresholds

    const reason = await this.memoryService.needsIntervention(userId, {
      missedDays:       Math.max(thresholds.skipDaysL1, 3),
      lowMoodThreshold: 2.5,
      lowMoodDays:      2,
    })

    if (reason === null) return null

    // Map reason to intervention type and level
    switch (reason) {
      case 'missed_3_days':
        return buildIntervention(userId, personaId, 'missed_days', 1, Math.max(thresholds.skipDaysL1, 3))
      case 'low_mood_sustained':
        return buildIntervention(userId, personaId, 'regression', 2, 2.5)
      case 'mood_declining':
        return buildIntervention(userId, personaId, 'regression', 2, 0)
      case 'no_tasks_completed':
        return buildIntervention(userId, personaId, 'missed_days', 1, 0)
      default:
        return null
    }
  }
}

// ── Factory helper ────────────────────────────────────────────────────────────

function buildIntervention(
  userId:     string,
  personaId:  CoachPersonaId,
  type:       InterventionType,
  level:      1 | 2 | 3 | 4 | 5,
  metricValue: number,
): CoachIntervention {
  const reasonMap: Record<InterventionType, string> = {
    missed_days: `User missed ${metricValue} consecutive day(s) without completing tasks.`,
    regression:  `Mood declined to ${metricValue}/5 over last 3 recorded days.`,
  }

  return {
    id:           crypto.randomUUID() as unknown as CoachInterventionId,
    userId,
    personaId,
    level,
    reason:       reasonMap[type],
    scriptType:   level === 1 ? 'morning_intervention' : 'intervention',
    videoUsed:    level >= 2,
    triggeredAt:  new Date().toISOString(),
    userReturned: null,
  }
}
