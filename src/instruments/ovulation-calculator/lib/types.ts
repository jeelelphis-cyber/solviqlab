export interface OvulationCalculatorInput {
  lastPeriodDate: string
  cycleLength?: number
}

export interface OvulationCalculatorOutput {
  ovulationDate: string
  fertileWindowStart: string
  fertileWindowEnd: string
  nextPeriodDate: string
  daysUntilOvulation: number
}
