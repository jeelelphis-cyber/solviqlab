// ─────────────────────────────────────────────────────────────────────────────
// Sleep & Wellness Intent Cluster — Assessment Configuration
//
// Second configuration — proves the engine is universal.
// Zero engine changes. Only data.
//
// Dimensions (total weight must = 1.0):
//   sleep_quality    0.40  — duration quality + consistency
//   recovery         0.35  — sleep architecture + wake readiness
//   lifestyle_impact 0.25  — how sleep affects weight/energy
// ─────────────────────────────────────────────────────────────────────────────

import type { AssessmentConfig } from '../types'

export const sleepAssessmentConfig: AssessmentConfig = {
  id: 'sleep-assessment',
  cluster: 'sleep',
  version: 1,
  schema_version: 1,

  trigger: {
    required_domains: [
      { domain: 'sleep',    min_confidence: 35 },
      { domain: 'recovery', min_confidence: 20 },
    ],
    min_instruments_completed: 1,   // sleep-calculator alone is enough to trigger
  },

  gap_questions: [
    {
      id: 'sleep_quality_subjective',
      type: 'select',
      label_key: 'assessment.sleep.question.quality',
      required: true,
      ask_if_signal_absent: 'sleep_quality_subjective',
      options: [
        { value: 'poor',      label_key: 'assessment.sleep.question.quality.poor' },
        { value: 'fair',      label_key: 'assessment.sleep.question.quality.fair' },
        { value: 'good',      label_key: 'assessment.sleep.question.quality.good' },
        { value: 'excellent', label_key: 'assessment.sleep.question.quality.excellent' },
      ],
    },
    {
      id: 'sleep_consistency',
      type: 'select',
      label_key: 'assessment.sleep.question.consistency',
      required: false,
      ask_if_signal_absent: 'sleep_consistency',
      options: [
        { value: 'very_inconsistent', label_key: 'assessment.sleep.question.consistency.very_inconsistent' },
        { value: 'inconsistent',      label_key: 'assessment.sleep.question.consistency.inconsistent' },
        { value: 'mostly_consistent', label_key: 'assessment.sleep.question.consistency.mostly_consistent' },
        { value: 'consistent',        label_key: 'assessment.sleep.question.consistency.consistent' },
      ],
    },
  ],

  dimensions: [
    {
      id: 'sleep_quality',
      label_key: 'assessment.sleep.dimension.sleep_quality',
      icon: '🌙',
      weight: 0.40,
      min_confidence: 35,
      scoring_rule: {
        type: 'composite_weighted',
        rules: [
          {
            weight: 0.65,
            rule: {
              // sleep_hours: optimal 7–9, warning <6 or >10
              type: 'signal_value_threshold',
              metric: 'sleep_hours',
              thresholds: [
                { max: 4.9,  score: 15,  label: 'Severely insufficient' },
                { max: 5.9,  score: 35,  label: 'Insufficient' },
                { max: 6.9,  score: 65,  label: 'Below recommended' },
                { max: 8.0,  score: 100, label: 'Optimal' },
                { max: 9.0,  score: 92,  label: 'Good' },
                { max: 10.0, score: 70,  label: 'Slightly long' },
                { max: 99,   score: 40,  label: 'Excessive' },
              ],
            },
          },
          {
            weight: 0.35,
            rule: {
              type: 'signal_status_map',
              metric: 'sleep_quality_subjective',
              status_scores: {
                optimal:  100,
                normal:   75,
                warning:  40,
                critical: 15,
                unknown:  50,
              },
            },
          },
        ],
      },
    },

    {
      id: 'recovery',
      label_key: 'assessment.sleep.dimension.recovery',
      icon: '⚡',
      weight: 0.35,
      min_confidence: 20,
      scoring_rule: {
        type: 'signal_status_map',
        metric: 'recovery_score',
        status_scores: {
          optimal:  100,
          normal:   78,
          warning:  45,
          critical: 18,
          unknown:  50,
        },
      },
    },

    {
      id: 'lifestyle_impact',
      label_key: 'assessment.sleep.dimension.lifestyle_impact',
      icon: '🔗',
      weight: 0.25,
      min_confidence: 15,
      scoring_rule: {
        // Sleep affects BMI — if BMI is elevated + sleep is poor, lifestyle_impact is low
        type: 'composite_weighted',
        rules: [
          {
            weight: 0.60,
            rule: {
              type: 'signal_presence',
              metric: 'sleep_hours',
              score_if_present: 80,
              score_if_absent: 40,
            },
          },
          {
            weight: 0.40,
            rule: {
              type: 'signal_status_map',
              metric: 'bmi',
              status_scores: {
                optimal:  90,
                normal:   75,
                warning:  50,
                critical: 25,
                unknown:  60,
              },
            },
          },
        ],
      },
    },
  ],

  insight_rules: [
    {
      id: 'achievement_optimal_sleep',
      condition: { type: 'dimension_score_above', dimension: 'sleep_quality', threshold: 85 },
      insight: {
        type: 'achievement',
        priority: 1,
        title_key: 'assessment.sleep.insight.optimal_sleep.title',
        body_key: 'assessment.sleep.insight.optimal_sleep.body',
        params_from_signals: ['sleep_hours'],
      },
    },
    {
      id: 'warning_chronic_sleep_debt',
      condition: {
        type: 'signal_value_below',
        metric: 'sleep_hours',
        value: 6,
      },
      insight: {
        type: 'warning',
        priority: 1,
        title_key: 'assessment.sleep.insight.chronic_debt.title',
        body_key: 'assessment.sleep.insight.chronic_debt.body',
        params_from_signals: ['sleep_hours'],
      },
    },
    {
      id: 'opportunity_improve_consistency',
      condition: {
        type: 'signal_status',
        metric: 'sleep_consistency',
        status: 'warning',
      },
      insight: {
        type: 'opportunity',
        priority: 2,
        title_key: 'assessment.sleep.insight.consistency.title',
        body_key: 'assessment.sleep.insight.consistency.body',
      },
    },
    {
      id: 'opportunity_weight_sleep_link',
      condition: {
        type: 'and',
        conditions: [
          { type: 'signal_value_above', metric: 'bmi', value: 27 },
          { type: 'dimension_score_below', dimension: 'sleep_quality', threshold: 65 },
        ],
      },
      insight: {
        type: 'opportunity',
        priority: 2,
        title_key: 'assessment.sleep.insight.weight_sleep_link.title',
        body_key: 'assessment.sleep.insight.weight_sleep_link.body',
        params_from_signals: ['bmi', 'sleep_hours'],
      },
    },
  ],

  narrative: {
    headline_by_tier: {
      excellent: 'assessment.sleep.headline.excellent',
      good:      'assessment.sleep.headline.good',
      fair:      'assessment.sleep.headline.fair',
      poor:      'assessment.sleep.headline.poor',
    },
    profile_classifiers: [
      {
        id: 'strong_sleeper',
        condition: { type: 'overall_score_above', threshold: 80 },
        label_key: 'assessment.sleep.profile.strong_sleeper.label',
        description_key: 'assessment.sleep.profile.strong_sleeper.description',
      },
      {
        id: 'sleep_deprived',
        condition: { type: 'signal_value_below', metric: 'sleep_hours', value: 6 },
        label_key: 'assessment.sleep.profile.sleep_deprived.label',
        description_key: 'assessment.sleep.profile.sleep_deprived.description',
      },
    ],
    max_key_points: 3,
    cta: {
      high_score: {
        label_key: 'assessment.sleep.cta.high_score',
        product_id: 'sleep-planner',
      },
      low_score: {
        label_key: 'assessment.sleep.cta.low_score',
        product_id: 'sleep-calculator',
      },
    },
  },

  recommendation_hooks: [
    {
      condition: { type: 'overall_score_below', threshold: 55 },
      boost_product: 'sleep-calculator',
      score_boost: 20,
      reason: 'Low sleep score — more sleep data would improve assessment',
    },
    {
      condition: { type: 'overall_score_above', threshold: 50 },
      boost_product: 'registration',
      score_boost: 22,
      reason: 'Sleep assessment completed — save your Wellness Profile',
    },
  ],

  output_signals: [
    {
      metric: 'sleep_assessment_score',
      domain: 'sleep',
      value_from: 'overall_score',
      unit: 'score/100',
      confidence_contribution: 15,
    },
  ],

  ai_context_fields: [
    { include: 'overall_score' },
    { include: 'profile_type' },
    { include: 'top_priority_action' },
    { include: 'dimension_scores' },
    { include: 'insights' },
    { include: 'data_sources' },
    { include: 'missing_signals' },
  ],
}
