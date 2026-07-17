import { describe, it, expect } from 'vitest'
import { calculateSavings } from '../lib/calculate.js'
import { SavingsInputSchema } from '../lib/validate.js'

const INPUT = {
  initialDeposit: 5000,
  monthlyDeposit: 200,
  annualRate: 4,
  years: 30,
  goalAmount: 200000,
}

describe('SavingsCalculator — performance', () => {
  it('calculateSavings() completes in < 5ms', () => {
    const start = performance.now()
    calculateSavings(INPUT)
    expect(performance.now() - start).toBeLessThan(5)
  })

  it('SavingsInputSchema.safeParse() completes in < 5ms', () => {
    const start = performance.now()
    SavingsInputSchema.safeParse(INPUT)
    expect(performance.now() - start).toBeLessThan(5)
  })

  it('full validate + calculate lifecycle < 10ms', () => {
    const start = performance.now()
    const validated = SavingsInputSchema.safeParse(INPUT)
    if (validated.success) calculateSavings(validated.data)
    expect(performance.now() - start).toBeLessThan(10)
  })

  it('1000 calculations (50-year horizon) complete in < 500ms', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      calculateSavings({
        initialDeposit: 1000 + (i % 9000),
        monthlyDeposit: i % 1000,
        annualRate: (i % 50),
        years: 1 + (i % 50),
      })
    }
    expect(performance.now() - start).toBeLessThan(500)
  })
})
