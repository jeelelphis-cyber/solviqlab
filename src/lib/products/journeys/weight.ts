import type { JourneyTemplate } from '../types'

export const WeightJourney: JourneyTemplate = {
  id:   'weight-30',
  name: 'Weight & Body Composition — 30 Days',
  steps: [
    { day: 1,  label: 'BMI Baseline',        action: 'calculator',     productSlug: 'bmi-calculator',          description: 'Understand where you start.' },
    { day: 1,  label: 'Body Fat Check',      action: 'calculator',     productSlug: 'body-fat-calculator',     description: 'Get the full picture.' },
    { day: 1,  label: 'Meet Mia',            action: 'assessment',     productSlug: 'weight-assessment',       description: 'Your first personalised video.' },
    { day: 3,  label: 'Calorie Target',      action: 'calculator',     productSlug: 'calorie-deficit-calculator', description: 'Set a sustainable deficit.' },
    { day: 5,  label: 'TDEE',                action: 'calculator',     productSlug: 'tdee-calculator',         description: 'Know your daily burn.' },
    { day: 7,  label: 'Week 1 Review',       action: 'review',                                                 description: 'Mia reviews your first week.' },
    { day: 14, label: 'New Goal Set',        action: 'new_goal',                                               description: 'Raise the bar for week 3.' },
    { day: 21, label: 'Progress Check',      action: 'progress_check',                                         description: 'See how far you have come.' },
    { day: 28, label: 'Ideal Weight Target', action: 'calculator',     productSlug: 'ideal-weight-calculator', description: 'Refine your target.' },
    { day: 30, label: 'Month 1 Complete',    action: 'review',                                                 description: 'Full progress report from Mia.' },
  ],
}
