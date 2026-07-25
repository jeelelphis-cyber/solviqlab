'use client'

// ─────────────────────────────────────────────────────────────────────────────
// JourneyExperience — V4-2 World-Class Journey Experience
//
// Transforms every calculator result from "a number" into the start of a
// personalized journey. Built to Journey UX Bible v1.0 standard.
//
// Design principles:
//  • Companion Principle — user feels someone is paying attention
//  • 10-second window — user understands phase + next step instantly
//  • Single Next Step — never two options, never a menu
//  • Progress Bias — "33% closer" not "Step 2 of 6"
//  • CTA Formula — [Action verb] + [Personal benefit]
//
// Reads ONLY from: runtime.userEngine.getIntentState(cluster) — P-16 compliance
// No engines called directly. No LLM. Works for all Intent Clusters.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { getBrowserRuntime }                from '@/lib/runtime/platform'
import type { IntentState, IntentPhase }    from '@/lib/domain/intent-state'
import { ASSESSMENT_SLUGS }                 from '@/lib/domain/intent-state'
import type { IntentCluster }               from '@/lib/assessment/types'

import { JourneyBadge }    from './JourneyBadge'
import { JourneyHero }     from './JourneyHero'
import { JourneyCard }     from './JourneyCard'
import { JourneyCTA }      from './JourneyCTA'
import { JourneyProgress } from './JourneyProgress'
import { JourneyUnlock }   from './JourneyUnlock'
import { getJourneyStrings }   from '@/lib/journey/strings'
import { localizeJourneyName } from '@/lib/journey/localize'

import {
  TIME_ESTIMATE,
  getJourneyCopy,
} from './journey-copy'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  readonly cluster: IntentCluster
  readonly lang: string
  readonly currentSlug: string
  readonly suggestedSlug?: string | null
  readonly suggestedName?: string | null
}

// ── Platform events that trigger a state refresh ──────────────────────────────

const PLATFORM_EVENTS = [
  'platform:intent_state_updated',
  'platform:recommendation_updated',
  'solviqlab:result',
] as const

// Cross-cluster: slug is an assessment for a DIFFERENT cluster (e.g. 'finance-assessment' on a weight page)
function isCrossClusterSlug(slug: string | null, currentCluster: IntentCluster): boolean {
  if (!slug) return false
  return ASSESSMENT_SLUGS.has(slug) && !slug.startsWith(currentCluster)
}

// ── Routing helpers ───────────────────────────────────────────────────────────

function buildNextHref(
  slug: string | null,
  cluster: IntentCluster,
  phase: IntentPhase,
  lang: string,
): string {
  if (phase === 'assessment') return `/${lang}/assessment/${cluster}`
  if (phase === 'planning')   return `/${lang}/plan/${cluster}`
  if (!slug) return `/${lang}/assessment/${cluster}`
  if (ASSESSMENT_SLUGS.has(slug)) {
    return `/${lang}/assessment/${slug.replace('-assessment', '')}`
  }
  return `/${lang}/calculators/${slug}`
}

function buildNextName(
  slug: string | null,
  phase: IntentPhase,
  name: string | null,
  cluster: IntentCluster,
  fallback: string,
  clusterName: string,
): string {
  if (phase === 'planning')   return 'Set Your Goal'
  if (phase === 'assessment') return clusterName
  if (!slug) return fallback
  return name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── JourneyExperience ─────────────────────────────────────────────────────────

export function JourneyExperience({ cluster, lang, currentSlug, suggestedSlug, suggestedName }: Props) {
  const s    = getJourneyStrings(lang)
  const copy = getJourneyCopy(lang)
  const [intent,  setIntent]  = useState<IntentState | null>(null)
  const [visible, setVisible] = useState(false)

  const refresh = useCallback(() => {
    const runtime = getBrowserRuntime()
    const state   = runtime.userEngine.getIntentState(cluster)
    if (!state || state.completedInstruments.length === 0) return
    setIntent(state)
    setVisible(true)
  }, [cluster])

  useEffect(() => {
    refresh()
    PLATFORM_EVENTS.forEach(e => window.addEventListener(e, refresh))
    return () => PLATFORM_EVENTS.forEach(e => window.removeEventListener(e, refresh))
  }, [refresh])

  if (!visible || !intent) return null

  const phase    = intent.currentPhase
  const decision = intent.recommendationDecision
  const count    = intent.completedInstruments.length

  const rawDecisionSlug = decision?.slug ?? null
  const crossCluster    = isCrossClusterSlug(rawDecisionSlug, cluster)
  const nextSlug        = crossCluster ? (suggestedSlug ?? null) : rawDecisionSlug
  const rawName         = crossCluster ? (suggestedName ?? null) : (decision?.name ?? null)
  const localName       = rawName ? localizeJourneyName(rawName, lang) : null
  const nextName        = buildNextName(nextSlug, phase, localName, cluster, s.nextStepBadge, copy.clusterAssessmentName[cluster])
  const nextHref        = buildNextHref(nextSlug, cluster, phase, lang)
  const nextTime        = TIME_ESTIMATE[nextSlug ?? ''] ?? TIME_ESTIMATE[`${cluster}-assessment`] ?? '3 min'

  return (
    <div
      className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700
                 bg-white dark:bg-slate-900 overflow-hidden
                 animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      {/* ── Phase Badge ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <JourneyBadge
          phase={phase}
          label={copy.phaseLabel[phase]}
          stepsLabel={copy.stepsCompleted(count)}
        />
      </div>

      <div className="p-5 space-y-5">

        {/* ── Hero Statement ───────────────────────────────────────────────── */}
        {/* Per UX Bible Part II — Emotional Arc: warm acknowledgment → momentum */}
        <JourneyHero
          hero={copy.phaseHero[phase]}
          sub={copy.buildHeroSub(intent)}
        />

        {/* ── Next Step Card ───────────────────────────────────────────────── */}
        {/* Per UX Bible Part III — Single Next Step Principle: exactly ONE option */}
        <JourneyCard>

          {/* Step name + time estimate */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {s.nextStepBadge}
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {nextName}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400
                             bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                             px-2.5 py-1 rounded-full font-medium">
              {nextTime}
            </span>
          </div>

          {/* Why this step — data-specific, per UX Bible Part VII */}
          {/* Formula: "Without [X], we can't build [Y] that accounts for [Z]." */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed
                        border-l-2 border-slate-300 dark:border-slate-600 pl-3">
            {copy.buildWhyThis(intent)}
          </p>

          {/* CTA — why-now hook + action button */}
          <JourneyCTA
            whyNow={copy.whyNow[phase]}
            ctaLabel={copy.ctaPrimary[phase]}
            href={nextHref}
          />

        </JourneyCard>

        {/* ── Progress ─────────────────────────────────────────────────────── */}
        {/* Per UX Bible: "You're 33% closer" not "Step 2 of 6" */}
        <JourneyProgress
          step={Math.min(count, 6)}
          total={6}
          progressLabel={copy.progressText(Math.min(count, 6), 6)}
        />

        {/* ── Unlock Preview ───────────────────────────────────────────────── */}
        {/* Per UX Bible Part III — Unlock Mechanic: preview what's earned */}
        <JourneyUnlock steps={copy.phaseUnlock[phase]} afterThisLabel={copy.afterThis} />

      </div>
    </div>
  )
}
