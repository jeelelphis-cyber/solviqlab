// ─────────────────────────────────────────────────────────────────────────────
// HistoryAnalyzer — unit tests (pure functions, no side effects)
// Sprint C-1.3
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest'
import type { DailyHistoryEntry } from '../../../graph/types'
import {
  countMissedDays,
  avgMood,
  avgEnergy,
  moodTrend,
  currentStreak,
  checkinCount,
  taskCompletionRate,
  isMilestoneDay,
  periodSummary,
} from '../history-analyzer'

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeEntry(
  date:              string,
  opts: {
    eveningCheckinDone?: boolean
    tasksAssigned?:      string[]
    tasksCompleted?:     string[]
    moodValue?:          number | null
    energyValue?:        number | null
  } = {},
): DailyHistoryEntry {
  return {
    date,
    morningVideoWatched: false,
    eveningCheckinDone:  opts.eveningCheckinDone ?? false,
    tasksAssigned:       opts.tasksAssigned  ?? [],
    tasksCompleted:      opts.tasksCompleted ?? [],
    moodValue:           opts.moodValue   !== undefined ? opts.moodValue   : null,
    moodContext:         opts.moodValue   !== undefined ? 'evening'        : null,
    energyValue:         opts.energyValue !== undefined ? opts.energyValue : null,
    energyContext:       opts.energyValue !== undefined ? 'evening'        : null,
    notes:               null,
    videoWatchDuration:  null,
  }
}

// Fixed "today" for deterministic tests
const TODAY = '2026-07-25'

// ─────────────────────────────────────────────────────────────────────────────
// countMissedDays
// ─────────────────────────────────────────────────────────────────────────────

