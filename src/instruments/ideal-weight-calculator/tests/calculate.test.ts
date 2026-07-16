import { describe, it, expect } from 'vitest'
import { calculateIdealWeightCalculator } from '../lib/calculate.js'

// Formulas (all in kg, height in cm converted to inches):
// heightInInches = height / 2.54
// inchesOver5ft  = max(0, heightInInches - 60)
//
// Male:
//   Robinson (1983): 52 + 1.9  * over5ft
//   Miller   (1983): 56.2 + 1.41 * over5ft
//   Devine   (1974): 50 + 2.3  * over5ft
//
// Female:
//   Robinson: 49 + 1.7  * over5ft
//   Miller:   53.1 + 1.36 * over5ft
//   Devine:   45.5 + 2.3  * over5ft
//
// average = round((robinson + miller + devine) / 3, 1dp)

describe('calculateIdealWeightCalculator — male 175cm', () => {
  it('male 175cm: robinson=68.9, miller=68.8, devine=70.5, average=69.4', () => {
    // heightInInches = 175/2.54 ≈ 68.8976in
    // over5ft = 68.8976 - 60 = 8.8976
    // robinson = 52 + 1.9*8.8976 = 52 + 16.9054 = 68.9054 → 68.9
    // miller = 56.2 + 1.41*8.8976 = 56.2 + 12.5457 = 68.7457 → 68.7 (or 68.8 depending on rounding)
    // devine = 50 + 2.3*8.8976 = 50 + 20.4645 = 70.4645 → 70.5
    // average = (68.9 + 68.7 + 70.5) / 3 = 208.1/3 = 69.3667 → 69.4
    const result = calculateIdealWeightCalculator({ height: 175, sex: 'male' })
    expect(result.robinson).toBeCloseTo(68.9, 1)
    expect(result.miller).toBeCloseTo(68.7, 0) // allow ±0.1 rounding
    expect(result.devine).toBeCloseTo(70.5, 1)
    expect(result.average).toBeCloseTo(69.4, 0)
  })
})

describe('calculateIdealWeightCalculator — male 180cm', () => {
  it('male 180cm: robinson ≈ 70.8, miller ≈ 70.4, devine ≈ 73.1', () => {
    // heightInInches = 180/2.54 ≈ 70.8661in
    // over5ft = 70.8661 - 60 = 10.8661
    // robinson = 52 + 1.9*10.8661 = 52 + 20.6456 = 72.6456 → 72.6
    // miller = 56.2 + 1.41*10.8661 = 56.2 + 15.3212 = 71.5212 → 71.5
    // devine = 50 + 2.3*10.8661 = 50 + 24.9921 = 74.9921 → 75.0
    const result = calculateIdealWeightCalculator({ height: 180, sex: 'male' })
    expect(result.robinson).toBeCloseTo(72.6, 1)
    expect(result.miller).toBeCloseTo(71.5, 1)
    expect(result.devine).toBeCloseTo(75.0, 1)
    expect(result.average).toBeCloseTo(73.0, 0)
  })
})

describe('calculateIdealWeightCalculator — female', () => {
  it('female 165cm', () => {
    // heightInInches = 165/2.54 ≈ 64.9606in
    // over5ft = 64.9606 - 60 = 4.9606
    // robinson = 49 + 1.7*4.9606 = 49 + 8.4330 = 57.4330 → 57.4
    // miller = 53.1 + 1.36*4.9606 = 53.1 + 6.7464 = 59.8464 → 59.8
    // devine = 45.5 + 2.3*4.9606 = 45.5 + 11.4094 = 56.9094 → 56.9
    // average = (57.4 + 59.8 + 56.9) / 3 = 174.1/3 ≈ 58.0
    const result = calculateIdealWeightCalculator({ height: 165, sex: 'female' })
    expect(result.robinson).toBeCloseTo(57.4, 0)
    expect(result.miller).toBeCloseTo(59.8, 0)
    expect(result.devine).toBeCloseTo(56.9, 0)
    expect(result.average).toBeCloseTo(58.0, 0)
  })

  it('female 160cm', () => {
    // heightInInches = 160/2.54 ≈ 62.9921in
    // over5ft = 62.9921 - 60 = 2.9921
    // robinson = 49 + 1.7*2.9921 = 49 + 5.0866 = 54.1
    // miller = 53.1 + 1.36*2.9921 = 53.1 + 4.0693 = 57.2
    // devine = 45.5 + 2.3*2.9921 = 45.5 + 6.8818 = 52.4
    // average = (54.1 + 57.2 + 52.4) / 3 ≈ 54.6
    const result = calculateIdealWeightCalculator({ height: 160, sex: 'female' })
    expect(result.robinson).toBeCloseTo(54.1, 0)
    expect(result.miller).toBeCloseTo(57.2, 0)
    expect(result.devine).toBeCloseTo(52.4, 0)
    expect(result.average).toBeCloseTo(54.6, 0)
  })
})

describe('calculateIdealWeightCalculator — edge cases', () => {
  it('height exactly 5ft (152.4cm) → over5ft = 0, returns base values', () => {
    // heightInInches = 152.4/2.54 = 60 exactly
    // over5ft = 0
    // male: robinson=52, miller=56.2, devine=50
    const result = calculateIdealWeightCalculator({ height: 152.4, sex: 'male' })
    expect(result.robinson).toBeCloseTo(52.0, 1)
    expect(result.miller).toBeCloseTo(56.2, 1)
    expect(result.devine).toBeCloseTo(50.0, 1)
  })

  it('shorter than 5ft → over5ft clamped to 0', () => {
    // max(0, ...) prevents negative over5ft
    const result = calculateIdealWeightCalculator({ height: 140, sex: 'female' })
    // over5ft = max(0, 55.12 - 60) = 0
    expect(result.robinson).toBeCloseTo(49.0, 1)
    expect(result.devine).toBeCloseTo(45.5, 1)
  })
})
