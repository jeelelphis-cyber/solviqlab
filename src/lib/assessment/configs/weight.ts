// ─────────────────────────────────────────────────────────────────────────────
// Weight Management Intent Cluster — Assessment Configuration
//
// This is the FIRST configuration for the Universal Assessment Engine.
// It is pure data — no functions, no business logic.
//
// The AssessmentEngine interprets this config.
// This file only describes WHAT to assess and HOW to score it.
//
// Dimensions (total weight must = 1.0):
//   body_composition  0.35  — BMI + Body Fat
//   metabolism        0.30  — BMR + TDEE
//   nutrition         0.20  — Calorie balance
//   lifestyle         0.15  — Activity + consistency
// ─────────────────────────────────────────────────────────────────────────────

import type { AssessmentConfig } from '../types'

export const weightAssessmentConfig: AssessmentConfig = {
  id: 'weight-assessment',
  cluster: 'weight',
  version: 1,
  schema_version: 1,

  // ── Trigger ─────────────────────────────────────────────────────────────────
  trigger: {
    required_domains: [
      { domain: 'weight',    min_confidence: 25 },
      { domain: 'metabolism', min_confidence: 20 },
    ],
    min_instruments_completed: 3,
  },

  // ── Gap Questions ────────────────────────────────────────────────────────────
  // Asked only if the signal is absent from Profile.
  // Max 3 to minimize friction.
  gap_questions: [
    {
      id: 'goal',
      type: 'select',
      label_key: 'assessment.weight.question.goal',
      required: true,
      ask_if_signal_absent: 'weight_goal',
      options: [
        { value: 'lose_weight',    label_key: 'assessment.weight.question.goal.lose' },
        { value: 'maintain',       label_key: 'assessment.weight.question.goal.maintain' },
        { value: 'build_muscle',   label_key: 'assessment.weight.question.goal.build' },
      ],
    },
    {
      id: 'activity_preference',
      type: 'select',
      label_key: 'assessment.weight.question.activity',
      required: false,
      ask_if_signal_absent: 'activity_preference',
      options: [
        { value: 'gym',     label_key: 'assessment.weight.question.activity.gym' },
        { value: 'home',    label_key: 'assessment.weight.question.activity.home' },
        { value: 'outdoor', label_key: 'assessment.weight.question.activity.outdoor' },
        { value: 'none',    label_key: 'assessment.weight.question.activity.none' },
      ],
    },
  ],

  // ── Dimensions ───────────────────────────────────────────────────────────────
  // Weights sum: 0.35 + 0.30 + 0.20 + 0.15 = 1.00
  dimensions: [
    {
      id: 'body_composition',
      label_key: 'assessment.weight.dimension.body_composition',
      icon: '⚖️',
      weight: 0.35,
      min_confidence: 25,
      scoring_rule: {
        type: 'composite_weighted',
        rules: [
          {
            weight: 0.50,
            rule: {
              type: 'signal_value_threshold',
              metric: 'bmi',
              thresholds: [
                { max: 16.0, score: 15,  label: 'Severe underweight' },
                { max: 18.4, score: 50,  label: 'Underweight' },
                { max: 24.9, score: 100, label: 'Normal' },
                { max: 27.4, score: 78,  label: 'Slightly overweight' },
                { max: 29.9, score: 55,  label: 'Overweight' },
                { max: 34.9, score: 30,  label: 'Obese I' },
                { max: 999,  score: 15,  label: 'Obese II+' },
              ],
            },
          },
          {
            weight: 0.50,
            rule: {
              type: 'signal_value_threshold',
              metric: 'body_fat_percent',
              gender_variant: {
                male: [
                  { max: 5,   score: 40,  label: 'Essential fat' },
                  { max: 13,  score: 100, label: 'Athlete' },
                  { max: 17,  score: 90,  label: 'Fitness' },
                  { max: 24,  score: 70,  label: 'Acceptable' },
                  { max: 999, score: 25,  label: 'Obese' },
                ],
                female: [
                  { max: 13,  score: 40,  label: 'Essential fat' },
                  { max: 20,  score: 100, label: 'Athlete' },
                  { max: 24,  score: 90,  label: 'Fitness' },
                  { max: 31,  score: 70,  label: 'Acceptable' },
                  { max: 999, score: 25,  label: 'Obese' },
                ],
              },
            },
          },
        ],
      },
    },

    {
      id: 'metabolism',
      label_key: 'assessment.weight.dimension.metabolism',
      icon: '🔥',
      weight: 0.30,
      min_confidence: 20,
      scoring_rule: {
        type: 'composite_weighted',
        rules: [
          {
            weight: 0.55,
            rule: {
              // TDEE / BMR ratio reflects activity multiplier health
              // Sedentary (1.2) = 65 pts, Active (1.55+) = 95 pts
              type: 'signal_value_threshold',
              metric: 'tdee_kcal',
              thresholds: [
                { max: 1400, score: 40,  label: 'Very low TDEE' },
                { max: 1800, score: 65,  label: 'Sedentary range' },
                { max: 2200, score: 80,  label: 'Light activity' },
                { max: 2800, score: 92,  label: 'Moderate activity' },
                { max: 3400, score: 95,  label: 'Active' },
                { max: 9999, score: 90,  label: 'Very active' },
              ],
            },
          },
          {
            weight: 0.45,
            rule: {
              type: 'signal_status_map',
              metric: 'bmr_kcal',
              status_scores: {
                optimal:  100,
                normal:   80,
                warning:  45,
                critical: 20,
                unknown:  50,
              },
            },
          },
        ],
      },
    },

    {
      id: 'nutrition',
      label_key: 'assessment.weight.dimension.nutrition',
      icon: '🥗',
      weight: 0.20,
      min_confidence: 15,
      scoring_rule: {
        type: 'composite_weighted',
        rules: [
          {
            weight: 0.60,
            rule: {
              type: 'signal_status_map',
              metric: 'daily_deficit_kcal',
              status_scores: {
                optimal:  95,   // deficit in healthy range (300–600 kcal)
                normal:   78,
                warning:  40,   // too aggressive or too low
                critical: 15,
                unknown:  55,
              },
            },
          },
          {
            weight: 0.40,
            rule: {
              type: 'signal_presence',
              metric: 'daily_calories_target',
              score_if_present: 90,
              score_if_absent:  45,
            },
          },
        ],
      },
    },

    {
      id: 'lifestyle',
      label_key: 'assessment.weight.dimension.lifestyle',
      icon: '🏃',
      weight: 0.15,
      min_confidence: 15,
      scoring_rule: {
        type: 'signal_status_map',
        metric: 'activity_level',
        status_scores: {
          optimal:  95,
          normal:   75,
          warning:  45,
          critical: 20,
          unknown:  50,
        },
      },
    },
  ],

  // ── Insight Rules ────────────────────────────────────────────────────────────
  insight_rules: [
    {
      id: 'achievement_healthy_composition',
      condition: {
        type: 'and',
        conditions: [
          { type: 'signal_value_range', metric: 'bmi', min: 18.5, max: 24.9 },
          { type: 'dimension_score_above', dimension: 'body_composition', threshold: 80 },
        ],
      },
      insight: {
        type: 'achievement',
        priority: 1,
        title_key: 'assessment.weight.insight.healthy_composition.title',
        body_key: 'assessment.weight.insight.healthy_composition.body',
        params_from_signals: ['bmi', 'body_fat_percent'],
      },
    },

    {
      id: 'warning_dual_risk',
      condition: {
        type: 'and',
        conditions: [
          { type: 'signal_value_above', metric: 'bmi', value: 29.9 },
          { type: 'dimension_score_below', dimension: 'body_composition', threshold: 40 },
        ],
      },
      insight: {
        type: 'warning',
        priority: 1,
        title_key: 'assessment.weight.insight.dual_risk.title',
        body_key: 'assessment.weight.insight.dual_risk.body',
        params_from_signals: ['bmi', 'body_fat_percent'],
      },
    },

    {
      id: 'opportunity_slow_metabolism',
      condition: { type: 'dimension_score_below', dimension: 'metabolism', threshold: 55 },
      insight: {
        type: 'opportunity',
        priority: 2,
        title_key: 'assessment.weight.insight.slow_metabolism.title',
        body_key: 'assessment.weight.insight.slow_metabolism.body',
        params_from_signals: ['bmr_kcal', 'tdee_kcal'],
      },
    },

    {
      id: 'warning_aggressive_deficit',
      condition: {
        type: 'signal_status',
        metric: 'daily_deficit_kcal',
        status: 'critical',
      },
      insight: {
        type: 'warning',
        priority: 1,
        title_key: 'assessment.weight.insight.aggressive_deficit.title',
        body_key: 'assessment.weight.insight.aggressive_deficit.body',
        params_from_signals: ['daily_deficit_kcal'],
      },
    },

    {
      id: 'opportunity_add_activity',
      condition: {
        type: 'and',
        conditions: [
          { type: 'dimension_score_below', dimension: 'lifestyle', threshold: 60 },
          { type: 'dimension_score_above', dimension: 'body_composition', threshold: 40 },
        ],
      },
      insight: {
        type: 'opportunity',
        priority: 2,
        title_key: 'assessment.weight.insight.add_activity.title',
        body_key: 'assessment.weight.insight.add_activity.body',
      },
    },

    {
      id: 'achievement_strong_metabolism',
      condition: { type: 'dimension_score_above', dimension: 'metabolism', threshold: 85 },
      insight: {
        type: 'achievement',
        priority: 2,
        title_key: 'assessment.weight.insight.strong_metabolism.title',
        body_key: 'assessment.weight.insight.strong_metabolism.body',
        params_from_signals: ['tdee_kcal', 'bmr_kcal'],
      },
    },

    {
      id: 'opportunity_complete_nutrition',
      condition: { type: 'signal_absent', metric: 'daily_calories_target' },
      insight: {
        type: 'opportunity',
        priority: 3,
        title_key: 'assessment.weight.insight.complete_nutrition.title',
        body_key: 'assessment.weight.insight.complete_nutrition.body',
      },
    },

    {
      id: 'opportunity_overall_fair',
      condition: { type: 'overall_score_below', threshold: 55 },
      insight: {
        type: 'opportunity',
        priority: 3,
        title_key: 'assessment.weight.insight.overall_fair.title',
        body_key: 'assessment.weight.insight.overall_fair.body',
      },
    },
  ],

  // ── Narrative ────────────────────────────────────────────────────────────────
  narrative: {
    headline_by_tier: {
      excellent: 'assessment.weight.headline.excellent',
      good:      'assessment.weight.headline.good',
      fair:      'assessment.weight.headline.fair',
      poor:      'assessment.weight.headline.poor',
    },
    profile_classifiers: [
      {
        id: 'lean_and_active',
        condition: {
          type: 'and',
          conditions: [
            { type: 'dimension_score_above', dimension: 'body_composition', threshold: 80 },
            { type: 'dimension_score_above', dimension: 'metabolism', threshold: 80 },
          ],
        },
        label_key: 'assessment.weight.profile.lean_and_active.label',
        description_key: 'assessment.weight.profile.lean_and_active.description',
      },
      {
        id: 'metabolically_slow',
        condition: {
          type: 'and',
          conditions: [
            { type: 'dimension_score_below', dimension: 'metabolism', threshold: 55 },
            { type: 'dimension_score_above', dimension: 'body_composition', threshold: 50 },
          ],
        },
        label_key: 'assessment.weight.profile.metabolically_slow.label',
        description_key: 'assessment.weight.profile.metabolically_slow.description',
      },
      {
        id: 'weight_loss_focus',
        condition: {
          type: 'and',
          conditions: [
            { type: 'signal_value_above', metric: 'bmi', value: 27.4 },
            { type: 'signal_present', metric: 'daily_deficit_kcal' },
          ],
        },
        label_key: 'assessment.weight.profile.weight_loss_focus.label',
        description_key: 'assessment.weight.profile.weight_loss_focus.description',
      },
      {
        id: 'building_awareness',
        condition: { type: 'overall_score_below', threshold: 55 },
        label_key: 'assessment.weight.profile.building_awareness.label',
        description_key: 'assessment.weight.profile.building_awareness.description',
      },
    ],
    max_key_points: 3,
    cta: {
      high_score: {
        label_key: 'assessment.weight.cta.high_score',
        product_id: 'weight-loss-planner',
      },
      low_score: {
        label_key: 'assessment.weight.cta.low_score',
        product_id: 'tdee-calculator',
      },
    },
  },

  // ── Recommendation Hooks ─────────────────────────────────────────────────────
  recommendation_hooks: [
    {
      condition: { type: 'dimension_score_below', dimension: 'metabolism', threshold: 55 },
      boost_product: 'tdee-calculator',
      score_boost: 18,
      reason: 'Low metabolism score — TDEE data would improve assessment accuracy',
    },
    {
      condition: { type: 'signal_absent', metric: 'body_fat_percent' },
      boost_product: 'body-fat-calculator',
      score_boost: 22,
      reason: 'Body composition dimension incomplete — body fat data needed',
    },
    {
      condition: { type: 'signal_absent', metric: 'daily_deficit_kcal' },
      boost_product: 'calorie-deficit-calculator',
      score_boost: 15,
      reason: 'No deficit target set — Calorie Deficit Calculator would complete nutrition picture',
    },
    {
      condition: { type: 'overall_score_above', threshold: 55 },
      boost_product: 'weight-loss-planner',
      score_boost: 30,
      reason: 'Assessment complete — Weight Loss Planner is logical next action',
    },
    {
      condition: { type: 'overall_score_above', threshold: 40 },
      boost_product: 'registration',
      score_boost: 25,
      reason: 'High-value assessment completed — ideal moment to save Weight Profile',
    },
  ],

  // ── Output Signals ────────────────────────────────────────────────────────────
  output_signals: [
    {
      metric: 'weight_assessment_score',
      domain: 'weight',
      value_from: 'overall_score',
      unit: 'score/100',
      confidence_contribution: 20,
    },
    {
      metric: 'body_composition_score',
      domain: 'fitness',
      value_from: 'dimension_score',
      dimension_id: 'body_composition',
      unit: 'score/100',
      confidence_contribution: 10,
    },
  ],

  // ── AI Coach Context Fields ──────────────────────────────────────────────────
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
