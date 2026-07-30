// ─────────────────────────────────────────────────────────────────────────────
// SolviqLab — Event Emitter
//
// Single function to emit platform events to Supabase.
// Works on both server (API routes) and client (browser).
//
// Usage:
//   import { emit } from '@/lib/events/emitter'
//   await emit('COACH_MESSAGE_SENT', userId, sessionId, lang, { coachId: 'mia', turnNumber: 1, messageLength: 42 })
//
// Fire-and-forget — never throws. Errors are logged silently.
// ─────────────────────────────────────────────────────────────────────────────

import type { EventName, EventPayloads } from './taxonomy'

interface EmitOptions {
  anonymousId?: string
}

export async function emit<E extends EventName>(
  name: E,
  userId: string | null,
  sessionId: string,
  lang: string,
  payload: EventPayloads[E],
  options: EmitOptions = {},
): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      // Server-side: write directly to Supabase via service client
      const { createServiceClient } = await import('@/lib/supabase/server')
      const supabase = createServiceClient()
      await supabase.from('platform_events').insert({
        name,
        user_id:      userId,
        anonymous_id: options.anonymousId ?? null,
        session_id:   sessionId,
        lang,
        payload,
        timestamp:    new Date().toISOString(),
      })
    } else {
      // Client-side: POST to tracking endpoint (keeps service key server-side)
      await fetch('/api/events/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          userId,
          anonymousId: options.anonymousId,
          sessionId,
          lang,
          payload,
        }),
      })
    }
  } catch {
    // Silent — events must never break product functionality
  }
}
