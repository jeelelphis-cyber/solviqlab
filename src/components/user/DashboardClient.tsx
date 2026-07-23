'use client'

// ─────────────────────────────────────────────────────────────────────────────
// DashboardClient
//
// The user's personal command center. Composes all three engines:
//   UserEngine → journey states + result history
//   ProfileEngine → health domains + confidence + missing insights
//   RecommendationEngine → primary next step
//
// Design principle: show the user WHAT they know about themselves,
// not just WHAT they've clicked. Confidence is the core metric.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getEngine } from '@/lib/user'
import { getProfileEngineFromUser } from '@/lib/user'
import { getRecommendationEngine, buildContextFromEngine } from '@/lib/recommendation'
import type { SolviqUser, JourneyState, ResultRecord } from '@/lib/user'
import type { PersonalHealthProfile } from '@/lib/profile'
import type { Recommendation } from '@/lib/recommendation'
import { HEALTH_DOMAINS, DOMAIN_META_MAP } from '@/lib/profile'
import { JOURNEY_DEFINITIONS } from '@/lib/journey/config'
import { JourneyProgressCard } from '../journey/JourneyProgressCard'
import { PrimaryRecommendationCard } from './PrimaryRecommendationCard'

interface Props {
  readonly lang: string
}

type HydrationState = 'loading' | 'ready' | 'empty'

// ── Domain Confidence Bar ──────────────────────────────────────────────────────

