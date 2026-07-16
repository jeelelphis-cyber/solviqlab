import { describe, it, expect } from 'vitest'
import { calculatePercentageCalculator } from '../calculate.js'
import { PercentageCalculatorInputSchema } from '../validate.js'

describe('Percentage Calculator — performance', () => {
  it('calculate() completes in < 5ms', () => {
    const input = { mode: 'percent-of' as const, a: 15, b: 200 }
    const start = performance.now()
    calculatePercentageCalculator(input)
    expect(performance.now() - start).toBeLessThan(5)
  })

  it('validate() completes in < 1ms (after JIT warmup)', () => {
    // Warm up Zod's JIT compilation
    PercentageCalculatorInputSchema.safeParse({ mode: 'percent-of', a: 1, b: 1 })
    const start = performance.now()
    PercentageCalculatorInputSchema.safeParse({ mode: 'percent-of', a: 15, b: 200 })
    expect(performance.now() - start).toBeLessThan(1)
  })
})
