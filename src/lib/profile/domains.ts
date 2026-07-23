// ─────────────────────────────────────────────────────────────────────────────
// Profile Domain Definitions
//
// Master mapping: instrument slug → domain contribution.
// Every calculator that can contribute to a health or finance profile is here.
//
// Rules:
//   - confidence_contribution sums to ≤100 per domain across all instruments
//   - status_map translates calculator labels to SignalStatus
//   - missing_instruments = instruments in this domain not yet completed
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ProfileDomain,
  HealthDomain,
  FinanceDomain,
  DomainProfile,
  DomainStatus,
  InstrumentProfileConfig,
  SignalStatus,
} from './types'

// ── Domain Metadata ───────────────────────────────────────────────────────────

export interface DomainMeta {
  readonly id: ProfileDomain
  readonly label: string
  readonly description: string
  readonly category: 'health' | 'finance'
  readonly primary_instruments: readonly string[]    // ordered by confidence contribution
  readonly confidence_thresholds: {
    readonly building: number    // ≥ this → 'building'
    readonly established: number // ≥ this → 'established'
  }
}

export const DOMAIN_META: readonly DomainMeta[] = [
  // ── Health ──────────────────────────────────────────────────────────────────
  {
    id: 'weight',
    label: 'Weight',
    description: 'Body weight, BMI, and ideal weight range',
    category: 'health',
    primary_instruments: ['bmi-calculator', 'ideal-weight-calculator', 'calorie-deficit-calculator'],
    confidence_thresholds: { building: 20, established: 60 },
  },
  {
    id: 'nutrition',
    label: 'Nutrition',
    description: 'Caloric intake, macronutrients, and dietary patterns',
    category: 'health',
    primary_instruments: ['calorie-calculator', 'tdee-calculator', 'calorie-deficit-calculator'],
    confidence_thresholds: { building: 20, established: 65 },
  },
  {
    id: 'metabolism',
    label: 'Metabolism',
    description: 'Basal metabolic rate and total daily energy expenditure',
    category: 'health',
    primary_instruments: ['bmr-calculator', 'tdee-calculator'],
    confidence_thresholds: { building: 30, established: 70 },
  },
  {
    id: 'fitness',
    label: 'Fitness',
    description: 'Body composition, fat percentage, and physical fitness',
    category: 'health',
    primary_instruments: ['body-fat-calculator', 'bmi-calculator'],
    confidence_thresholds: { building: 25, established: 65 },
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Sleep duration, quality, and schedule',
    category: 'health',
    primary_instruments: ['sleep-calculator'],
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'Physical recovery, rest, and restoration',
    category: 'health',
    primary_instruments: ['sleep-calculator'],
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'hydration',
    label: 'Hydration',
    description: 'Daily water intake and hydration needs',
    category: 'health',
    primary_instruments: [],   // hydration calculator coming in Wave 2
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    description: 'Heart rate, target zones, and cardio health',
    category: 'health',
    primary_instruments: [],   // heart rate calculator coming in Wave 2
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'mental_wellness',
    label: 'Mental Wellness',
    description: 'Stress, anxiety, and mental health indicators',
    category: 'health',
    primary_instruments: [],   // stress calculator coming in Wave 2
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'womens_health',
    label: "Women's Health",
    description: 'Menstrual cycle, fertility, and women-specific metrics',
    category: 'health',
    primary_instruments: ['ovulation-calculator'],
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'pregnancy',
    label: 'Pregnancy',
    description: 'Due date, weight gain, and pregnancy tracking',
    category: 'health',
    primary_instruments: ['due-date-calculator', 'pregnancy-calculator'],
    confidence_thresholds: { building: 30, established: 70 },
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    description: 'Overall lifestyle patterns and health behaviors',
    category: 'health',
    primary_instruments: ['tdee-calculator', 'sleep-calculator'],
    confidence_thresholds: { building: 20, established: 60 },
  },
  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    id: 'savings',
    label: 'Savings',
    description: 'Savings goals, rates, and compound growth',
    category: 'finance',
    primary_instruments: ['savings-calculator', 'compound-interest-calculator'],
    confidence_thresholds: { building: 30, established: 70 },
  },
  {
    id: 'investment',
    label: 'Investment',
    description: 'Investment growth, returns, and portfolio strategy',
    category: 'finance',
    primary_instruments: ['investment-calculator', 'compound-interest-calculator'],
    confidence_thresholds: { building: 30, established: 70 },
  },
  {
    id: 'debt',
    label: 'Debt',
    description: 'Loans, mortgages, and debt repayment',
    category: 'finance',
    primary_instruments: ['loan-calculator', 'mortgage-calculator'],
    confidence_thresholds: { building: 25, established: 65 },
  },
  {
    id: 'retirement',
    label: 'Retirement',
    description: 'Retirement readiness and savings trajectory',
    category: 'finance',
    primary_instruments: ['retirement-calculator'],
    confidence_thresholds: { building: 40, established: 80 },
  },
  {
    id: 'income',
    label: 'Income',
    description: 'Salary, tax, and take-home pay',
    category: 'finance',
    primary_instruments: ['salary-calculator', 'tax-calculator'],
    confidence_thresholds: { building: 25, established: 65 },
  },
]

