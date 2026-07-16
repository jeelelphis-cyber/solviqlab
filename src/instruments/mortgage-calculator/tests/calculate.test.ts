import { describe, it, expect } from 'vitest'
import { calculateMortgageCalculator } from '../lib/calculate.js'

// Reference values cross-checked with standard annuity formula:
// M = P * [r(1+r)^n] / [(1+r)^n - 1]

describe('calculateMortgageCalculator — monthly payment', () => {
  it('$300k home, $0 down, 7% rate, 30yr → $1,995.91/mo', () => {
    // P=300000, r=0.07/12=0.005833, n=360
    // M = 300000 * (0.005833 * 1.005833^360) / (1.005833^360 - 1)
    // 1.005833^360 ≈ 8.1165 → M ≈ 300000 * 0.04733 / 7.1165 ≈ 1995.91
    const result = calculateMortgageCalculator({
      homePrice: 300000,
      downPayment: 0,
      annualRate: 7,
      termYears: '30',
    })
    expect(result.monthlyPayment).toBeCloseTo(1995.91, 1)
    expect(result.principal).toBe(300000)
  })

  it('$200k home, $0 down, 4% rate, 15yr → $1,479.38/mo', () => {
    // P=200000, r=0.04/12≈0.003333, n=180
    // M ≈ 200000 * 0.007397 / 1.22079 ≈ 1479.38
    const result = calculateMortgageCalculator({
      homePrice: 200000,
      downPayment: 0,
      annualRate: 4,
      termYears: '15',
    })
    expect(result.monthlyPayment).toBeCloseTo(1479.38, 1)
  })

  it('down payment reduces principal correctly', () => {
    const result = calculateMortgageCalculator({
      homePrice: 400000,
      downPayment: 80000,
      annualRate: 6,
      termYears: '30',
    })
    expect(result.principal).toBe(320000)
    // P=320000, r=0.005, n=360 → M = 320000*(0.005*1.005^360)/(1.005^360-1)
    // 1.005^360 ≈ 6.0226 → M ≈ 320000*0.005997/5.0226 ≈ 1918.56
    expect(result.monthlyPayment).toBeCloseTo(1918.56, 0)
  })

  it('totalPayment = monthlyPayment × n', () => {
    const result = calculateMortgageCalculator({
      homePrice: 300000,
      downPayment: 0,
      annualRate: 7,
      termYears: '30',
    })
    const n = 30 * 12
    expect(result.totalPayment).toBeCloseTo(result.monthlyPayment * n, 0)
  })

  it('totalInterest = totalPayment - principal', () => {
    const result = calculateMortgageCalculator({
      homePrice: 300000,
      downPayment: 0,
      annualRate: 7,
      termYears: '30',
    })
    expect(result.totalInterest).toBeCloseTo(result.totalPayment - result.principal, 1)
  })
})

describe('calculateMortgageCalculator — edge cases', () => {
  it('0% interest rate → simple division (no annuity formula)', () => {
    // P=120000, r=0, n=120 → monthly = 120000/120 = 1000
    const result = calculateMortgageCalculator({
      homePrice: 120000,
      downPayment: 0,
      annualRate: 0,
      termYears: '10',
    })
    expect(result.monthlyPayment).toBe(1000)
    expect(result.totalInterest).toBe(0)
  })

  it('short term 5yr at 5%', () => {
    // P=50000, r=0.05/12≈0.004167, n=60
    // M ≈ 50000 * 0.018871 / 1.28336 ≈ 943.56
    const result = calculateMortgageCalculator({
      homePrice: 50000,
      downPayment: 0,
      annualRate: 5,
      termYears: '5',
    })
    expect(result.monthlyPayment).toBeCloseTo(943.56, 0)
  })
})
