// ─────────────────────────────────────────────────────────────────────────────
// CoachPlannerImpl — Sprint C-1.4
//
// Implements the CoachPlanner interface (contracts/index.ts).
//
// Architecture Bible v2.1 §04 C2 (P-16):
//   PlannerEngine.adapt() is NEVER called directly from this class.
//   Adaptation requests are dispatched as 'coach:plan_adapt' events only.
//   The P48 pipeline handler is the sole consumer that calls adapt().
//
// Storage strategy:
//   CoachPlan is stored as a MemoryFact in the UserGraph's coachMemory node
//   (key: 'active_coach_plan') until a dedicated PlanNode is added in Sprint C-2.
//   This avoids schema changes in Sprint C-1.
// ─────────────────────────────────────────────────────────────────────────────

import type { CoachPlanner, CoachPersonaConfig } from '../contracts'
import type { ActivePlan }    from '../../domain/active-plan'
import type {
  CoachPlan,
  CoachGoal,
  CoachTask,
  CoachPlanId,
  CoachPersonaId,
  CoachTaskId,
} from '../domain/types'
import type { PlanChangedEvent } from '../events/types'
import type { GraphRepository } from '../../graph/repository'
import type { GraphUpdater }    from '../../graph/updater'
import { PlannerEngine }        from '../../planner/engine'
import { adaptivePlanToCoachPlan } from './plan-converter'

// ── PlanAdaptationReason ──────────────────────────────────────────────────────

/**
 * Why a plan adaptation was requested.
 * Maps to the 'reason' field in PlanChangedEvent.payload — some are normalised
 * to the three event-level reasons ('energy_low' | 'motivation_critical' | 'off_track_sustained').
 */
export type PlanAdaptationReason =
  | 'user_struggling'    // → 'off_track_sustained'
  | 'user_excelling'     // → 'off_track_sustained' (over-achievement)
  | 'goal_changed'       // → 'off_track_sustained' (goal shift)
  | 'intervention'       // → 'motivation_critical'
  | 'weekly_review'      // → 'off_track_sustained'

// ── Storage key ───────────────────────────────────────────────────────────────

const PLAN_FACT_ID = 'active_coach_plan'

// ── CoachPlannerImpl ──────────────────────────────────────────────────────────

export class CoachPlannerImpl implements CoachPlanner {

  private readonly engine: PlannerEngine
  private readonly _dispatch: (event: PlanChangedEvent) => void

  constructor(
    private readonly repo:    GraphRepository,
    private readonly updater: GraphUpdater,
    /**
     * Optional event dispatch override — used in tests and server-side environments.
     * In production browser code, defaults to window.dispatchEvent.
     * In Node/test, pass a spy function to capture dispatched events.
     */
    dispatchFn?: (event: PlanChangedEvent) => void,
  ) {
    this.engine = new PlannerEngine()
    this._dispatch = dispatchFn ?? defaultDispatch
  }

  // ── getActivePlan() ───────────────────────────────────────────────────────

  /**
   * Retrieve the active ActivePlan for context assembly.
   * Reads from UserGraph coachMemory facts. Returns null for new users.
   */
  async getActivePlan(userId: string): Promise<ActivePlan | null> {
    const graph = this.repo.get(userId)
    if (!graph) return null

    const fact = graph.coachMemory.facts.find(f => f.id === PLAN_FACT_ID)
    if (!fact) return null

    try {
      return JSON.parse(fact.text) as ActivePlan
    } catch {
      return null
    }
  }

  // ── dispatchPlanAdapt() ───────────────────────────────────────────────────

  /**
   * Dispatch 'coach:plan_adapt' to the EventBus.
   * P48 in platform-pipeline.ts is the ONLY handler — this method must NOT
   * call PlannerEngine.adapt() directly (Architecture Bible v2.1 §04 C2, P-16).
   */
  async dispatchPlanAdapt(
    userId:          string,
    planId:          CoachPlanId,
    reason:          'energy_low' | 'motivation_critical' | 'off_track_sustained',
    week:            number,
    actualValue:     number,
    subjectiveScore: number,
    notes:           string | null,
  ): Promise<void> {
    const event: PlanChangedEvent = {
      type:      'coach:plan_adapt',
      eventId:   uid(),
      userId,
      timestamp: Date.now(),
      payload: {
        planId,
        reason,
        week,
        actualValue,
        subjectiveScore,
        notes,
      },
    }

    this.dispatch(event)
  }

