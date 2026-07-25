// ─────────────────────────────────────────────────────────────────────────────
// SessionEventTracker — fires analytics events for every session step.
//
// Currently: console + localStorage log (no external service yet).
// Future: swap emit() body to send to Posthog / Mixpanel / Amplitude.
// ─────────────────────────────────────────────────────────────────────────────

import type { SessionEvent, SessionEventPayload, SessionState } from './types'
import type { StorageProvider } from '../user/storage'

const LOG_KEY = 'session:events'
const MAX_LOG = 200

export class SessionEventTracker {
  constructor(private readonly storage: StorageProvider) {}

  emit(
    event:     SessionEvent,
    state:     SessionState,
    sessionId: string,
    userId:    string,
    meta?:     Record<string, unknown>,
  ): void {
    const payload: SessionEventPayload = {
      event,
      state,
      sessionId,
      userId,
      at:   new Date().toISOString(),
      meta,
    }

    // Console (dev visibility)
    console.info(`[Session] ${event}`, { state, ...meta })

    // Append to local event log (for future analytics export)
    const log = this.storage.get<SessionEventPayload[]>(LOG_KEY) ?? []
    const trimmed = log.length >= MAX_LOG ? log.slice(-MAX_LOG + 1) : log
    this.storage.set(LOG_KEY, [...trimmed, payload])
  }

  getLog(): SessionEventPayload[] {
    return this.storage.get<SessionEventPayload[]>(LOG_KEY) ?? []
  }

  clearLog(): void {
    this.storage.remove(LOG_KEY)
  }
}
