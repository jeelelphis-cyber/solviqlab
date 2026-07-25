// ─────────────────────────────────────────────────────────────────────────────
// Session Flow Types
//
// Single source of truth for every step in the First User Session.
// All future products (Finance, Career, Productivity) reuse this flow.
// ─────────────────────────────────────────────────────────────────────────────

export const SESSION_FLOW = [
  'landing',
  'calculator',
  'assessment',
  'result',
  'mia_intro',
  'onboarding',
  'generating',
  'video',
  'first_action',
  'premium',
  'return_tomorrow',
] as const

export type SessionState = typeof SESSION_FLOW[number]

// ── Analytics Events ──────────────────────────────────────────────────────────

export type SessionEvent =
  | 'session_started'
  | 'calculator_started'
  | 'assessment_started'
  | 'assessment_finished'
  | 'mia_intro_seen'
  | 'name_entered'
  | 'goal_selected'
  | 'video_requested'
  | 'video_ready'
  | 'video_started'
  | 'video_completed'
  | 'first_action_done'
  | 'premium_clicked'
  | 'premium_started'
  | 'returned_next_day'

export interface SessionEventPayload {
  readonly event:     SessionEvent
  readonly state:     SessionState
  readonly sessionId: string
  readonly userId:    string
  readonly at:        string   // ISO
  readonly meta?:     Record<string, unknown>
}

// ── Session Data ──────────────────────────────────────────────────────────────

export interface SessionData {
  readonly userId:          string
  readonly name:            string | null
  readonly goal:            string | null
  readonly cluster:         string | null
  readonly assessmentScore: number | null
  readonly videoId:         string | null
  readonly firstAction:     string | null     // what the user committed to doing
  readonly startedAt:       string
  readonly lastSeenAt:      string
  readonly returnedAt:      string | null     // populated on day-2+ visits
}

// ── Snapshot (what gets persisted to localStorage) ────────────────────────────

export interface SessionSnapshot {
  readonly sessionId:       string
  readonly current:         SessionState
  readonly data:            SessionData
  readonly completedStates: SessionState[]
  readonly history: readonly {
    readonly state: SessionState
    readonly at:    string
  }[]
}
