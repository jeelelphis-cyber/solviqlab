import type { RetirementCalculatorInput, RetirementCalculatorOutput } from './types.js'

export function calculateRetirementCalculator(input: RetirementCalculatorInput): RetirementCalculatorOutput {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    monthlyContribution,
    annualReturn = 7,
    inflationRate = 3,
  } = input

  if (retirementAge <= currentAge) {
    throw new Error('Retirement age must be greater than current age.')
  }
  if (currentSavings < 0) throw new Error('Current savings must be non-negative.')
  if (monthlyContribution < 0) throw new Error('Monthly contribution must be non-negative.')

  const years = retirementAge - currentAge
  const r = annualReturn / 100 / 12  // monthly rate
  const n = years * 12               // total months

  // Future value of lump sum (current savings)
  const fvPrincipal = currentSavings * Math.pow(1 + r, n)

  // Future value of monthly contributions (annuity)
  const fvContributions = r > 0
    ? monthlyContribution * (Math.pow(1 + r, n) - 1) / r
    : monthlyContribution * n

  const projectedSavings = fvPrincipal + fvContributions
  const totalContributions = currentSavings + monthlyContribution * n
  const totalGrowth = projectedSavings - totalContributions

  // 4% safe withdrawal rule → monthly income
  const monthlyIncomeEstimate = projectedSavings * 0.04 / 12

  // Real value in today's dollars (inflation-adjusted)
  const realValueToday = projectedSavings / Math.pow(1 + inflationRate / 100, years)

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    projectedSavings: round2(projectedSavings),
    totalContributions: round2(totalContributions),
    totalGrowth: round2(totalGrowth),
    monthlyIncomeEstimate: round2(monthlyIncomeEstimate),
    realValueToday: round2(realValueToday),
  }
}
