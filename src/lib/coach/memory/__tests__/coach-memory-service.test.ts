// ─────────────────────────────────────────────────────────────────────────────
// CoachMemoryService — unit tests
// Sprint C-1.3
//
// CoachMemoryInterface is fully mocked. Tests validate orchestration and
// analytics logic — never the implementation details of CoachMemoryImpl.
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { MockedObject }                     from 'vitest'

import { CoachMemoryService }    from '../coach-memory-service'
import type { CoachMemoryInterface } from '../../contracts'
import type { DailyHistory }     from '../../domain/types'

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeMockMemory(): MockedObject<CoachMemoryInterface> {
  return {
    buildContext:        vi.fn(),
    readGraph:           vi.fn(),
    recordDecision:      vi.fn(),
    recordDailyHistory:  vi.fn(),
    getDailyHistory:     vi.fn(),
    getRoutine:          vi.fn(),
    getDailyReview:      vi.fn(),
  }
}

function makeDailyHistory(
  date:  string,
  opts: {
    eveningCheckinDone?: boolean
    tasksAssigned?:      string[]
    tasksCompleted?:     string[]
    moodValue?:          number | null
    energyValue?:        number | null
  } = {},
): DailyHistory {
  return {
    date,
    userId:              'user-1',
    morningVideoWatched: false,
    eveningCheckinDone:  opts.eveningCheckinDone ?? false,
    tasksAssigned:       opts.tasksAssigned  ?? [],
    tasksCompleted:      opts.tasksCompleted ?? [],
    moodRating:  { value: opts.moodValue   ?? null, context: opts.moodValue   != null ? 'evening' : null },
    energyRating:{ value: opts.energyValue ?? null, context: opts.energyValue != null ? 'evening' : null },
    notes:               null,
    videoWatchDuration:  null,
  }
}

