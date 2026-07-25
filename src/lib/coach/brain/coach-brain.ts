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
  constructor(
    private readonly memory:         CoachMemoryInterface,
    private readonly decisionEngine: DecisionEngineImpl,
  ) {}

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
   * Rules:
   *   - 3+ consecutive days with no tasks completed → missed_days (L1)
   *   - Mood or energy declining over last 7 days   → regression  (L2)
   *   - No activity at all                          → null
   */
  async checkIntervention(
    userId:  string,
    persona: CoachPersonaConfig | CoachPersonaConfigWithEvaluableRules,
  ): Promise<CoachIntervention | null> {
    const days       = await this.memory.getDailyHistory(userId, 7)
    const personaId  = persona.coachId as unknown as CoachPersonaId
    const thresholds = persona.domainConfig.interventionThresholds

    if (days.length === 0) return null

    // ── Check missed days ─────────────────────────────────────────────────

    const missedDayThreshold = thresholds.skipDaysL1   // default from persona config
    let consecutiveMissed = 0
    const sorted = [...days].sort((a, b) => b.date.localeCompare(a.date))
    for (const day of sorted) {
      if (day.tasksCompleted.length === 0) {
        consecutiveMissed++
      } else {
        break
      }
    }

    if (consecutiveMissed >= Math.max(missedDayThreshold, 3)) {
      return buildIntervention(userId, personaId, 'missed_days', 1, consecutiveMissed)
    }

    // ── Check regression (declining mood/energy trend) ────────────────────

    const withMood = days.filter(d => d.moodRating.value !== null)
    if (withMood.length >= 3) {
      const recent = withMood.slice(-3).map(d => d.moodRating.value as number)
      const isRegressing = recent[0] > recent[1] && recent[1] > recent[2]
      if (isRegressing) {
        return buildIntervention(userId, personaId, 'regression', 2, recent[2])
      }
    }

    return null
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
