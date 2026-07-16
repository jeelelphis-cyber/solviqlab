export interface TaxCalculatorInput {
  income: number
  filingStatus: 'single' | 'married_jointly' | 'head_of_household'
}

export interface TaxCalculatorOutput {
  federalTax: number
  effectiveRate: number
  marginalRate: number
  takeHomePay: number
  standardDeduction: number
  taxableIncome: number
}
