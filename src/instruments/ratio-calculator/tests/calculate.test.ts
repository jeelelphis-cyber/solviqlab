import { describe, it, expect } from 'vitest'
import { calculateRatioCalculator } from '../lib/calculate.js'

// Formula:
// g = gcd(round(a), round(b))
// simplifiedA = a/g, simplifiedB = b/g
// d = (c * b) / a  when c is provided, else 0
// decimal = round(a/b * 1e6) / 1e6

describe('calculateRatioCalculator — simplification', () => {
  it('6:4 → simplified 3:2', () => {
    // gcd(6,4)=2 → 6/2=3, 4/2=2
    const result = calculateRatioCalculator({ a: 6, b: 4 })
    expect(result.simplifiedA).toBe(3)
    expect(result.simplifiedB).toBe(2)
    expect(result.decimal).toBeCloseTo(1.5, 5)
  })

  it('10:15 → simplified 2:3', () => {
    // gcd(10,15)=5 → 2:3
    const result = calculateRatioCalculator({ a: 10, b: 15 })
    expect(result.simplifiedA).toBe(2)
    expect(result.simplifiedB).toBe(3)
  })

  it('8:8 → simplified 1:1', () => {
    const result = calculateRatioCalculator({ a: 8, b: 8 })
    expect(result.simplifiedA).toBe(1)
    expect(result.simplifiedB).toBe(1)
    expect(result.decimal).toBe(1)
  })

  it('already simplified 3:7 → 3:7', () => {
    const result = calculateRatioCalculator({ a: 3, b: 7 })
    expect(result.simplifiedA).toBe(3)
    expect(result.simplifiedB).toBe(7)
  })
})

describe('calculateRatioCalculator — 4th proportional (d)', () => {
  it('6:9 = 4:d → d=6', () => {
    // d = (c * b) / a = (4 * 9) / 6 = 36/6 = 6
    const result = calculateRatioCalculator({ a: 6, b: 9, c: 4 })
    expect(result.d).toBeCloseTo(6, 4)
  })

  it('2:3 = 8:d → d=12', () => {
    // d = (8 * 3) / 2 = 12
    const result = calculateRatioCalculator({ a: 2, b: 3, c: 8 })
    expect(result.d).toBeCloseTo(12, 4)
  })

  it('no c provided → d=0', () => {
    const result = calculateRatioCalculator({ a: 6, b: 9 })
    expect(result.d).toBe(0)
  })
})

describe('calculateRatioCalculator — decimal', () => {
  it('6:9 → decimal = 0.666667', () => {
    // 6/9 = 0.66666... → round to 6dp = 0.666667
    const result = calculateRatioCalculator({ a: 6, b: 9 })
    expect(result.decimal).toBeCloseTo(0.666667, 5)
  })

  it('1:4 → decimal = 0.25', () => {
    const result = calculateRatioCalculator({ a: 1, b: 4 })
    expect(result.decimal).toBe(0.25)
  })
})

describe('calculateRatioCalculator — edge cases', () => {
  it('prime ratio 7:11 stays as 7:11', () => {
    const result = calculateRatioCalculator({ a: 7, b: 11 })
    expect(result.simplifiedA).toBe(7)
    expect(result.simplifiedB).toBe(11)
  })

  it('large equal ratio 100:100 → 1:1', () => {
    const result = calculateRatioCalculator({ a: 100, b: 100 })
    expect(result.simplifiedA).toBe(1)
    expect(result.simplifiedB).toBe(1)
  })
})
