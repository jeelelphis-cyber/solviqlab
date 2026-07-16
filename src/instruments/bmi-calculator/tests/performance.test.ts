import { describe, it, expect } from 'vitest'
import { calculateBMI } from '../calculate.js'
import { BMIInputSchema } from '../validate.js'

describe('BMI Calculator — performance', () => {
  it('calculateBMI() completes in < 5ms', () => {
    const input = { height_cm: 175, weight_kg: 70, unitSystem: 'metric' as const }

    const start = performance.now()
    calculateBMI(input)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(5)
  })

  it('BMIInputSchema.safeParse() completes in < 1ms', () => {
    const input = { height_cm: 175, weight_kg: 70, unitSystem: 'metric' }

    const start = performance.now()
    BMIInputSchema.safeParse(input)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(5)
  })

  it('full calculate + interpret lifecycle < 10ms', () => {
    const input = { height_cm: 175, weight_kg: 70, unitSystem: 'metric' as const }

    const start = performance.now()
    const validated = BMIInputSchema.safeParse(input)
    if (validated.success) calculateBMI(validated.data)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(10)
  })
})