  // ── createPlan() ──────────────────────────────────────────────────────────

  /**
   * Build a new CoachPlan for the user.
   *
   * Phase → duration mapping:
   *   onboarding  → 7 days  (1 week)
   *   planning    → 30 days (4 weeks)
   *   active+     → 90 days (13 weeks)
   */
  async createPlan(
    userId:  string,
    goal:    CoachGoal,
    persona: CoachPersonaConfig,
  ): Promise<CoachPlan> {
    const graph  = this.repo.getOrCreate(userId)
    const phase  = (graph.journey.currentPhase ?? 'onboarding') as string
    const duration = phaseToDuration(phase)

    // Build an ActivePlan via PlannerEngine using the goal data
    const activePlan = this.engine.build({
      userId,
      cluster:      goal.primaryMetric as never,   // cluster approximated from primaryMetric
      assessmentId: uid(),
      strategyId:   'balanced',
      strategyName: 'Balanced Approach',
      currentValue: goal.currentValue,
      goalValue:    goal.targetValue,
      unit:         goal.unit,
      startedAt:    new Date().toISOString(),
    })

    // Convert ActivePlan → CoachPlan
    const personaId  = persona.coachId as unknown as CoachPersonaId
    const coachPlan  = adaptivePlanToCoachPlan(activePlan, userId, goal, personaId)

    // Persist the ActivePlan in graph coachMemory facts (Sprint C-1 storage)
    this.updater.addMemoryFact(userId, {
      id:         PLAN_FACT_ID,
      text:       JSON.stringify(activePlan),
      category:   'fact',
      importance: 'high',
      addedAt:    new Date().toISOString(),
    })

    // Also store the CoachPlan metadata separately
    this.updater.addMemoryFact(userId, {
      id:         'active_coach_plan_meta',
      text:       JSON.stringify(coachPlan),
      category:   'fact',
      importance: 'high',
      addedAt:    new Date().toISOString(),
    })

    // Update journey phase to reflect planning has started
    this.updater.updateJourney(userId, {
      currentPhase:  duration === 7 ? 'onboarding' : duration === 30 ? 'planning' : 'active',
      activeCluster: goal.primaryMetric,
    })

    return coachPlan
  }

  // ── getCoachPlan() ─────────────────────────────────────────────────────────

  /**
   * Retrieve the active CoachPlan (coach-domain wrapper, not ActivePlan).
   * Returns null for new users with no plan.
   */
  async getCoachPlan(userId: string): Promise<CoachPlan | null> {
    const graph = this.repo.get(userId)
    if (!graph) return null

    const fact = graph.coachMemory.facts.find(f => f.id === 'active_coach_plan_meta')
    if (!fact) return null

    try {
      return JSON.parse(fact.text) as CoachPlan
    } catch {
      return null
    }
  }

  // ── requestAdaptation() ───────────────────────────────────────────────────

  /**
   * Request a plan adaptation by emitting 'coach:plan_adapt' via EventBus.
   *
   * C2 rule: this method NEVER calls PlannerEngine.adapt() directly.
   * The event is handled by P48 in platform-pipeline.ts.
   */
  async requestAdaptation(
    userId: string,
    reason: PlanAdaptationReason,
  ): Promise<void> {
    const activePlan = await this.getActivePlan(userId)
    const planId     = (activePlan?.plan_id ?? uid()) as unknown as CoachPlanId
    const lastCheckIn = activePlan?.check_ins[activePlan.check_ins.length - 1]

    const event: PlanChangedEvent = {
      type:      'coach:plan_adapt',
      eventId:   uid(),
      userId,
      timestamp: Date.now(),
      payload: {
        planId,
        reason:         mapReason(reason),
        week:           lastCheckIn?.week ?? 1,
        actualValue:    lastCheckIn?.actual_value ?? (activePlan?.current_value ?? 0),
        subjectiveScore: lastCheckIn?.subjective_score ?? 5,
        notes:          `Adaptation requested: ${reason}`,
      },
    }

    this.dispatch(event)
  }

