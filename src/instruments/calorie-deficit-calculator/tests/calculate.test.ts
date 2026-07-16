import { describe, it, expect } from 'vitest'
import { calculateCalorieDeficitCalculator } from '../lib/calculate.js'

// Formula:
// dailyDeficit = round(weeklyLossKg * 7700 / 7)
// dailyTarget  = max(1200, tdee - dailyDeficit)
// totalFatKg   = |currentWeight - targetWeight|
// totalDeficit = round(totalFatKg * 7700)
// weeksToGoal  = round(totalDeficit / (dailyDeficit * 7))

describe('calculateCalorieDeficitCalculator — reference values', () => {
  it('90→80kg, tdee=2500, 0.5kg/wk loss goal', () => {
    // dailyDeficit = round(0.5*7700/7) = round(550) = 550
    // dailyTarget = max(1200, 2500-550) = 1950
    // totalFatKg = 10
    // totalDeficit = round(10*7700) = 77000
    // weeksToGoal = round(77000/(550*7)) = round(77000/3850) = round(20) = 20
    const result = calculateCalorieDeficitCalculator({
      currentWeight: 90,
      targetWeight: 80,
      tdee: 2500,
      weeklyLossGoal: '0.5',
    })
    expect(result.dailyDeficit).toBe(550)
    expect(result.dailyTarget).toBe(1950)
    expect(result.totalDeficit).toBe(77000)
    expect(result.weeksToGoal).toBe(20)
  })

  it('0.25kg/wk → dailyDeficit=275', () => {
    // round(0.25*7700/7) = round(275) = 275
    const result = calculateCalorieDeficitCalculator({
      currentWeight: 80,
      targetWeight: 75,
      tdee: 2000,
      weeklyLossGoal: '0.25',
    })
    expect(result.dailyDeficit).toBe(275)
    expect(result.dailyTarget).toBe(1725) // max(1200, 2000-275)
  })

  it('1kg/wk → dailyDeficit=1100', () => {
    // round(1*7700/7) = round(1100) = 1100
    const result = calculateCalorieDeficitCalculator({
      currentWeight: 100,
      targetWeight: 70,
      tdee: 2800,
      weeklyLossGoal: '1',
    })
    expect(result.dailyDeficit).toBe(1100)
    expect(result.dailyTarget).toBe(1700) // max(1200, 2800-1100)
    // totalFatKg=30, totalDeficit=round(30*7700)=231000
    expect(result.totalDeficit).toBe(231000)
    // weeksToGoal = round(231000/(1100*7)) = round(231000/7700) = round(30) = 30
    expect(result.weeksToGoal).toBe(30)
  })
})

describe('calculateCalorieDeficitCalculator — minimum calorie floor', () => {
  it('extreme deficit is floored at 1200 cal/day', () => {
    // tdee=1600, weeklyLoss=1kg → dailyDeficit=1100
    // dailyTarget = max(1200, 1600-1100) = max(1200, 500) = 1200
    const result = calculateCalorieDeficitCalculator({
      currentWeight: 70,
      targetWeight: 65,
      tdee: 1600,
      weeklyLossGoal: '1',
    })
    expect(result.dailyTarget).toBe(1200)
  })
})

describe('calculateCalorieDeficitCalculator — edge cases', () => {
  it('weight already at target → totalFatKg=0, weeksToGoal=0', () => {
    const result = calculateCalorieDeficitCalculator({
      currentWeight: 75,
      targetWeight: 75,
      tdee: 2000,
      weeklyLossGoal: '0.5',
    })
    expect(result.totalDeficit).toBe(0)
    expect(result.weeksToGoal).toBe(0)
  })

  it('totalFatKg uses absolute value (handles gain goal)', () => {
    // currentWeight < targetWeight (gaining)
    const result = calculateCalorieDeficitCalculator({
      currentWeight: 60,
      targetWeight: 70,
      tdee: 2200,
      weeklyLossGoal: '0.5',
    })
    // totalFatKg = |60-70| = 10
    expect(result.totalDeficit).toBe(77000)
  })
})
