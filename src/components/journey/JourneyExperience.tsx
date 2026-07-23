'use client'

// ─────────────────────────────────────────────────────────────────────────────
// JourneyExperience — V4-1 First Journey Experience
//
// Transforms every calculator result from "a number" into the start of a
// personalized journey. Appears below the calculator after the first result.
//
// Reads ONLY from: runtime.userEngine.getIntentState(cluster) — P-16 compliance
// No engines called directly. No LLM. No new engines introduced.
// Works for any calculator across all Intent Clusters.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import type { IntentState, IntentPhase } from '@/lib/domain/intent-state'
import { ASSESSMENT_SLUGS } from '@/lib/domain/intent-state'
import type { IntentCluster } from '@/lib/assessment/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  readonly cluster: IntentCluster
  readonly lang: string
  readonly currentSlug: string
}

// ── Phase config ──────────────────────────────────────────────────────────────

const PHASE_CONFIG: Record<IntentPhase, {
  icon: string
  label: string
  dotColor: string
  badgeBg: string
  badgeText: string
}> = {
  discovery: {
    icon: '🔍',
    label: 'Building Your Profile',
    dotColor: 'bg-blue-500',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-300',
  },
  assessment: {
    icon: '📋',
    label: 'Ready for Assessment',
    dotColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
    badgeText: 'text-amber-700 dark:text-amber-300',
  },
  planning: {
    icon: '🎯',
    label: 'Strategy Ready',
    dotColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-300',
  },
  execution: {
    icon: '🚀',
    label: 'On Your Journey',
    dotColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  habit: {
    icon: '⭐',
    label: 'Goal Achieved',
    dotColor: 'bg-yellow-500',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800',
    badgeText: 'text-yellow-700 dark:text-yellow-300',
  },
}

// ── What comes after — journey preview ───────────────────────────────────────

const PHASE_PREVIEW: Record<IntentPhase, string[]> = {
  discovery:  ['Assessment', 'Strategy', 'Personal Plan', 'AI Coach'],
  assessment: ['Strategy', 'Personal Plan', 'AI Coach'],
  planning:   ['Personal Plan', 'AI Coach'],
  execution:  ['Weekly Check-ins', 'AI Coach', 'New Goal'],
  habit:      ['New Goal'],
}

// ── Time estimates ─────────────────────────────────────────────────────────────

const TIME_ESTIMATES: Partial<Record<string, string>> = {
  'weight-assessment': '3 min',
  'sleep-assessment':  '3 min',
  'finance-assessment': '3 min',
  'bmi-calculator':     '1 min',
  'calorie-calculator': '2 min',
  'body-fat-calculator':'2 min',
  'ideal-weight-calculator': '1 min',
  'macro-calculator':   '2 min',
  'protein-calculator': '1 min',
  'tdee-calculator':    '2 min',
  'sleep-calculator':   '2 min',
  'savings-calculator': '2 min',
}

// ── Situation text generator (no LLM) ─────────────────────────────────────────

function buildSituation(intent: IntentState, currentSlug: string): string {
  const count = intent.completedInstruments.length
  const { currentPhase, latestAssessment, activePlan } = intent

  if (currentPhase === 'habit' && activePlan) {
    return `You've completed your ${activePlan.goal}. Ready for the next challenge.`
  }
  if (currentPhase === 'execution' && activePlan) {
    const checkIns = activePlan.check_ins.length
    return checkIns > 0
      ? `Week ${checkIns + 1} of your plan — ${activePlan.goal}.`
      : `Your plan is active. First check-in unlocks adaptive coaching.`
  }
  if (currentPhase === 'planning') {
    return `Strategy selected. Set your goal to start your personalized plan.`
  }
  if (currentPhase === 'assessment' && latestAssessment) {
    return `Assessment score: ${latestAssessment.overall_score}/100. Your personal strategy is ready.`
  }
  if (currentPhase === 'assessment') {
    return `You have enough data. A 3-minute assessment reveals your personalized strategy.`
  }
  if (count === 1) {
    return `First data point saved. ${3 - count} more steps to unlock your personal assessment.`
  }
  if (count < 3) {
    return `${count} health metrics collected. ${3 - count} more to unlock your assessment.`
  }
  return `Strong profile with ${count} data points. Assessment ready — takes 3 minutes.`
}

// ── Next step href builder ─────────────────────────────────────────────────────

function buildNextHref(
  slug: string | null,
  cluster: IntentCluster,
  phase: IntentPhase,
  lang: string,
): string {
  // Phase-aware routing
  if (phase === 'assessment') return `/${lang}/assessment/${cluster}`
  if (phase === 'planning')   return `/${lang}/plan/${cluster}`
  if (!slug) return `/${lang}/assessment/${cluster}`
  if (ASSESSMENT_SLUGS.has(slug)) {
    return `/${lang}/assessment/${slug.replace('-assessment', '')}`
  }
  return `/${lang}/calculators/${slug}`
}

function buildNextLabel(slug: string | null, phase: IntentPhase, name: string | null): string {
  if (phase === 'planning') return 'Set Your Goal'
  if (phase === 'assessment') return 'Start Assessment'
  if (!slug) return 'Continue'
  return name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── JourneyExperience ─────────────────────────────────────────────────────────

const PLATFORM_EVENTS = [
  'platform:intent_state_updated',
  'platform:recommendation_updated',
  'solviqlab:result',
] as const

export function JourneyExperience({ cluster, lang, currentSlug }: Props) {
  const [intent,  setIntent]  = useState<IntentState | null>(null)
  const [visible, setVisible] = useState(false)

  const refresh = useCallback(() => {
    const runtime = getBrowserRuntime()
    const state = runtime.userEngine.getIntentState(cluster)
    if (!state) return

    // Only show after user has at least 1 result
    if (state.completedInstruments.length > 0) {
      setIntent(state)
      setVisible(true)
    }
  }, [cluster])

  useEffect(() => {
    refresh()
    PLATFORM_EVENTS.forEach(e => window.addEventListener(e, refresh))
    return () => PLATFORM_EVENTS.forEach(e => window.removeEventListener(e, refresh))
  }, [refresh])

  if (!visible || !intent) return null

  const phase   = intent.currentPhase
  const phConf  = PHASE_CONFIG[phase]
  const decision = intent.recommendationDecision
  const count   = intent.completedInstruments.length

  // Next step data
  const nextSlug   = decision?.slug ?? null
  const nextName   = buildNextLabel(nextSlug, phase, decision?.name ?? null)
  const nextHref   = buildNextHref(nextSlug, cluster, phase, lang)
  const nextTime   = TIME_ESTIMATES[nextSlug ?? ''] ?? TIME_ESTIMATES[`${cluster}-assessment`] ?? '3 min'
  const whyText    = decision?.reasons[0]
    ?? (phase === 'assessment'
        ? `Without this assessment we can't build your personalized ${cluster} plan.`
        : `Each step builds a more accurate picture of your situation.`)

  // Progress — use journey state if available
  const journeyState = intent.completedInstruments.length > 0
    ? null // journey state is in SolviqUser.journey_states — not in IntentState currently
    : null
  const progressStep = count
  const progressTotal = 6  // standard journey length

  const preview = PHASE_PREVIEW[phase]

  return (
    <div
      className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700
                 bg-white dark:bg-slate-900 overflow-hidden
                 animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      {/* ── Header: Phase ───────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${phConf.badgeBg} ${phConf.badgeText}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${phConf.dotColor} animate-pulse`} />
            {phConf.icon} {phConf.label}
          </span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
          {count} {count === 1 ? 'step' : 'steps'} completed
        </span>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Situation: what system understood ───────────────────────────── */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {buildSituation(intent, currentSlug)}
        </p>

        {/* ── Next Step ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">

          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                Next Step
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {nextName}
              </div>
            </div>
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-full">
              {nextTime}
            </span>
          </div>

          {/* Why this step */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-l-2 border-slate-300 dark:border-slate-600 pl-3">
            {whyText}
          </p>

          <a
            href={nextHref}
            className="group flex items-center justify-center gap-2 w-full py-2.5 px-4
                       bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                       rounded-xl transition-colors"
          >
            {nextName}
            <svg
              className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform"
              fill="none" viewBox="0 0 16 16"
            >
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* ── Progress ────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Your Journey
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Step {Math.min(progressStep, progressTotal)} of {progressTotal}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: progressTotal }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  i < progressStep
                    ? 'bg-blue-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── What comes after ────────────────────────────────────────────── */}
        {preview.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider shrink-0">
              After this:
            </span>
            {preview.map((step, i) => (
              <span key={step} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-[10px]">→</span>}
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {step}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
