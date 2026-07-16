import { describe, it, expect } from 'vitest'
import { calculateBMI, imperialToBMI } from '../calculate.js'

// All reference values from FORMULA_VERIFICATION.md
// Cross-checked against WHO/NIH/CDC sources

describe('calculateBMI — metric', () => {
  it('computes BMI for reference case (175cm, 70kg)', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 70, unitSystem: 'metric' })
    expect(result.bmi).toBeCloseTo(22.9, 1)
    expect(result.category).toBe('normal')
  })

  it('computes BMI Prime correctly', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 70, unitSystem: 'metric' })
    expect(result.bmiPrime).toBeCloseTo(22.9 / 25, 2)
  })

  it('computes healthy weight range for 175cm', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 70, unitSystem: 'metric' })
    expect(result.healthyWeightMin_kg).toBeCloseTo(56.7, 1)
    expect(result.healthyWeightMax_kg).toBeCloseTo(76.3, 1)
  })

  it('classifies underweight (BMI < 18.5)', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 50, unitSystem: 'metric' })
    expect(result.bmi).toBeLessThan(18.5)
    expect(result.category).toBe('underweight')
  })

  it('classifies severely underweight (BMI < 16)', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 42, unitSystem: 'metric' })
    expect(result.bmi).toBeLessThan(16)
    expect(result.category).toBe('underweight_severe')
  })

  it('classifies overweight (BMI 25–30)', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 85, unitSystem: 'metric' })
    expect(result.bmi).toBeGreaterThanOrEqual(25)
    expect(result.bmi).toBeLessThan(30)
    expect(result.category).toBe('overweight')
  })

  it('classifies obese class 1 (BMI 30–35)', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 100, unitSystem: 'metric' })
    expect(result.category).toBe('obese_1')
  })
})

describe('calculateBMI — body fat estimate', () => {
  it('computes Deurenberg body fat for age=30 male BMI=25', () => {
    const result = calculateBMI({
      height_cm: 178,
      weight_kg: 79.3, // ~BMI 25
      age: 30,
      sex: 'male',
      unitSystem: 'metric',
    })
    // Deurenberg: 1.2×25 + 0.23×30 - 10.8×1 - 5.4 = 30 + 6.9 - 10.8 - 5.4 = 20.7
    expect(result.bodyFatEstimate).toBeDefined()
    expect(result.bodyFatEstimate!).toBeCloseTo(20.7, 0)
  })

  it('returns undefined body fat when age or sex is missing', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 70, unitSystem: 'metric' })
    expect(result.bodyFatEstimate).toBeUndefined()
  })

  it('returns undefined body fat for sex=other', () => {
    const result = calculateBMI({
      height_cm: 175,
      weight_kg: 70,
      age: 30,
      sex: 'other',
      unitSystem: 'metric',
    })
    expect(result.bodyFatEstimate).toBeUndefined()
  })
})

describe('imperialToBMI', () => {
  it('converts 5ft9in / 154lb correctly', () => {
    // Reference: NIH imperial formula. 703 × 154 / 69² = 22.74
    const bmi = imperialToBMI(5, 9, 154)
    expect(bmi).toBeCloseTo(22.7, 1)
  })

  it('metric and imperial give same BMI for same person', () => {
    // 5ft9in = 175.26cm, 154lb = 69.85kg
    const metricResult = calculateBMI({
      height_cm: 175.26,
      weight_kg: 69.85,
      unitSystem: 'metric',
    })
    const imperialBMI = imperialToBMI(5, 9, 154)
    // Allow 0.2 rounding difference
    expect(Math.abs(metricResult.bmi - imperialBMI)).toBeLessThan(0.2)
  })
})

describe('calculateBMI — boundary values', () => {
  it('handles minimum valid height (50cm)', () => {
    const result = calculateBMI({ height_cm: 50, weight_kg: 30, unitSystem: 'metric' })
    expect(result.bmi).toBeGreaterThan(0)
    expect(result.category).toBe('obese_3')
  })

  it('handles maximum valid weight (300kg)', () => {
    const result = calculateBMI({ height_cm: 175, weight_kg: 300, unitSystem: 'metric' })
    expect(result.bmi).toBeGreaterThan(0)
    expect(result.category).toBe('obese_3')
  })

  it('Ponderal Index computes correctly', () => {
    // 175cm, 70kg: PI = 70 / 1.75³ = 70 / 5.359 = 13.06
    const result = calculateBMI({ height_cm: 175, weight_kg: 70, unitSystem: 'metric' })
    expect(result.ponderalIndex).toBeCloseTo(13.1, 0)
  })
})
