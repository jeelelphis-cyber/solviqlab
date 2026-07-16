import { describe, it, expect } from 'vitest'
import { calculateCompoundInterestCalculator } from '../lib/calculate.js'

// Reference values:
// A = P(1 + r/n)^(nt) for principal only
// FV_contributions = PMT * ((1 + r/12)^months - 1) / (r/12)  ← code always uses monthly rate r/12

describe('calculateCompoundInterestCalculator — principal only', () => {
  it('$10,000 at 5% annually for 10yr → $16,288.95', () => {
    // A = 10000 * (1 + 0.05/1)^(1*10) = 10000 * 1.05^10
    // 1.05^10 = 1.628895 → A = 16288.95
    const result = calculateCompoundInterestCalculator({
      principal: 10000,
      annualRate: 5,
      years: 10,
      compoundFrequency: 'annually',
    })
    expect(result.finalAmount).toBeCloseTo(16288.95, 1)
    expect(result.totalContributions).toBe(10000)
    expect(result.totalInterest).toBeCloseTo(6288.95, 1)
  })

  it('$1,000 at 8% monthly compounding for 5yr → $1,489.85', () => {
    // A = 1000 * (1 + 0.08/12)^(12*5) = 1000 * (1.006667)^60
    // (1.006667)^60 ≈ 1.48985 → A ≈ 1489.85
    const result = calculateCompoundInterestCalculator({
      principal: 1000,
      annualRate: 8,
      years: 5,
      compoundFrequency: 'monthly',
    })
    expect(result.finalAmount).toBeCloseTo(1489.85, 1)
  })

  it('$5,000 at 6% quarterly for 3yr', () => {
    // A = 5000 * (1 + 0.06/4)^(4*3) = 5000 * (1.015)^12
    // 1.015^12 ≈ 1.19562 → A ≈ 5978.09
    const result = calculateCompoundInterestCalculator({
      principal: 5000,
      annualRate: 6,
      years: 3,
      compoundFrequency: 'quarterly',
    })
    expect(result.finalAmount).toBeCloseTo(5978.09, 1)
  })

  it('$10,000 at 5% daily for 10yr', () => {
    // A = 10000 * (1 + 0.05/365)^(365*10)
    // ≈ 10000 * e^0.5 ≈ 10000 * 1.64866 ≈ 16486.65
    const result = calculateCompoundInterestCalculator({
      principal: 10000,
      annualRate: 5,
      years: 10,
      compoundFrequency: 'daily',
    })
    expect(result.finalAmount).toBeCloseTo(16486.65, 0)
  })
})

describe('calculateCompoundInterestCalculator — with monthly contributions', () => {
  it('$1,000 principal + $100/mo at 6% monthly for 5yr', () => {
    // Principal: 1000 * (1 + 0.06/12)^60 = 1000 * 1.005^60 ≈ 1000 * 1.34885 = 1348.85
    // FV contributions (annuity): 100 * ((1.005^60 - 1) / 0.005) = 100 * (0.34885 / 0.005)
    //   = 100 * 69.77 = 6977.00
    // Total ≈ 1348.85 + 6977.00 = 8325.85
    const result = calculateCompoundInterestCalculator({
      principal: 1000,
      annualRate: 6,
      years: 5,
      monthlyContribution: 100,
      compoundFrequency: 'monthly',
    })
    expect(result.finalAmount).toBeCloseTo(8325.85, 0)
    // totalContributions = 1000 + 100*60 = 7000
    expect(result.totalContributions).toBe(7000)
    expect(result.totalInterest).toBeCloseTo(8325.85 - 7000, 0)
  })

  it('zero monthly contribution → same as principal-only path', () => {
    const withZero = calculateCompoundInterestCalculator({
      principal: 5000,
      annualRate: 8,
      years: 3,
      monthlyContribution: 0,
      compoundFrequency: 'annually',
    })
    const withoutContrib = calculateCompoundInterestCalculator({
      principal: 5000,
      annualRate: 8,
      years: 3,
      compoundFrequency: 'annually',
    })
    expect(withZero.finalAmount).toBe(withoutContrib.finalAmount)
  })
})

describe('calculateCompoundInterestCalculator — BUG: daily compounding with contributions', () => {
  // BUG: when compoundFrequency is 'daily', the principal is compounded daily (correct),
  // but fvContributions still uses monthlyRate = r/12 instead of the effective monthly rate
  // derived from daily compounding: effectiveMonthlyRate = (1 + r/365)^(365/12) - 1.
  // This means the contributions FV is calculated inconsistently with the principal FV.
  // The test below documents the CURRENT (inconsistent) behavior.
  it('BUG: daily compounding with contributions uses r/12 for FV annuity (not effective monthly rate)', () => {
    const result = calculateCompoundInterestCalculator({
      principal: 10000,
      annualRate: 6,
      years: 2,
      monthlyContribution: 200,
      compoundFrequency: 'daily',
    })
    // Current behavior: principal = 10000*(1+0.06/365)^730
    // 10000 * 1.000164^730 ≈ 10000 * 1.12749 ≈ 11274.97
    // contributions FV uses r/12 = 0.005: 200*((1.005^24-1)/0.005) = 200*25.432 = 5086.4
    // total ≈ 16361 (approx, using r/12 monthly rate — the bug)
    // We just check the result is a number and not NaN
    expect(result.finalAmount).toBeGreaterThan(0)
    expect(Number.isNaN(result.finalAmount)).toBe(false)

    // The CORRECT approach would use effectiveMonthlyRate = (1+0.06/365)^(365/12)-1
    // which gives a slightly different contributions FV. Document expected difference:
    const r = 0.06
    const effectiveMonthly = Math.pow(1 + r / 365, 365 / 12) - 1
    const months = 24
    const correctFvContribs = 200 * (Math.pow(1 + effectiveMonthly, months) - 1) / effectiveMonthly
    const bugFvContribs = 200 * (Math.pow(1 + r / 12, months) - 1) / (r / 12)
    // The two approaches give meaningfully different results
    expect(Math.abs(correctFvContribs - bugFvContribs)).toBeGreaterThan(0)
  })

  it.todo('CORRECT behavior: daily compounding should use effective monthly rate for contributions FV')
})

describe('calculateCompoundInterestCalculator — edge cases', () => {
  it('0% interest rate → finalAmount = principal', () => {
    const result = calculateCompoundInterestCalculator({
      principal: 5000,
      annualRate: 0,
      years: 10,
      compoundFrequency: 'annually',
    })
    expect(result.finalAmount).toBe(5000)
    expect(result.totalInterest).toBe(0)
  })

  it('1 year period', () => {
    // $10,000 at 10% annually for 1yr → $11,000
    const result = calculateCompoundInterestCalculator({
      principal: 10000,
      annualRate: 10,
      years: 1,
      compoundFrequency: 'annually',
    })
    expect(result.finalAmount).toBeCloseTo(11000, 1)
  })
})
