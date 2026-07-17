export type InputMethod = 'lmp' | 'conception' | 'dueDate'

export interface PregnancyCalculatorInput {
  method: InputMethod
  date: string  // ISO date string YYYY-MM-DD
}

export interface PregnancyMilestone {
  week: number
  label: string
  date: string  // ISO date string
}

export interface PregnancyCalculatorOutput {
  dueDate: string           // ISO date
  conceptionDate: string    // ISO date
  lmpDate: string           // ISO date
  weeksPregnant: number     // complete weeks from today
  daysPregnant: number      // total days from LMP to today
  daysRemaining: number     // days until due date
  trimester: 1 | 2 | 3
  trimesterLabel: string    // "First Trimester", etc.
  isOverdue: boolean
  milestones: PregnancyMilestone[]
}
