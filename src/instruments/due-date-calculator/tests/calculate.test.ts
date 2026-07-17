import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateDueDate, addDays, daysBetween } from '../lib/calculate.js'

// ─── Helper: freeze Date to a fixed "today" for relative tests ───────────────
// We use 2025-05-15 as our fake today (week 19 if LMP=2025-01-01)
const FAKE_TODAY = '2025-05-15'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(FAKE_TODAY + 'T12:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})

// ─── Pure helper tests ────────────────────────────────────────────────────────

describe('addDays helper', () => {
  it('2025-01-01 + 280 = 2025-10-08', () => {
    expect(addDays('2025-01-01', 280)).toBe('2025-10-08')
  })

  it('2025-01-01 + 0 = 2025-01-01', () => {
    expect(addDays('2025-01-01', 0)).toBe('2025-01-01')
  })

  it('2025-01-01 + 14 = 2025-01-15', () => {
    expect(addDays('2025-01-01', 14)).toBe('2025-01-15')
  })

  it('2025-10-08 + (-280) = 2025-01-01', () => {
    expect(addDays('2025-10-08', -280)).toBe('2025-01-01')
  })

  it('crosses year boundary correctly', () => {
    expect(addDays('2024-11-01', 280)).toBe('2025-08-08')
  })
})

describe('daysBetween helper', () => {
  it('2025-01-01 to 2025-10-08 = 280', () => {
    expect(daysBetween('2025-01-01', '2025-10-08')).toBe(280)
  })

  it('same date = 0', () => {
    expect(daysBetween('2025-01-01', '2025-01-01')).toBe(0)
  })

  it('reversed order returns negative', () => {
    expect(daysBetween('2025-10-08', '2025-01-01')).toBe(-280)
  })

  it('2025-01-01 to 2025-01-15 = 14', () => {
    expect(daysBetween('2025-01-01', '2025-01-15')).toBe(14)
  })
})

// ─── LMP method ───────────────────────────────────────────────────────────────

describe('calculateDueDate — LMP method', () => {
  it('LMP 2025-01-01 → dueDate 2025-10-08 (LMP + 280)', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.dueDate).toBe('2025-10-08')
  })

  it('LMP 2025-01-01 → conceptionDate 2025-01-15 (LMP + 14)', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.conceptionDate).toBe('2025-01-15')
  })

  it('LMP is echoed back as lmpDate', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.lmpDate).toBe('2025-01-01')
  })

  it('weeksPregnant = floor(daysPregnant / 7) relative to today 2025-05-15', () => {
    // LMP 2025-01-01, today 2025-05-15 = 134 days → 19 weeks
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.daysPregnant).toBe(134)
    expect(r.weeksPregnant).toBe(19)
  })

  it('daysRemaining = days from today to dueDate', () => {
    // today 2025-05-15, dueDate 2025-10-08 = 146 days remaining
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.daysRemaining).toBe(146)
    expect(r.isOverdue).toBe(false)
  })
})

// ─── Conception method ────────────────────────────────────────────────────────

describe('calculateDueDate — conception method', () => {
  it('conceptionDate 2025-01-15 → lmpDate 2025-01-01 (conception - 14)', () => {
    const r = calculateDueDate({ method: 'conception', date: '2025-01-15' })
    expect(r.lmpDate).toBe('2025-01-01')
  })

  it('conceptionDate 2025-01-15 → dueDate 2025-10-08 (conception + 266)', () => {
    const r = calculateDueDate({ method: 'conception', date: '2025-01-15' })
    expect(r.dueDate).toBe('2025-10-08')
  })
})

// ─── IVF methods ──────────────────────────────────────────────────────────────

describe('calculateDueDate — IVF methods', () => {
  it('ivf3 transfer 2025-01-15 → dueDate = transfer + 263 days', () => {
    const r = calculateDueDate({ method: 'ivf3', date: '2025-01-15' })
    expect(r.dueDate).toBe(addDays('2025-01-15', 263))
  })

  it('ivf5 transfer 2025-01-15 → dueDate = transfer + 261 days', () => {
    const r = calculateDueDate({ method: 'ivf5', date: '2025-01-15' })
    expect(r.dueDate).toBe(addDays('2025-01-15', 261))
  })

  it('ivf3 lmpDate = transfer - 17 days', () => {
    const r = calculateDueDate({ method: 'ivf3', date: '2025-01-15' })
    expect(r.lmpDate).toBe(addDays('2025-01-15', -17))
  })

  it('ivf5 lmpDate = transfer - 19 days', () => {
    const r = calculateDueDate({ method: 'ivf5', date: '2025-01-15' })
    expect(r.lmpDate).toBe(addDays('2025-01-15', -19))
  })
})

// ─── Cross-method consistency ─────────────────────────────────────────────────