export const DOMAIN_META_MAP: Readonly<Record<ProfileDomain, DomainMeta>> = Object.fromEntries(
  DOMAIN_META.map(d => [d.id, d])
) as Readonly<Record<ProfileDomain, DomainMeta>>

// ── Instrument → Profile Mapping ──────────────────────────────────────────────

const WEIGHT_STATUS: Readonly<Record<string, SignalStatus>> = {
  'Underweight':    'warning',
  'Normal Weight':  'optimal',
  'Normal weight':  'optimal',
  'Overweight':     'warning',
  'Obese':          'critical',
  'Obese Class I':  'critical',
  'Obese Class II': 'critical',
  'Obese Class III':'critical',
}

const GENERIC_STATUS: Readonly<Record<string, SignalStatus>> = {
  'Low':    'warning',
  'Normal': 'optimal',
  'High':   'warning',
  'Very High': 'critical',
  'Very Low':  'critical',
}

export const INSTRUMENT_PROFILE_CONFIGS: readonly InstrumentProfileConfig[] = [
  // ── Health Instruments ───────────────────────────────────────────────────────
  {
    slug: 'bmi-calculator',
    name: 'BMI Calculator',
    domains: [
      {
        domain: 'weight',
        metric: 'bmi',
        confidence_contribution: 30,
        status_map: WEIGHT_STATUS,
      },
      {
        domain: 'fitness',
        metric: 'bmi_fitness_proxy',
        confidence_contribution: 15,
        status_map: WEIGHT_STATUS,
      },
    ],
  },
  {
    slug: 'ideal-weight-calculator',
    name: 'Ideal Weight Calculator',
    domains: [
      {
        domain: 'weight',
        metric: 'ideal_weight_range',
        confidence_contribution: 20,
      },
    ],
  },
  {
    slug: 'bmr-calculator',
    name: 'BMR Calculator',
    domains: [
      {
        domain: 'metabolism',
        metric: 'bmr_kcal',
        confidence_contribution: 45,
      },
    ],
  },
  {
    slug: 'tdee-calculator',
    name: 'TDEE Calculator',
    domains: [
      {
        domain: 'metabolism',
        metric: 'tdee_kcal',
        confidence_contribution: 55,
      },
      {
        domain: 'nutrition',
        metric: 'daily_target_kcal',
        confidence_contribution: 25,
      },
      {
        domain: 'lifestyle',
        metric: 'activity_level',
        confidence_contribution: 20,
      },
    ],
  },
  {
    slug: 'calorie-calculator',
    name: 'Calorie Calculator',
    domains: [
      {
        domain: 'nutrition',
        metric: 'daily_calories_kcal',
        confidence_contribution: 35,
        status_map: GENERIC_STATUS,
      },
    ],
  },
  {
    slug: 'calorie-deficit-calculator',
    name: 'Calorie Deficit Calculator',
    domains: [
      {
        domain: 'nutrition',
        metric: 'calorie_deficit_kcal',
        confidence_contribution: 30,
      },
      {
        domain: 'weight',
        metric: 'weight_loss_plan',
        confidence_contribution: 20,
      },
    ],
  },
  {
    slug: 'body-fat-calculator',
    name: 'Body Fat Calculator',
    domains: [
      {
        domain: 'fitness',
        metric: 'body_fat_percent',
        confidence_contribution: 55,
        status_map: {
          'Essential Fat': 'warning',
          'Athletes':      'optimal',
          'Fitness':       'optimal',
          'Average':       'normal',
          'Obese':         'critical',
        },
      },
    ],
  },
  {
    slug: 'sleep-calculator',
    name: 'Sleep Calculator',
    domains: [
      {
        domain: 'sleep',
        metric: 'sleep_hours',
        confidence_contribution: 80,
        status_map: {
          'Insufficient': 'warning',
          'Optimal':      'optimal',
          'Excessive':    'warning',
        },
      },
      {
        domain: 'recovery',
        metric: 'recovery_quality',
        confidence_contribution: 60,
      },
      {
        domain: 'lifestyle',
        metric: 'sleep_schedule',
        confidence_contribution: 15,
      },
    ],
  },
  {
    slug: 'ovulation-calculator',
    name: 'Ovulation Calculator',
    domains: [
      {
        domain: 'womens_health',
        metric: 'cycle_data',
        confidence_contribution: 60,
      },
    ],
  },
  {
    slug: 'due-date-calculator',
    name: 'Due Date Calculator',
    domains: [
      {
        domain: 'pregnancy',
        metric: 'due_date',
        confidence_contribution: 50,
      },
    ],
  },
  {
    slug: 'pregnancy-calculator',
    name: 'Pregnancy Calculator',
    domains: [
      {
        domain: 'pregnancy',
        metric: 'pregnancy_week',
        confidence_contribution: 50,
      },
    ],
  },
  // ── Finance Instruments ──────────────────────────────────────────────────────
  {
    slug: 'savings-calculator',
    name: 'Savings Calculator',
    domains: [
      {
        domain: 'savings',
        metric: 'savings_target',
        confidence_contribution: 45,
      },
    ],
  },
  {
    slug: 'compound-interest-calculator',
    name: 'Compound Interest Calculator',
    domains: [
      {
        domain: 'savings',
        metric: 'compound_growth',
        confidence_contribution: 35,
      },
      {
        domain: 'investment',
        metric: 'growth_projection',
        confidence_contribution: 35,
      },
    ],
  },
  {
    slug: 'investment-calculator',
    name: 'Investment Calculator',
    domains: [
      {
        domain: 'investment',
        metric: 'investment_return',
        confidence_contribution: 50,
      },
    ],
  },
  {
    slug: 'loan-calculator',
    name: 'Loan Calculator',
    domains: [
      {
        domain: 'debt',
        metric: 'loan_payment',
        confidence_contribution: 40,
      },
    ],
  },
  {
    slug: 'mortgage-calculator',
    name: 'Mortgage Calculator',
    domains: [
      {
        domain: 'debt',
        metric: 'mortgage_payment',
        confidence_contribution: 50,
      },
    ],
  },
  {
    slug: 'retirement-calculator',
    name: 'Retirement Calculator',
    domains: [
      {
        domain: 'retirement',
        metric: 'retirement_readiness',
        confidence_contribution: 80,
      },
    ],
  },
  {
    slug: 'salary-calculator',
    name: 'Salary Calculator',
    domains: [
      {
        domain: 'income',
        metric: 'gross_salary',
        confidence_contribution: 40,
      },
    ],
  },
  {
    slug: 'tax-calculator',
    name: 'Tax Calculator',
    domains: [
      {
        domain: 'income',
        metric: 'tax_liability',
        confidence_contribution: 45,
      },
    ],
  },
  {
    slug: 'inflation-calculator',
    name: 'Inflation Calculator',
    domains: [
      {
        domain: 'savings',
        metric: 'inflation_impact',
        confidence_contribution: 20,
      },
    ],
  },
]

