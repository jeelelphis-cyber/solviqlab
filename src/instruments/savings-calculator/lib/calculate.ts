import type { SavingsCalculatorInput, SavingsCalculatorOutput, YearlySnapshot } from './types.js'

const round2 = (n: number) => Math.round(n * 100) / 100

export function calculateSavings(input: SavingsCalculatorInput): SavingsCalculatorOutput {
  const {
    initialDeposit,
    monthlyDeposit = 0,
    annualRate,
    years,
    goalAmount,
  } = input

  // Validation
  if (annualRate < 0 || annualRate > 50) throw new Error('Annual rate must be between 0% and 50%.')
  if (years < 1 || years > 50) throw new Error('Investment period must be between 1 and 50 years.')
  if (initialDeposit < 0) throw new Error('Initial deposit must be non-negative.')
  if (monthlyDeposit < 0) throw new Error('Monthly deposit must be non-negative.')
  if (initialDeposit === 0 && (monthlyDeposit === 0 || monthlyDeposit === undefined)) {
    throw new Error('Either initial deposit or monthly deposit must be greater than zero.')
  }

  const totalMonths = years * 12
  const monthlyRate = annualRate / 100 / 12

  const yearlyBreakdown: YearlySnapshot[] = []
  let balance = initialDeposit
  let monthsToGoal: number | null = null

  for (let month = 1; month <= totalMonths; month++) {
    // Apply interest for this month
    if (monthlyRate > 0) {
      balance = balance * (1 + monthlyRate) + monthlyDeposit
    } else {
      balance = balance + monthlyDeposit
    }

    // Track monthsToGoal
    if (goalAmount !== undefined && goalAmount > 0 && monthsToGoal === null && balance >= goalAmount) {
      monthsToGoal = month
    }

    // Capture yearly snapshot at end of each year
    if (month % 12 === 0) {
      const year = month / 12
      const totalDeposited = initialDeposit + monthlyDeposit * month
      const interestEarned = balance - totalDeposited
      yearlyBreakdown.push({
        year,
        balance: round2(balance),
        totalDeposited: round2(totalDeposited),
        interestEarned: round2(interestEarned),
      })
    }
  }

  const finalBalance = round2(balance)
  const totalDeposited = round2(initialDeposit + monthlyDeposit * totalMonths)
  const totalInterest = round2(finalBalance - totalDeposited)

  return {
    finalBalance,
    totalDeposited,
    totalInterest,
    monthsToGoal,
    yearlyBreakdown,
  }
}
