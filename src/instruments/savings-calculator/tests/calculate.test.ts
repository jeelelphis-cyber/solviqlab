import { describe, it, expect } from 'vitest'
import { calculateSavings } from '../lib/calculate.js'

// ─── Reference values cross-checked with:
// Monthly compounding FV formula: balance(m) = balance(m-1) × (1 + r/12) + monthlyDeposit
// Where r = annualRate / 100

describe('calculateSavings — lump sum growth', () => {
  it('$10,000 @ 5% annually 10 years, no contributions → FV ≈ $16,470', () => {
    // (1 + 0.05/12)^120 × 10000 = 10000 × 1.6470... ≈ 16470.09
    const result = calculateSavings({ initialDeposit: 10000, annualRate: 5, years: 10 })
    expect(result.finalBalance).toBeCloseTo(16470, 0)
  })
})

describe('calculateSavings — monthly contributions only', () => {
  it('$0 initial + $100/month @ 5% annually 10 years → FV ≈ $15,528', () => {
    // FV annuity monthly: 100 × ((1 + 0.05/12)^120 − 1) / (0.05/12) ≈ 15528.23
    const result = calculateSavings({ initialDeposit: 0, monthlyDeposit: 100, annualRate: 5, years: 10 })
    expect(result.finalBalance).toBeCloseTo(15528, 0)
  })
})

describe('calculateSavings — rate=0 exact arithmetic', () => {
  it('rate=0: finalBalance = initialDeposit + monthlyDeposit × 12 × years (exact)', () => {
    const result = calculateSavings({ initialDeposit: 1000, monthlyDeposit: 200, annualRate: 0, years: 5 })
    const expected = 1000 + 200 * 12 * 5
    expect(result.finalBalance).toBe(expected)
  })
})

describe('calculateSavings — totalDeposited', () => {
  it('totalDeposited = initialDeposit + monthlyDeposit × 12 × years', () => {
    const result = calculateSavings({ initialDeposit: 5000, monthlyDeposit: 300, annualRate: 4, years: 10 })
    const expected = 5000 + 300 * 12 * 10
    expect(result.totalDeposited).toBeCloseTo(expected, 2)
  })

  it('totalDeposited with no monthly deposit = initialDeposit', () => {
    const result = calculateSavings({ initialDeposit: 10000, annualRate: 5, years: 5 })
    expect(result.totalDeposited).toBe(10000)
  })
})

describe('calculateSavings — totalInterest', () => {
  it('totalInterest = finalBalance - totalDeposited (always >= 0 when rate >= 0)', () => {
    const result = calculateSavings({ initialDeposit: 5000, monthlyDeposit: 200, annualRate: 4, years: 10 })
    expect(result.totalInterest).toBeCloseTo(result.finalBalance - result.totalDeposited, 2)
    expect(result.totalInterest).toBeGreaterThanOrEqual(0)
  })

  it('totalInterest = 0 when rate = 0', () => {
    const result = calculateSavings({ initialDeposit: 1000, monthlyDeposit: 100, annualRate: 0, years: 3 })
    expect(result.totalInterest).toBe(0)
  })
})

describe('calculateSavings — yearlyBreakdown', () => {
  it('yearlyBreakdown.length = years', () => {
    const result = calculateSavings({ initialDeposit: 5000, annualRate: 5, years: 10 })
    expect(result.yearlyBreakdown.length).toBe(10)
  })

  it('yearlyBreakdown[0].year = 1', () => {
    const result = calculateSavings({ initialDeposit: 5000, annualRate: 5, years: 10 })
    expect(result.yearlyBreakdown[0]!.year).toBe(1)
  })

  it('yearlyBreakdown[last].year = years', () => {
    const result = calculateSavings({ initialDeposit: 5000, annualRate: 5, years: 10 })
    expect(result.yearlyBreakdown[9]!.year).toBe(10)
  })

  it('balance grows each year when rate > 0', () => {
    const result = calculateSavings({ initialDeposit: 5000, monthlyDeposit: 100, annualRate: 5, years: 5 })
    for (let i = 1; i < result.yearlyBreakdown.length; i++) {
      expect(result.yearlyBreakdown[i]!.balance).toBeGreaterThan(result.yearlyBreakdown[i - 1]!.balance)
    }
  })

  it('yearlyBreakdown[last].balance ≈ finalBalance', () => {
    const result = calculateSavings({ initialDeposit: 5000, monthlyDeposit: 100, annualRate: 4, years: 10 })
    const lastYear = result.yearlyBreakdown[result.yearlyBreakdown.length - 1]!
    expect(lastYear.balance).toBeCloseTo(result.finalBalance, 2)
  })
})