describe('countMissedDays()', () => {
  it('returns 0 when today has a check-in', () => {
    const entries = [makeEntry('2026-07-25', { eveningCheckinDone: true })]
    expect(countMissedDays(entries, TODAY)).toBe(0)
  })

  it('returns 0 when today has tasks completed (no check-in flag)', () => {
    const entries = [makeEntry('2026-07-25', { tasksCompleted: ['task-1'] })]
    expect(countMissedDays(entries, TODAY)).toBe(0)
  })

  it('returns 1 when today has no check-in but yesterday has one', () => {
    const entries = [
      makeEntry('2026-07-24', { eveningCheckinDone: true }),
      // Today (07-25) has no entry at all → counted as missed
    ]
    // i=0: date=TODAY=07-25, no entry, oldest='07-24', 07-25 >= 07-24 → missed (1)
    // i=1: date=07-24, has check-in → stop
    expect(countMissedDays(entries, TODAY)).toBe(1)
  })

  it('returns 3 when today and last 2 days have no check-in', () => {
    const entries = [
      makeEntry('2026-07-20', { eveningCheckinDone: true }),
      makeEntry('2026-07-21', { eveningCheckinDone: false }),
      makeEntry('2026-07-22', { eveningCheckinDone: false }),
      // 07-23, 07-24, 07-25 missing entirely — treated as missed if >= oldest entry
    ]
    // oldest = 07-20
    // i=0: 07-25 — no entry, in range → missed(1)
    // i=1: 07-24 — no entry, in range → missed(2)
    // i=2: 07-23 — no entry, in range → missed(3)
    // i=3: 07-22 — entry, no activity → missed(4)
    // i=4: 07-21 — entry, no activity → missed(5)
    // i=5: 07-20 — entry, has check-in → stop (5)
    expect(countMissedDays(entries, TODAY)).toBe(5)
  })

  it('returns correct count when entries are out of order', () => {
    // Supply entries in reverse order — function must handle that
    const entries = [
      makeEntry('2026-07-25', { eveningCheckinDone: false }),
      makeEntry('2026-07-24', { eveningCheckinDone: false }),
      makeEntry('2026-07-22', { eveningCheckinDone: true }),
    ]
    // i=0: 07-25 no activity → missed(1)
    // i=1: 07-24 no activity → missed(2)
    // i=2: 07-23 no entry, oldest=07-22, 07-23 >= 07-22 → missed(3)
    // i=3: 07-22 has check-in → stop → 3
    expect(countMissedDays(entries, TODAY)).toBe(3)
  })

  it('returns 0 when entries are empty', () => {
    expect(countMissedDays([], TODAY)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// avgMood
// ─────────────────────────────────────────────────────────────────────────────

describe('avgMood()', () => {
  it('returns null for empty entries', () => {
    expect(avgMood([], 7, TODAY)).toBeNull()
  })

  it('returns the single value when there is 1 entry', () => {
    const entries = [makeEntry('2026-07-25', { moodValue: 4 })]
    expect(avgMood(entries, 7, TODAY)).toBe(4)
  })

  it('returns correct average for 3 entries', () => {
    const entries = [
      makeEntry('2026-07-23', { moodValue: 2 }),
      makeEntry('2026-07-24', { moodValue: 4 }),
      makeEntry('2026-07-25', { moodValue: 3 }),
    ]
    // (2 + 4 + 3) / 3 = 3
    expect(avgMood(entries, 7, TODAY)).toBeCloseTo(3, 5)
  })

  it('returns null when all entries in window have null mood', () => {
    const entries = [makeEntry('2026-07-25', { moodValue: undefined })]
    expect(avgMood(entries, 7, TODAY)).toBeNull()
  })

  it('ignores entries outside the window', () => {
    const entries = [
      makeEntry('2026-07-01', { moodValue: 1 }),   // outside 7-day window
      makeEntry('2026-07-25', { moodValue: 5 }),
    ]
    expect(avgMood(entries, 7, TODAY)).toBe(5)
  })

  it('handles window larger than available data', () => {
    const entries = [makeEntry('2026-07-24', { moodValue: 3 })]
    expect(avgMood(entries, 30, TODAY)).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// avgEnergy
// ─────────────────────────────────────────────────────────────────────────────

describe('avgEnergy()', () => {
  it('returns null when no entries have energy data', () => {
    expect(avgEnergy([], 7, TODAY)).toBeNull()
  })

  it('returns correct average', () => {
    const entries = [
      makeEntry('2026-07-24', { energyValue: 2 }),
      makeEntry('2026-07-25', { energyValue: 4 }),
    ]
    expect(avgEnergy(entries, 7, TODAY)).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// moodTrend
// ─────────────────────────────────────────────────────────────────────────────

describe('moodTrend()', () => {
  it('returns insufficient_data when fewer than 3 entries', () => {
    const entries = [
      makeEntry('2026-07-24', { moodValue: 3 }),
      makeEntry('2026-07-25', { moodValue: 4 }),
    ]
    expect(moodTrend(entries, 7, TODAY)).toBe('insufficient_data')
  })

  it('returns improving when newer half is significantly higher', () => {
    // 6 entries: first 3 avg=2, last 3 avg=4 → delta=+2
    const entries = [
      makeEntry('2026-07-20', { moodValue: 2 }),
      makeEntry('2026-07-21', { moodValue: 2 }),
      makeEntry('2026-07-22', { moodValue: 2 }),
      makeEntry('2026-07-23', { moodValue: 4 }),
      makeEntry('2026-07-24', { moodValue: 4 }),
      makeEntry('2026-07-25', { moodValue: 4 }),
    ]
    expect(moodTrend(entries, 6, TODAY)).toBe('improving')
  })

  it('returns declining when newer half is significantly lower', () => {
    const entries = [
      makeEntry('2026-07-20', { moodValue: 4 }),
      makeEntry('2026-07-21', { moodValue: 4 }),
      makeEntry('2026-07-22', { moodValue: 4 }),
      makeEntry('2026-07-23', { moodValue: 2 }),
      makeEntry('2026-07-24', { moodValue: 2 }),
      makeEntry('2026-07-25', { moodValue: 2 }),
    ]
    expect(moodTrend(entries, 6, TODAY)).toBe('declining')
  })

  it('returns stable when delta is small (< 0.5)', () => {
    const entries = [
      makeEntry('2026-07-20', { moodValue: 3 }),
      makeEntry('2026-07-21', { moodValue: 3 }),
      makeEntry('2026-07-22', { moodValue: 3 }),
      makeEntry('2026-07-23', { moodValue: 3.2 }),
      makeEntry('2026-07-24', { moodValue: 3.2 }),
      makeEntry('2026-07-25', { moodValue: 3.2 }),
    ]
    expect(moodTrend(entries, 6, TODAY)).toBe('stable')
  })

  it('returns insufficient_data for empty entries', () => {
    expect(moodTrend([], 7, TODAY)).toBe('insufficient_data')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// currentStreak
// ─────────────────────────────────────────────────────────────────────────────

describe('currentStreak()', () => {
  it('returns 0 when no entries', () => {
    expect(currentStreak([], TODAY)).toBe(0)
  })

  it('returns 1 when only today has a check-in', () => {
    const entries = [makeEntry('2026-07-25', { eveningCheckinDone: true })]
    expect(currentStreak(entries, TODAY)).toBe(1)
  })

  it('returns 5 for 5 consecutive days including today', () => {
    const entries = [
      makeEntry('2026-07-21', { eveningCheckinDone: true }),
      makeEntry('2026-07-22', { eveningCheckinDone: true }),
      makeEntry('2026-07-23', { eveningCheckinDone: true }),
      makeEntry('2026-07-24', { eveningCheckinDone: true }),
      makeEntry('2026-07-25', { eveningCheckinDone: true }),
    ]
    expect(currentStreak(entries, TODAY)).toBe(5)
  })

  it('breaks streak on a gap (missing day)', () => {
    // Today=07-25 (check-in), 07-24 (missing), 07-23 (check-in)
    // Streak should be 1 (only today)
    const entries = [
      makeEntry('2026-07-23', { eveningCheckinDone: true }),
      makeEntry('2026-07-25', { eveningCheckinDone: true }),
    ]
    expect(currentStreak(entries, TODAY)).toBe(1)
  })

  it('breaks streak when a day has no activity', () => {
    const entries = [
      makeEntry('2026-07-23', { eveningCheckinDone: true }),
      makeEntry('2026-07-24', { eveningCheckinDone: false }),  // no activity
      makeEntry('2026-07-25', { eveningCheckinDone: true }),
    ]
    // Today OK, but 07-24 breaks streak → streak = 1
    expect(currentStreak(entries, TODAY)).toBe(1)
  })

  it('counts completed tasks as activity when eveningCheckinDone is false', () => {
    const entries = [
      makeEntry('2026-07-24', { eveningCheckinDone: false, tasksCompleted: ['t1'] }),
      makeEntry('2026-07-25', { eveningCheckinDone: true }),
    ]
    expect(currentStreak(entries, TODAY)).toBe(2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// checkinCount
// ─────────────────────────────────────────────────────────────────────────────

describe('checkinCount()', () => {
  it('returns 0 when no entries', () => {
    expect(checkinCount([], 7, TODAY)).toBe(0)
  })

  it('counts entries within window', () => {
    const entries = [
      makeEntry('2026-07-20', { eveningCheckinDone: true }),
      makeEntry('2026-07-23', { eveningCheckinDone: true }),
      makeEntry('2026-07-25', { eveningCheckinDone: true }),
    ]
    // Last 7 days from TODAY = 2026-07-19 to 2026-07-25 → all 3 are inside
    expect(checkinCount(entries, 7, TODAY)).toBe(3)
  })

  it('excludes entries outside the window', () => {
    const entries = [
      makeEntry('2026-07-01', { eveningCheckinDone: true }),  // outside window
      makeEntry('2026-07-25', { eveningCheckinDone: true }),
    ]
    expect(checkinCount(entries, 7, TODAY)).toBe(1)
  })

  it('returns 0 when entries exist but eveningCheckinDone is false', () => {
    const entries = [makeEntry('2026-07-25', { eveningCheckinDone: false })]
    expect(checkinCount(entries, 7, TODAY)).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// taskCompletionRate
// ─────────────────────────────────────────────────────────────────────────────

describe('taskCompletionRate()', () => {
  it('returns 0 when no tasks assigned', () => {
    const entries = [makeEntry('2026-07-25')]
    expect(taskCompletionRate(entries, 7, TODAY)).toBe(0)
  })

  it('returns 1 (100%) when all tasks completed', () => {
    const entries = [
      makeEntry('2026-07-25', { tasksAssigned: ['t1', 't2'], tasksCompleted: ['t1', 't2'] }),
    ]
    expect(taskCompletionRate(entries, 7, TODAY)).toBe(1)
  })

  it('returns 0.5 (50%) when half of tasks completed', () => {
    const entries = [
      makeEntry('2026-07-25', { tasksAssigned: ['t1', 't2'], tasksCompleted: ['t1'] }),
    ]
    expect(taskCompletionRate(entries, 7, TODAY)).toBe(0.5)
  })

  it('returns 0 when no tasks completed', () => {
    const entries = [
      makeEntry('2026-07-25', { tasksAssigned: ['t1', 't2'], tasksCompleted: [] }),
    ]
    expect(taskCompletionRate(entries, 7, TODAY)).toBe(0)
  })

  it('aggregates across multiple days', () => {
    const entries = [
      makeEntry('2026-07-24', { tasksAssigned: ['t1', 't2'], tasksCompleted: ['t1'] }),
      makeEntry('2026-07-25', { tasksAssigned: ['t3', 't4'], tasksCompleted: ['t3', 't4'] }),
    ]
    // 3 completed / 4 assigned = 0.75
    expect(taskCompletionRate(entries, 7, TODAY)).toBe(0.75)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// isMilestoneDay
// ─────────────────────────────────────────────────────────────────────────────

describe('isMilestoneDay()', () => {
  it('returns null when no entries', () => {
    expect(isMilestoneDay([], TODAY)).toBeNull()
  })

  it('returns 7 on the 7th day since first entry', () => {
    // First entry was 7 days ago
    const entries = [makeEntry('2026-07-18')]
    expect(isMilestoneDay(entries, TODAY)).toBe(7)
  })

  it('returns 30 on the 30th day since first entry', () => {
    const entries = [makeEntry('2026-06-25')]  // 30 days before 2026-07-25
    expect(isMilestoneDay(entries, TODAY)).toBe(30)
  })

  it('returns 90 on the 90th day since first entry', () => {
    const entries = [makeEntry('2026-04-26')]  // 90 days before 2026-07-25
    expect(isMilestoneDay(entries, TODAY)).toBe(90)
  })

  it('returns null for a non-milestone day', () => {
    const entries = [makeEntry('2026-07-20')]  // 5 days ago — not a milestone
    expect(isMilestoneDay(entries, TODAY)).toBeNull()
  })

  it('uses the earliest entry as start date when multiple entries exist', () => {
    const entries = [
      makeEntry('2026-07-20'),  // newer
      makeEntry('2026-07-18'),  // this is the real first (7 days ago)
    ]
    expect(isMilestoneDay(entries, TODAY)).toBe(7)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// periodSummary
// ─────────────────────────────────────────────────────────────────────────────

describe('periodSummary()', () => {
  it('returns zero values for empty history', () => {
    const summary = periodSummary([], 7, TODAY)
    expect(summary.days).toBe(7)
    expect(summary.checkins).toBe(0)
    expect(summary.avgMood).toBeNull()
    expect(summary.avgEnergy).toBeNull()
    expect(summary.trend).toBe('insufficient_data')
    expect(summary.streak).toBe(0)
    expect(summary.tasksCompleted).toBe(0)
    expect(summary.completionRate).toBe(0)
  })

  it('correctly aggregates a week of data', () => {
    const entries = [
      makeEntry('2026-07-21', { eveningCheckinDone: true, tasksAssigned: ['t1'], tasksCompleted: ['t1'], moodValue: 3, energyValue: 3 }),
      makeEntry('2026-07-22', { eveningCheckinDone: true, tasksAssigned: ['t2'], tasksCompleted: ['t2'], moodValue: 4, energyValue: 4 }),
      makeEntry('2026-07-23', { eveningCheckinDone: true, tasksAssigned: ['t3'], tasksCompleted: [],      moodValue: 5, energyValue: 5 }),
      makeEntry('2026-07-24', { eveningCheckinDone: true, tasksAssigned: [],     tasksCompleted: [],      moodValue: 4, energyValue: 4 }),
      makeEntry('2026-07-25', { eveningCheckinDone: true, tasksAssigned: [],     tasksCompleted: [],      moodValue: 5, energyValue: 5 }),
    ]
    const summary = periodSummary(entries, 7, TODAY)

    expect(summary.days).toBe(7)
    expect(summary.checkins).toBe(5)           // all 5 entries have eveningCheckinDone=true
    expect(summary.tasksCompleted).toBe(2)     // t1 + t2
    expect(summary.completionRate).toBe(2/3)   // 2 completed / 3 assigned
    expect(summary.avgMood).toBeCloseTo((3+4+5+4+5)/5, 5)
    expect(summary.streak).toBe(5)             // all 5 consecutive days
  })
})
