import { describe, it, expect } from 'vitest'
import { calculateFractionCalculator } from '../lib/calculate.js'

// Operations use cross-multiplication then reduce by GCD.

describe('calculateFractionCalculator — addition', () => {
  it('1/2 + 1/3 = 5/6', () => {
    // n = 1*3 + 1*2 = 5, d = 2*3 = 6, gcd(5,6)=1
    const result = calculateFractionCalculator({
      numerator1: 1, denominator1: 2, operation: 'add', numerator2: 1, denominator2: 3,
    })
    expect(result.resultNumerator).toBe(5)
    expect(result.resultDenominator).toBe(6)
    expect(result.decimal).toBeCloseTo(5 / 6, 5)
  })

  it('1/4 + 1/4 = 2/4 simplified to 1/2', () => {
    // n = 1*4 + 1*4 = 8, d = 4*4 = 16, gcd(8,16)=8 → 1/2
    const result = calculateFractionCalculator({
      numerator1: 1, denominator1: 4, operation: 'add', numerator2: 1, denominator2: 4,
    })
    expect(result.resultNumerator).toBe(1)
    expect(result.resultDenominator).toBe(2)
  })

  it('2/3 + 1/6 = 5/6', () => {
    // n = 2*6 + 1*3 = 15, d = 3*6 = 18, gcd(15,18)=3 → 5/6
    const result = calculateFractionCalculator({
      numerator1: 2, denominator1: 3, operation: 'add', numerator2: 1, denominator2: 6,
    })
    expect(result.resultNumerator).toBe(5)
    expect(result.resultDenominator).toBe(6)
  })
})

describe('calculateFractionCalculator — subtraction', () => {
  it('3/4 - 1/4 = 2/4 = 1/2', () => {
    // n = 3*4 - 1*4 = 8, d = 4*4 = 16, gcd(8,16)=8 → 1/2
    const result = calculateFractionCalculator({
      numerator1: 3, denominator1: 4, operation: 'subtract', numerator2: 1, denominator2: 4,
    })
    expect(result.resultNumerator).toBe(1)
    expect(result.resultDenominator).toBe(2)
  })

  it('5/6 - 1/3 = 3/6 = 1/2', () => {
    // n = 5*3 - 1*6 = 9, d = 6*3 = 18, gcd(9,18)=9 → 1/2
    const result = calculateFractionCalculator({
      numerator1: 5, denominator1: 6, operation: 'subtract', numerator2: 1, denominator2: 3,
    })
    expect(result.resultNumerator).toBe(1)
    expect(result.resultDenominator).toBe(2)
  })
})

describe('calculateFractionCalculator — multiplication', () => {
  it('3/4 × 2/5 = 6/20 = 3/10', () => {
    // n = 3*2 = 6, d = 4*5 = 20, gcd(6,20)=2 → 3/10
    const result = calculateFractionCalculator({
      numerator1: 3, denominator1: 4, operation: 'multiply', numerator2: 2, denominator2: 5,
    })
    expect(result.resultNumerator).toBe(3)
    expect(result.resultDenominator).toBe(10)
    expect(result.decimal).toBeCloseTo(0.3, 5)
  })

  it('2/3 × 3/2 = 6/6 = 1/1 = 1', () => {
    const result = calculateFractionCalculator({
      numerator1: 2, denominator1: 3, operation: 'multiply', numerator2: 3, denominator2: 2,
    })
    expect(result.resultNumerator).toBe(1)
    expect(result.resultDenominator).toBe(1)
    expect(result.decimal).toBeCloseTo(1, 5)
  })
})

describe('calculateFractionCalculator — division', () => {
  it('1/2 ÷ 1/4 = 4/2 = 2/1', () => {
    // divide: n = 1*4 = 4, d = 2*1 = 2, gcd(4,2)=2 → 2/1
    const result = calculateFractionCalculator({
      numerator1: 1, denominator1: 2, operation: 'divide', numerator2: 1, denominator2: 4,
    })
    expect(result.resultNumerator).toBe(2)
    expect(result.resultDenominator).toBe(1)
    expect(result.decimal).toBe(2)
  })

  it('2/3 ÷ 4/9 = 18/12 = 3/2', () => {
    // n = 2*9 = 18, d = 3*4 = 12, gcd(18,12)=6 → 3/2
    const result = calculateFractionCalculator({
      numerator1: 2, denominator1: 3, operation: 'divide', numerator2: 4, denominator2: 9,
    })
    expect(result.resultNumerator).toBe(3)
    expect(result.resultDenominator).toBe(2)
    expect(result.decimal).toBeCloseTo(1.5, 5)
  })
})

describe('calculateFractionCalculator — edge cases', () => {
  it('0/5 + 1/5 = 1/5', () => {
    const result = calculateFractionCalculator({
      numerator1: 0, denominator1: 5, operation: 'add', numerator2: 1, denominator2: 5,
    })
    expect(result.resultNumerator).toBe(1)
    expect(result.resultDenominator).toBe(5)
  })

  it('result fully reduces to whole number: 4/2 + 2/2 = 3/1', () => {
    // n = 4*2 + 2*2 = 12, d = 2*2 = 4, gcd(12,4)=4 → 3/1
    const result = calculateFractionCalculator({
      numerator1: 4, denominator1: 2, operation: 'add', numerator2: 2, denominator2: 2,
    })
    expect(result.resultNumerator).toBe(3)
    expect(result.resultDenominator).toBe(1)
    expect(result.decimal).toBe(3)
  })
})
