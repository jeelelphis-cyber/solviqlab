// ─────────────────────────────────────────────────────────────────────────────
// GraphUpdater — mutates individual UserGraph nodes.
//
// All writes go through GraphRepository so the graph stays consistent.
// Each method is an atomic patch: it reads the current graph, applies the
// change, and writes back. Never exposes raw graph mutation to callers.
// ─────────────────────────────────────────────────────────────────────────────

import type { GraphRepository } from './repository'
import type {
  UserGraph, GoalEntry, HabitEntry, AssessmentEntry,
  MemoryFact, CommunicationStyle, ResponseLength, DailyHistoryEntry,
  QuizResultEntry,
} from './types'

function now(): string { return new Date().toISOString() }

function patch<K extends keyof UserGraph>(
  repo: GraphRepository,
  userId: string,
  key: K,
  update: (current: UserGraph[K]) => UserGraph[K],
): void {
  const graph = repo.getOrCreate(userId)
  const updated: UserGraph = { ...graph, [key]: update(graph[key]) }
  repo.save(updated)
}

export class GraphUpdater {
  constructor(private readonly repo: GraphRepository) {}

  // ── Identity ──────────────────────────────────────────────────────────────

  updateIdentity(userId: string, data: {
    name?: string; language?: string; timezone?: string; age?: number; userType?: 'anonymous' | 'authenticated'
  }): void {
    patch(this.repo, userId, 'identity', cur => ({
      ...cur, ...data, updatedAt: now(),
    }))
  }

  setName(userId: string, name: string): void {
    this.updateIdentity(userId, { name })
  }

  // ── Goals ─────────────────────────────────────────────────────────────────

  upsertGoal(userId: string, goal: GoalEntry): void {
    patch(this.repo, userId, 'goals', cur => {
      const filtered = cur.items.filter(g => g.id !== goal.id)
      return { ...cur, items: [...filtered, goal], updatedAt: now(), confidence: 'stated' }
    })
  }

  removeGoal(userId: string, goalId: string): void {
    patch(this.repo, userId, 'goals', cur => ({
      ...cur,
      items:     cur.items.filter(g => g.id !== goalId),
      updatedAt: now(),
    }))
  }

  // ── Habits ────────────────────────────────────────────────────────────────

  upsertHabit(userId: string, habit: HabitEntry): void {
    patch(this.repo, userId, 'habits', cur => {
      const filtered = cur.items.filter(h => h.id !== habit.id)
      return { ...cur, items: [...filtered, habit], updatedAt: now(), confidence: 'stated' }
    })
  }

  removeHabit(userId: string, habitId: string): void {
    patch(this.repo, userId, 'habits', cur => ({
      ...cur,
      items:     cur.items.filter(h => h.id !== habitId),
      updatedAt: now(),
    }))
  }

  // ── Assessments ───────────────────────────────────────────────────────────

  upsertAssessment(userId: string, assessment: AssessmentEntry): void {
    patch(this.repo, userId, 'assessments', cur => {
      const filtered = cur.items.filter(a => a.clusterId !== assessment.clusterId)
      return {
        ...cur,
        items:      [...filtered, assessment],
        updatedAt:  now(),
        confidence: assessment.confidence === 'confirmed' ? 'confirmed' : 'inferred',
      }
    })
  }

  // ── Journey ───────────────────────────────────────────────────────────────

  updateJourney(userId: string, data: {
    activeCluster?: string | null
    currentPhase?: string | null
    progress?: number | null
    completedStep?: string
  }): void {
    patch(this.repo, userId, 'journey', cur => {
      const completedSteps = data.completedStep
        ? [...new Set([...cur.completedSteps, data.completedStep])]
        : cur.completedSteps

      return {
        ...cur,
        activeCluster:  data.activeCluster  ?? cur.activeCluster,
        currentPhase:   data.currentPhase   ?? cur.currentPhase,
        progress:       data.progress       ?? cur.progress,
        completedSteps,
        updatedAt:      now(),
        confidence:     'inferred',
      }
    })
  }

  // ── Coach Memory ──────────────────────────────────────────────────────────

  addMemoryFact(userId: string, fact: MemoryFact): void {
    patch(this.repo, userId, 'coachMemory', cur => {
      const filtered = cur.facts.filter(f => f.id !== fact.id)
      return { ...cur, facts: [...filtered, fact], updatedAt: now() }
    })
  }

