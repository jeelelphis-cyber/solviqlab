import type { CoachReason, CoachTemplate } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Coach Copy — all trigger templates, organized by language
//
// Sprint 1: assessment:completed — {{score}}, {{dimension}}, {{strategy}}, {{cluster_label}}
// Sprint 2: plan:created         — {{goal}}, {{duration_weeks}}, {{strategy}}, {{cluster_label}}
// Sprint 3: plan:check_in        — {{week}}, {{deviation}}, {{on_track_weeks}}, {{cluster_label}}
//
// Rule: English is the source of truth. Other locales fall back to EN.
// Rule: NO English strings outside this file or coach-i18n.ts.
// ─────────────────────────────────────────────────────────────────────────────

type CoachCopyMap = Partial<Record<CoachReason, CoachTemplate>>

// ── English ───────────────────────────────────────────────────────────────────

const EN: CoachCopyMap = {
  // assessment:completed
  excellent_score: {
    title:   'Strong foundation. Your data tells a clear story.',
    body:    'Your {{cluster_label}} score is {{score}}/100 — that puts you well ahead. Your plan is built on real signals, not guesswork.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  good_score: {
    title:   'Solid score. One area has room to move.',
    body:    'You scored {{score}}/100. {{dimension}} is your biggest opportunity — and your strategy is already calibrated for it.',
    actions: [{ label: 'See My Strategy', actionId: 'see_strategy', type: 'primary' }],
  },

  missing_dimension: {
    title:   '{{dimension}} is holding you back.',
    body:    'Your overall score is {{score}}/100, but {{dimension}} scored significantly lower. Your strategy focuses there first.',
    actions: [{ label: 'See My Strategy', actionId: 'see_strategy', type: 'primary' }],
  },

  low_score: {
    title:   'Clear starting point. That is actually useful.',
    body:    'A score of {{score}}/100 means we have precise data on what to fix. Your strategy targets the highest-impact area first.',
    actions: [{ label: 'See My Strategy', actionId: 'see_strategy', type: 'primary' }],
  },

  // plan:created
  strategy_match: {
    title:   'Your plan matches your assessment. That is not a coincidence.',
    body:    '{{strategy}} was selected because your data pointed directly to it. {{duration_weeks}} weeks, calibrated to your starting point.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  first_plan: {
    title:   'Your first {{cluster_label}} plan is live.',
    body:    'The system built this around your actual data — not a generic template. Your goal: {{goal}}.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  high_confidence_plan: {
    title:   'High-confidence data. High-confidence plan.',
    body:    'Your assessment had comprehensive data, so your plan has fewer assumptions. {{duration_weeks}} weeks to reach your goal.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  conservative_start: {
    title:   'This plan starts at a pace you can sustain.',
    body:    'A {{duration_weeks}}-week plan built around realistic progress — not a crash course. Consistency beats speed here.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  aggressive_start: {
    title:   'This is an ambitious goal. The plan accounts for that.',
    body:    'Your target requires meaningful change. The {{duration_weeks}}-week plan is built to get you there — with weekly checkpoints to keep you on track.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  // plan:check_in
  on_track: {
    title:   'Week {{week}}. You are exactly where you should be.',
    body:    'Your {{cluster_label}} progress is on target. {{on_track_weeks}} consistent weeks — that is what drives real results.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  off_track: {
    title:   'Week {{week}}. Your plan has been adjusted.',
    body:    'You deviated {{deviation}}% from target this week. Your plan has been recalibrated — the goal stays the same, the path adapts.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },

  milestone_approaching: {
    title:   'A milestone is within reach.',
    body:    'You are close to your Week {{milestone_week}} checkpoint. Keep the current pace through this week.',
    actions: [{ label: 'See My Plan', actionId: 'see_plan', type: 'primary' }],
  },
}

// ── Spanish ───────────────────────────────────────────────────────────────────
// Partial — only overrides that differ significantly in tone. Falls back to EN.

const ES: CoachCopyMap = {
  excellent_score: {
    title:   'Base sólida. Tus datos cuentan una historia clara.',
    body:    'Tu puntuación de {{cluster_label}} es {{score}}/100 — eso te pone muy por delante. Tu plan se basa en señales reales, no en suposiciones.',
    actions: [{ label: 'Ver Mi Plan', actionId: 'see_plan', type: 'primary' }],
  },
  good_score: {
    title:   'Buena puntuación. Hay margen de mejora en un área.',
    body:    'Obtuviste {{score}}/100. {{dimension}} es tu mayor oportunidad — y tu estrategia ya está calibrada para ello.',
    actions: [{ label: 'Ver Mi Estrategia', actionId: 'see_strategy', type: 'primary' }],
  },
}

// ── Other locales (stub — fill in as translations arrive) ─────────────────────
const DE: CoachCopyMap = {}
const FR: CoachCopyMap = {}
const IT: CoachCopyMap = {}
const PT: CoachCopyMap = {}
const UK: CoachCopyMap = {}
const PL: CoachCopyMap = {}
const NL: CoachCopyMap = {}
const TR: CoachCopyMap = {}

const LOCALES: Record<string, CoachCopyMap> = {
  en: EN, es: ES, de: DE, fr: FR, it: IT,
  pt: PT, uk: UK, pl: PL, nl: NL, tr: TR,
}

/** Returns the best available template for a reason in the given language.
 *  Falls back to English if the locale has no entry for that reason. */
export function getCoachCopy(lang: string): CoachCopyMap {
  const locale = LOCALES[lang]
  if (!locale || locale === EN) return EN
  // Merge: locale overrides on top of EN base
  return { ...EN, ...locale }
}

// ── Interpolation ─────────────────────────────────────────────────────────────

export function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key]
    return val !== undefined && val !== null ? String(val) : ''
  })
}
