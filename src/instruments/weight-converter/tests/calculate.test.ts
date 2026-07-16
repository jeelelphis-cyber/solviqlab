import { describe, it, expect } from 'vitest'
import { calculateWeightConverter } from '../lib/calculate.js'

// Conversion factors: kg=1, g=0.001, lb=0.453592, oz=0.0283495, st=6.35029, t=1000, ton=907.185

describe('calculateWeightConverter — from kilograms', () => {
  it('1kg → 1000g, 2.2046lb', () => {
    const result = calculateWeightConverter({ value: 1, fromUnit: 'kg' })
    expect(result.kilograms).toBe(1)
    expect(result.grams).toBe(1000)
    expect(result.pounds).toBeCloseTo(2.2046, 4)
    expect(result.ounces).toBeCloseTo(35.274, 2)
    expect(result.stones).toBeCloseTo(0.1575, 4)
  })

  it('70kg → 154.3235lb', () => {
    // 70 / 0.453592 = 154.3234...
    const result = calculateWeightConverter({ value: 70, fromUnit: 'kg' })
    expect(result.pounds).toBeCloseTo(154.3235, 3)
  })
})

describe('calculateWeightConverter — from pounds', () => {
  it('1lb → 0.453592kg, 453.59g', () => {
    const result = calculateWeightConverter({ value: 1, fromUnit: 'lb' })
    expect(result.kilograms).toBeCloseTo(0.4536, 4)
    expect(result.grams).toBeCloseTo(453.59, 1)
  })

  it('1 stone = 14lb → 6.3503kg', () => {
    const result = calculateWeightConverter({ value: 14, fromUnit: 'lb' })
    // 14 * 0.453592 = 6.35029kg
    expect(result.kilograms).toBeCloseTo(6.3503, 4)
    expect(result.stones).toBeCloseTo(1, 3)
  })
})

describe('calculateWeightConverter — from stones', () => {
  it('1 stone → 6.35029kg, 14lb', () => {
    const result = calculateWeightConverter({ value: 1, fromUnit: 'st' })
    expect(result.kilograms).toBeCloseTo(6.3503, 4)
    // 6.35029 / 0.453592 = 14.0
    expect(result.pounds).toBeCloseTo(14, 3)
  })
})

describe('calculateWeightConverter — from grams', () => {
  it('1000g → 1kg, 2.2046lb', () => {
    const result = calculateWeightConverter({ value: 1000, fromUnit: 'g' })
    expect(result.kilograms).toBe(1)
    expect(result.pounds).toBeCloseTo(2.2046, 4)
  })
})

describe('calculateWeightConverter — from ounces', () => {
  it('16oz → approx 0.4536kg (≈1lb)', () => {
    const result = calculateWeightConverter({ value: 16, fromUnit: 'oz' })
    // 16 * 0.0283495 = 0.453592kg
    expect(result.kilograms).toBeCloseTo(0.4536, 4)
    expect(result.pounds).toBeCloseTo(1, 3)
  })
})

describe('calculateWeightConverter — edge cases', () => {
  it('0 weight → all zeros', () => {
    const result = calculateWeightConverter({ value: 0, fromUnit: 'kg' })
    expect(result.kilograms).toBe(0)
    expect(result.grams).toBe(0)
    expect(result.pounds).toBe(0)
    expect(result.stones).toBe(0)
  })
})
