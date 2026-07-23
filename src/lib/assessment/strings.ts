// ── Assessment EN strings ─────────────────────────────────────────────────────
// Maps i18n keys used in AssessmentConfig to English text.
// Full i18n (via instrument JSON files) is a later sprint.

const STRINGS: Readonly<Record<string, string>> = {
  // ── Weight Assessment — Headlines ──────────────────────────────────────────
  'assessment.weight.headline.excellent': 'Your weight profile looks excellent',
  'assessment.weight.headline.good':      'Your weight profile is in good shape',
  'assessment.weight.headline.fair':      'Your weight profile has room to improve',
  'assessment.weight.headline.poor':      'Your weight profile needs attention',

  // ── Weight Assessment — Dimensions ─────────────────────────────────────────
  'assessment.weight.dimension.body_composition': 'Body Composition',
  'assessment.weight.dimension.metabolism':       'Metabolism',
  'assessment.weight.dimension.nutrition':        'Nutrition',
  'assessment.weight.dimension.lifestyle':        'Lifestyle & Activity',

  // ── Weight Assessment — Profile Types ──────────────────────────────────────
  'assessment.weight.profile.lean_and_active.label':           'Lean & Active',
  'assessment.weight.profile.lean_and_active.description':     'Your body composition and metabolic rate are both strong. You\'re in the optimal zone.',
  'assessment.weight.profile.metabolically_slow.label':        'Metabolically Slow',
  'assessment.weight.profile.metabolically_slow.description':  'Your body composition is reasonable, but your metabolism is running below its potential. Increasing activity frequency can help.',
  'assessment.weight.profile.weight_loss_focus.label':         'Weight Loss Focus',
  'assessment.weight.profile.weight_loss_focus.description':   'You\'re in an active weight loss phase. Your data shows you\'re on a plan — consistency is the key.',
  'assessment.weight.profile.building_awareness.label':        'Building Awareness',
  'assessment.weight.profile.building_awareness.description':  'You\'re early in understanding your body\'s metrics. Each additional data point will sharpen your picture.',

  // ── Weight Assessment — Insights ───────────────────────────────────────────
  'assessment.weight.insight.healthy_composition.title':   'Healthy body composition',
  'assessment.weight.insight.healthy_composition.body':    'Your BMI of {{bmi}} and body fat percentage of {{body_fat_percent}}% are both in the healthy range. This is a strong foundation.',
  'assessment.weight.insight.dual_risk.title':             'Elevated weight and fat risk',
  'assessment.weight.insight.dual_risk.body':              'Both your BMI ({{bmi}}) and body fat percentage ({{body_fat_percent}}%) are above recommended ranges. Addressing both through consistent deficit and activity gives the best outcome.',
  'assessment.weight.insight.slow_metabolism.title':       'Metabolism is below potential',
  'assessment.weight.insight.slow_metabolism.body':        'Your BMR of {{bmr_kcal}} kcal and TDEE of {{tdee_kcal}} kcal suggest your metabolism is running below its potential. Strength training and consistent meal timing can help.',
  'assessment.weight.insight.aggressive_deficit.title':    'Calorie deficit may be too aggressive',
  'assessment.weight.insight.aggressive_deficit.body':     'A deficit of {{daily_deficit_kcal}} kcal/day risks muscle loss and metabolic adaptation. Consider reducing to 400–600 kcal/day for sustainable results.',
  'assessment.weight.insight.add_activity.title':          'Increasing activity would accelerate progress',
  'assessment.weight.insight.add_activity.body':           'Your current activity level is the main limiter. Even adding 30 minutes of walking daily can improve your TDEE by 200–300 kcal.',
  'assessment.weight.insight.strong_metabolism.title':     'Strong metabolic rate',
  'assessment.weight.insight.strong_metabolism.body':      'Your TDEE of {{tdee_kcal}} kcal and BMR of {{bmr_kcal}} kcal show a healthy, active metabolism. This gives you flexibility in your nutrition approach.',
  'assessment.weight.insight.complete_nutrition.title':    'Add calorie target for better accuracy',
  'assessment.weight.insight.complete_nutrition.body':     'Completing the Calorie Deficit Calculator would give your nutrition dimension a precise target and improve this assessment\'s accuracy.',
  'assessment.weight.insight.overall_fair.title':          'More data will sharpen your picture',
  'assessment.weight.insight.overall_fair.body':           'Your current score reflects the data available so far. Completing your remaining weight instruments will give a significantly more accurate profile.',

  // ── Weight Assessment — Questions ──────────────────────────────────────────
  'assessment.weight.question.goal':                  'What is your primary weight goal?',
  'assessment.weight.question.goal.lose':             'Lose weight',
  'assessment.weight.question.goal.maintain':         'Maintain current weight',
  'assessment.weight.question.goal.build':            'Build muscle',
  'assessment.weight.question.activity':              'What type of activity do you prefer?',
  'assessment.weight.question.activity.gym':          'Gym workouts',
  'assessment.weight.question.activity.home':         'Home workouts',
  'assessment.weight.question.activity.outdoor':      'Outdoor activities',
  'assessment.weight.question.activity.none':         'No regular activity yet',

  // ── Weight Assessment — CTA ────────────────────────────────────────────────
  'assessment.weight.cta.high_score': 'Build my weight loss plan →',
  'assessment.weight.cta.low_score':  'Complete my metabolic data →',

  // ── Sleep Assessment — Headlines ───────────────────────────────────────────
  'assessment.sleep.headline.excellent': 'Your sleep profile is excellent',
  'assessment.sleep.headline.good':      'Your sleep profile is in good shape',
  'assessment.sleep.headline.fair':      'Your sleep has room to improve',
  'assessment.sleep.headline.poor':      'Your sleep needs attention',

  // ── Sleep Assessment — Dimensions ──────────────────────────────────────────
  'assessment.sleep.dimension.sleep_quality':    'Sleep Quality',
  'assessment.sleep.dimension.recovery':         'Recovery',
  'assessment.sleep.dimension.lifestyle_impact': 'Lifestyle Impact',

  // ── Sleep Assessment — Profile Types ───────────────────────────────────────
  'assessment.sleep.profile.strong_sleeper.label':        'Strong Sleeper',
  'assessment.sleep.profile.strong_sleeper.description':  'Your sleep patterns are solid. Focus on maintaining consistency.',
  'assessment.sleep.profile.sleep_deprived.label':        'Sleep Deprived',
  'assessment.sleep.profile.sleep_deprived.description':  'Chronic sleep deprivation is affecting your health metrics. Prioritizing sleep will improve everything else.',

  // ── Sleep Assessment — Insights ────────────────────────────────────────────
  'assessment.sleep.insight.optimal_sleep.title':     'Sleep duration is optimal',
  'assessment.sleep.insight.optimal_sleep.body':      'You\'re averaging {{sleep_hours}} hours of sleep — right in the 7–9 hour sweet spot. This supports optimal recovery and metabolic health.',
  'assessment.sleep.insight.chronic_debt.title':      'Chronic sleep debt detected',
  'assessment.sleep.insight.chronic_debt.body':       'Averaging {{sleep_hours}} hours is significantly below the 7–9 hour recommendation. Chronic sleep debt elevates cortisol, impairs fat loss, and reduces cognitive performance.',
  'assessment.sleep.insight.consistency.title':       'Sleep schedule consistency matters',
  'assessment.sleep.insight.consistency.body':        'Inconsistent sleep timing disrupts your circadian rhythm even when total hours are adequate. Try to wake within 30 minutes of the same time daily.',
  'assessment.sleep.insight.weight_sleep_link.title': 'Sleep is affecting your weight',
  'assessment.sleep.insight.weight_sleep_link.body':  'With a BMI of {{bmi}} and sleep of {{sleep_hours}} hours, improving sleep quality may accelerate weight management more than further caloric restriction.',

  // ── Sleep Assessment — Questions ───────────────────────────────────────────
  'assessment.sleep.question.quality':                          'How would you rate your sleep quality overall?',
  'assessment.sleep.question.quality.poor':                     'Poor — I wake up tired',
  'assessment.sleep.question.quality.fair':                     'Fair — sometimes rested',
  'assessment.sleep.question.quality.good':                     'Good — usually rested',
  'assessment.sleep.question.quality.excellent':                'Excellent — consistently rested',
  'assessment.sleep.question.consistency':                      'How consistent is your sleep schedule?',
  'assessment.sleep.question.consistency.very_inconsistent':    'Very inconsistent',
  'assessment.sleep.question.consistency.inconsistent':         'Mostly inconsistent',
  'assessment.sleep.question.consistency.mostly_consistent':    'Mostly consistent',
  'assessment.sleep.question.consistency.consistent':           'Very consistent',

  // ── Sleep Assessment — CTA ─────────────────────────────────────────────────
  'assessment.sleep.cta.high_score': 'Create my sleep plan →',
  'assessment.sleep.cta.low_score':  'Improve my sleep data →',

  // ── Gate Messages ─────────────────────────────────────────────────────────
  'assessment.gate.need_more_instruments': 'Complete a few more calculators to unlock this assessment.',
  'assessment.gate.need_domain_data':      'Complete the recommended calculators to build enough data for your assessment.',
}

/** Resolve an i18n key, with optional signal value interpolation. */
export function resolveString(key: string, params?: Readonly<Record<string, string | number>>): string {
  const template = STRINGS[key] ?? key
  if (!params) return template
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''))
}

/** Resolve tier: score → tier label key. */
export function scoreTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}
