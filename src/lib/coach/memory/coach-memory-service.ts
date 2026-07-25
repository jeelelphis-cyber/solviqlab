// ─────────────────────────────────────────────────────────────────────────────
// CoachMemoryService — high-level memory + analytics service.
//
// Sprint C-1.3 — Daily History & Memory layer.
//
// Sits above CoachMemoryImpl and HistoryAnalyzer. Used by CoachBrain and
// DecisionRules to query analytics without touching raw graph structures.
//
// Architecture Bible v2.1 §05 (C3): DailyHistoryNode is the single source of
// truth. This service is the recommended read path for the Coach Brain.
// ─────────────────────────────────────────────────────────────────────────────

import type { CoachMemoryInterface } from '../contracts'
import type { DailyHistory }         from '../domain/types'
import type { DailyHistoryEntry }    from '../../graph/types'
import type { PeriodSummary, MoodTrend } from './history-analyzer'
import {
  countMissedDays,
  currentStreak,
  isMilestoneDay,
  periodSummary,
  avgMood,
} from './history-analyzer'

// ── Exported types ────────────────────────────────────────────────────────────

export type { PeriodSummary, MoodTrend }

export type InterventionReason =
  | 'missed_3_days'
  | 'low_mood_sustained'
  | 'mood_declining'
  | 'no_tasks_completed'
  | null

export interface InterventionThresholds {
  readonly missedDays:        number   // default 3
  readonly lowMoodThreshold:  number   // default 2.5
  readonly lowMoodDays:       number   // default 2
}

export interface UserInsights {
  readonly userId:               string
  readonly generatedAt:          string        // ISO datetime
  readonly streak:               number
  readonly last7Days:            PeriodSummary
  readonly last30Days:           PeriodSummary
  readonly moodTrend:            MoodTrend
  readonly missedDays:           number        // consecutive missed
  readonly isMilestoneDay:       number | null
  readonly needsIntervention:    boolean
  readonly interventionReason:   InterventionReason
}

// ── Default thresholds ────────────────────────────────────────────────────────

const DEFAULT_THRESHOLDS: InterventionThresholds = {
  missedDays:       3,
  lowMoodThreshold: 2.5,
  lowMoodDays:      2,
}

// ── DailyCheckIn ─────────────────────────────────────────────────────────────
// Re-export the DailyCheckIn type so CoachMemoryService is self-contained.
// The canonical definition lives in coach-brain.ts; we mirror the shape here
// to avoid a circular dependency between brain → memory.

export interface DailyCheckIn {
  readonly userId:         string
  readonly date:           string
  readonly mood:           number
  readonly energy:         number
  readonly completedTasks: readonly string[]
  readonly notes?:         string
}

// ── CoachMemoryService ────────────────────────────────────────────────────────

export class CoachMemoryService {
  constructor(private readonly memory: CoachMemoryInterface) {}

  // ── getUserInsights() ─────────────────────────────────────────────────────

  /**
   * Build a full UserInsights snapshot for the given user.
   * Called by CoachBrain.analyze() to feed analytics into decision rules.
   */
  async getUserInsights(userId: string): Promise<UserInsights> {
    const history = await this.getHistory(userId, 90)
    const entries = history as readonly DailyHistoryEntry[]

    const today        = todayISO()
    const streak       = currentStreak(entries, today)
    const missed       = countMissedDays(entries, today)
    const milestone    = isMilestoneDay(entries, today)
    const last7        = periodSummary(entries, 7, today)
    const last30       = periodSummary(entries, 30, today)
    const trend        = last7.trend
    const reason       = resolveInterventionReason(entries, DEFAULT_THRESHOLDS, today)

    return {
      userId,
      generatedAt:          new Date().toISOString(),
      streak,
      last7Days:            last7,
      last30Days:           last30,
      moodTrend:            trend,
      missedDays:           missed,
      isMilestoneDay:       milestone,
      needsIntervention:    reason !== null,
      interventionReason:   reason,
    }
  }

  // ── saveCheckIn() ─────────────────────────────────────────────────────────

