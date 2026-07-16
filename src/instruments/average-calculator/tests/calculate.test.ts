import { describe, it, expect } from 'vitest'
import { calculateAverageCalculator } from '../lib/calculate.js'

// Computes: mean, median, mode, range, count, sum
// All rounded to 4dp

describe('calculateAverageCalculator — reference set [2,4,6,8,10]', () => {
  it('mean=6, median=6, range=8, count=5, sum=30', () => {
    const result = calculateAverageCalculator({ numbers: [2, 4, 6, 8, 10] })
    expect(result.mean).toBe(6)
    expect(result.median).toBe(6)
    expect(result.range).toBe(8)
    expect(result.count).toBe(5)
    expect(result.sum).toBe(30)
  })
})

describe('calculateAverageCalculator — mode', () => {
  it('[1,1,2,3] → mode=1', () => {
    const result = calculateAverageCalculator({ numbers: [1, 1, 2, 3] })
    expect(result.mode).toBe(1)
    expect(result.mean).toBeCloseTo(1.75, 4)
  })

  it('[5,5,5,2] → mode=5', () => {
    const result = calculateAverageCalculator({ numbers: [5, 5, 5, 2] })
    expect(result.mode).toBe(5)
  })

  it('[3,3,7,7] → mode = first max-frequency value (3 or 7)', () => {
    // Both 3 and 7 appear twice. Code returns first one found in map iteration.
    // Map insertion order: 3 first, 7 second → mode = 3
    const result = calculateAverageCalculator({ numbers: [3, 3, 7, 7] })
    // We accept either 3 or 7 as the mode (bimodal case)
    expect([3, 7]).toContain(result.mode)
  })
})

describe('calculateAverageCalculator — median', () => {
  it('even count [1,3,5,7] → median = (3+5)/2 = 4', () => {
    const result = calculateAverageCalculator({ numbers: [1, 3, 5, 7] })
    expect(result.median).toBe(4)
  })

  it('odd count [1,2,3,4,5] → median = 3 (middle element)', () => {
    const result = calculateAverageCalculator({ numbers: [1, 2, 3, 4, 5] })
    expect(result.median).toBe(3)
  })

  it('unsorted input [5,1,3] → median = 3 after sorting', () => {
    const result = calculateAverageCalculator({ numbers: [5, 1, 3] })
    expect(result.median).toBe(3)
  })
})

describe('calculateAverageCalculator — floating point values', () => {
  it('[1.5, 2.5, 3.5] → mean=2.5, sum=7.5', () => {
    const result = calculateAverageCalculator({ numbers: [1.5, 2.5, 3.5] })
    expect(result.mean).toBeCloseTo(2.5, 4)
    expect(result.sum).toBeCloseTo(7.5, 4)
    expect(result.median).toBe(2.5)
    expect(result.range).toBe(2)
  })
})

describe('calculateAverageCalculator — single element', () => {
  it('[42] → mean=42, median=42, range=0, count=1', () => {
    const result = calculateAverageCalculator({ numbers: [42] })
    expect(result.mean).toBe(42)
    expect(result.median).toBe(42)
    expect(result.range).toBe(0)
    expect(result.count).toBe(1)
    expect(result.sum).toBe(42)
  })
})

describe('calculateAverageCalculator — negative numbers', () => {
  it('[-3,-1,1,3] → mean=0, median=0, range=6', () => {
    const result = calculateAverageCalculator({ numbers: [-3, -1, 1, 3] })
    expect(result.mean).toBe(0)
    expect(result.median).toBe(0)
    expect(result.range).toBe(6)
  })
})
