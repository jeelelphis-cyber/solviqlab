import { describe, it, expect } from 'vitest'
import { calculateCalories } from '../lib/calculate.js'
import { CalorieInputSchema } from '../lib/validate.js'

const INPUT = {
  weight_kg: 70,
  height_cm: 175,
  age: 30,
  sex: 'male' as const,
  activityLevel: 'moderate' as const,
  goal: 'lose' as const,
}

describe('CalorieCalculator — performance', () => {
  it('calculateCalories() completes in < 5ms', () => {
    const start = performance.now()
    calculateCalories(INPUT)
    expect(performance.now() - start).toBeLessThan(5)
  })

  it('CalorieInputSchema.safeParse() completes in < 5ms', () => {
    const start = performance.now()
    CalorieInputSchema.safeParse(INPUT)
    expect(performance.now() - start).toBeLessThan(5)
  })

  it('full validate + calculate lifecycle < 10ms', () => {
    const start = performance.now()
    const validated = CalorieInputSchema.safeParse(INPUT)
    if (validated.success) calculateCalories(validated.data)
    expect(performance.now() - start).toBeLessThan(10)
  })

  it('1000 calculations complete in < 500ms', () => {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      calculateCalories({ ...INPUT, weight_kg: 50 + (i % 100), age: 20 + (i % 60) })
    }
    expect(performance.now() - start).toBeLessThan(500)
  })
})
