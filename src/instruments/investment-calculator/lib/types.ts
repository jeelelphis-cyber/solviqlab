export interface InvestmentCalculatorInput {
  initialAmount: number
  monthlyContribution?: number
  annualReturn?: number
  years?: number
}

export interface InvestmentCalculatorOutput {
  finalValue: number
  totalContributions: number
  totalInterest: number
  doublingTime: number | null
}