function DomainBar({ profile }: { profile: PersonalHealthProfile }) {
  const activeDomains = HEALTH_DOMAINS
    .map(d => ({ domain: d, meta: DOMAIN_META_MAP[d], conf: profile.domains[d]?.confidence ?? 0 }))
    .filter(d => d.conf > 0 || d.meta.primary_instruments.length > 0)
    .sort((a, b) => b.conf - a.conf)
    .slice(0, 8)

  if (activeDomains.length === 0) return null

  const CONF_COLOR = (conf: number) =>
    conf >= 70 ? 'bg-emerald-500' : conf >= 30 ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Health Profile</h2>
        <span className="text-xs font-mono text-slate-400">{profile.overall_confidence}% overall</span>
      </div>

      <div className="space-y-2.5">
        {activeDomains.map(({ domain, meta, conf }) => (
          <div key={domain} className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 w-28 shrink-0 truncate">
              {meta.label}
            </span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${CONF_COLOR(conf)}`}
                style={{ width: `${conf}%` }}
              />
            </div>
            <span className="text-xs font-mono text-slate-400 w-8 text-right shrink-0">{conf}%</span>
          </div>
        ))}
      </div>

      {profile.missing_insights.length > 0 && (
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Next to complete:{' '}
            <Link
              href={`/${''}/calculators/${profile.missing_insights[0]!.instrument_slug}`}
              className="text-blue-500 hover:underline"
            >
              {profile.missing_insights[0]!.instrument_name}
            </Link>
            {' '}+{profile.missing_insights[0]!.confidence_gain}% confidence
          </p>
        </div>
      )}
    </div>
  )
}

// ── Result History ─────────────────────────────────────────────────────────────

function ResultHistory({ results, lang }: { results: readonly ResultRecord[]; lang: string }) {
  const recent = [...results]
    .reverse()
    .filter(r => r.result_value !== null && r.result_label !== 'Visited')
    .slice(0, 6)

  if (recent.length === 0) return null

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
      <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Recent Results</h2>
      <div className="space-y-2">
        {recent.map(r => (
          <Link
            key={r.id}
            href={`/${lang}/calculators/${r.instrument_slug}`}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {r.instrument_name}
              </div>
              <div className="text-xs text-slate-400 truncate">
                {r.result_label ?? ''}
                {r.result_value !== null && r.unit ? ` · ${r.result_value} ${r.unit}` : ''}
              </div>
            </div>
            <span className="text-xs text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Journey Grid ──────────────────────────────────────────────────────────────

function JourneyGrid({ journeyStates, lang }: { journeyStates: readonly JourneyState[]; lang: string }) {
  const active = journeyStates.filter(j => j.completed_count > 0)
  if (active.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Active Journeys</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {active.map(js => {
          const journey = JOURNEY_DEFINITIONS.find(j => j.id === js.journey_id)
          if (!journey) return null
          const firstSlug = journey.steps[0]?.slug ?? ''
          return (
            <JourneyProgressCard
              key={js.journey_id}
              slug={firstSlug}
              lang={lang}
              liveState={js}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ lang }: { lang: string }) {
  return (
    <div className="text-center py-16 space-y-4">
      <div className="text-5xl">🧬</div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        Your profile is waiting
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto">
        Complete your first calculator to start building your Personal Health Profile.
      </p>
      <Link
        href={`/${lang}/calculators/bmi-calculator`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Start with BMI Calculator →
      </Link>
    </div>
  )
}

// ── Contradictions Banner ─────────────────────────────────────────────────────

function ContradictionsBanner({ profile }: { profile: PersonalHealthProfile }) {
  if (profile.contradictions.length === 0) return null
  const top = profile.contradictions[0]!

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
      <span className="text-amber-500 text-lg shrink-0">⚠</span>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Possible inconsistency</p>
        <p className="text-xs text-amber-700/80 dark:text-amber-400/70">{top.description}</p>
        <p className="text-xs text-amber-600 dark:text-amber-500">{top.suggestion}</p>
      </div>
    </div>
  )
}

// ── DashboardClient ───────────────────────────────────────────────────────────

export function DashboardClient({ lang }: Props) {
  const [hydration, setHydration] = useState<HydrationState>('loading')
  const [user, setUser]         = useState<SolviqUser | null>(null)
  const [profile, setProfile]   = useState<PersonalHealthProfile | null>(null)
  const [primaryRec, setPrimaryRec] = useState<Recommendation | null>(null)

  useEffect(() => {
    const engine = getEngine()
    const profileEngine = getProfileEngineFromUser()

    if (!engine || !profileEngine) {
      setHydration('empty')
      return
    }

    const u = engine.getOrCreateUser()
    setUser(u)

    const p = profileEngine.getProfile(u.id)
    setProfile(p)

    const ctx = buildContextFromEngine(engine, '')
    const result = getRecommendationEngine().recommend(ctx, lang)
    setPrimaryRec(result.primary)

    const hasActivity = engine.getResultHistory().some(
      r => r.result_label !== 'Visited'
    )
    setHydration(hasActivity ? 'ready' : 'empty')
  }, [lang])

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (hydration === 'loading') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (hydration === 'empty') {
    return <EmptyState lang={lang} />
  }

  const journeyStates = user?.journey_states ?? []
  const resultHistory = user?.result_history ?? []

  return (
    <div className="space-y-5">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {user?.type === 'authenticated' && (user as { display_name?: string | null }).display_name
              ? `Welcome back, ${(user as { display_name: string }).display_name.split(' ')[0]}`
              : 'Your Dashboard'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {resultHistory.filter(r => r.result_label !== 'Visited').length} results · {profile?.total_signals ?? 0} profile signals
          </p>
        </div>
        <Link
          href={`/${lang}/calculators/bmi-calculator`}
          className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
        >
          + New calculation
        </Link>
      </div>

      {/* Primary recommendation */}
      {primaryRec && (
        <PrimaryRecommendationCard recommendation={primaryRec} lang={lang} />
      )}

      {/* Health profile confidence */}
      {profile && profile.total_signals > 0 && (
        <DomainBar profile={profile} />
      )}

      {/* Contradictions */}
      {profile && <ContradictionsBanner profile={profile} />}

      {/* Active journeys */}
      <JourneyGrid journeyStates={journeyStates} lang={lang} />

      {/* Result history */}
      <ResultHistory results={resultHistory} lang={lang} />

    </div>
  )
}