  removeMemoryFact(userId: string, factId: string): void {
    patch(this.repo, userId, 'coachMemory', cur => ({
      ...cur, facts: cur.facts.filter(f => f.id !== factId), updatedAt: now(),
    }))
  }

  setCommunicationStyle(userId: string, style: CommunicationStyle): void {
    patch(this.repo, userId, 'coachMemory', cur => ({
      ...cur, communicationStyle: style, updatedAt: now(), confidence: 'stated',
    }))
  }

  addPreferredTopic(userId: string, topic: string): void {
    patch(this.repo, userId, 'coachMemory', cur => ({
      ...cur,
      preferredTopics: [...new Set([...cur.preferredTopics, topic])],
      updatedAt: now(),
    }))
  }

  // ── Preferences ───────────────────────────────────────────────────────────

  updatePreferences(userId: string, data: {
    language?: string; responseLength?: ResponseLength; notificationsEnabled?: boolean
  }): void {
    patch(this.repo, userId, 'preferences', cur => ({
      ...cur, ...data, updatedAt: now(), confidence: 'stated',
    }))
  }

  // ── Retention ─────────────────────────────────────────────────────────────

  updateRetention(userId: string, data: {
    daysSinceActive?: number; dormancyLevel?: string; lastReminderFiredAt?: string | null
  }): void {
    patch(this.repo, userId, 'retention', cur => ({
      ...cur, ...data, updatedAt: now(), confidence: 'inferred',
    }))
  }

  // ── Premium ───────────────────────────────────────────────────────────────

  updatePremium(userId: string, data: {
    tier?: string; quotaUsedToday?: number; quotaLimit?: number
  }): void {
    patch(this.repo, userId, 'premium', cur => ({
      ...cur, ...data, updatedAt: now(), confidence: 'confirmed',
    }))
  }

  // ── Daily History ─────────────────────────────────────────────────────────
  // Architecture Bible v2.1 §05 (C3): DailyHistoryNode is the single source
  // of truth for mood, energy, and task completion. Max 90 entries kept.

  addDailyHistoryEntry(userId: string, entry: DailyHistoryEntry): void {
    patch(this.repo, userId, 'dailyHistory', cur => {
      const MAX_ENTRIES = 90
      // Replace entry for same date if it exists, otherwise append
      const filtered = cur.entries.filter(e => e.date !== entry.date)
      const sorted = [...filtered, entry].sort((a, b) => a.date.localeCompare(b.date))
      // Prune oldest entries beyond 90-day window
      const pruned = sorted.length > MAX_ENTRIES ? sorted.slice(-MAX_ENTRIES) : sorted
      return { ...cur, entries: pruned, updatedAt: now() }
    })
  }

  getLastNDayHistory(userId: string, n: number): readonly DailyHistoryEntry[] {
    const graph = this.repo.getOrCreate(userId)
    const entries = graph.dailyHistory.entries
    return entries.slice(-n)
  }

  // ── Quiz Results ──────────────────────────────────────────────────────────
  // Sprint M-1: persist completed quiz results into the graph.

  saveQuizResult(userId: string, result: QuizResultEntry): void {
    patch(this.repo, userId, 'quizResults', cur => {
      // Replace existing result for same slug if any
      const filtered = (cur?.items ?? []).filter(r => r.slug !== result.slug)
      return {
        ...(cur ?? {}),
        items:      [...filtered, result],
        updatedAt:  now(),
        confidence: 'stated' as const,
      }
    })
  }

  getQuizResult(userId: string, slug: string): QuizResultEntry | null {
    const graph = this.repo.getOrCreate(userId)
    return graph.quizResults?.items.find(r => r.slug === slug) ?? null
  }
}

// ── Standalone pure helpers (for use in client components without a repo) ─────

/** Save a QuizResult into a UserGraph value object (does NOT persist — use GraphUpdater for persistence). */
export function saveQuizResult(graph: UserGraph, result: QuizResultEntry): UserGraph {
  const existing = graph.quizResults?.items ?? []
  const filtered = existing.filter(r => r.slug !== result.slug)
  return {
    ...graph,
    quizResults: {
      items:      [...filtered, result],
      updatedAt:  new Date().toISOString(),
      confidence: 'stated',
    },
    updatedAt: new Date().toISOString(),
  }
}

/** Read the latest QuizResult for a slug from a UserGraph value object. */
export function getQuizResult(graph: UserGraph, slug: string): QuizResultEntry | null {
  return graph.quizResults?.items.find(r => r.slug === slug) ?? null
}
