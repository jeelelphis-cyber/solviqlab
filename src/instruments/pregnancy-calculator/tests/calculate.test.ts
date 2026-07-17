import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculatePregnancy, addDays, daysBetween } from '../lib/calculate.js'

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

  it('reversed = negative', () => {
    expect(daysBetween('2025-10-08', '2025-01-01')).toBe(-280)
  })

  it('2025-01-01 to 2025-01-15 = 14', () => {
    expect(daysBetween('2025-01-01', '2025-01-15')).toBe(14)
  })
})

// ─── LMP method ───────────────────────────────────────────────────────────────

describe('calculatePregnancy — LMP method', () => {
  it('lmpDate 2025-01-01 → dueDate 2025-10-08 (LMP + 280)', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.dueDate).toBe('2025-10-08')
  })

  it('lmpDate 2025-01-01 → conceptionDate 2025-01-15 (LMP + 14)', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.conceptionDate).toBe('2025-01-15')
  })

  it('lmpDate is echoed back as lmpDate', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.lmpDate).toBe('2025-01-01')
  })

  it('weeksPregnant = floor(daysPregnant / 7); daysPregnant = days from LMP to today (2025-05-15)', () => {
    // LMP 2025-01-01, today 2025-05-15 = 134 days → 19 weeks
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.daysPregnant).toBe(134)
    expect(r.weeksPregnant).toBe(19)
  })

  it('daysRemaining = days from today to dueDate', () => {
    // today 2025-05-15, dueDate 2025-10-08 = 146 days remaining
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.daysRemaining).toBe(146)
    expect(r.isOverdue).toBe(false)
  })
})

// ─── Conception method ────────────────────────────────────────────────────────

describe('calculatePregnancy — conception method', () => {
  it('conceptionDate 2025-01-15 → lmpDate 2025-01-01', () => {
    const r = calculatePregnancy({ method: 'conception', date: '2025-01-15' })
    expect(r.lmpDate).toBe('2025-01-01')
  })

  it('conceptionDate 2025-01-15 → dueDate 2025-10-08 (conception + 266)', () => {
    const r = calculatePregnancy({ method: 'conception', date: '2025-01-15' })
    expect(r.dueDate).toBe('2025-10-08')
  })
})

// ─── DueDate method ───────────────────────────────────────────────────────────

describe('calculatePregnancy — dueDate method', () => {
  it('dueDate 2025-10-08 → lmpDate 2025-01-01 (dueDate - 280)', () => {
    const r = calculatePregnancy({ method: 'dueDate', date: '2025-10-08' })
    expect(r.lmpDate).toBe('2025-01-01')
  })

  it('dueDate 2025-10-08 → conceptionDate 2025-01-15 (dueDate - 266)', () => {
    const r = calculatePregnancy({ method: 'dueDate', date: '2025-10-08' })
    expect(r.conceptionDate).toBe('2025-01-15')
  })
})

// ─── Cross-method consistency ─────────────────────────────────────────────────

describe('all three methods produce same dueDate for same pregnancy', () => {
  it('lmp=2025-01-01, conception=2025-01-15, dueDate=2025-10-08 all yield same dueDate', () => {
    const rLmp  = calculatePregnancy({ method: 'lmp',       date: '2025-01-01' })
    const rCon  = calculatePregnancy({ method: 'conception', date: '2025-01-15' })
    const rDue  = calculatePregnancy({ method: 'dueDate',   date: '2025-10-08' })
    expect(rLmp.dueDate).toBe('2025-10-08')
    expect(rCon.dueDate).toBe('2025-10-08')
    expect(rDue.dueDate).toBe('2025-10-08')
  })

  it('all three methods yield same lmpDate', () => {
    const rLmp = calculatePregnancy({ method: 'lmp',       date: '2025-01-01' })
    const rCon = calculatePregnancy({ method: 'conception', date: '2025-01-15' })
    const rDue = calculatePregnancy({ method: 'dueDate',   date: '2025-10-08' })
    expect(rLmp.lmpDate).toBe('2025-01-01')
    expect(rCon.lmpDate).toBe('2025-01-01')
    expect(rDue.lmpDate).toBe('2025-01-01')
  })
})

// ─── Milestones ───────────────────────────────────────────────────────────────