  /**
   * Convert a DailyCheckIn into a DailyHistory entry and persist it.
   * This is the single authorised write path for mood/energy data (C3).
   */
  async saveCheckIn(userId: string, checkIn: DailyCheckIn): Promise<void> {
    const entry: DailyHistory = {
      date:                checkIn.date,
      userId,
      morningVideoWatched: false,        // updated by VideoProvider webhook
      eveningCheckinDone:  true,
      tasksAssigned:       [],           // populated by PlannerEngine
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

  // ── getHistory() ──────────────────────────────────────────────────────────

  /**
   * Retrieve the last `days` DailyHistory entries for the user.
   * Delegates to CoachMemoryInterface.getDailyHistory().
   */
  async getHistory(userId: string, days: number): Promise<readonly DailyHistoryEntry[]> {
    // CoachMemoryInterface returns DailyHistory (domain type) which shares
    // the same shape as DailyHistoryEntry but with nested moodRating/energyRating.
    // We convert to DailyHistoryEntry here for the analyzer functions.
    const domainHistory = await this.memory.getDailyHistory(userId, days)
    return domainHistory.map(d => ({
      date:                d.date,
      morningVideoWatched: d.morningVideoWatched,
      eveningCheckinDone:  d.eveningCheckinDone,
      tasksAssigned:       d.tasksAssigned,
      tasksCompleted:      d.tasksCompleted,
      moodValue:           d.moodRating.value,
      moodContext:         d.moodRating.context,
      energyValue:         d.energyRating.value,
      energyContext:       d.energyRating.context,
      notes:               d.notes,
      videoWatchDuration:  d.videoWatchDuration,
    }))
  }

  // ── getStreak() ───────────────────────────────────────────────────────────

  /** Current consecutive-day streak for the user. */
  async getStreak(userId: string): Promise<number> {
    const entries = await this.getHistory(userId, 90)
    return currentStreak(entries, todayISO())
  }

  // ── needsIntervention() ───────────────────────────────────────────────────

  /**
   * Determine whether the user needs an intervention right now.
   * Returns the reason string or null if no intervention is needed.
   *
   * Evaluation order (first match wins):
   *   1. missed_3_days       — consecutiveMissedDays >= thresholds.missedDays
   *   2. low_mood_sustained  — avgMood(last N days) < thresholds.lowMoodThreshold
   *   3. mood_declining      — moodTrend === 'declining'
   *   4. no_tasks_completed  — 0 tasks completed in last 7 days
   */
  async needsIntervention(
    userId:     string,
    thresholds: InterventionThresholds = DEFAULT_THRESHOLDS,
  ): Promise<InterventionReason> {
    const entries = await this.getHistory(userId, 90)
    return resolveInterventionReason(entries, thresholds, todayISO())
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return today as 'YYYY-MM-DD' in local time. */
function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Return the ISO date string N days before `isoDate`. */
function isoDateMinusDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() - n)
  const y   = d.getFullYear()
  const mon = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mon}-${day}`
}

/**
 * Pure helper: resolve InterventionReason from entries + thresholds.
 * Extracted so getUserInsights() and needsIntervention() share the same logic.
 */
function resolveInterventionReason(
  entries:    readonly DailyHistoryEntry[],
  thresholds: InterventionThresholds,
  today:      string,
): InterventionReason {
  // 1. Missed days
  const missed = countMissedDays(entries, today)
  if (missed >= thresholds.missedDays) return 'missed_3_days'

  // 2. Low mood sustained
  const mood = avgMood(entries, thresholds.lowMoodDays, today)
  if (mood !== null && mood < thresholds.lowMoodThreshold) return 'low_mood_sustained'

  // 3. Mood declining trend
  const summary = periodSummary(entries, 7, today)
  if (summary.trend === 'declining') return 'mood_declining'

  // 4. No tasks completed in last 7 days (only fires when tasks were actually assigned)
  if (summary.tasksCompleted === 0 && summary.checkins > 0) {
    const week7Cutoff  = isoDateMinusDays(today, 6)
    const anyAssigned  = entries.some(e =>
      e.date >= week7Cutoff && e.date <= today && e.tasksAssigned.length > 0,
    )
    if (anyAssigned) return 'no_tasks_completed'
  }

  return null
}
