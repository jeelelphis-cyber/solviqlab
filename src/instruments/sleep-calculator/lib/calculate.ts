import type { SleepCalculatorInput, SleepCalculatorOutput } from './types.js'

function parseHHMM(time: string): number {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) throw new Error('Invalid time format. Please use HH:MM (e.g. 07:30).')
  const hours = parseInt(match[1]!, 10)
  const minutes = parseInt(match[2]!, 10)
  if (hours < 0 || hours > 23) throw new Error('Hours must be between 0 and 23.')
  if (minutes < 0 || minutes > 59) throw new Error('Minutes must be between 0 and 59.')
  return hours * 60 + minutes
}

function formatMinutes(totalMinutes: number): string {
  // Wrap around midnight (mod 1440 = minutes in a day)
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440
  const h = Math.floor(wrapped / 60)
  const m = wrapped % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const CYCLE_MINUTES = 90

export function calculateSleepCalculator(input: SleepCalculatorInput): SleepCalculatorOutput {
  const { mode, targetTime, fallAsleepMinutes = 15 } = input

  if (!targetTime) throw new Error('Please enter a target time.')

  const targetMinutes = parseHHMM(targetTime)

  let cycle4Time: string
  let cycle5Time: string
  let cycle6Time: string
  let cycle7Time: string

  if (mode === 'waketime') {
    // Want to wake at targetTime → compute when to go to sleep
    // bedtime = wakeTime - fallAsleepMinutes - (cycles × 90 min)
    cycle4Time = formatMinutes(targetMinutes - fallAsleepMinutes - 4 * CYCLE_MINUTES)
    cycle5Time = formatMinutes(targetMinutes - fallAsleepMinutes - 5 * CYCLE_MINUTES)
    cycle6Time = formatMinutes(targetMinutes - fallAsleepMinutes - 6 * CYCLE_MINUTES)
    cycle7Time = formatMinutes(targetMinutes - fallAsleepMinutes - 7 * CYCLE_MINUTES)
  } else {
    // Going to sleep at targetTime → compute when to wake up
    // wakeTime = bedTime + fallAsleepMinutes + (cycles × 90 min)
    cycle4Time = formatMinutes(targetMinutes + fallAsleepMinutes + 4 * CYCLE_MINUTES)
    cycle5Time = formatMinutes(targetMinutes + fallAsleepMinutes + 5 * CYCLE_MINUTES)
    cycle6Time = formatMinutes(targetMinutes + fallAsleepMinutes + 6 * CYCLE_MINUTES)
    cycle7Time = formatMinutes(targetMinutes + fallAsleepMinutes + 7 * CYCLE_MINUTES)
  }

  return {
    cycle4Time,
    cycle5Time,
    cycle6Time,
    cycle7Time,
    recommendation: 'For optimal rest, aim for 7.5 hours (5 cycles) or 9 hours (6 cycles).',
  }
}
