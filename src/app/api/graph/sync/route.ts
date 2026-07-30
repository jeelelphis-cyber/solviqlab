// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/graph/sync  — load UserGraph from Supabase for authenticated user
// POST /api/graph/sync  — save UserGraph to Supabase for authenticated user
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getServerSession()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ graph: null })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('user_graphs')
    .select('graph_data, graph_version, updated_at')
    .eq('user_id', userId)
    .single()

  return NextResponse.json({ graph: data?.graph_data ?? null, updatedAt: data?.updated_at ?? null })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { graph: Record<string, unknown>; version?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.graph || typeof body.graph !== 'object') {
    return NextResponse.json({ error: 'graph required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('user_graphs')
    .upsert({
      user_id:       userId,
      graph_data:    body.graph,
      graph_version: body.version ?? 1,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
