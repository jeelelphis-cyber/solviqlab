import type { InvestmentCalculatorInput, InvestmentCalculatorOutput } from './types.js'

export function calculateInvestmentCalculator(input: InvestmentCalculatorInput): InvestmentCalculatorOutput {
  const {
    initialAmount,
    monthlyContribution = 0,
    annualReturn = 7,
    years = 10,
  } = input

  if (initialAmount < 0) throw new Error('Initial amount must be non-negative.')
  if (monthlyContribution < 0) throw new Error('Monthly contribution must be non-negative.')
  if (annualReturn < 0 || annualReturn > 50) throw new Error('Annual return must be between 0% and 50%.')
  if (years < 1 || years > 50) throw new Error('Investment period must be between 1 and 50 years.')

  const r = annualReturn / 100 / 12  // monthly rate
  const n = years * 12               // total months

  // Future value = FV of lump sum + FV of monthly contributions
  const fvLumpSum = initialAmount * Math.pow(1 + r, n)
  const fvContributions = r > 0
    ? monthlyContribution * (Math.pow(1 + r, n) - 1) / r
    : monthlyContribution * n

  const finalValue = fvLumpSum + fvContributions
  const totalContributions = initialAmount + monthlyContribution * n
  const totalInterest = finalValue - totalContributions

  // Rule of 72: years to double = 72 / annual return rate
  const doublingTime = annualReturn > 0
    ? Math.round((72 / annualReturn) * 10) / 10
    : null

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    finalValue: round2(finalValue),
    totalContributions: round2(totalContributions),
    totalInterest: round2(totalInterest),
    doublingTime,
  }
}
