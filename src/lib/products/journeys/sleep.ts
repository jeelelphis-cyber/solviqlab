import type { JourneyTemplate } from '../types'

export const SleepJourney: JourneyTemplate = {
  id:   'sleep-30',
  name: 'Sleep Optimisation — 30 Days',
  steps: [
    { day: 1,  label: 'Sleep Baseline',   action: 'calculator', productSlug: 'sleep-calculator',    description: 'Measure your current sleep.' },
    { day: 1,  label: 'Meet Mia',         action: 'assessment', productSlug: 'sleep-assessment',    description: 'Your first sleep coaching video.' },
    { day: 3,  label: 'BMR Check',        action: 'calculator', productSlug: 'bmr-calculator',      description: 'Sleep affects metabolism — see how.' },
    { day: 7,  label: 'Week 1 Review',    action: 'review',                                          description: 'Did the one action change anything?' },
    { day: 14, label: 'Progress Check',   action: 'progress_check',                                  description: 'Mia compares week 1 vs week 2.' },
    { day: 21, label: 'Habit Lock-in',    action: 'review',                                          description: 'Three weeks — building a real habit.' },
    { day: 30, label: 'Sleep Month Done', action: 'review',                                          description: 'Full sleep score change from Mia.' },
  ],
}
