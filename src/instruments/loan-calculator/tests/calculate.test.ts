import { describe, it, expect } from 'vitest'
import { calculateLoanCalculator } from '../lib/calculate.js'

// Reference: standard annuity formula M = P * r(1+r)^n / ((1+r)^n - 1)

describe('calculateLoanCalculator — monthly payment', () => {
  it('$10,000 at 5% for 24 months → ~$438.71/mo', () => {
    // r = 0.05/12 ≈ 0.004167, n=24
    // M = 10000 * (0.004167 * 1.004167^24) / (1.004167^24 - 1)
    // 1.004167^24 ≈ 1.10494 → M ≈ 10000 * 0.004604 / 0.10494 ≈ 438.71
    const result = calculateLoanCalculator({ principal: 10000, annualRate: 5, termMonths: 24 })
    expect(result.monthlyPayment).toBeCloseTo(438.71, 1)
  })

  it('$25,000 at 8% for 60 months → ~$507.03/mo', () => {
    // r = 0.08/12 ≈ 0.006667, n=60
    // 1.006667^60 ≈ 1.48985 → M ≈ 25000 * 0.009933 / 0.48985 ≈ 506.91
    const result = calculateLoanCalculator({ principal: 25000, annualRate: 8, termMonths: 60 })
    expect(result.monthlyPayment).toBeCloseTo(506.91, 0)
  })

  it('totalPayment = monthlyPayment × termMonths', () => {
    const result = calculateLoanCalculator({ principal: 10000, annualRate: 5, termMonths: 24 })
    expect(result.totalPayment).toBeCloseTo(result.monthlyPayment * 24, 1)
  })

  it('totalInterest = totalPayment - principal', () => {
    const result = calculateLoanCalculator({ principal: 10000, annualRate: 5, termMonths: 24 })
    expect(result.totalInterest).toBeCloseTo(result.totalPayment - 10000, 1)
  })
})

describe('calculateLoanCalculator — edge cases', () => {
  it('0% interest → monthly = principal / months', () => {
    const result = calculateLoanCalculator({ principal: 12000, annualRate: 0, termMonths: 12 })
    expect(result.monthlyPayment).toBe(1000)
    expect(result.totalInterest).toBe(0)
  })

  it('single month term', () => {
    const result = calculateLoanCalculator({ principal: 5000, annualRate: 12, termMonths: 1 })
    // r=0.01, n=1 → M = 5000 * (0.01 * 1.01) / 0.01 = 5050
    expect(result.monthlyPayment).toBeCloseTo(5050, 0)
    expect(result.totalInterest).toBeCloseTo(50, 0)
  })
})
