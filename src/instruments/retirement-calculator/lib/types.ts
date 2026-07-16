export interface RetirementCalculatorInput {
  currentAge: number
  retirementAge: number
  currentSavings: number
  monthlyContribution: number
  annualReturn?: number
  inflationRate?: number
}

export interface RetirementCalculatorOutput {
  projectedSavings: number
  totalContributions: number
  totalGrowth: number
  monthlyIncomeEstimate: number
  realValueToday: number
}
