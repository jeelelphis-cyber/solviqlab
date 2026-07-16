import type { SalaryCalculatorInput, SalaryCalculatorOutput } from './types.js'

export function calculateSalaryCalculator(input: SalaryCalculatorInput): SalaryCalculatorOutput {
  const { salaryType, amount, hoursPerWeek = 40, weeksPerYear = 52 } = input

  if (amount < 0) throw new Error('Amount must be non-negative.')
  if (hoursPerWeek < 1 || hoursPerWeek > 168) throw new Error('Hours per week must be between 1 and 168.')
  if (weeksPerYear < 1 || weeksPerYear > 52) throw new Error('Weeks per year must be between 1 and 52.')

  let annual: number
  let hourly: number

  if (salaryType === 'hourly') {
    hourly = amount
    annual = amount * hoursPerWeek * weeksPerYear
  } else {
    annual = amount
    hourly = amount / (hoursPerWeek * weeksPerYear)
  }

  const weekly = annual / 52
  const biweekly = annual / 26
  const monthly = annual / 12
  // 261 = average working days per year (52 weeks × 5 days)
  const daily = annual / 261

  const round2 = (n: number) => Math.round(n * 100) / 100

  return {
    hourly: round2(hourly),
    daily: round2(daily),
    weekly: round2(weekly),
    biweekly: round2(biweekly),
    monthly: round2(monthly),
    annual: round2(annual),
  }
}