  // ── completeTask() ────────────────────────────────────────────────────────

  /**
   * Mark a task as completed within the active CoachPlan.
   * Updates the CoachPlan stored in the graph.
   */
  async completeTask(userId: string, taskId: string): Promise<void> {
    const coachPlan = await this.getCoachPlan(userId)
    if (!coachPlan) return

    const now = new Date().toISOString()
    const updatedTasks: readonly CoachTask[] = coachPlan.tasks.map(t => {
      if ((t.id as string) !== taskId) return t
      return {
        ...t,
        status:      'completed' as const,
        completedAt: now,
      }
    })

    const updatedPlan: CoachPlan = {
      ...coachPlan,
      tasks: updatedTasks,
    }

    this.updater.addMemoryFact(userId, {
      id:         'active_coach_plan_meta',
      text:       JSON.stringify(updatedPlan),
      category:   'fact',
      importance: 'high',
      addedAt:    now,
    })
  }

  // ── getTodaysTasks() ──────────────────────────────────────────────────────

  /**
   * Return today's incomplete tasks for the user.
   *
   * If no plan exists or no tasks are scheduled for today, returns 1–3 default
   * tasks derived from persona.domainConfig.taskCategories.
   */
  async getTodaysTasks(
    userId:  string,
    persona?: CoachPersonaConfig,
  ): Promise<readonly CoachTask[]> {
    const coachPlan = await this.getCoachPlan(userId)
    const today     = todayISO()

    if (coachPlan) {
      const todayTasks = coachPlan.tasks.filter(
        t => t.date === today && t.status !== 'completed' && t.status !== 'skipped',
      )
      if (todayTasks.length > 0) return todayTasks
    }

    // No tasks for today — generate defaults from persona config (or generic)
    return buildDefaultTasks(coachPlan, today, persona)
  }

  // ── Private: dispatch ─────────────────────────────────────────────────────

  private dispatch(event: PlanChangedEvent): void {
    this._dispatch(event)
  }
}

// ── Default dispatch ──────────────────────────────────────────────────────────

/**
 * Default event dispatch: window.dispatchEvent in browser, no-op on server.
 * Override via constructor argument for test environments (no window).
 */
function defaultDispatch(event: PlanChangedEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(event.type, { detail: event }))
  }
  // Server-side: no-op until EventBus adapter is wired in Sprint C-2.
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function todayISO(): string {
  const d   = new Date()
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function phaseToDuration(phase: string): 7 | 30 | 90 {
  if (phase === 'onboarding' || phase === 'assessment') return 7
  if (phase === 'planning') return 30
  return 90
}

function mapReason(
  reason: PlanAdaptationReason,
): 'energy_low' | 'motivation_critical' | 'off_track_sustained' {
  if (reason === 'intervention') return 'motivation_critical'
  return 'off_track_sustained'
}

const DEFAULT_TASK_TEMPLATES: readonly { category: string; description: string; minutes: number }[] = [
  { category: 'movement',     description: 'Take a 10-minute walk',        minutes: 10 },
  { category: 'nutrition',    description: 'Drink 8 glasses of water',      minutes: 5  },
  { category: 'mindfulness',  description: 'Take 5 minutes to breathe',     minutes: 5  },
]

function buildDefaultTasks(
  plan:    CoachPlan | null,
  today:   string,
  persona?: CoachPersonaConfig,
): readonly CoachTask[] {
  const planId      = (plan?.id ?? uid()) as unknown as import('../domain/types').CoachPlanId
  const categories  = persona?.domainConfig.taskCategories ?? ['movement', 'nutrition', 'sleep']
  const templates   = DEFAULT_TASK_TEMPLATES.filter(t => categories.includes(t.category))
  const selected    = templates.length > 0 ? templates.slice(0, 3) : DEFAULT_TASK_TEMPLATES.slice(0, 3)

  return selected.map(tmpl => ({
    id:                uid() as unknown as CoachTaskId,
    planId,
    date:              today,
    description:       tmpl.description,
    category:          tmpl.category,
    estimatedMinutes:  tmpl.minutes,
    status:            'assigned' as const,
    completedAt:       null,
  }))
}
