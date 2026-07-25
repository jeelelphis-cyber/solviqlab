// ─────────────────────────────────────────────────────────────────────────────
// SessionFlowEngine — single controller for the First User Session.
//
// Replaces scattered useState across components. One engine knows:
//   - where the user is now
//   - what they've already completed
//   - where to go next
//   - what to save
//
// CEO Decision №004: this is the foundation. All future products
// (Finance, Career, Productivity) reuse this same engine.
// ─────────────────────────────────────────────────────────────────────────────

import type { StorageProvider } from '../user/storage'
import { SessionEventTracker }  from './tracker'
import {
  SESSION_FLOW,
  type SessionState,
  type SessionData,
  type SessionSnapshot,
  type SessionEvent,
} from './types'

const SNAPSHOT_KEY = 'session:flow'

// Events fired automatically on each state transition
const TRANSITION_EVENTS: Partial<Record<SessionState, SessionEvent>> = {
  assessment:     'assessment_started',
  result:         'assessment_finished',
  mia_intro:      'mia_intro_seen',
  generating:     'video_requested',
  first_action:   'video_completed',
  premium:        'first_action_done',
  return_tomorrow:'premium_started',
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function now(): string {
  return new Date().toISOString()
}

function makeDefaultData(userId: string): SessionData {
  const ts = now()
  return {
    userId,
    name:            null,
    goal:            null,
    cluster:         null,
    assessmentScore: null,
    videoId:         null,
    firstAction:     null,
    startedAt:       ts,
    lastSeenAt:      ts,
    returnedAt:      null,
  }
}

export class SessionFlowEngine {
  private sessionId:       string
  private current:         SessionState
  private data:            SessionData
  private completedStates: SessionState[]
  private history:         Array<{ state: SessionState; at: string }>
  private readonly tracker: SessionEventTracker

  constructor(
    private readonly storage: StorageProvider,
    userId: string,
  ) {
    this.tracker = new SessionEventTracker(storage)

    const saved = storage.get<SessionSnapshot>(SNAPSHOT_KEY)

    if (saved && saved.data.userId === userId) {
      this.sessionId       = saved.sessionId
      this.current         = saved.current
      this.data            = { ...saved.data, lastSeenAt: now() }
      this.completedStates = [...saved.completedStates]
      this.history         = [...saved.history]

      // Mark as returned if it's a new day
      if (!saved.data.returnedAt) {
        const lastSeen  = new Date(saved.data.lastSeenAt)
        const today     = new Date()
        const diffDays  = Math.floor((today.getTime() - lastSeen.getTime()) / 86_400_000)
        if (diffDays >= 1) {
          this.data = { ...this.data, returnedAt: now() }
          this.tracker.emit('returned_next_day', this.current, this.sessionId, userId)
        }
      }
    } else {
      // Fresh session
      this.sessionId       = makeId()
      this.current         = 'landing'
      this.data            = makeDefaultData(userId)
      this.completedStates = []
      this.history         = [{ state: 'landing', at: now() }]
      this.tracker.emit('session_started', 'landing', this.sessionId, userId)
    }

    this.save()
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  getState(): SessionState { return this.current }

  getData(): Readonly<SessionData> { return this.data }

  getSessionId(): string { return this.sessionId }

  isCompleted(state: SessionState): boolean {
    return this.completedStates.includes(state)
  }

  getSnapshot(): SessionSnapshot {
    return {
      sessionId:       this.sessionId,
      current:         this.current,
      data:            this.data,
      completedStates: [...this.completedStates],
      history:         [...this.history],
    }
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  /** Merge new data into the session (name, goal, videoId, etc.) */
  setData(patch: Partial<SessionData>): void {
    this.data = { ...this.data, ...patch, lastSeenAt: now() }

    // Specific field events
    if (patch.name && !this.isCompleted('onboarding')) {
      this.tracker.emit('name_entered', this.current, this.sessionId, this.data.userId, { name: patch.name })
    }
    if (patch.goal) {
      this.tracker.emit('goal_selected', this.current, this.sessionId, this.data.userId, { goal: patch.goal })
    }
    if (patch.videoId) {
      this.tracker.emit('video_ready', this.current, this.sessionId, this.data.userId, { videoId: patch.videoId })
    }

    this.save()
  }

  /** Advance to the next state in the linear flow. */
  advance(patch?: Partial<SessionData>): SessionState {
    if (patch) this.data = { ...this.data, ...patch, lastSeenAt: now() }

    if (!this.completedStates.includes(this.current)) {
      this.completedStates.push(this.current)
    }

    const nextIndex = SESSION_FLOW.indexOf(this.current) + 1
    const next: SessionState = nextIndex < SESSION_FLOW.length
      ? SESSION_FLOW[nextIndex]!
      : 'return_tomorrow'

    const event = TRANSITION_EVENTS[next]
    if (event) {
      this.tracker.emit(event, next, this.sessionId, this.data.userId)
    }

    this.current = next
    this.history.push({ state: next, at: now() })
    this.save()

    return next
  }

  /** Jump to an explicit state (e.g. when URL changes). */
  goto(state: SessionState, patch?: Partial<SessionData>): void {
    if (patch) this.data = { ...this.data, ...patch, lastSeenAt: now() }

    if (!this.completedStates.includes(this.current)) {
      this.completedStates.push(this.current)
    }

    const event = TRANSITION_EVENTS[state]
    if (event) {
      this.tracker.emit(event, state, this.sessionId, this.data.userId)
    }

    this.current = state
    this.history.push({ state, at: now() })
    this.save()
  }

  /** Fire an explicit event (e.g. video_started, premium_clicked). */
  track(event: SessionEvent, meta?: Record<string, unknown>): void {
    this.tracker.emit(event, this.current, this.sessionId, this.data.userId, meta)
  }

  /** Reset to start a fresh session for the same user. */
  reset(): void {
    this.sessionId       = makeId()
    this.current         = 'landing'
    this.data            = makeDefaultData(this.data.userId)
    this.completedStates = []
    this.history         = [{ state: 'landing', at: now() }]
    this.tracker.emit('session_started', 'landing', this.sessionId, this.data.userId)
    this.save()
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  private save(): void {
    this.storage.set(SNAPSHOT_KEY, this.getSnapshot())
  }
}
