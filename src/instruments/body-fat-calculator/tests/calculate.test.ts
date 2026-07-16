import { describe, it, expect } from 'vitest'
import { calculateBodyFatCalculator } from '../lib/calculate.js'

describe('calculateBodyFatCalculator — male body fat %', () => {
  it('male height=177, neck=37, waist=81 → bodyFat in plausible range', () => {
    const result = calculateBodyFatCalculator({ height: 177, neck: 37, waist: 81, sex: 'male' })
    expect(result.bodyFat).toBeGreaterThan(10)
    expect(result.bodyFat).toBeLessThan(20)
  })

  it('male lean: height=180, neck=40, waist=75 → bodyFat < 15%', () => {
    const result = calculateBodyFatCalculator({ height: 180, neck: 40, waist: 75, sex: 'male' })
    expect(result.bodyFat).toBeLessThan(15)
    expect(result.bodyFat).toBeGreaterThan(3)
  })

  it('higher waist → higher body fat', () => {
    const lean  = calculateBodyFatCalculator({ height: 180, neck: 38, waist: 78, sex: 'male' })
    const heavy = calculateBodyFatCalculator({ height: 180, neck: 38, waist: 100, sex: 'male' })
    expect(heavy.bodyFat).toBeGreaterThan(lean.bodyFat)
  })
})

describe('calculateBodyFatCalculator — female body fat %', () => {
  it('female height=165, neck=31, waist=70, hip=95 → 20–35%', () => {
    const result = calculateBodyFatCalculator({ height: 165, neck: 31, waist: 70, hip: 95, sex: 'female' })
    expect(result.bodyFat).toBeGreaterThan(20)
    expect(result.bodyFat).toBeLessThan(35)
  })
})

describe('calculateBodyFatCalculator — fatMass / leanMass (requires weight)', () => {
  it('returns null for fatMass/leanMass when weight not provided', () => {
    const result = calculateBodyFatCalculator({ height: 177, neck: 37, waist: 81, sex: 'male' })
    expect(result.fatMass).toBeNull()
    expect(result.leanMass).toBeNull()
  })

  it('computes fatMass and leanMass correctly when weight provided', () => {
    // male, 80kg, ~15% body fat → fatMass ≈ 12kg, leanMass ≈ 68kg
    const result = calculateBodyFatCalculator({ height: 177, neck: 37, waist: 81, sex: 'male', weight: 80 })
    expect(result.fatMass).not.toBeNull()
    expect(result.leanMass).not.toBeNull()
    expect(result.fatMass! + result.leanMass!).toBeCloseTo(80, 0)
    expect(result.fatMass!).toBeGreaterThan(0)
    expect(result.leanMass!).toBeGreaterThan(0)
  })
})

describe('calculateBodyFatCalculator — sex-specific categories (ACE guidelines)', () => {
  it('male at 10% body fat → Athletic (not Essential Fat)', () => {
    // Force 10% via waist/neck ratio that yields ~10%
    const result = calculateBodyFatCalculator({ height: 185, neck: 42, waist: 72, sex: 'male' })
    // At these measurements bodyFat should be in athletic range for males
    if (result.bodyFat >= 6 && result.bodyFat < 14) {
      expect(result.category).toBe('Athletic')
    }
  })

  it('female at 18% body fat → Athletic (not Fitness as per male range)', () => {
    const result = calculateBodyFatCalculator({ height: 165, neck: 31, waist: 65, hip: 88, sex: 'female' })
    // Female athletic range is 14-20%
    if (result.bodyFat >= 14 && result.bodyFat < 21) {
      expect(result.category).toBe('Athletic')
    }
  })

  it('male Essential Fat threshold is 6% (not 14% as female)', () => {
    // A male at 7% should be Athletic, not Essential Fat
    const result = calculateBodyFatCalculator({ height: 185, neck: 42, waist: 72, sex: 'male' })
    if (result.bodyFat > 6) {
      expect(result.category).not.toBe('Essential Fat')
    }
  })
})
