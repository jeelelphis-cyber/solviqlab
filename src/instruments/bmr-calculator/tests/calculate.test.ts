import { describe, it, expect } from 'vitest'
import { calculateBmrCalculator } from '../lib/calculate.js'

// Mifflin-St Jeor formula:
// base = 10*weight(kg) + 6.25*height(cm) - 5*age
// male:   base + 5
// female: base - 161

describe('calculateBmrCalculator — male', () => {
  it('male 80kg 180cm 30yr → 1780 kcal', () => {
    // base = 10*80 + 6.25*180 - 5*30 = 800 + 1125 - 150 = 1775
    // male: 1775 + 5 = 1780
    const result = calculateBmrCalculator({ weight: 80, height: 180, age: 30, sex: 'male' })
    expect(result.bmr).toBe(1780)
  })

  it('male 70kg 175cm 25yr → 1723 kcal', () => {
    // base = 10*70 + 6.25*175 - 5*25 = 700 + 1093.75 - 125 = 1668.75
    // male: 1668.75 + 5 = 1673.75 → rounded = 1674
    const result = calculateBmrCalculator({ weight: 70, height: 175, age: 25, sex: 'male' })
    // 1674 kcal
    expect(result.bmr).toBe(1674)
  })

  it('male 100kg 190cm 40yr → 2045 kcal', () => {
    // base = 10*100 + 6.25*190 - 5*40 = 1000 + 1187.5 - 200 = 1987.5
    // male: 1987.5 + 5 = 1992.5 → rounded = 1993
    const result = calculateBmrCalculator({ weight: 100, height: 190, age: 40, sex: 'male' })
    expect(result.bmr).toBe(1993)
  })
})

describe('calculateBmrCalculator — female', () => {
  it('female 60kg 165cm 25yr → 1383 kcal', () => {
    // base = 10*60 + 6.25*165 - 5*25 = 600 + 1031.25 - 125 = 1506.25
    // female: 1506.25 - 161 = 1345.25 → rounded = 1345
    const result = calculateBmrCalculator({ weight: 60, height: 165, age: 25, sex: 'female' })
    expect(result.bmr).toBe(1345)
  })

  it('female 55kg 160cm 35yr → correct Mifflin-St Jeor', () => {
    // base = 10*55 + 6.25*160 - 5*35 = 550 + 1000 - 175 = 1375
    // female: 1375 - 161 = 1214
    const result = calculateBmrCalculator({ weight: 55, height: 160, age: 35, sex: 'female' })
    expect(result.bmr).toBe(1214)
  })
})

describe('calculateBmrCalculator — edge cases', () => {
  it('returns integer (rounded)', () => {
    const result = calculateBmrCalculator({ weight: 73, height: 172, age: 28, sex: 'male' })
    expect(Number.isInteger(result.bmr)).toBe(true)
  })

  it('younger person has higher BMR than older (same weight/height/sex)', () => {
    const young = calculateBmrCalculator({ weight: 70, height: 175, age: 20, sex: 'male' })
    const old = calculateBmrCalculator({ weight: 70, height: 175, age: 50, sex: 'male' })
    expect(young.bmr).toBeGreaterThan(old.bmr)
  })
})