describe('calculateSavings — monthsToGoal', () => {
  it('monthsToGoal is null when goalAmount not provided', () => {
    const result = calculateSavings({ initialDeposit: 10000, annualRate: 5, years: 10 })
    expect(result.monthsToGoal).toBeNull()
  })

  it('monthsToGoal: $10,000 init @ 5% rate, goal=$20,000 → between 160-180 months', () => {
    const result = calculateSavings({ initialDeposit: 10000, annualRate: 5, years: 50, goalAmount: 20000 })
    expect(result.monthsToGoal).not.toBeNull()
    expect(result.monthsToGoal!).toBeGreaterThanOrEqual(160)
    expect(result.monthsToGoal!).toBeLessThanOrEqual(180)
  })

  it('monthsToGoal is null if goal exceeds max 50 year projection', () => {
    // $100 initial @ 1% rate, goal = $1,000,000 — not reachable in 50 years
    const result = calculateSavings({ initialDeposit: 100, annualRate: 1, years: 50, goalAmount: 1000000 })
    expect(result.monthsToGoal).toBeNull()
  })

  it('monthsToGoal = 0 not possible — minimum is month 1', () => {
    // Goal already exceeded at start? Goal set lower than initial
    const result = calculateSavings({ initialDeposit: 10000, annualRate: 5, years: 10, goalAmount: 5000 })
    // $10,000 > $5,000 goal → reached in month 1 (since we check after first compound)
    expect(result.monthsToGoal).toBe(1)
  })
})

describe('calculateSavings — validation errors', () => {
  it('throws for negative initialDeposit', () => {
    expect(() => calculateSavings({ initialDeposit: -100, annualRate: 5, years: 10 })).toThrow()
  })

  it('throws for rate > 50', () => {
    expect(() => calculateSavings({ initialDeposit: 1000, annualRate: 51, years: 10 })).toThrow()
  })

  it('throws for years > 50', () => {
    expect(() => calculateSavings({ initialDeposit: 1000, annualRate: 5, years: 51 })).toThrow()
  })

  it('throws if both initial=0 and monthly=0', () => {
    expect(() => calculateSavings({ initialDeposit: 0, monthlyDeposit: 0, annualRate: 5, years: 10 })).toThrow()
  })

  it('throws if both initial=0 and monthly undefined', () => {
    expect(() => calculateSavings({ initialDeposit: 0, annualRate: 5, years: 10 })).toThrow()
  })

  it('throws for negative annualRate', () => {
    expect(() => calculateSavings({ initialDeposit: 1000, annualRate: -1, years: 10 })).toThrow()
  })

  it('throws for years < 1', () => {
    expect(() => calculateSavings({ initialDeposit: 1000, annualRate: 5, years: 0 })).toThrow()
  })

  it('accepts boundary values: annualRate=0, years=1, initialDeposit=0 with monthlyDeposit>0', () => {
    expect(() => calculateSavings({ initialDeposit: 0, monthlyDeposit: 100, annualRate: 0, years: 1 })).not.toThrow()
  })

  it('accepts boundary values: annualRate=50, years=50', () => {
    expect(() => calculateSavings({ initialDeposit: 1000, annualRate: 50, years: 50 })).not.toThrow()
  })
})
