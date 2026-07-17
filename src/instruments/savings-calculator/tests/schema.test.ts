import { describe, it, expect } from 'vitest'
import { SavingsInputSchema } from '../lib/validate.js'

describe('SavingsInputSchema — valid inputs', () => {
  const valid = {
    initialDeposit: 5000,
    monthlyDeposit: 200,
    annualRate: 4,
    years: 10,
  }

  it('accepts complete valid input', () => {
    expect(SavingsInputSchema.safeParse(valid).success).toBe(true)
  })

  it('defaults monthlyDeposit to 0 when not provided', () => {
    const result = SavingsInputSchema.safeParse({ initialDeposit: 1000, annualRate: 5, years: 10 })
    expect(result.success && result.data.monthlyDeposit).toBe(0)
  })

  it('defaults compoundFrequency to "monthly" when not provided', () => {
    const result = SavingsInputSchema.safeParse(valid)
    expect(result.success && result.data.compoundFrequency).toBe('monthly')
  })

  it('accepts all valid compoundFrequency values', () => {
    for (const freq of ['monthly', 'quarterly', 'annually'] as const) {
      expect(SavingsInputSchema.safeParse({ ...valid, compoundFrequency: freq }).success).toBe(true)
    }
  })

  it('accepts goalAmount when provided', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, goalAmount: 50000 }).success).toBe(true)
  })

  it('goalAmount is undefined when not provided', () => {
    const result = SavingsInputSchema.safeParse(valid)
    expect(result.success && result.data.goalAmount).toBeUndefined()
  })

  it('accepts initialDeposit = 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, initialDeposit: 0 }).success).toBe(true)
  })

  it('accepts initialDeposit = 10,000,000 (max)', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, initialDeposit: 10_000_000 }).success).toBe(true)
  })

  it('accepts monthlyDeposit = 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, monthlyDeposit: 0 }).success).toBe(true)
  })

  it('accepts monthlyDeposit = 100,000 (max)', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, monthlyDeposit: 100_000 }).success).toBe(true)
  })

  it('accepts annualRate = 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, annualRate: 0 }).success).toBe(true)
  })

  it('accepts annualRate = 50 (max)', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, annualRate: 50 }).success).toBe(true)
  })

  it('accepts years = 1 (min)', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, years: 1 }).success).toBe(true)
  })

  it('accepts years = 50 (max)', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, years: 50 }).success).toBe(true)
  })
})

describe('SavingsInputSchema — invalid inputs', () => {
  const valid = {
    initialDeposit: 5000,
    monthlyDeposit: 200,
    annualRate: 4,
    years: 10,
  }

  it('rejects initialDeposit < 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, initialDeposit: -1 }).success).toBe(false)
  })

  it('rejects initialDeposit > 10,000,000', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, initialDeposit: 10_000_001 }).success).toBe(false)
  })

  it('rejects monthlyDeposit < 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, monthlyDeposit: -1 }).success).toBe(false)
  })

  it('rejects monthlyDeposit > 100,000', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, monthlyDeposit: 100_001 }).success).toBe(false)
  })

  it('rejects annualRate < 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, annualRate: -0.01 }).success).toBe(false)
  })

  it('rejects annualRate > 50', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, annualRate: 50.01 }).success).toBe(false)
  })

  it('rejects years < 1', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, years: 0 }).success).toBe(false)
  })

  it('rejects years > 50', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, years: 51 }).success).toBe(false)
  })

  it('rejects non-integer years', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, years: 5.5 }).success).toBe(false)
  })

  it('rejects invalid compoundFrequency', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, compoundFrequency: 'weekly' }).success).toBe(false)
  })

  it('rejects missing initialDeposit', () => {
    const { initialDeposit: _, ...noDeposit } = valid
    expect(SavingsInputSchema.safeParse(noDeposit).success).toBe(false)
  })

  it('rejects missing annualRate', () => {
    const { annualRate: _, ...noRate } = valid
    expect(SavingsInputSchema.safeParse(noRate).success).toBe(false)
  })

  it('rejects missing years', () => {
    const { years: _, ...noYears } = valid
    expect(SavingsInputSchema.safeParse(noYears).success).toBe(false)
  })

  it('rejects string where number expected', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, initialDeposit: 'five thousand' }).success).toBe(false)
  })

  it('rejects NaN annualRate', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, annualRate: NaN }).success).toBe(false)
  })

  it('rejects goalAmount < 0', () => {
    expect(SavingsInputSchema.safeParse({ ...valid, goalAmount: -1 }).success).toBe(false)
  })
})