describe('milestones', () => {
  it('milestones array has exactly 12 entries', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.milestones).toHaveLength(12)
  })

  it('milestone week 40 date = dueDate (LMP + 280)', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    const m40 = r.milestones.find(m => m.week === 40)
    expect(m40?.date).toBe(r.dueDate)
    expect(m40?.date).toBe('2025-10-08')
  })

  it('milestone week 4 date = LMP + 28 days', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    const m4 = r.milestones.find(m => m.week === 4)
    expect(m4?.date).toBe(addDays('2025-01-01', 28))
  })

  it('milestone week 12 date = LMP + 84 days', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    const m12 = r.milestones.find(m => m.week === 12)
    expect(m12?.date).toBe(addDays('2025-01-01', 84))
  })

  it('each milestone date = LMP + (week * 7)', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    for (const m of r.milestones) {
      expect(m.date).toBe(addDays('2025-01-01', m.week * 7))
    }
  })
})

// ─── Trimester logic ──────────────────────────────────────────────────────────

describe('trimester', () => {
  it('trimester 1 when weeksPregnant = 8 (freeze today to get week 8)', () => {
    // LMP 56 days before today → 8 weeks
    // today = 2025-05-15; LMP = 2025-03-20 (56 days before)
    const lmp = addDays(FAKE_TODAY, -56)
    const r = calculatePregnancy({ method: 'lmp', date: lmp })
    expect(r.weeksPregnant).toBe(8)
    expect(r.trimester).toBe(1)
  })

  it('trimester 2 when weeksPregnant = 20', () => {
    // 140 days before today
    const lmp = addDays(FAKE_TODAY, -140)
    const r = calculatePregnancy({ method: 'lmp', date: lmp })
    expect(r.weeksPregnant).toBe(20)
    expect(r.trimester).toBe(2)
  })

  it('trimester 3 when weeksPregnant = 30', () => {
    // 210 days before today
    const lmp = addDays(FAKE_TODAY, -210)
    const r = calculatePregnancy({ method: 'lmp', date: lmp })
    expect(r.weeksPregnant).toBe(30)
    expect(r.trimester).toBe(3)
  })
})

// ─── isOverdue ────────────────────────────────────────────────────────────────

describe('isOverdue', () => {
  it('isOverdue = false when due date is in the future', () => {
    const r = calculatePregnancy({ method: 'lmp', date: '2025-01-01' })
    expect(r.isOverdue).toBe(false)
  })

  it('isOverdue = true when due date is in the past', () => {
    // LMP 282 days ago → dueDate = LMP+280 = 2 days in the past → overdue
    const lmp = addDays(FAKE_TODAY, -282)
    const r = calculatePregnancy({ method: 'lmp', date: lmp })
    expect(r.isOverdue).toBe(true)
    expect(r.daysRemaining).toBeLessThan(0)
  })
})

// ─── Validation / errors ──────────────────────────────────────────────────────

describe('validation', () => {
  it('throws for invalid date format (letters)', () => {
    expect(() => calculatePregnancy({ method: 'lmp', date: 'not-a-date' })).toThrow()
  })

  it('throws for invalid date format (empty string)', () => {
    expect(() => calculatePregnancy({ method: 'lmp', date: '' })).toThrow()
  })

  it('throws for invalid date format (wrong separator)', () => {
    expect(() => calculatePregnancy({ method: 'lmp', date: '2025/01/01' })).toThrow()
  })

  it('throws for impossible calendar date (Feb 30)', () => {
    expect(() => calculatePregnancy({ method: 'lmp', date: '2025-02-30' })).toThrow()
  })

  it('throws for LMP more than 42 weeks (294 days) in the past', () => {
    // 295 days before today → beyond 42-week cutoff
    const lmp = addDays(FAKE_TODAY, -295)
    expect(() => calculatePregnancy({ method: 'lmp', date: lmp })).toThrow()
  })

  it('throws for LMP more than 42 weeks in the future', () => {
    const lmp = addDays(FAKE_TODAY, 42 * 7 + 1)
    expect(() => calculatePregnancy({ method: 'lmp', date: lmp })).toThrow()
  })

  it('does not throw for valid LMP on the boundary (today)', () => {
    expect(() => calculatePregnancy({ method: 'lmp', date: FAKE_TODAY })).not.toThrow()
  })

  it('throws for dueDate method when date is more than 280 days away', () => {
    const tooFar = addDays(FAKE_TODAY, 281)
    expect(() => calculatePregnancy({ method: 'dueDate', date: tooFar })).toThrow()
  })
})
