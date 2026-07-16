import type { OvulationCalculatorInput, OvulationCalculatorOutput } from './types.js'

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from + 'T00:00:00Z')
  const toDate = new Date(to + 'T00:00:00Z')
  return Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

export function calculateOvulationCalculator(input: OvulationCalculatorInput): OvulationCalculatorOutput {
  const { lastPeriodDate, cycleLength = 28 } = input

  if (!lastPeriodDate || !/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodDate)) {
    throw new Error('Please enter a valid date in YYYY-MM-DD format.')
  }
  if (cycleLength < 21 || cycleLength > 45) {
    throw new Error('Cycle length must be between 21 and 45 days.')
  }

  // Ovulation typically occurs 14 days before the next period
  const ovulationDay = cycleLength - 14

  const ovulationDate = addDays(lastPeriodDate, ovulationDay)
  const fertileWindowStart = addDays(ovulationDate, -5)
  const fertileWindowEnd = addDays(ovulationDate, 1)
  const nextPeriodDate = addDays(lastPeriodDate, cycleLength)

  const today = todayUTC()
  const daysUntilOvulation = daysBetween(today, ovulationDate)

  return {
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    nextPeriodDate,
    daysUntilOvulation,
  }
}
