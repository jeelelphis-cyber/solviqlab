// ─────────────────────────────────────────────────────────────────────────────
// Journey Engine — Configuration
//
// Defines all journeys, their steps, and per-instrument next-step data.
// This is the single source of truth for the Journey Engine.
//
// Adding a new journey:
//   1. Add to JOURNEY_DEFINITIONS
//   2. Add slug → journey mapping in SLUG_TO_JOURNEY
//   3. Add per-instrument next step data in NEXT_STEP_DATA
// ─────────────────────────────────────────────────────────────────────────────

export interface JourneyStep {
  readonly slug: string
  readonly shortName: string
}

export interface JourneyDefinition {
  readonly id: string
  readonly name: string
  readonly emoji: string
  readonly category: 'health' | 'finance' | 'productivity' | 'relationships'
  readonly steps: readonly JourneyStep[]
  readonly profileLabel: string
  readonly unlockAtStep: number         // unlock AI consultation after N steps
  readonly unlockReward: string         // what gets unlocked
}

export interface NextStepData {
  readonly journeyId: string
  readonly nextSlug: string
  readonly nextName: string
  readonly reason: string
  readonly estimatedMinutes: number
  readonly benefits: readonly string[]
  readonly profileLabel: string
  readonly profileContribution: number  // +N% to profile
}

// ── Journey Definitions ───────────────────────────────────────────────────────

export const JOURNEY_DEFINITIONS: readonly JourneyDefinition[] = [
  {
    id: 'health',
    name: 'Health Journey',
    emoji: '💪',
    category: 'health',
    profileLabel: 'Health Profile',
    unlockAtStep: 3,
    unlockReward: 'Personal Health Report',
    steps: [
      { slug: 'bmi-calculator',            shortName: 'BMI' },
      { slug: 'calorie-calculator',         shortName: 'Calories' },
      { slug: 'tdee-calculator',            shortName: 'TDEE' },
      { slug: 'bmr-calculator',            shortName: 'BMR' },
      { slug: 'body-fat-calculator',        shortName: 'Body Fat' },
      { slug: 'ideal-weight-calculator',    shortName: 'Ideal Weight' },
    ],
  },
  {
    id: 'weight-management',
    name: 'Weight Management',
    emoji: '⚖️',
    category: 'health',
    profileLabel: 'Weight Profile',
    unlockAtStep: 3,
    unlockReward: 'Personal Weight Plan',
    steps: [
      { slug: 'bmi-calculator',             shortName: 'BMI' },
      { slug: 'calorie-deficit-calculator',  shortName: 'Deficit' },
      { slug: 'tdee-calculator',             shortName: 'TDEE' },
      { slug: 'ideal-weight-calculator',     shortName: 'Goal' },
      { slug: 'body-fat-calculator',         shortName: 'Body Fat' },
      { slug: 'weight-assessment',           shortName: 'Assessment' },
    ],
  },
  {
    id: 'sleep-wellness',
    name: 'Sleep & Wellness',
    emoji: '🌙',
    category: 'health',
    profileLabel: 'Wellness Profile',
    unlockAtStep: 2,
    unlockReward: 'Wellness Insights',
    steps: [
      { slug: 'sleep-calculator',    shortName: 'Sleep' },
      { slug: 'bmi-calculator',      shortName: 'BMI' },
      { slug: 'calorie-calculator',  shortName: 'Calories' },
      { slug: 'sleep-assessment',    shortName: 'Assessment' },
    ],
  },
  {
    id: 'finance',
    name: 'Financial Journey',
    emoji: '💰',
    category: 'finance',
    profileLabel: 'Financial Profile',
    unlockAtStep: 3,
    unlockReward: 'Personal Financial Report',
    steps: [
      { slug: 'savings-calculator',           shortName: 'Savings' },
      { slug: 'compound-interest-calculator',  shortName: 'Growth' },
      { slug: 'investment-calculator',         shortName: 'Invest' },
      { slug: 'retirement-calculator',         shortName: 'Retire' },
      { slug: 'inflation-calculator',          shortName: 'Inflation' },
    ],
  },
  {
    id: 'home-buying',
    name: 'Home Buying Journey',
    emoji: '🏠',
    category: 'finance',
    profileLabel: 'Homebuyer Profile',
    unlockAtStep: 2,
    unlockReward: 'Affordability Report',
    steps: [
      { slug: 'mortgage-calculator',          shortName: 'Mortgage' },
      { slug: 'loan-calculator',              shortName: 'Loan' },
      { slug: 'compound-interest-calculator', shortName: 'Interest' },
      { slug: 'savings-calculator',           shortName: 'Savings' },
    ],
  },
  {
    id: 'family-planning',
    name: 'Family Planning',
    emoji: '👶',
    category: 'health',
    profileLabel: 'Family Profile',
    unlockAtStep: 2,
    unlockReward: 'Personalized Timeline',
    steps: [
      { slug: 'due-date-calculator',   shortName: 'Due Date' },
      { slug: 'pregnancy-calculator',  shortName: 'Pregnancy' },
      { slug: 'ovulation-calculator',  shortName: 'Ovulation' },
    ],
  },
]

