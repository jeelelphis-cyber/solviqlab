// ─────────────────────────────────────────────────────────────────────────────
// SolviqLab — Event Taxonomy
//
// CANONICAL event names for the entire platform.
// Always SCREAMING_SNAKE_CASE. Never use string literals elsewhere.
// Add new events here first — nowhere else.
// ─────────────────────────────────────────────────────────────────────────────

// ── Member ────────────────────────────────────────────────────────────────────
export const EVENTS = {
  // Auth & Registration
  USER_REGISTERED:          'USER_REGISTERED',
  USER_LOGGED_IN:           'USER_LOGGED_IN',
  TRIAL_STARTED:            'TRIAL_STARTED',
  TRIAL_EXPIRED:            'TRIAL_EXPIRED',
  SUBSCRIPTION_UPGRADED:    'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_CANCELED:    'SUBSCRIPTION_CANCELED',

  // Coach
  COACH_SESSION_STARTED:    'COACH_SESSION_STARTED',
  COACH_MESSAGE_SENT:       'COACH_MESSAGE_SENT',
  COACH_MESSAGE_RECEIVED:   'COACH_MESSAGE_RECEIVED',
  COACH_PLAN_GENERATED:     'COACH_PLAN_GENERATED',
  COACH_PAYWALL_HIT:        'COACH_PAYWALL_HIT',
  COACH_SELECTED:           'COACH_SELECTED',

  // Product (calculators, assessments)
  PRODUCT_OPENED:           'PRODUCT_OPENED',
  PRODUCT_COMPLETED:        'PRODUCT_COMPLETED',
  PRODUCT_RESULT_SAVED:     'PRODUCT_RESULT_SAVED',
  ASSESSMENT_STARTED:       'ASSESSMENT_STARTED',
  ASSESSMENT_COMPLETED:     'ASSESSMENT_COMPLETED',

  // Graph
  GRAPH_FACT_ADDED:         'GRAPH_FACT_ADDED',
  GRAPH_GOAL_SET:           'GRAPH_GOAL_SET',
  GRAPH_PROFILE_UPDATED:    'GRAPH_PROFILE_UPDATED',

  // System
  RATE_LIMIT_HIT:           'RATE_LIMIT_HIT',
  API_ERROR:                'API_ERROR',
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]

// ── Payload shapes per event ──────────────────────────────────────────────────

export interface EventPayloads {
  USER_REGISTERED:       { email: string; source: string }
  USER_LOGGED_IN:        { email: string }
  TRIAL_STARTED:         { trialExpiresAt: string }
  TRIAL_EXPIRED:         Record<string, never>
  SUBSCRIPTION_UPGRADED: { plan: string; stripeSubscriptionId: string }
  SUBSCRIPTION_CANCELED: { reason?: string }

  COACH_SESSION_STARTED:  { coachId: string; userName: string }
  COACH_MESSAGE_SENT:     { coachId: string; turnNumber: number; messageLength: number }
  COACH_MESSAGE_RECEIVED: { coachId: string; turnNumber: number; provider: string; tokensUsed?: number }
  COACH_PLAN_GENERATED:   { coachId: string }
  COACH_PAYWALL_HIT:      { coachId: string; turnCount: number }
  COACH_SELECTED:         { coachId: string; cluster: string }

  PRODUCT_OPENED:         { slug: string; lang: string }
  PRODUCT_COMPLETED:      { slug: string; value: number | null; label: string | null }
  PRODUCT_RESULT_SAVED:   { slug: string }
  ASSESSMENT_STARTED:     { cluster: string }
  ASSESSMENT_COMPLETED:   { cluster: string; score: number; phase: string }

  GRAPH_FACT_ADDED:       { factId: string; category: string }
  GRAPH_GOAL_SET:         { cluster: string; goalValue: number }
  GRAPH_PROFILE_UPDATED:  { domainsChanged: string[] }

  RATE_LIMIT_HIT:         { endpoint: string }
  API_ERROR:              { endpoint: string; status: number; code?: string }
}
