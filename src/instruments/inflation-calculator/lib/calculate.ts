import type { InflationCalculatorInput, InflationCalculatorOutput } from './types.js'

export function calculateInflationCalculator(input: InflationCalculatorInput): InflationCalculatorOutput {
  const { amount, fromYear, toYear, inflationRate = 3.0 } = input

  if (amount < 0) throw new Error('Amount must be non-negative.')
  if (inflationRate < 0) throw new Error('Inflation rate must be non-negative.')

  const yearsElapsed = toYear - fromYear
  if (yearsElapsed === 0) {
    return {
      adjustedAmount: Math.round(amount * 100) / 100,
      totalInflation: 0,
      purchasingPowerLoss: 0,
      yearsElapsed: 0,
    }
  }

  const adjustedAmount = amount * Math.pow(1 + inflationRate / 100, yearsElapsed)
  const totalInflation = ((adjustedAmount / amount) - 1) * 100
  // How much less the original amount buys in the target year
  const purchasingPowerLoss = 100 - (amount / adjustedAmount * 100)

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    adjustedAmount: round2(adjustedAmount),
    totalInflation: round2(totalInflation),
    purchasingPowerLoss: round2(purchasingPowerLoss),
    yearsElapsed,
  }
}
