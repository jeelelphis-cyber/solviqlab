export interface SalaryCalculatorInput {
  salaryType: 'hourly' | 'annual'
  amount: number
  hoursPerWeek?: number
  weeksPerYear?: number
}

export interface SalaryCalculatorOutput {
  hourly: number
  daily: number
  weekly: number
  biweekly: number
  monthly: number
  annual: number
}
