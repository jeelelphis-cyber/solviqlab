import type { TaxCalculatorInput, TaxCalculatorOutput } from './types.js'

interface Bracket {
  min: number
  max: number
  rate: number
}

const BRACKETS: Record<string, Bracket[]> = {
  single: [
    { min: 0,      max: 11600,  rate: 0.10 },
    { min: 11600,  max: 47150,  rate: 0.12 },
    { min: 47150,  max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_jointly: [
    { min: 0,      max: 23200,  rate: 0.10 },
    { min: 23200,  max: 94300,  rate: 0.12 },
    { min: 94300,  max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0,      max: 16550,  rate: 0.10 },
    { min: 16550,  max: 63100,  rate: 0.12 },
    { min: 63100,  max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
}

const STANDARD_DEDUCTIONS: Record<string, number> = {
  single: 14600,
  married_jointly: 29200,
  head_of_household: 21900,
}

export function calculateTaxCalculator(input: TaxCalculatorInput): TaxCalculatorOutput {
  const { income, filingStatus } = input

  if (income < 0) throw new Error('Income must be non-negative.')

  const standardDeduction = STANDARD_DEDUCTIONS[filingStatus] ?? 14600
  const taxableIncome = Math.max(0, income - standardDeduction)
  const brackets = BRACKETS[filingStatus] ?? BRACKETS['single']!

  let federalTax = 0
  let marginalRate = 0

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break
    const incomeInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
    if (incomeInBracket > 0) {
      federalTax += incomeInBracket * bracket.rate
      marginalRate = bracket.rate * 100
    }
  }

  const effectiveRate = income > 0 ? (federalTax / income) * 100 : 0
  const takeHomePay = income - federalTax

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    federalTax: round2(federalTax),
    effectiveRate: round2(effectiveRate),
    marginalRate,
    takeHomePay: round2(takeHomePay),
    standardDeduction,
    taxableIncome: round2(taxableIncome),
  }
}
