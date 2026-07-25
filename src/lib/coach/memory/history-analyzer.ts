// ─────────────────────────────────────────────────────────────────────────────
// HistoryAnalyzer — pure functions for analysing DailyHistoryEntry arrays.
//
// Sprint C-1.3 — Daily History & Memory layer.
//
// All functions are:
//   - Pure: no side effects, no async, no I/O
//   - Deterministic: same input → same output
//   - ISO-date safe: string comparison is correct for 'YYYY-MM-DD' format
//
// Architecture Bible v2.1 §05 (C3): DailyHistoryNode is the single source of
// truth for mood, energy, and task completion.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyHistoryEntry } from '../../graph/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MoodTrend = 'improving' | 'declining' | 'stable' | 'insufficient_data'

export interface PeriodSummary {
  readonly days:            number
  readonly checkins:        number
  readonly avgMood:         number | null
  readonly avgEnergy:       number | null
  readonly trend:           MoodTrend
  readonly streak:          number
  readonly tasksCompleted:  number
  readonly completionRate:  number
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Return today as 'YYYY-MM-DD' in local time. */
function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Subtract N days from an ISO date string ('YYYY-MM-DD'), returning another ISO date string. */
function subtractDays(isoDate: string, n: number): string {
  const d = new Date(isoDate + 'T00:00:00')
  d.setDate(d.getDate() - n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Cutoff date (inclusive lower bound) for a window of N days ending at `baseDate`. */
function cutoffFor(baseDate: string, days: number): string {
  return subtractDays(baseDate, days - 1)
}

// ─────────────────────────────────────────────────────────────────────────────
// countMissedDays
// ─────────────────────────────────────────────────────────────────────────────

/**
 * How many consecutive days (counting back from today) have NO check-in.
 *
 * A day "has a check-in" if eveningCheckinDone is true OR tasksCompleted is
 * non-empty (mirrors the logic used in CoachBrain.checkIntervention).
 *
 * Days that exist in the entries array but have no activity count as missed.
 * Days entirely absent from entries (gaps) are treated as if a check-in existed
 * only when we reach a day that IS in the entries and has activity — otherwise
 * we stop counting at the first entry with activity.
 *
 * Implementation: walk backwards day-by-day from yesterday (or `today`),
 * check if an entry exists for that date and has activity. Stop at first
 * active day. Calendar gaps between today and the most recent entry are missed.
 */
export function countMissedDays(
  entries:  readonly DailyHistoryEntry[],
  today?:   string,
): number {
  const base = today ?? todayISO()

  // Index entries by date for O(1) lookup
  const byDate = new Map<string, DailyHistoryEntry>()
  for (const e of entries) byDate.set(e.date, e)

  // Determine the oldest date to consider (furthest back we'd ever count)
  // We need a practical limit; 90 days matches DailyHistoryNode's max.
  const LIMIT = 90

  let missed = 0
  for (let i = 0; i <= LIMIT; i++) {
    const date    = subtractDays(base, i)
    const entry   = byDate.get(date)

    if (!entry) {
      // No entry for this date — could be a gap before any history was recorded.
      // Stop if we've gone past all known entries.
      // Find the oldest entry date to know if we're still in-range.
      if (byDate.size === 0) break

      const oldest = [...byDate.keys()].sort()[0]!
      if (date < oldest) break   // before any history: stop counting

      // Date is within the history range but has no entry → treat as missed
      missed++
      continue
    }

    const hasActivity = entry.eveningCheckinDone || entry.tasksCompleted.length > 0
    if (hasActivity) break
    missed++
  }

  return missed
}

// ─────────────────────────────────────────────────────────────────────────────
// avgMood
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Average moodValue over entries in the last `days` days.
 * Returns null if there are no entries with non-null mood in the window.
 *
 * "Last N days" = from (today − N + 1) to today inclusive.
 */
export function avgMood(
  entries: readonly DailyHistoryEntry[],
  days:    number,
  today?:  string,
): number | null {
  const base    = today ?? todayISO()
  const cutoff  = cutoffFor(base, days)
  const inRange = entries.filter(e => e.date >= cutoff && e.date <= base && e.moodValue !== null)

  if (inRange.length === 0) return null

  const sum = inRange.reduce((acc, e) => acc + (e.moodValue ?? 0), 0)
  return sum / inRange.length
}

// ─────────────────────────────────────────────────────────────────────────────
// avgEnergy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Average energyValue over entries in the last `days` days.
 * Returns null if there are no entries with non-null energy in the window.
 */
export function avgEnergy(
  entries: readonly DailyHistoryEntry[],
  days:    number,
  today?:  string,
): number | null {
  const base    = today ?? todayISO()
  const cutoff  = cutoffFor(base, days)
  const inRange = entries.filter(e => e.date >= cutoff && e.date <= base && e.energyValue !== null)

  if (inRange.length === 0) return null

  const sum = inRange.reduce((acc, e) => acc + (e.energyValue ?? 0), 0)
  return sum / inRange.length
}

// ─────────────────────────────────────────────────────────────────────────────
// moodTrend
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify mood trend over `windowDays` days (default 6 = two 3-day windows).
 *
 * Algorithm:
 *   1. Take entries in window, sorted ascending by date, with non-null moodValue.
 *   2. Split into first half (older) and second half (newer).
 *   3. Need at least 3 total entries; otherwise 'insufficient_data'.
 *   4. improving = avgSecond − avgFirst >= +0.5
 *      declining = avgFirst − avgSecond >= +0.5
 *      stable    = |avgSecond − avgFirst| < 0.5
 */
export function moodTrend(
  entries:    readonly DailyHistoryEntry[],
  windowDays: number = 6,
  today?:     string,
): MoodTrend {
  const base    = today ?? todayISO()
  const cutoff  = cutoffFor(base, windowDays)

  const inRange = entries
    .filter(e => e.date >= cutoff && e.date <= base && e.moodValue !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  if (inRange.length < 3) return 'insufficient_data'

  const mid   = Math.floor(inRange.length / 2)
  const older = inRange.slice(0, mid)
  const newer = inRange.slice(mid)

  const avgOlder = older.reduce((s, e) => s + (e.moodValue ?? 0), 0) / older.length
  const avgNewer = newer.reduce((s, e) => s + (e.moodValue ?? 0), 0) / newer.length
  const delta    = avgNewer - avgOlder

  if (delta >=  0.5) return 'improving'
  if (delta <= -0.5) return 'declining'
  return 'stable'
}

// ─────────────────────────────────────────────────────────────────────────────
// checkinCount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Number of entries in the last `days` days where eveningCheckinDone is true.
 */
export function checkinCount(
  entries: readonly DailyHistoryEntry[],
  days:    number,
  today?:  string,
): number {
  const base   = today ?? todayISO()
  const cutoff = cutoffFor(base, days)
  return entries.filter(e => e.date >= cutoff && e.date <= base && e.eveningCheckinDone).length
}

// ─────────────────────────────────────────────────────────────────────────────
// currentStreak
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Number of consecutive days (from today backward) that have a check-in.
 *
 * A day "has a check-in" if eveningCheckinDone is true OR tasksCompleted is
 * non-empty. Today itself is included if it qualifies.
 *
 * Gaps break the streak immediately.
 */
export function currentStreak(
  entries: readonly DailyHistoryEntry[],
  today?:  string,
): number {
  const base   = today ?? todayISO()
  const byDate = new Map<string, DailyHistoryEntry>()
  for (const e of entries) byDate.set(e.date, e)

  let streak = 0
  for (let i = 0; i <= 90; i++) {
    const date  = subtractDays(base, i)
    const entry = byDate.get(date)

    if (!entry) break  // no entry = no check-in on that day = streak broken

    const hasActivity = entry.eveningCheckinDone || entry.tasksCompleted.length > 0
    if (!hasActivity) break

    streak++
  }

  return streak
}

// ─────────────────────────────────────────────────────────────────────────────
// taskCompletionRate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fraction of assigned tasks that were completed over the last `days` days.
 *
 * Returns a number in [0, 1]. Returns 0 if there are no assigned tasks
 * (avoids division by zero).
 *
 * Only entries within the window contribute. Entries with empty tasksAssigned
 * are included in the calculation as 0 assigned / 0 completed (they add nothing).
 */
export function taskCompletionRate(
  entries: readonly DailyHistoryEntry[],
  days:    number,
  today?:  string,
): number {
  const base    = today ?? todayISO()
  const cutoff  = cutoffFor(base, days)
  const inRange = entries.filter(e => e.date >= cutoff && e.date <= base)

  const totalAssigned  = inRange.reduce((s, e) => s + e.tasksAssigned.length,  0)
  const totalCompleted = inRange.reduce((s, e) => s + e.tasksCompleted.length, 0)

  if (totalAssigned === 0) return 0
  return totalCompleted / totalAssigned
}

// ─────────────────────────────────────────────────────────────────────────────
// isMilestoneDay
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether today is a milestone day relative to the first entry.
 *
 * Milestones: 7, 30, 90 days from the first recorded entry.
 * Returns the milestone number (7 | 30 | 90) or null.
 *
 * Only exact calendar day matches count — not "within X days of milestone".
 */
export function isMilestoneDay(
  entries: readonly DailyHistoryEntry[],
  today?:  string,
): 7 | 30 | 90 | null {
  if (entries.length === 0) return null

  const base    = today ?? todayISO()
  const sorted  = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const firstDate = sorted[0]!.date

  // Compute calendar days between firstDate and base
  const msPerDay  = 86_400_000
  const firstMs   = new Date(firstDate + 'T00:00:00').getTime()
  const baseMs    = new Date(base       + 'T00:00:00').getTime()
  const daysDiff  = Math.round((baseMs - firstMs) / msPerDay)

  if (daysDiff === 7)  return 7
  if (daysDiff === 30) return 30
  if (daysDiff === 90) return 90
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// periodSummary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregate statistics for the last `days` days.
 */
export function periodSummary(
  entries: readonly DailyHistoryEntry[],
  days:    number,
  today?:  string,
): PeriodSummary {
  const base = today ?? todayISO()

  return {
    days,
    checkins:       checkinCount(entries, days, base),
    avgMood:        avgMood(entries, days, base),
    avgEnergy:      avgEnergy(entries, days, base),
    trend:          moodTrend(entries, days, base),
    streak:         currentStreak(entries, base),
    tasksCompleted: entries
      .filter(e => e.date >= cutoffFor(base, days) && e.date <= base)
      .reduce((s, e) => s + e.tasksCompleted.length, 0),
    completionRate: taskCompletionRate(entries, days, base),
  }
}