// Fixed "today" injected via vi.setSystemTime()
const FIXED_TODAY = new Date('2026-07-25T12:00:00.000Z')

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CoachMemoryService', () => {
  let memory:  MockedObject<CoachMemoryInterface>
  let service: CoachMemoryService

  beforeEach(() => {
    memory  = makeMockMemory()
    service = new CoachMemoryService(memory)
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_TODAY)
  })

  // Reset timers after each test
  afterEach(() => {
    vi.useRealTimers()
  })

  // ── getUserInsights() ─────────────────────────────────────────────────────

  describe('getUserInsights()', () => {
    it('returns correct insights for a user with 5 consecutive check-ins', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-21', { eveningCheckinDone: true, moodValue: 3, energyValue: 3 }),
        makeDailyHistory('2026-07-22', { eveningCheckinDone: true, moodValue: 4, energyValue: 4 }),
        makeDailyHistory('2026-07-23', { eveningCheckinDone: true, moodValue: 4, energyValue: 4 }),
        makeDailyHistory('2026-07-24', { eveningCheckinDone: true, moodValue: 4, energyValue: 4 }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true, moodValue: 5, energyValue: 5 }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const insights = await service.getUserInsights('user-1')

      expect(insights.userId).toBe('user-1')
      expect(insights.streak).toBe(5)
      expect(insights.last7Days.checkins).toBe(5)
      expect(insights.missedDays).toBe(0)
      expect(insights.needsIntervention).toBe(false)
      expect(insights.interventionReason).toBeNull()
    })

    it('sets needsIntervention=true and correct reason when 3 days are missed', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-20', { eveningCheckinDone: true }),
        // 07-21, 07-22, 07-23, 07-24 all missing → 4 consecutive missed
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const insights = await service.getUserInsights('user-1')

      expect(insights.needsIntervention).toBe(true)
      expect(insights.interventionReason).toBe('missed_3_days')
      expect(insights.missedDays).toBeGreaterThanOrEqual(3)
    })

    it('includes generatedAt as a valid ISO datetime', async () => {
      memory.getDailyHistory.mockResolvedValue([])
      const insights = await service.getUserInsights('user-1')
      expect(() => new Date(insights.generatedAt)).not.toThrow()
      expect(insights.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('returns milestone 7 when first entry was 7 days ago', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-18', { eveningCheckinDone: true }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const insights = await service.getUserInsights('user-1')
      expect(insights.isMilestoneDay).toBe(7)
    })
  })

  // ── needsIntervention() ───────────────────────────────────────────────────

  describe('needsIntervention()', () => {
    it('returns null when user has recent check-ins and stable mood', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-23', { eveningCheckinDone: true, moodValue: 4 }),
        makeDailyHistory('2026-07-24', { eveningCheckinDone: true, moodValue: 4 }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true, moodValue: 4 }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const result = await service.needsIntervention('user-1')
      expect(result).toBeNull()
    })

    it('returns missed_3_days after 3 consecutive missed days', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-20', { eveningCheckinDone: true }),
        // 07-21, 07-22, 07-23, 07-24 missing → ≥3 missed
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const result = await service.needsIntervention('user-1')
      expect(result).toBe('missed_3_days')
    })

    it('returns low_mood_sustained when mood < 2.5 for last 2 days', async () => {
      const history: readonly DailyHistory[] = [
        // Yesterday and today both check-in done but low mood
        makeDailyHistory('2026-07-24', { eveningCheckinDone: true, moodValue: 2 }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true, moodValue: 2 }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const result = await service.needsIntervention('user-1', {
        missedDays:       3,
        lowMoodThreshold: 2.5,
        lowMoodDays:      2,
      })
      expect(result).toBe('low_mood_sustained')
    })

    it('respects custom thresholds', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-24', { eveningCheckinDone: true, moodValue: 3 }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true, moodValue: 3 }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      // With a high threshold of 3.5, mood=3 should trigger low_mood_sustained
      const result = await service.needsIntervention('user-1', {
        missedDays:       3,
        lowMoodThreshold: 3.5,
        lowMoodDays:      2,
      })
      expect(result).toBe('low_mood_sustained')
    })
  })

  // ── saveCheckIn() ─────────────────────────────────────────────────────────

  describe('saveCheckIn()', () => {
    it('calls memory.recordDailyHistory with correct entry shape', async () => {
      memory.recordDailyHistory.mockResolvedValue(undefined)

      await service.saveCheckIn('user-1', {
        userId:         'user-1',
        date:           '2026-07-25',
        mood:           4,
        energy:         3,
        completedTasks: ['task-1', 'task-2'],
        notes:          'Feeling good',
      })

      expect(memory.recordDailyHistory).toHaveBeenCalledOnce()
      const [calledUserId, entry] = memory.recordDailyHistory.mock.calls[0]!
      expect(calledUserId).toBe('user-1')
      expect(entry.date).toBe('2026-07-25')
      expect(entry.eveningCheckinDone).toBe(true)
      expect(entry.moodRating.value).toBe(4)
      expect(entry.moodRating.context).toBe('evening')
      expect(entry.energyRating.value).toBe(3)
      expect(entry.tasksCompleted).toEqual(['task-1', 'task-2'])
      expect(entry.notes).toBe('Feeling good')
    })

    it('stores null notes when notes is not provided', async () => {
      memory.recordDailyHistory.mockResolvedValue(undefined)

      await service.saveCheckIn('user-1', {
        userId:         'user-1',
        date:           '2026-07-25',
        mood:           3,
        energy:         3,
        completedTasks: [],
      })

      const [, entry] = memory.recordDailyHistory.mock.calls[0]!
      expect(entry.notes).toBeNull()
    })
  })

  // ── getStreak() ───────────────────────────────────────────────────────────

  describe('getStreak()', () => {
    it('returns 0 when no history', async () => {
      memory.getDailyHistory.mockResolvedValue([])
      const streak = await service.getStreak('user-1')
      expect(streak).toBe(0)
    })

    it('returns 3 for 3 consecutive days including today', async () => {
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-23', { eveningCheckinDone: true }),
        makeDailyHistory('2026-07-24', { eveningCheckinDone: true }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const streak = await service.getStreak('user-1')
      expect(streak).toBe(3)
    })

    it('breaks streak when a day is missing', async () => {
      // Gap on 2026-07-23 → streak is only 2 (07-24 + 07-25)
      const history: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-22', { eveningCheckinDone: true }),
        makeDailyHistory('2026-07-24', { eveningCheckinDone: true }),
        makeDailyHistory('2026-07-25', { eveningCheckinDone: true }),
      ]
      memory.getDailyHistory.mockResolvedValue(history)

      const streak = await service.getStreak('user-1')
      expect(streak).toBe(2)
    })
  })

  // ── getHistory() ──────────────────────────────────────────────────────────

  describe('getHistory()', () => {
    it('returns mapped DailyHistoryEntry array', async () => {
      const raw: readonly DailyHistory[] = [
        makeDailyHistory('2026-07-25', { moodValue: 4, energyValue: 3, eveningCheckinDone: true }),
      ]
      memory.getDailyHistory.mockResolvedValue(raw)

      const result = await service.getHistory('user-1', 7)

      expect(result).toHaveLength(1)
      expect(result[0]?.date).toBe('2026-07-25')
      expect(result[0]?.moodValue).toBe(4)
      expect(result[0]?.energyValue).toBe(3)
      expect(result[0]?.eveningCheckinDone).toBe(true)
    })

    it('delegates to memory.getDailyHistory with the requested days', async () => {
      memory.getDailyHistory.mockResolvedValue([])
      await service.getHistory('user-1', 30)
      expect(memory.getDailyHistory).toHaveBeenCalledWith('user-1', 30)
    })
  })
})
