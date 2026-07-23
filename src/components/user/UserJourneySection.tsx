'use client'

// ─────────────────────────────────────────────────────────────────────────────
// UserJourneySection — Live journey UI with real user state + recommendations
//
// This client component:
//   1. Gets/creates the anonymous user on mount
//   2. Marks the current instrument as visited
//   3. Listens for 'solviqlab:result' CustomEvents from calculators
//   4. Stores results and updates journey state
//   5. Computes the best next-step recommendation via RecommendationEngine
//   6. Renders journey components with REAL progress data
//   7. Shows RegistrationPrompt when trigger fires
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { getEngine, RESULT_CAPTURE_EVENT } from '@/lib/user'
import type { JourneyState, RegistrationTriggerResult } from '@/lib/user'
import type { ResultCaptureDetail } from '@/lib/user/events'
import { getJourneyForSlug } from '@/lib/journey/config'
import { getRecommendationEngine, buildContextFromEngine } from '@/lib/recommendation'
import type { Recommendation } from '@/lib/recommendation'
import { JourneyProgressCard } from '../journey/JourneyProgressCard'
import { UnlockCard } from '../journey/UnlockCard'
import { AIConsultCard } from '../journey/AIConsultCard'
import { RegistrationPrompt } from './RegistrationPrompt'
import { PrimaryRecommendationCard } from './PrimaryRecommendationCard'

interface Props {
  readonly slug: string
  readonly lang: string
}

type HydrationState = 'loading' | 'ready'

export function UserJourneySection({ slug, lang }: Props) {
  const [hydration, setHydration] = useState<HydrationState>('loading')
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null)
  const [regTrigger, setRegTrigger] = useState<RegistrationTriggerResult | null>(null)
  const [regDismissed, setRegDismissed] = useState(false)
  const [primaryRec, setPrimaryRec] = useState<Recommendation | null>(null)

  const journey = getJourneyForSlug(slug)

  const refreshState = useCallback(() => {
    const engine = getEngine()
    if (!engine) return

    const js = journey ? engine.getJourneyState(journey.id) : null
    setJourneyState(js)

    const trigger = engine.checkRegistrationTrigger()
    setRegTrigger(trigger)

    // Compute recommendation
    const ctx = buildContextFromEngine(engine, slug)
    const result = getRecommendationEngine().recommend(ctx, lang)
    setPrimaryRec(result.primary)
  }, [journey, slug, lang])

  useEffect(() => {
    const engine = getEngine()
    if (!engine) {
      setHydration('ready')
      return
    }

    engine.getOrCreateUser()
    engine.markVisited(slug)
    refreshState()
    setHydration('ready')

    const handleResult = (e: Event) => {
      const detail = (e as CustomEvent<ResultCaptureDetail>).detail
      if (!detail?.slug) return
      engine.storeResult(detail)
      refreshState()
    }

    window.addEventListener(RESULT_CAPTURE_EVENT, handleResult)
    return () => window.removeEventListener(RESULT_CAPTURE_EVENT, handleResult)
  }, [slug, refreshState])

  // ── Skeleton (SSR + initial hydration) ────────────────────────────────────
  if (hydration === 'loading') {
    return (
      <div className="space-y-4 mt-4 animate-pulse">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-48" />
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-20" />
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-24" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Primary Recommendation — the engine's best next step */}
      {primaryRec && (
        <PrimaryRecommendationCard recommendation={primaryRec} lang={lang} />
      )}

      {/* Journey progress + unlock/AI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <JourneyProgressCard slug={slug} lang={lang} liveState={journeyState} />
        <div className="flex flex-col gap-4">
          <UnlockCard slug={slug} lang={lang} />
          <AIConsultCard slug={slug} lang={lang} />
        </div>
      </div>

      {/* Registration prompt — appears when trigger fires */}
      {regTrigger?.shouldSuggest && !regDismissed && (
        <RegistrationPrompt
          lang={lang}
          trigger={regTrigger}
          journeyState={journeyState}
          onDismiss={() => setRegDismissed(true)}
        />
      )}
    </div>
  )
}
