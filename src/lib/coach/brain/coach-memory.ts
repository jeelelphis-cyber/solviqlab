// ─────────────────────────────────────────────────────────────────────────────
// CoachMemoryImpl — CoachMemoryInterface implementation.
//
// Wraps GraphRepository and GraphUpdater to provide a clean memory API for
// Coach Brain. Brain never touches repository/updater directly.
//
// Architecture Bible v2.1 §05 (C3): DailyHistoryNode is the single source of
// truth for mood, energy, and task completion.
// ─────────────────────────────────────────────────────────────────────────────

import type { GraphRepository }   from '../../graph/repository'
import type { GraphUpdater }      from '../../graph/updater'
import type { UserGraph }         from '../../graph/types'
import type {
  CoachMemoryInterface,
  MiaContext,
} from '../contracts'
import type {
  CoachDecision,
  DailyHistory,
  CoachRoutine,
  DailyReview,
  CoachPhase,
} from '../domain/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function now(): string { return new Date().toISOString() }

function mapGraphPhaseToCoachPhase(phase: string | null): CoachPhase {
  const valid: CoachPhase[] = [
    'onboarding', 'assessment', 'planning', 'active',
    'review', 'transformation', 'paused',
  ]
  if (phase !== null && (valid as string[]).includes(phase)) {
    return phase as CoachPhase
  }
  return 'onboarding'
}

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(isoDate).getTime()
  return Math.max(0, Math.floor(ms / 86_400_000))
}

// ─────────────────────────────────────────────────────────────────────────────

export class CoachMemoryImpl implements CoachMemoryInterface {
  constructor(
    private readonly repo:    GraphRepository,
    private readonly updater: GraphUpdater,
  ) {}

  // ── Read context ──────────────────────────────────────────────────────────

  async buildContext(userId: string): Promise<MiaContext> {
    const graph = this.repo.getOrCreate(userId)

    const phase        = mapGraphPhaseToCoachPhase(graph.journey.currentPhase)
    const startDate    = graph.createdAt
    const daysSinceStart = daysSince(startDate)

    // Derive streak from dailyHistory: consecutive days with at least 1 task completed
    const entries = [...graph.dailyHistory.entries].sort((a, b) =>
      b.date.localeCompare(a.date),
    )
    let currentStreak = 0
    for (const entry of entries) {
      if (entry.tasksCompleted.length > 0) {
        currentStreak++
      } else {
        break
      }
    }

    const latestEntry   = entries[0] ?? null
    const activeGoal    = graph.goals.items.find(g => g.status === 'active') ?? null
    const recentFacts   = graph.coachMemory.facts.slice(-5).map(f => f.text)

    const context: MiaContext = {
      name:                       graph.identity.name,
      daysSinceStart,
      currentStreak,
      lastAction:                 latestEntry ? `check-in on ${latestEntry.date}` : null,
      lastMoodRating:             latestEntry?.moodValue ?? null,
      lastEnergyRating:           latestEntry?.energyValue ?? null,
      currentGoal:                activeGoal?.text ?? null,
      recentVictories:            [],   // extended in future sprints
      recentFailures:             [],
      coachNotes:                 recentFacts,
      nextMilestone:              null, // PlannerEngine-owned, read via CoachPlanner
      coachPhase:                 phase,
      lastVideoWatchedAt:         null, // set by VideoProvider webhook
      preferredCommunicationTime: null, // set by CoachRoutine
    }

    return context
  }

  // ── Raw graph access ──────────────────────────────────────────────────────

  async readGraph(userId: string): Promise<UserGraph> {
    return this.repo.getOrCreate(userId)
  }

  // ── Write decision audit log ──────────────────────────────────────────────

  async recordDecision(userId: string, decision: CoachDecision): Promise<void> {
    // Decisions are stored as memory facts for audit trail.
    // Future sprint will migrate this to a dedicated CoachDecisionsNode.
    this.updater.addMemoryFact(userId, {
      id:         decision.decisionId,
      text:       `Decision: ${decision.scriptType} (rule: ${decision.firedRuleId}) — ${decision.rationale}`,
      category:   'event',
      importance: 'medium',
      addedAt:    decision.decidedAt,
    })
  }

  // ── Daily history ─────────────────────────────────────────────────────────

  async recordDailyHistory(userId: string, entry: DailyHistory): Promise<void> {
    this.updater.addDailyHistoryEntry(userId, {
      date:                entry.date,
      morningVideoWatched: entry.morningVideoWatched,
      eveningCheckinDone:  entry.eveningCheckinDone,
      tasksAssigned:       entry.tasksAssigned,
      tasksCompleted:      entry.tasksCompleted,
      moodValue:           entry.moodRating.value,
      moodContext:         entry.moodRating.context,
      energyValue:         entry.energyRating.value,
      energyContext:       entry.energyRating.context,
      notes:               entry.notes,
      videoWatchDuration:  entry.videoWatchDuration,
    })
  }

  async getDailyHistory(userId: string, days: number): Promise<readonly DailyHistory[]> {
    const raw = this.updater.getLastNDayHistory(userId, days)
    return raw.map(e => ({
      date:                e.date,
      userId,
      morningVideoWatched: e.morningVideoWatched,
      eveningCheckinDone:  e.eveningCheckinDone,
      tasksAssigned:       e.tasksAssigned,
      tasksCompleted:      e.tasksCompleted,
      moodRating: {
        value:   e.moodValue,
        context: e.moodContext,
      },
      energyRating: {
        value:   e.energyValue,
        context: e.energyContext,
      },
      notes:              e.notes,
      videoWatchDuration: e.videoWatchDuration,
    }))
  }

  // ── Routine (stub — future Sprint) ────────────────────────────────────────

  async getRoutine(_userId: string, _type: 'morning' | 'evening'): Promise<CoachRoutine | null> {
    // Routines will be stored in a CoachRoutineNode (Sprint C-2).
    // Return null until that node is built.
    return null
  }

  // ── Daily review (stub — future Sprint) ──────────────────────────────────

  async getDailyReview(
    _userId: string,
    _date:   string,
    _period: 'morning' | 'evening',
  ): Promise<DailyReview | null> {
    // Daily Review Module is Sprint C-2. Return null for now.
    return null
  }
}