describe('cross-method: all 4 methods produce valid ISO date strings for dueDate', () => {
  it('lmp method dueDate is ISO date string', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('conception method dueDate is ISO date string', () => {
    const r = calculateDueDate({ method: 'conception', date: '2025-01-15' })
    expect(r.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('ivf3 method dueDate is ISO date string', () => {
    const r = calculateDueDate({ method: 'ivf3', date: '2025-01-15' })
    expect(r.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('ivf5 method dueDate is ISO date string', () => {
    const r = calculateDueDate({ method: 'ivf5', date: '2025-01-15' })
    expect(r.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('lmp and conception with equivalent dates produce same dueDate', () => {
    const rLmp = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    const rCon = calculateDueDate({ method: 'conception', date: '2025-01-15' })
    expect(rLmp.dueDate).toBe(rCon.dueDate)
  })
})

// ─── Milestones ───────────────────────────────────────────────────────────────

describe('milestones', () => {
  it('milestones array has exactly 14 entries', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.milestones).toHaveLength(14)
  })

  it('milestone week 40 date === dueDate', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    const m40 = r.milestones.find(m => m.week === 40)
    expect(m40?.date).toBe(r.dueDate)
    expect(m40?.date).toBe('2025-10-08')
  })

  it('milestone week 28 trimester is 3', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    const m28 = r.milestones.find(m => m.week === 28)
    expect(m28?.trimester).toBe(3)
  })

  it('milestone week 28 isPast = false when today is before week 28 date', () => {
    // LMP 2025-01-01, week 28 date = 2025-07-16; today = 2025-05-15 → not past
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    const m28 = r.milestones.find(m => m.week === 28)
    expect(m28?.isPast).toBe(false)
  })

  it('milestone week 4 isPast = true when today is well past week 4', () => {
    // Week 4 date = 2025-01-29; today = 2025-05-15 → past
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    const m4 = r.milestones.find(m => m.week === 4)
    expect(m4?.isPast).toBe(true)
  })

  it('each milestone has trimester field (1, 2, or 3)', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    for (const m of r.milestones) {
      expect([1, 2, 3]).toContain(m.trimester)
    }
  })
})

// ─── Trimester boundaries ─────────────────────────────────────────────────────

describe('trimester1End and trimester2End', () => {
  it('trimester1End = lmpDate + 91 days (13 × 7)', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.trimester1End).toBe(addDays('2025-01-01', 13 * 7))
    expect(r.trimester1End).toBe(addDays('2025-01-01', 91))
  })

  it('trimester2End = lmpDate + 189 days (27 × 7)', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.trimester2End).toBe(addDays('2025-01-01', 27 * 7))
    expect(r.trimester2End).toBe(addDays('2025-01-01', 189))
  })
})

// ─── Gestational age ──────────────────────────────────────────────────────────

describe('gestationalAge format', () => {
  it('gestationalAge matches format "X weeks Y days"', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.gestationalAge).toMatch(/^\d+ weeks \d days$/)
  })

  it('gestationalAge at 19w 1d from 2025-01-01 (134 days)', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    // 134 days = 19 weeks 1 day
    expect(r.gestationalAge).toBe('19 weeks 1 days')
  })
})

// ─── isOverdue ────────────────────────────────────────────────────────────────

describe('isOverdue', () => {
  it('isOverdue = false when due date is in the future', () => {
    const r = calculateDueDate({ method: 'lmp', date: '2025-01-01' })
    expect(r.isOverdue).toBe(false)
  })

  it('isOverdue = true when dueDate is in the past', () => {
    // LMP 282 days before today → dueDate = LMP + 280 = 2 days in the past
    const lmp = addDays(FAKE_TODAY, -282)
    const r = calculateDueDate({ method: 'lmp', date: lmp })
    expect(r.isOverdue).toBe(true)
    expect(r.daysRemaining).toBeLessThan(0)
  })
})

// ─── Validation / errors ──────────────────────────────────────────────────────

describe('validation', () => {
  it('throws for invalid date format (letters)', () => {
    expect(() => calculateDueDate({ method: 'lmp', date: 'not-a-date' })).toThrow()
  })

  it('throws for invalid date format (empty string)', () => {
    expect(() => calculateDueDate({ method: 'lmp', date: '' })).toThrow()
  })

  it('throws for invalid date format (wrong separator)', () => {
    expect(() => calculateDueDate({ method: 'lmp', date: '2025/01/01' })).toThrow()
  })

  it('throws for impossible calendar date (Feb 30)', () => {
    expect(() => calculateDueDate({ method: 'lmp', date: '2025-02-30' })).toThrow()
  })

  it('throws for LMP more than 294 days in the past (lmp method)', () => {
    const lmp = addDays(FAKE_TODAY, -295)
    expect(() => calculateDueDate({ method: 'lmp', date: lmp })).toThrow()
  })

  it('throws for LMP date in the future', () => {
    const futureLmp = addDays(FAKE_TODAY, 1)
    expect(() => calculateDueDate({ method: 'lmp', date: futureLmp })).toThrow()
  })

  it('throws for conception date in the future', () => {
    const futureConception = addDays(FAKE_TODAY, 1)
    expect(() => calculateDueDate({ method: 'conception', date: futureConception })).toThrow()
  })

  it('does not throw for valid LMP on the boundary (today)', () => {
    expect(() => calculateDueDate({ method: 'lmp', date: FAKE_TODAY })).not.toThrow()
  })
})
