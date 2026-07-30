import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { EVENTS } from '@/lib/events/taxonomy'

const ALLOWED_EVENTS = new Set(Object.values(EVENTS))

export async function POST(req: NextRequest) {
  let body: {
    name: string
    userId?: string | null
    anonymousId?: string | null
    sessionId: string
    lang: string
    payload?: Record<string, unknown>
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate event name against taxonomy — reject unknown events
  if (!ALLOWED_EVENTS.has(body.name as never)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  if (!body.sessionId) {
    return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
  }

  // Use authenticated userId if available, fall back to body.userId
  const session = await getServerSession()
  const userId = (session?.user as { id?: string } | undefined)?.id ?? body.userId ?? null

  const supabase = createServiceClient()
  await supabase.from('platform_events').insert({
    name:         body.name,
    user_id:      userId,
    anonymous_id: body.anonymousId ?? null,
    session_id:   body.sessionId,
    lang:         body.lang ?? 'en',
    payload:      body.payload ?? {},
    timestamp:    new Date().toISOString(),
  })

  return NextResponse.json({ ok: true })
}
