import { describe, it, expect } from 'vitest'
import { calculateTdeeCalculator } from '../lib/calculate.js'

// Mifflin-St Jeor BMR + Harris-Benedict activity multipliers
// multipliers: sedentary=1.2, light=1.375, moderate=1.55, active=1.725, very_active=1.9
// weightLoss = tdee - 500, weightGain = tdee + 500

describe('calculateTdeeCalculator — reference values', () => {
  it('male 80kg 180cm 30yr moderate → BMR=1780, TDEE=2759', () => {
    // BMR: base = 10*80 + 6.25*180 - 5*30 = 1775, male = 1780
    // TDEE: round(1780 * 1.55) = round(2759) = 2759
    const result = calculateTdeeCalculator({
      weight: 80, height: 180, age: 30, sex: 'male', activityLevel: 'moderate',
    })
    expect(result.bmr).toBe(1780)
    expect(result.tdee).toBe(2759)
    expect(result.weightLoss).toBe(2259)
    expect(result.weightGain).toBe(3259)
  })

  it('female 60kg 165cm 25yr sedentary', () => {
    // BMR: base = 10*60 + 6.25*165 - 5*25 = 1506.25, female = 1506.25 - 161 = 1345.25 → 1345
    // TDEE: round(1345 * 1.2) = round(1614) = 1614
    const result = calculateTdeeCalculator({
      weight: 60, height: 165, age: 25, sex: 'female', activityLevel: 'sedentary',
    })
    expect(result.bmr).toBe(1345)
    expect(result.tdee).toBe(1614)
  })

  it('male 90kg 178cm 35yr active', () => {
    // BMR: base = 10*90 + 6.25*178 - 5*35 = 900 + 1112.5 - 175 = 1837.5, male = 1842.5 → 1843
    // TDEE: round(1843 * 1.725) = round(3179.175) = 3179
    const result = calculateTdeeCalculator({
      weight: 90, height: 178, age: 35, sex: 'male', activityLevel: 'active',
    })
    expect(result.bmr).toBe(1843)
    expect(result.tdee).toBe(3179)
  })

  it('very_active level uses multiplier 1.9', () => {
    const result = calculateTdeeCalculator({
      weight: 75, height: 175, age: 28, sex: 'male', activityLevel: 'very_active',
    })
    // BMR: base = 750 + 1093.75 - 140 = 1703.75, male = 1708.75 → 1709
    // TDEE: round(1709 * 1.9) = round(3247.1) = 3247
    expect(result.bmr).toBe(1709)
    expect(result.tdee).toBe(3247)
  })
})

describe('calculateTdeeCalculator — weightLoss / weightGain', () => {
  it('weightLoss = tdee - 500, weightGain = tdee + 500', () => {
    const result = calculateTdeeCalculator({
      weight: 80, height: 180, age: 30, sex: 'male', activityLevel: 'moderate',
    })
    expect(result.weightLoss).toBe(result.tdee - 500)
    expect(result.weightGain).toBe(result.tdee + 500)
  })
})

describe('calculateTdeeCalculator — edge cases', () => {
  it('light activity uses multiplier 1.375', () => {
    const result = calculateTdeeCalculator({
      weight: 70, height: 170, age: 30, sex: 'female', activityLevel: 'light',
    })
    // BMR: base = 700 + 1062.5 - 150 = 1612.5, female = 1451.5 → 1452
    // TDEE: round(1452 * 1.375) = round(1996.5) = 1997 (or 1996 — let's verify)
    // Actually: 1451.5 rounds to 1452, 1452*1.375 = 1996.5 → rounds to 1997
    expect(result.tdee).toBe(1997)
  })

  it('BMR result is rounded integer', () => {
    const result = calculateTdeeCalculator({
      weight: 73, height: 172, age: 28, sex: 'male', activityLevel: 'sedentary',
    })
    expect(Number.isInteger(result.bmr)).toBe(true)
    expect(Number.isInteger(result.tdee)).toBe(true)
  })
})
