import type { DueDateCalculatorInput, DueDateCalculatorOutput, DueDateMilestone } from './types.js'

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

const MILESTONE_DEFS: { week: number; label: string; trimester: 1 | 2 | 3 }[] = [
  { week: 4,  label: 'Missed period / positive test',          trimester: 1 },
  { week: 6,  label: 'Heartbeat detectable by ultrasound',     trimester: 1 },
  { week: 8,  label: 'End of embryonic period',                trimester: 1 },
  { week: 12, label: 'End of first trimester',                 trimester: 1 },
  { week: 13, label: 'First trimester complete',               trimester: 1 },
  { week: 16, label: 'Gender may be visible on ultrasound',    trimester: 2 },
  { week: 20, label: 'Anatomy scan (mid-pregnancy ultrasound)',trimester: 2 },
  { week: 24, label: 'Viability milestone',                    trimester: 2 },
  { week: 27, label: 'Second trimester complete',              trimester: 2 },
  { week: 28, label: 'Third trimester begins',                 trimester: 3 },
  { week: 32, label: "Baby's lungs nearly mature",             trimester: 3 },
  { week: 36, label: 'Early term',                             trimester: 3 },
  { week: 37, label: 'Full term',                              trimester: 3 },
  { week: 40, label: 'Estimated due date',                     trimester: 3 },
]

function buildMilestones(lmpDate: string, today: string): DueDateMilestone[] {
  return MILESTONE_DEFS.map(({ week, label, trimester }) => {
    const date = addDays(lmpDate, week * 7)
    return {
      week,
      label,
      date,
      trimester,
      isPast: date <= today,
    }
  })
}

function getTrimester(weeksPregnant: number): 1 | 2 | 3 {
  if (weeksPregnant <= 13) return 1
  if (weeksPregnant <= 27) return 2
  return 3
}

// ── Main calculation ───────────────────────────────────────────────────────────

export function calculateDueDate(input: DueDateCalculatorInput): DueDateCalculatorOutput {
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

    const daysSinceLmp = daysBetween(lmpDate, today)
    if (daysSinceLmp > 294) {
      throw new Error('The LMP date is more than 42 weeks ago. Please check the date.')
    }
    if (daysSinceLmp < 0) {
      throw new Error('The LMP date cannot be in the future.')
    }
  } else if (method === 'conception') {
    conceptionDate = date
    lmpDate = addDays(conceptionDate, -14)
    dueDate = addDays(conceptionDate, 266)

    const daysSinceConception = daysBetween(conceptionDate, today)
    if (daysSinceConception > 280) {
      throw new Error('The conception date results in a pregnancy past 40 weeks. Please check the date.')
    }
    if (daysSinceConception < 0) {
      throw new Error('The conception date cannot be in the future.')
    }
  } else if (method === 'ivf3') {
    // 3-day embryo transfer: LMP = transfer - 17 days; dueDate = transfer + 263 days
    lmpDate = addDays(date, -17)
    conceptionDate = addDays(date, -3)
    dueDate = addDays(date, 263)

    const daysSinceTransfer = daysBetween(date, today)
    if (daysSinceTransfer > 280) {
      throw new Error('The IVF day-3 transfer date results in a pregnancy past 40 weeks. Please check the date.')
    }
    if (daysSinceTransfer < 0) {
      throw new Error('The IVF transfer date cannot be in the future.')
    }
  } else {
    // ivf5: 5-day blastocyst transfer: LMP = transfer - 19 days; dueDate = transfer + 261 days
    lmpDate = addDays(date, -19)
    conceptionDate = addDays(date, -5)
    dueDate = addDays(date, 261)

    const daysSinceTransfer = daysBetween(date, today)
    if (daysSinceTransfer > 280) {
      throw new Error('The IVF day-5 transfer date results in a pregnancy past 40 weeks. Please check the date.')
    }
    if (daysSinceTransfer < 0) {
      throw new Error('The IVF transfer date cannot be in the future.')
    }
  }

  const daysPregnant = daysBetween(lmpDate, today)
  const daysRemaining = daysBetween(today, dueDate)
  const weeksPregnant = Math.max(0, Math.floor(daysPregnant / 7))
  const isOverdue = daysRemaining < 0
  const trimester = getTrimester(weeksPregnant)
  const gestationalAge = `${weeksPregnant} weeks ${daysPregnant % 7} days`
  const trimester1End = addDays(lmpDate, 13 * 7)
  const trimester2End = addDays(lmpDate, 27 * 7)
  const milestones = buildMilestones(lmpDate, today)

  return {
    dueDate,
    lmpDate,
    conceptionDate,
    weeksPregnant,
    daysPregnant,
    daysRemaining,
    trimester,
    isOverdue,
    gestationalAge,
    trimester1End,
    trimester2End,
    milestones,
  }
}
