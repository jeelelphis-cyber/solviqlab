// ─────────────────────────────────────────────────────────────────────────────
// Alex Persona Config — Sprint C-1.2 placeholder
//
// Alex is the Finance Coach. Full config implemented in Sprint C-2.
// This file exports a minimal skeleton that satisfies CoachPersonaConfigWithEvaluableRules
// so the PERSONA_REGISTRY and TypeScript compilation work without errors today.
//
// Architecture Bible v2.1 §03 P-17: one engine, different configs.
// Adding Alex = adding this config. No engine changes needed.
// ─────────────────────────────────────────────────────────────────────────────

import type { CoachPersonaConfigWithEvaluableRules } from '../brain/decision-engine'

// TODO (Sprint C-2): implement full decision rules for Alex (Finance Coach)
// TODO (Sprint C-2): add Alex avatar and voice IDs from heygen/types.ts
// TODO (Sprint C-2): define finance-specific domainConfig (primaryMetric: 'net_worth' etc.)
// TODO (Sprint C-2): define toneByPhase — Alex is calm, analytical, strategic (MIA_BIBLE §12)
// TODO (Sprint C-2): define videoTemplates for budget reviews, milestone celebrations

export const ALEX_PERSONA_CONFIG: CoachPersonaConfigWithEvaluableRules = {

  coachId:   'alex',
  coachName: 'Alex',
  cluster:   'finance',

  personality: {
    tone:          'analytical',
    style:         'advisory',
    languageLevel: 'professional',
    emojiPolicy:   'never',
  },

  // Sprint C-2: real rules go here. Currently empty — engine will return no decisions.
  decisionRules: [],

  // TODO (Sprint C-2): define per-phase tone instructions
  toneByPhase: {
    onboarding:     { key: 'calm_trust',     instruction: 'TODO Sprint C-2' },
    firstWeek:      { key: 'observational',  instruction: 'TODO Sprint C-2' },
    firstMonth:     { key: 'strategic',      instruction: 'TODO Sprint C-2' },
    transformation: { key: 'acknowledging',  instruction: 'TODO Sprint C-2' },
    partnership:    { key: 'peer_strategic', instruction: 'TODO Sprint C-2' },
  },

  // TODO (Sprint C-2): define finance-specific video templates
  videoTemplates: {
    morning: {
      structure:    ['greeting', 'financial_focus_today'],
      maxDuration:  60,
      requiredVars: ['name'],
      fallbackText: 'Good morning. Your financial focus for today is ready.',
    },
    evening: {
      structure:    ['daily_check', 'reflection'],
      maxDuration:  45,
      requiredVars: ['name'],
      fallbackText: 'Good evening. Reflect on your financial actions today.',
    },
    intervention: {
      L1: { structure: ['acknowledgment', 'reframe'],        maxDuration: 40, requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
      L2: { structure: ['check_in', 'small_step'],           maxDuration: 50, requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
      L3: { structure: ['pattern', 'rebuild'],               maxDuration: 55, requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
      L4: { structure: ['goal_reconnect', 'plan_adapt'],     maxDuration: 60, requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
      L5: { structure: ['honest_talk', 'open_door'],         maxDuration: 50, requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
    },
    milestone:   { structure: ['achievement', 'next_level'], maxDuration: 60,  requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
    celebration: { structure: ['precise_win', 'raise_bar'],  maxDuration: 55,  requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
    weekReview:  { structure: ['week_numbers', 'next_week'], maxDuration: 90,  requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
    monthReview: { structure: ['month_story', 'next_month'], maxDuration: 120, requiredVars: ['name'], fallbackText: 'TODO Sprint C-2' },
  },

  // TODO (Sprint C-2): finance-specific metrics and thresholds
  domainConfig: {
    primaryMetric:    'net_savings_rate',
    secondaryMetrics: ['monthly_expenses', 'emergency_fund_months', 'debt_to_income'],
    taskCategories:   ['budgeting', 'saving', 'investing', 'debt_reduction', 'income_growth'],
    interventionThresholds: {
      skipDaysL1:       1,
      skipDaysL2:       3,
      skipDaysL3:       7,
      offTrackWeeksL4:  2,
      trendDownWeeksL5: 4,
    },
  },

  safetyRules: {
    // TODO (Sprint C-2): finance-specific safety rules (no specific investment picks, etc.)
    neverMentionTopics: [
      'specific_stock_picks',
      'guaranteed_returns',
      'get_rich_quick',
      'illegal_tax_schemes',
    ],
    requiresDisclaimer: [
      'investment_advice',
      'tax_guidance',
      'insurance_recommendation',
    ],
    escalateToHuman: [
      'bankruptcy_crisis',
      'financial_fraud_victim',
      'extreme_debt_emergency',
    ],
  },

}
