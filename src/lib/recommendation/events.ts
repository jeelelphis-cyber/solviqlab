// ─────────────────────────────────────────────────────────────────────────────
// Recommendation Events
//
// Every recommendation lifecycle action emits a typed event.
// Currently → GA4. Future → EventStore (DevOS).
// ─────────────────────────────────────────────────────────────────────────────

import type { RecommendationType } from './types'

export interface RecommendationGeneratedEvent {
  readonly type: 'RecommendationGenerated'
  readonly user_id: string | null
  readonly recommendation_type: RecommendationType
  readonly instrument_slug: string | null
  readonly score: number
  readonly context_slug: string
  readonly timestamp: string
}

export interface RecommendationViewedEvent {
  readonly type: 'RecommendationViewed'
  readonly user_id: string | null
  readonly recommendation_type: RecommendationType
  readonly instrument_slug: string | null
  readonly timestamp: string
}

export interface RecommendationAcceptedEvent {
  readonly type: 'RecommendationAccepted'
  readonly user_id: string | null
  readonly recommendation_type: RecommendationType
  readonly instrument_slug: string | null
  readonly score: number
  readonly timestamp: string
}

export interface RecommendationIgnoredEvent {
  readonly type: 'RecommendationIgnored'
  readonly user_id: string | null
  readonly recommendation_type: RecommendationType
  readonly instrument_slug: string | null
  readonly timestamp: string
}

export interface RecommendationCompletedEvent {
  readonly type: 'RecommendationCompleted'
  readonly user_id: string | null
  readonly recommendation_type: RecommendationType
  readonly instrument_slug: string | null
  readonly time_to_complete_seconds: number
  readonly timestamp: string
}

export type RecommendationEvent =
  | RecommendationGeneratedEvent
  | RecommendationViewedEvent
  | RecommendationAcceptedEvent
  | RecommendationIgnoredEvent
  | RecommendationCompletedEvent

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function emitRecommendationEvent(event: RecommendationEvent): void {
  try {
    if (typeof window !== 'undefined') {
      window.gtag?.('event', event.type, {
        user_id:  event.user_id,
        rec_type: event.recommendation_type,
        slug:     event.instrument_slug,
      })
    }
  } catch {}
}