// ── Per-Instrument Next Step Data ─────────────────────────────────────────────

const NEXT_STEP_DATA: Readonly<Record<string, NextStepData>> = {
  'bmi-calculator': {
    journeyId: 'health',
    nextSlug: 'calorie-calculator',
    nextName: 'Calorie Calculator',
    reason: 'Your BMI reveals where you stand. Now discover exactly how many calories your body needs to reach your goal weight.',
    estimatedMinutes: 2,
    benefits: [
      'Know your exact daily calorie target',
      'Personalize your nutrition plan',
      'Turn your BMI insight into action',
    ],
    profileLabel: 'Health Profile',
    profileContribution: 20,
  },

  'calorie-calculator': {
    journeyId: 'health',
    nextSlug: 'tdee-calculator',
    nextName: 'TDEE Calculator',
    reason: 'Your calorie needs change based on how active you are. TDEE gives you the complete picture of your energy balance.',
    estimatedMinutes: 2,
    benefits: [
      'Account for your activity level',
      'Discover your true energy expenditure',
      'Set a realistic calorie target',
    ],
    profileLabel: 'Health Profile',
    profileContribution: 20,
  },

  'tdee-calculator': {
    journeyId: 'health',
    nextSlug: 'bmr-calculator',
    nextName: 'BMR Calculator',
    reason: 'Your BMR is the foundation of your metabolism — the calories you burn just by existing. Essential for precision nutrition.',
    estimatedMinutes: 1,
    benefits: [
      'Understand your metabolic baseline',
      'Fine-tune your calorie deficit or surplus',
      'Achieve more precise results',
    ],
    profileLabel: 'Health Profile',
    profileContribution: 15,
  },

  'bmr-calculator': {
    journeyId: 'health',
    nextSlug: 'body-fat-calculator',
    nextName: 'Body Fat Calculator',
    reason: 'BMR tells you about your metabolism. Body fat percentage reveals your body composition — a far more accurate health marker than weight alone.',
    estimatedMinutes: 2,
    benefits: [
      'Track the real measure of fitness',
      'Distinguish fat loss from muscle loss',
      'Set composition-based goals',
    ],
    profileLabel: 'Health Profile',
    profileContribution: 20,
  },

  'body-fat-calculator': {
    journeyId: 'health',
    nextSlug: 'ideal-weight-calculator',
    nextName: 'Ideal Weight Calculator',
    reason: 'Now that you know your body composition, calculate your ideal weight — a personalized target based on your height and frame.',
    estimatedMinutes: 1,
    benefits: [
      'Set a science-based target weight',
      'Understand your healthy range',
      'Complete your Health Profile',
    ],
    profileLabel: 'Health Profile',
    profileContribution: 25,
  },

  'ideal-weight-calculator': {
    journeyId: 'health',
    nextSlug: 'calorie-deficit-calculator',
    nextName: 'Calorie Deficit Calculator',
    reason: 'You know your ideal weight. Now calculate the exact calorie deficit needed to get there at a healthy, sustainable pace.',
    estimatedMinutes: 2,
    benefits: [
      'Calculate your personalized deficit',
      'Set a realistic timeline',
      'Avoid muscle loss while cutting',
    ],
    profileLabel: 'Health Profile',
    profileContribution: 20,
  },

  'calorie-deficit-calculator': {
    journeyId: 'weight-management',
    nextSlug: 'tdee-calculator',
    nextName: 'TDEE Calculator',
    reason: 'Your deficit only works if your total energy expenditure is accurate. TDEE accounts for your activity — the missing piece.',
    estimatedMinutes: 2,
    benefits: [
      'Calibrate your deficit precisely',
      'Avoid under- or over-eating',
      'Build a plan that actually works',
    ],
    profileLabel: 'Weight Profile',
    profileContribution: 25,
  },

  'sleep-calculator': {
    journeyId: 'sleep-wellness',
    nextSlug: 'bmi-calculator',
    nextName: 'BMI Calculator',
    reason: 'Sleep quality and body composition are deeply connected. People who sleep well maintain healthier weight — see where you stand.',
    estimatedMinutes: 2,
    benefits: [
      'Understand the sleep-weight connection',
      'Build a complete wellness picture',
      'Identify areas for improvement',
    ],
    profileLabel: 'Wellness Profile',
    profileContribution: 30,
  },

  'savings-calculator': {
    journeyId: 'finance',
    nextSlug: 'compound-interest-calculator',
    nextName: 'Compound Interest Calculator',
    reason: 'Your savings grow exponentially when compounded. See how your money multiplies over time with compound interest.',
    estimatedMinutes: 2,
    benefits: [
      'See the power of compound growth',
      'Project your savings 10, 20, 30 years out',
      'Understand how interest works for you',
    ],
    profileLabel: 'Financial Profile',
    profileContribution: 20,
  },

  'compound-interest-calculator': {
    journeyId: 'finance',
    nextSlug: 'investment-calculator',
    nextName: 'Investment Calculator',
    reason: 'Compound interest is the foundation. Now see how regular investments amplify your wealth through market returns.',
    estimatedMinutes: 2,
    benefits: [
      'Model different investment scenarios',
      'Compare contribution strategies',
      'See your projected net worth',
    ],
    profileLabel: 'Financial Profile',
    profileContribution: 20,
  },

  'investment-calculator': {
    journeyId: 'finance',
    nextSlug: 'retirement-calculator',
    nextName: 'Retirement Calculator',
    reason: 'Investing is how you build wealth. Retirement planning is how you protect it. Complete your financial picture.',
    estimatedMinutes: 3,
    benefits: [
      'Know your retirement readiness',
      'Identify your savings gap',
      'Plan your financial independence',
    ],
    profileLabel: 'Financial Profile',
    profileContribution: 25,
  },

  'retirement-calculator': {
    journeyId: 'finance',
    nextSlug: 'inflation-calculator',
    nextName: 'Inflation Calculator',
    reason: 'Your retirement number looks great today — but inflation erodes purchasing power. Account for it in your plan.',
    estimatedMinutes: 1,
    benefits: [
      'Protect against purchasing power loss',
      'Adjust your retirement target realistically',
      'Complete your Financial Profile',
    ],
    profileLabel: 'Financial Profile',
    profileContribution: 15,
  },

  'mortgage-calculator': {
    journeyId: 'home-buying',
    nextSlug: 'loan-calculator',
    nextName: 'Loan Calculator',
    reason: 'Your mortgage is one loan. But home buying often involves additional borrowing. Understand the full cost.',
    estimatedMinutes: 2,
    benefits: [
      'Model total borrowing cost',
      'Compare loan options',
      'Avoid hidden affordability gaps',
    ],
    profileLabel: 'Homebuyer Profile',
    profileContribution: 30,
  },

  'loan-calculator': {
    journeyId: 'home-buying',
    nextSlug: 'savings-calculator',
    nextName: 'Savings Calculator',
    reason: 'Knowing your loan payments is one side. Knowing how to save your down payment is the other.',
    estimatedMinutes: 2,
    benefits: [
      'Plan your down payment timeline',
      'Set a monthly savings target',
      'Reach your home purchase date',
    ],
    profileLabel: 'Homebuyer Profile',
    profileContribution: 30,
  },

  'due-date-calculator': {
    journeyId: 'family-planning',
    nextSlug: 'pregnancy-calculator',
    nextName: 'Pregnancy Calculator',
    reason: 'Your due date is set. Now track your pregnancy week by week — what\'s happening, what to expect, and when.',
    estimatedMinutes: 2,
    benefits: [
      'Track development week by week',
      'Know what to expect at each stage',
      'Prepare for key milestones',
    ],
    profileLabel: 'Family Profile',
    profileContribution: 35,
  },

  'pregnancy-calculator': {
    journeyId: 'family-planning',
    nextSlug: 'ovulation-calculator',
    nextName: 'Ovulation Calculator',
    reason: 'Track your fertility window to plan or prepare. Complete your Family Planning profile.',
    estimatedMinutes: 1,
    benefits: [
      'Know your fertile days',
      'Optimize timing with precision',
      'Complete your Family Profile',
    ],
    profileLabel: 'Family Profile',
    profileContribution: 35,
  },

  'ovulation-calculator': {
    journeyId: 'family-planning',
    nextSlug: 'due-date-calculator',
    nextName: 'Due Date Calculator',
    reason: 'Track your entire journey — from conception planning to due date. Complete the full picture.',
    estimatedMinutes: 1,
    benefits: [
      'Know your expected due date',
      'Plan your pregnancy timeline',
      'Complete your Family Profile',
    ],
    profileLabel: 'Family Profile',
    profileContribution: 30,
  },

  'weight-assessment': {
    journeyId: 'weight-management',
    nextSlug: 'weight-loss-planner',
    nextName: 'Weight Loss Planner',
    reason: 'Your Weight Assessment is complete. Build your personalized week-by-week plan based on your profile data.',
    estimatedMinutes: 5,
    benefits: [
      'Week-by-week calorie and meal targets',
      'Personalized milestone timeline',
      'Adjustable plan based on your progress',
    ],
    profileLabel: 'Weight Profile',
    profileContribution: 30,
  },

  'sleep-assessment': {
    journeyId: 'sleep-wellness',
    nextSlug: 'calorie-calculator',
    nextName: 'Calorie Calculator',
    reason: 'Your sleep profile is built. Now connect it to your nutrition — sleep quality and caloric balance are deeply linked.',
    estimatedMinutes: 2,
    benefits: [
      'See the sleep-metabolism connection',
      'Build a complete Wellness Profile',
      'Get cross-domain health insights',
    ],
    profileLabel: 'Wellness Profile',
    profileContribution: 40,
  },
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getNextStep(slug: string): NextStepData | null {
  return NEXT_STEP_DATA[slug] ?? null
}

export function getJourneyForSlug(slug: string): JourneyDefinition | null {
  const nextStep = NEXT_STEP_DATA[slug]
  if (!nextStep) return null
  return JOURNEY_DEFINITIONS.find(j => j.id === nextStep.journeyId) ?? null
}

export interface JourneyPosition {
  readonly journey: JourneyDefinition
  readonly currentIndex: number        // 0-based
  readonly completedCount: number      // steps before current (assumed completed)
  readonly totalSteps: number
  readonly progressPercent: number
  readonly stepsUntilUnlock: number
}

export function getJourneyPosition(slug: string): JourneyPosition | null {
  const journey = getJourneyForSlug(slug)
  if (!journey) return null

  const currentIndex = journey.steps.findIndex(s => s.slug === slug)
  if (currentIndex === -1) return null

  const completedCount = currentIndex
  const totalSteps = journey.steps.length
  const progressPercent = Math.round((completedCount / totalSteps) * 100)
  const stepsUntilUnlock = Math.max(0, journey.unlockAtStep - completedCount)

  return { journey, currentIndex, completedCount, totalSteps, progressPercent, stepsUntilUnlock }
}
