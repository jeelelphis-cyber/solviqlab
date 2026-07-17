import type { PregnancyCalculatorInput, PregnancyCalculatorOutput, PregnancyMilestone } from './types.js'

// ── Date helpers ───────────────────────────────────────────────────────────────

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  const fromDate = new Date(from + 'T00:00:00Z')
  const toDate = new Date(to + 'T00:00:00Z')
  return Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── Milestone definitions ──────────────────────────────────────────────────────

const MILESTONE_DEFS: { week: number; label: string }[] = [
  { week: 4,  label: 'Missed period / positive test' },
  { week: 6,  label: 'Heartbeat detectable by ultrasound' },
  { week: 8,  label: 'End of embryonic period' },
  { week: 12, label: 'End of first trimester' },
  { week: 16, label: 'Gender may be visible on ultrasound' },
  { week: 20, label: 'Anatomy scan (mid-pregnancy ultrasound)' },
  { week: 24, label: 'Viability milestone' },
  { week: 28, label: 'Third trimester begins' },
  { week: 32, label: "Baby's lungs nearly mature" },
  { week: 36, label: 'Early term' },
  { week: 37, label: 'Full term' },
  { week: 40, label: 'Estimated due date' },
]

function buildMilestones(lmpDate: string): PregnancyMilestone[] {
  return MILESTONE_DEFS.map(({ week, label }) => ({
    week,
    label,
    date: addDays(lmpDate, week * 7),
  }))
}

function getTrimester(weeksPregnant: number): 1 | 2 | 3 {
  if (weeksPregnant <= 13) return 1
  if (weeksPregnant <= 27) return 2
  return 3
}

function getTrimesterLabel(trimester: 1 | 2 | 3): string {
  if (trimester === 1) return 'First Trimester'
  if (trimester === 2) return 'Second Trimester'
  return 'Third Trimester'
}

// ── Main calculation ───────────────────────────────────────────────────────────

export function calculatePregnancy(input: PregnancyCalculatorInput): PregnancyCalculatorOutput {
  const { method, date } = input

  // Basic date format validation
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Please enter a valid date in YYYY-MM-DD format.')
  }

  // Check the date is a real calendar date
  const parts = date.split('-').map(Number)
  const testDate = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!))
  if (
    testDate.getUTCFullYear() !== parts[0] ||
    testDate.getUTCMonth() + 1 !== parts[1] ||
    testDate.getUTCDate() !== parts[2]
  ) {
    throw new Error('The date entered is not a valid calendar date.')
  }

  const today = todayUTC()

  let lmpDate: string
  let conceptionDate: string
  let dueDate: string

  if (method === 'lmp') {
    lmpDate = date
    conceptionDate = addDays(lmpDate, 14)
    dueDate = addDays(lmpDate, 280)

    // LMP must not be more than 294 days in the past (42 weeks — outer limit for overdue pregnancy)
    const daysSinceLmp = daysBetween(lmpDate, today)
    if (daysSinceLmp > 294) {
      throw new Error('The LMP date is more than 42 weeks ago. Please check the date.')
    }
    // LMP must not be more than 42 weeks in the future
    if (daysSinceLmp < -(42 * 7)) {
      throw new Error('The LMP date is too far in the future (more than 42 weeks). Please check the date.')
    }
  } else if (method === 'conception') {
    conceptionDate = date
    lmpDate = addDays(conceptionDate, -14)
    dueDate = addDays(conceptionDate, 266)

    const daysSinceLmp = daysBetween(lmpDate, today)
    if (daysSinceLmp > 294) {
      throw new Error('The conception date results in a pregnancy past 42 weeks. Please check the date.')
    }
    if (daysSinceLmp < -(42 * 7)) {
      throw new Error('The conception date is too far in the future. Please check the date.')
    }
  } else {
    // method === 'dueDate'
    dueDate = date
    lmpDate = addDays(dueDate, -280)
    conceptionDate = addDays(dueDate, -266)

    // Due date must be within 280 days from now (past or future)
    const daysUntilDue = daysBetween(today, dueDate)
    if (Math.abs(daysUntilDue) > 280) {
      throw new Error('The due date must be within 280 days from today (past or future). Please check the date.')
    }
  }

  const daysPregnant = daysBetween(lmpDate, today)
  const daysRemaining = daysBetween(today, dueDate)
  const weeksPregnant = Math.max(0, Math.floor(daysPregnant / 7))
  const isOverdue = daysRemaining < 0
  const trimester = getTrimester(weeksPregnant)
  const trimesterLabel = getTrimesterLabel(trimester)
  const milestones = buildMilestones(lmpDate)

  return {
    dueDate,
    conceptionDate,
    lmpDate,
    weeksPregnant,
    daysPregnant,
    daysRemaining,
    trimester,
    trimesterLabel,
    isOverdue,
    milestones,
  }
}
