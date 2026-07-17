export type DueDateMethod = 'lmp' | 'conception' | 'ivf3' | 'ivf5'

export interface DueDateCalculatorInput {
  method: DueDateMethod
  date: string  // ISO YYYY-MM-DD
}

export interface DueDateMilestone {
  week: number
  label: string
  date: string
  trimester: 1 | 2 | 3
  isPast: boolean
}

export interface DueDateCalculatorOutput {
  dueDate: string
  lmpDate: string
  conceptionDate: string
  weeksPregnant: number
  daysPregnant: number
  daysRemaining: number
  trimester: 1 | 2 | 3
  isOverdue: boolean
  gestationalAge: string   // e.g. "12 weeks 3 days"
  trimester1End: string    // end of T1 = LMP + 13*7 days
  trimester2End: string    // end of T2 = LMP + 27*7 days
  milestones: DueDateMilestone[]
}
