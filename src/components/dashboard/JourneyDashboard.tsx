'use client'

// ─────────────────────────────────────────────────────────────────────────────
// JourneyDashboard — V4-3 Personal Journey Dashboard
//
// Sections (per CEO spec):
//  1. Hero — personalized greeting + phase
//  2. Today's Action — THE single next step (most prominent)
//  3. Active Plan — plan progress (conditional)
//  4. Journey Progress — "33% closer" + segment bar
//  5. Achievements — what the user has already done
//  6. Coach Card — contextual entry point to AI Coach
//  7. Coach Insight — one data-derived insight
//  8. Other Journeys — quick links to secondary clusters
//
// Reads ONLY from: runtime.userEngine.getIntentState(cluster) — P-16 compliance
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { getBrowserRuntime }                from '@/lib/runtime/platform'
import type { IntentState, IntentPhase }    from '@/lib/domain/intent-state'
import type { IntentCluster }               from '@/lib/assessment/types'
import { getT }                             from '@/lib/i18n/ui'

import { JourneyProgress }        from '@/components/journey/JourneyProgress'
import { getJourneyCopy }         from '@/components/journey/journey-copy'
import { getJourneyStrings }      from '@/lib/journey/strings'
import { localizeJourneyName }    from '@/lib/journey/localize'
import { DashboardHero }          from './DashboardHero'
import { DashboardNextAction }    from './DashboardNextAction'
import { DashboardActivePlan }    from './DashboardActivePlan'
import { DashboardAchievements }  from './DashboardAchievements'
import { DashboardCoachInsight }  from './DashboardCoachInsight'
import { DashboardCoachCard }     from './DashboardCoachCard'
import { buildCoachInsight }      from './dashboard-copy'

const KNOWN_CLUSTERS: IntentCluster[] = ['weight', 'sleep', 'finance']

const PHASE_ORDER: Record<IntentPhase, number> = {
  habit: 5, execution: 4, planning: 3, assessment: 2, discovery: 1,
}

function selectPrimaryCluster(
  intents: Partial<Record<IntentCluster, IntentState>>,
): IntentCluster | null {
  let best: IntentCluster | null = null
  let bestScore = -1

  for (const [cluster, intent] of Object.entries(intents) as [IntentCluster, IntentState][]) {
    if (!intent || intent.completedInstruments.length === 0) continue
    const score = PHASE_ORDER[intent.currentPhase] * 100 + intent.completedInstruments.length
    if (score > bestScore) {
      bestScore = score
      best = cluster
    }
  }

  return best
}

const PLATFORM_EVENTS = [
  'platform:intent_state_updated',
  'platform:recommendation_updated',
  'solviqlab:result',
] as const

function DashboardEmpty({ lang }: { lang: string }) {
  const t = getT(lang)
  return (
    <div className="flex flex-col items-center text-center py-16 space-y-4">
      <div className="text-4xl">🔍</div>
      <div className="space-y-2">
        <p className="text-xl font-bold text-slate-900 dark:text-white">
          {t('dashboard.empty.title')}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          {t('dashboard.empty.body')}
        </p>
      </div>
      <a
        href={`/${lang}/calculators/bmi-calculator`}
        className="group flex items-center gap-2 py-3 px-6 min-h-[44px]
                   bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold
                   rounded-xl active:scale-[0.98] transition-all duration-150"
      >
        {t('dashboard.empty.cta')}
        <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  )
}

interface Props {
  readonly lang: string
}

export function JourneyDashboard({ lang }: Props) {
  const [intents, setIntents] = useState<Partial<Record<IntentCluster, IntentState>>>({})
  const [loaded,  setLoaded]  = useState(false)

  const refresh = useCallback(() => {
    const runtime = getBrowserRuntime()
    const next: Partial<Record<IntentCluster, IntentState>> = {}
    for (const cluster of KNOWN_CLUSTERS) {
      const state = runtime.userEngine.getIntentState(cluster)
      if (state) next[cluster] = state
    }
    setIntents(next)
    setLoaded(true)
  }, [])

  useEffect(() => {
    refresh()
    PLATFORM_EVENTS.forEach(e => window.addEventListener(e, refresh))
    return () => PLATFORM_EVENTS.forEach(e => window.removeEventListener(e, refresh))
  }, [refresh])

  if (!loaded) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        ))}
      </div>
    )
  }

  const primaryCluster = selectPrimaryCluster(intents)

  if (!primaryCluster) {
    return <DashboardEmpty lang={lang} />
  }

  const t       = getT(lang)
  const intent  = intents[primaryCluster]!
  const phase   = intent.currentPhase
  const decision = intent.recommendationDecision
  const count   = intent.completedInstruments.length
  const insight = buildCoachInsight(intent, lang)
  const copy    = getJourneyCopy(lang)
  const s       = getJourneyStrings(lang)

  const otherClusters = KNOWN_CLUSTERS.filter(
    c => c !== primaryCluster && (intents[c]?.completedInstruments.length ?? 0) > 0
  )

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

      {/* 1. Hero */}
      <DashboardHero intent={intent} lang={lang} />

      {/* 2. Today's Action */}
      <DashboardNextAction
        phase={phase}
        cluster={primaryCluster}
        lang={lang}
        nextSlug={decision?.slug ?? null}
        nextName={decision?.name ? localizeJourneyName(decision.name, lang) : null}
      />

      {/* 3. Active Plan */}
      {intent.activePlan && intent.activePlan.status === 'active' && (
        <DashboardActivePlan
          plan={intent.activePlan}
          lang={lang}
          cluster={primaryCluster}
        />
      )}

      {/* 4. Assessment Score — when available */}
      {intent.latestAssessment && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
              {t('dashboard.score.label')}
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {intent.latestAssessment.overall_score}<span className="text-sm font-normal text-slate-400">/100</span>
            </p>
          </div>
          <a
            href={`/${lang}/assessment/${primaryCluster}`}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0"
          >
            {t('dashboard.score.view_full')}
          </a>
        </div>
      )}

      {/* 5. Journey Progress */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-4">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
          {s.journeyProgress}
        </p>
        <JourneyProgress step={Math.min(count, 6)} total={6} progressLabel={copy.progressText(Math.min(count, 6), 6)} />
      </div>

      {/* 6. Achievements */}
      <DashboardAchievements instruments={intent.completedInstruments} limit={5} lang={lang} />

      {/* 7. Coach Card — contextual entry point */}
      <DashboardCoachCard cluster={primaryCluster} lang={lang} />

      {/* 8. Coach Insight */}
      {insight && <DashboardCoachInsight insight={insight} lang={lang} />}

      {/* 9. Other active clusters */}
      {otherClusters.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {t('dashboard.other_journeys')}
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {otherClusters.map(cluster => {
              const ci = intents[cluster]!
              return (
                <li key={cluster}>
                  <a
                    href={`/${lang}/assessment/${cluster}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5
                               hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {t('dashboard.cluster_journey', { cluster: t('assessment.banner.cluster.' + cluster) || cluster })}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t('dashboard.steps_phase', {
                          steps: String(ci.completedInstruments.length),
                          phase: t('dashboard.phase.' + ci.currentPhase) || ci.currentPhase,
                        })}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
