'use client'

// ─────────────────────────────────────────────────────────────────────────────
// UserJourneySection — Live journey UI driven by platform events
//
// V3-10E: Migrated to Event-Driven architecture (P-15).
//
// Old model: calculator → solviqlab:result → storeResult() (direct) → refresh
// New model: calculator → solviqlab:result → EventBus → P10..P60 handlers
//            → platform:intent_state_updated / platform:recommendation_updated
//            → refreshState() (reads engines, re-renders)
//
// This component no longer calls storeResult() directly.
// The EventBus (initialized by PlatformProvider) owns that responsibility.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { getEngine } from '@/lib/user'
import type { JourneyState, RegistrationTriggerResult } from '@/lib/user'
import { getJourneyForSlug } from '@/lib/journey/config'
import { getRecommendationEngine, buildContextFromEngine } from '@/lib/recommendation'
import type { Recommendation } from '@/lib/recommendation'
import { JourneyProgressCard } from '../journey/JourneyProgressCard'
import { UnlockCard } from '../journey/UnlockCard'
import { AIConsultCard } from '../journey/AIConsultCard'
import { RegistrationPrompt } from './RegistrationPrompt'
import { PrimaryRecommendationCard } from './PrimaryRecommendationCard'
import { getJourneyStrings } from '@/lib/journey/strings'

interface Props {
  readonly slug: string
  readonly lang: string
}

type HydrationState = 'loading' | 'ready'

// Platform events that signal a state change worth re-rendering for
const REFRESH_EVENTS = [
  'platform:intent_state_updated',
  'platform:recommendation_updated',
] as const

export function UserJourneySection({ slug, lang }: Props) {
  const s = getJourneyStrings(lang)
  const [hydration, setHydration]     = useState<HydrationState>('loading')
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null)
  const [regTrigger, setRegTrigger]   = useState<RegistrationTriggerResult | null>(null)
  const [regDismissed, setRegDismissed] = useState(false)
  const [primaryRec, setPrimaryRec]   = useState<Recommendation | null>(null)

  const journey = getJourneyForSlug(slug)

  const refreshState = useCallback(() => {
    const engine = getEngine()
    if (!engine) return

    // Read updated state from engines (EventBus P10 already wrote to localStorage)
    const js = journey ? engine.getJourneyState(journey.id) : null
    setJourneyState(js)

    const trigger = engine.checkRegistrationTrigger()
    setRegTrigger(trigger)

    // P-16+P-17: read stored decision first (EventBus P60 already computed it)
    const decision = engine.getRecommendationDecision()
    if (decision) {
      // Reconstruct a minimal Recommendation from the stored decision for display
      setPrimaryRec({
        id:               decision.decision_id,
        type:             decision.type,
        priority:         'primary',
        instrument_slug:  decision.slug,
        instrument_name:  decision.name,
        title:            decision.name ?? s.nextStepBadge,
        reason:           decision.reasons[0] ?? '',
        detail:           decision.reasons.join(' · '),
        estimated_minutes: null,
        expected_value:   decision.score >= 70 ? 'very_high' : decision.score >= 50 ? 'high' : 'medium',
        score:            decision.score,
        scoring: {
          need: 0, confidence: 0, journey_importance: 0, completion_probability: 0,
          composite: decision.score,
          factors: [...decision.reasons],
        },
        generated_at: decision.generated_at,
        expires_at:   null,
        cta_label:    s.continueJourney,
        cta_href:     decision.slug ? `/${lang}/calculators/${decision.slug}` : null,
      })
    } else {
      const ctx = buildContextFromEngine(engine, slug)
      const result = getRecommendationEngine().recommend(ctx, lang)
      setPrimaryRec(result.primary)
    }
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

    // Listen to platform events (emitted by EventBus after full handler chain runs).
    // P-15: this component does NOT call storeResult() — EventBus P10 owns that.
    const handlePlatformEvent = () => refreshState()

    const cleanups = REFRESH_EVENTS.map(eventType => {
      window.addEventListener(eventType, handlePlatformEvent)
      return () => window.removeEventListener(eventType, handlePlatformEvent)
    })

    return () => cleanups.forEach(fn => fn())
  }, [slug, refreshState])

  // ── Skeleton ──────────────────────────────────────────────────────────────
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
      {/* Primary Recommendation — updates automatically via platform:recommendation_updated */}
      {primaryRec && (
        <PrimaryRecommendationCard recommendation={primaryRec} lang={lang} />
      )}

      {/* Journey progress */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <JourneyProgressCard slug={slug} lang={lang} liveState={journeyState} />
        <div className="flex flex-col gap-4">
          <UnlockCard slug={slug} lang={lang} />
          <AIConsultCard slug={slug} lang={lang} />
        </div>
      </div>

      {/* Registration prompt */}
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
