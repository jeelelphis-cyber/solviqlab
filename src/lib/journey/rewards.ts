// ─────────────────────────────────────────────────────────────────────────────
// Journey Rewards — What each step contributes
//
// Shown as a "completion banner" at the top of the journey section.
// Even without persistence, we can truthfully say:
// "By completing this calculator you've established your X baseline."
//
// These are forward-looking aspirational rewards (no persistence needed).
// ─────────────────────────────────────────────────────────────────────────────

export interface StepReward {
  readonly completionLabel: string        // "BMI Baseline established"
  readonly profileInsight: string         // "Health Score is now trackable"
  readonly aiReadinessContribution: number // 0-100, how much this contributes to AI unlock
  readonly dimensionUnlocked: string      // "Body Composition dimension"
}

const STEP_REWARDS: Readonly<Record<string, StepReward>> = {
  'bmi-calculator': {
    completionLabel: 'BMI Baseline established',
    profileInsight: 'Body Weight dimension added to Health Profile',
    aiReadinessContribution: 20,
    dimensionUnlocked: 'Body Weight',
  },
  'calorie-calculator': {
    completionLabel: 'Daily Calorie Target calculated',
    profileInsight: 'Nutrition dimension added to Health Profile',
    aiReadinessContribution: 20,
    dimensionUnlocked: 'Nutrition',
  },
  'tdee-calculator': {
    completionLabel: 'Energy Expenditure mapped',
    profileInsight: 'Activity Level dimension added to Health Profile',
    aiReadinessContribution: 20,
    dimensionUnlocked: 'Activity Level',
  },
  'bmr-calculator': {
    completionLabel: 'Metabolic Rate measured',
    profileInsight: 'Metabolism dimension added to Health Profile',
    aiReadinessContribution: 15,
    dimensionUnlocked: 'Metabolism',
  },
  'body-fat-calculator': {
    completionLabel: 'Body Composition analyzed',
    profileInsight: 'Body Composition dimension added to Health Profile',
    aiReadinessContribution: 20,
    dimensionUnlocked: 'Body Composition',
  },
  'ideal-weight-calculator': {
    completionLabel: 'Goal Weight established',
    profileInsight: 'Weight Goal dimension added to Health Profile',
    aiReadinessContribution: 25,
    dimensionUnlocked: 'Weight Goal',
  },
  'calorie-deficit-calculator': {
    completionLabel: 'Deficit Strategy defined',
    profileInsight: 'Weight Loss Plan dimension added',
    aiReadinessContribution: 25,
    dimensionUnlocked: 'Weight Loss Plan',
  },
  'sleep-calculator': {
    completionLabel: 'Sleep Schedule optimized',
    profileInsight: 'Sleep Quality dimension added to Wellness Profile',
    aiReadinessContribution: 30,
    dimensionUnlocked: 'Sleep Quality',
  },
  'savings-calculator': {
    completionLabel: 'Savings Target set',
    profileInsight: 'Savings dimension added to Financial Profile',
    aiReadinessContribution: 20,
    dimensionUnlocked: 'Savings',
  },
  'compound-interest-calculator': {
    completionLabel: 'Growth Projection calculated',
    profileInsight: 'Investment Growth dimension added',
    aiReadinessContribution: 20,
    dimensionUnlocked: 'Investment Growth',
  },
  'investment-calculator': {
    completionLabel: 'Investment Strategy modeled',
    profileInsight: 'Portfolio dimension added to Financial Profile',
    aiReadinessContribution: 25,
    dimensionUnlocked: 'Portfolio',
  },
  'retirement-calculator': {
    completionLabel: 'Retirement Readiness assessed',
    profileInsight: 'Retirement dimension added to Financial Profile',
    aiReadinessContribution: 25,
    dimensionUnlocked: 'Retirement',
  },
  'mortgage-calculator': {
    completionLabel: 'Mortgage Scenario modeled',
    profileInsight: 'Home Financing dimension added',
    aiReadinessContribution: 30,
    dimensionUnlocked: 'Home Financing',
  },
  'loan-calculator': {
    completionLabel: 'Loan Terms analyzed',
    profileInsight: 'Debt Management dimension added',
    aiReadinessContribution: 30,
    dimensionUnlocked: 'Debt Management',
  },
  'due-date-calculator': {
    completionLabel: 'Due Date calculated',
    profileInsight: 'Pregnancy Timeline dimension added',
    aiReadinessContribution: 35,
    dimensionUnlocked: 'Pregnancy Timeline',
  },
  'pregnancy-calculator': {
    completionLabel: 'Pregnancy Week tracked',
    profileInsight: 'Development dimension added to Family Profile',
    aiReadinessContribution: 35,
    dimensionUnlocked: 'Development',
  },
  'ovulation-calculator': {
    completionLabel: 'Fertility Window mapped',
    profileInsight: 'Fertility dimension added to Family Profile',
    aiReadinessContribution: 30,
    dimensionUnlocked: 'Fertility',
  },
}

export function getStepReward(slug: string): StepReward | null {
  return STEP_REWARDS[slug] ?? null
}