export const INSTRUMENT_PROFILE_MAP: Readonly<Record<string, InstrumentProfileConfig>> =
  Object.fromEntries(INSTRUMENT_PROFILE_CONFIGS.map(c => [c.slug, c]))

// ── Empty Domain Profile Factory ──────────────────────────────────────────────

export function emptyDomainProfile(domain: ProfileDomain): DomainProfile {
  const meta = DOMAIN_META_MAP[domain]
  return {
    domain,
    confidence: 0,
    status: 'unknown' as DomainStatus,
    signals: [],
    last_updated: null,
    missing_instruments: meta.primary_instruments as string[],
  }
}

export function computeDomainStatus(confidence: number, meta: DomainMeta): DomainStatus {
  if (confidence >= meta.confidence_thresholds.established) return 'established'
  if (confidence >= meta.confidence_thresholds.building)    return 'building'
  if (confidence > 0)                                       return 'building'
  return 'unknown'
}

export const HEALTH_DOMAINS: readonly HealthDomain[] = [
  'weight', 'nutrition', 'metabolism', 'fitness', 'sleep', 'recovery',
  'hydration', 'cardiovascular', 'mental_wellness', 'womens_health', 'pregnancy', 'lifestyle',
]

export const FINANCE_DOMAINS: readonly FinanceDomain[] = [
  'savings', 'investment', 'debt', 'retirement', 'income',
]

export const ALL_DOMAINS: readonly ProfileDomain[] = [...HEALTH_DOMAINS, ...FINANCE_DOMAINS]
