// ─────────────────────────────────────────────────────────────────────────────
// Profile Events
//
// Every profile lifecycle action emits a typed event.
// Currently → GA4. Future → EventStore (DevOS).
// ─────────────────────────────────────────────────────────────────────────────

import type { ProfileDomain } from './types'

export interface ProfileUpdatedEvent {
  readonly type: 'ProfileUpdated'
  readonly user_id: string | null
  readonly instrument_slug: string
  readonly domains_affected: readonly ProfileDomain[]
  readonly overall_confidence: number
  readonly timestamp: string
}

export interface SignalAddedEvent {
  readonly type: 'SignalAdded'
  readonly user_id: string | null
  readonly instrument_slug: string
  readonly domain: ProfileDomain
  readonly metric: string
  readonly timestamp: string
}

export interface ConfidenceChangedEvent {
  readonly type: 'ConfidenceChanged'
  readonly user_id: string | null
  readonly domain: ProfileDomain
  readonly previous_confidence: number
  readonly new_confidence: number
  readonly timestamp: string
}

export interface ContradictionDetectedEvent {
  readonly type: 'ContradictionDetected'
  readonly user_id: string | null
  readonly contradiction_id: string
  readonly severity: 'low' | 'medium' | 'high'
  readonly domains: readonly ProfileDomain[]
  readonly timestamp: string
}

export interface ProfileCompletedEvent {
  readonly type: 'ProfileCompleted'
  readonly user_id: string | null
  readonly overall_confidence: number
  readonly total_signals: number
  readonly timestamp: string
}

export type ProfileEvent =
  | ProfileUpdatedEvent
  | SignalAddedEvent
  | ConfidenceChangedEvent
  | ContradictionDetectedEvent
  | ProfileCompletedEvent

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

export function emitProfileEvent(event: ProfileEvent): void {
  try {
    if (typeof window !== 'undefined') {
      window.gtag?.('event', event.type, {
        user_id:   (event as { user_id?: string | null }).user_id,
        slug:      (event as { instrument_slug?: string }).instrument_slug,
        domain:    (event as { domain?: string }).domain,
      })
    }
  } catch {}
}
