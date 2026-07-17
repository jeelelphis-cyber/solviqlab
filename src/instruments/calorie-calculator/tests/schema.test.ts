import { describe, it, expect } from 'vitest'
import { CalorieInputSchema } from '../lib/validate.js'

describe('CalorieInputSchema — valid inputs', () => {
  const valid = {
    weight_kg: 70,
    height_cm: 175,
    age: 30,
    sex: 'male' as const,
    activityLevel: 'moderate' as const,
  }

  it('accepts complete valid input', () => {
    const result = CalorieInputSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults goal to "maintain" when not provided', () => {
    const result = CalorieInputSchema.safeParse(valid)
    expect(result.success && result.data.goal).toBe('maintain')
  })

  it('defaults unitSystem to "metric" when not provided', () => {
    const result = CalorieInputSchema.safeParse(valid)
    expect(result.success && result.data.unitSystem).toBe('metric')
  })

  it('accepts all valid activityLevel values', () => {
    for (const level of ['sedentary', 'light', 'moderate', 'active', 'very_active'] as const) {
      const result = CalorieInputSchema.safeParse({ ...valid, activityLevel: level })
      expect(result.success).toBe(true)
    }
  })

  it('accepts all valid goal values', () => {
    for (const goal of ['lose', 'maintain', 'gain'] as const) {
      const result = CalorieInputSchema.safeParse({ ...valid, goal })
      expect(result.success).toBe(true)
    }
  })

  it('accepts both sex values', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, sex: 'male' }).success).toBe(true)
    expect(CalorieInputSchema.safeParse({ ...valid, sex: 'female' }).success).toBe(true)
  })

  it('accepts boundary weight: 20 kg', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, weight_kg: 20 }).success).toBe(true)
  })

  it('accepts boundary weight: 300 kg', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, weight_kg: 300 }).success).toBe(true)
  })

  it('accepts boundary height: 100 cm', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, height_cm: 100 }).success).toBe(true)
  })

  it('accepts boundary height: 250 cm', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, height_cm: 250 }).success).toBe(true)
  })

  it('accepts boundary age: 15', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, age: 15 }).success).toBe(true)
  })

  it('accepts boundary age: 100', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, age: 100 }).success).toBe(true)
  })
})

describe('CalorieInputSchema — invalid inputs', () => {
  const valid = { weight_kg: 70, height_cm: 175, age: 30, sex: 'male' as const, activityLevel: 'moderate' as const }

  it('rejects weight below 20 kg', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, weight_kg: 19 }).success).toBe(false)
  })

  it('rejects weight above 300 kg', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, weight_kg: 301 }).success).toBe(false)
  })

  it('rejects height below 100 cm', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, height_cm: 99 }).success).toBe(false)
  })

  it('rejects height above 250 cm', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, height_cm: 251 }).success).toBe(false)
  })

  it('rejects age below 15', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, age: 14 }).success).toBe(false)
  })

  it('rejects age above 100', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, age: 101 }).success).toBe(false)
  })

  it('rejects invalid sex value', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, sex: 'other' }).success).toBe(false)
  })

  it('rejects invalid activityLevel value', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, activityLevel: 'extreme' }).success).toBe(false)
  })

  it('rejects invalid goal value', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, goal: 'bulk' }).success).toBe(false)
  })

  it('rejects missing weight', () => {
    const { weight_kg: _, ...noWeight } = valid
    expect(CalorieInputSchema.safeParse(noWeight).success).toBe(false)
  })

  it('rejects missing height', () => {
    const { height_cm: _, ...noHeight } = valid
    expect(CalorieInputSchema.safeParse(noHeight).success).toBe(false)
  })

  it('rejects missing age', () => {
    const { age: _, ...noAge } = valid
    expect(CalorieInputSchema.safeParse(noAge).success).toBe(false)
  })

  it('rejects missing sex', () => {
    const { sex: _, ...noSex } = valid
    expect(CalorieInputSchema.safeParse(noSex).success).toBe(false)
  })

  it('rejects missing activityLevel', () => {
    const { activityLevel: _, ...noActivity } = valid
    expect(CalorieInputSchema.safeParse(noActivity).success).toBe(false)
  })

  it('rejects string where number expected', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, weight_kg: 'seventy' }).success).toBe(false)
  })

  it('rejects NaN weight', () => {
    expect(CalorieInputSchema.safeParse({ ...valid, weight_kg: NaN }).success).toBe(false)
  })
})
