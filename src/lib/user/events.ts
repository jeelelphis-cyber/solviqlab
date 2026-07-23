// ─────────────────────────────────────────────────────────────────────────────
// User Events — Typed event system
//
// Every user action emits a typed event.
// Currently consumed by: analytics (GA4), future EventStore (DevOS).
//
// Pattern: fire-and-forget. Failures are silent — never block UX.
//
// DevOS note: When EventStore is implemented, replace emitToAnalytics()
//   with emitToEventStore(). The event types stay identical.
// ─────────────────────────────────────────────────────────────────────────────

import type { UserId, RegistrationTriggerReason } from './types'

// ── Event Definitions ─────────────────────────────────────────────────────────

export interface UserCreatedEvent {
  readonly type: 'UserCreated'
  readonly user_id: UserId
  readonly timestamp: string
}

export interface ResultStoredEvent {
  readonly type: 'ResultStored'
  readonly user_id: UserId
  readonly instrument_slug: string
  readonly result_id: string
  readonly journey_id: string | null
  readonly timestamp: string
}

export interface JourneyProgressUpdatedEvent {
  readonly type: 'JourneyProgressUpdated'
  readonly user_id: UserId
  readonly journey_id: string
  readonly completed_count: number
  readonly progress_percent: number
  readonly timestamp: string
}

export interface RewardUnlockedEvent {
  readonly type: 'RewardUnlocked'
  readonly user_id: UserId
  readonly reward: string
  readonly journey_id: string
  readonly timestamp: string
}

export interface RegistrationSuggestedEvent {
  readonly type: 'RegistrationSuggested'
  readonly user_id: UserId
  readonly trigger: RegistrationTriggerReason
  readonly journey_progress: number
  readonly completed_count: number
  readonly timestamp: string
}

export interface RegistrationCompletedEvent {
  readonly type: 'RegistrationCompleted'
  readonly anonymous_id: UserId
  readonly authenticated_id: UserId
  readonly auth_provider: string
  readonly timestamp: string
}

export interface AnonymousMergedEvent {
  readonly type: 'AnonymousMerged'
  readonly anonymous_id: UserId
  readonly authenticated_id: UserId
  readonly results_merged: number
  readonly journeys_merged: number
  readonly timestamp: string
}

export type UserEvent =
  | UserCreatedEvent
  | ResultStoredEvent
  | JourneyProgressUpdatedEvent
  | RewardUnlockedEvent
  | RegistrationSuggestedEvent
  | RegistrationCompletedEvent
  | AnonymousMergedEvent

// ── Result Capture CustomEvent ────────────────────────────────────────────────

/**
 * Calculators dispatch this CustomEvent when they produce a result.
 * The UserEngine listens for it and stores the ResultRecord.
 *
 * Dispatch from a calculator component:
 *   window.dispatchEvent(new CustomEvent(RESULT_CAPTURE_EVENT, {
 *     detail: { slug, name, value, label, category, unit, metadata }
 *   }))
 */
export const RESULT_CAPTURE_EVENT = 'solviqlab:result' as const

export interface ResultCaptureDetail {
  readonly slug: string
  readonly name: string
  readonly value: number | null
  readonly label: string | null
  readonly category: string | null
  readonly unit: string | null
  readonly algorithm_version?: string
  readonly metadata?: Record<string, unknown>
}

// ── Analytics Bridge ─────────────────────────────────────────────────────────

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function now(): string {
  return new Date().toISOString()
}

export function emitUserEvent(event: UserEvent): void {
  try {
    window.gtag?.('event', event.type, {
      user_id:    'user_id' in event ? event.user_id : undefined,
      journey_id: 'journey_id' in event ? event.journey_id : undefined,
      slug:       'instrument_slug' in event ? event.instrument_slug : undefined,
      timestamp:  event.timestamp,
    })
  } catch {}
}

export function makeEvent<T extends UserEvent['type']>(
  type: T,
  payload: Omit<Extract<UserEvent, { type: T }>, 'type' | 'timestamp'>
): Extract<UserEvent, { type: T }> {
  return { type, timestamp: now(), ...payload } as Extract<UserEvent, { type: T }>
}
