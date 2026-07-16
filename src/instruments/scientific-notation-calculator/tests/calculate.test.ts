import { describe, it, expect } from 'vitest'
import { calculateScientificNotationCalculator } from '../lib/calculate.js'

// Formula:
// exponent = floor(log10(|value|))
// coefficient = round(value / 10^exponent * 1e6) / 1e6
// scientific = `${coefficient} × 10^${exponent}`
// Engineering: engExp = floor(exponent/3)*3, engCoef = value/10^engExp

describe('calculateScientificNotationCalculator — positive numbers', () => {
  it('12345 → coefficient=1.2345, exponent=4, scientific="1.2345 × 10^4"', () => {
    // log10(12345) ≈ 4.0915, floor = 4
    // coefficient = round(12345/10000 * 1e6)/1e6 = round(1234500)/1e6 = 1.2345
    const result = calculateScientificNotationCalculator({ value: 12345 })
    expect(result.coefficient).toBe(1.2345)
    expect(result.exponent).toBe(4)
    expect(result.scientific).toBe('1.2345 × 10^4')
  })

  it('0.00567 → coefficient=5.67, exponent=-3', () => {
    // log10(0.00567) ≈ -2.2464, floor = -3
    // coefficient = round(0.00567/10^-3 * 1e6)/1e6 = round(5.67 * 1e6)/1e6 = 5.67
    const result = calculateScientificNotationCalculator({ value: 0.00567 })
    expect(result.coefficient).toBeCloseTo(5.67, 4)
    expect(result.exponent).toBe(-3)
    expect(result.scientific).toBe('5.67 × 10^-3')
  })

  it('1000000 → coefficient=1, exponent=6', () => {
    const result = calculateScientificNotationCalculator({ value: 1000000 })
    expect(result.coefficient).toBe(1)
    expect(result.exponent).toBe(6)
    expect(result.scientific).toBe('1 × 10^6')
  })

  it('1 → coefficient=1, exponent=0', () => {
    const result = calculateScientificNotationCalculator({ value: 1 })
    expect(result.coefficient).toBe(1)
    expect(result.exponent).toBe(0)
  })

  it('500 → coefficient=5, exponent=2, engineering uses 10^2', () => {
    const result = calculateScientificNotationCalculator({ value: 500 })
    expect(result.coefficient).toBe(5)
    expect(result.exponent).toBe(2)
    // engExp = floor(2/3)*3 = 0; engCoef = 500/1 = 500
    expect(result.engineering).toBe('500 × 10^0')
  })

  it('engineering notation: 12345 → 12.345 × 10^3', () => {
    // exponent=4, engExp=floor(4/3)*3=3, engCoef=12345/1000=12.345
    const result = calculateScientificNotationCalculator({ value: 12345 })
    expect(result.engineering).toBe('12.345 × 10^3')
  })
})

describe('calculateScientificNotationCalculator — zero', () => {
  it('0 → all zeros, scientific="0", engineering="0"', () => {
    const result = calculateScientificNotationCalculator({ value: 0 })
    expect(result.coefficient).toBe(0)
    expect(result.exponent).toBe(0)
    expect(result.scientific).toBe('0')
    expect(result.engineering).toBe('0')
  })
})

describe('calculateScientificNotationCalculator — negative numbers', () => {
  it('-5000 → coefficient=-5, exponent=3', () => {
    // log10(|-5000|) = log10(5000) ≈ 3.699, floor=3
    // coefficient = round(-5000/1000 * 1e6)/1e6 = -5
    const result = calculateScientificNotationCalculator({ value: -5000 })
    expect(result.coefficient).toBe(-5)
    expect(result.exponent).toBe(3)
    expect(result.scientific).toBe('-5 × 10^3')
  })
})

describe('calculateScientificNotationCalculator — edge cases', () => {
  it('small decimal 0.1 → coefficient=1, exponent=-1', () => {
    const result = calculateScientificNotationCalculator({ value: 0.1 })
    expect(result.coefficient).toBeCloseTo(1, 4)
    expect(result.exponent).toBe(-1)
  })
})
