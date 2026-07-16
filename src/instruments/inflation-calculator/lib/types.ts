export interface InflationCalculatorInput {
  amount: number
  fromYear: number
  toYear: number
  inflationRate?: number
}

export interface InflationCalculatorOutput {
  adjustedAmount: number
  totalInflation: number
  purchasingPowerLoss: number
  yearsElapsed: number
}
