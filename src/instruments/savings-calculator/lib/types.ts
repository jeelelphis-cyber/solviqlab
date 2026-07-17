export type CompoundFrequency = 'monthly' | 'quarterly' | 'annually'

export interface SavingsCalculatorInput {
  initialDeposit: number
  monthlyDeposit?: number
  annualRate: number
  years: number
  compoundFrequency?: CompoundFrequency
  goalAmount?: number
}

export interface YearlySnapshot {
  year: number
  balance: number
  totalDeposited: number
  interestEarned: number
}

export interface SavingsCalculatorOutput {
  finalBalance: number
  totalDeposited: number
  totalInterest: number
  monthsToGoal: number | null
  yearlyBreakdown: YearlySnapshot[]
}
