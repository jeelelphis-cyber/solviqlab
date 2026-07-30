// POST /api/cron/expire-trials — runs daily via Vercel Cron
// Sets is_pro = false for users whose trial_expires_at < now
// and have no active Stripe subscription.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Find users with expired trial and no active Stripe subscription
  const { data: expired, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('is_pro', true)
    .lt('trial_expires_at', new Date().toISOString())
    .not('stripe_status', 'eq', 'active')
    .not('stripe_status', 'eq', 'past_due') // past_due gets 3-day grace in isPro()

  if (error) {
    console.error('[expire-trials] query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expired?.length) {
    return NextResponse.json({ ok: true, expired: 0 })
  }

  const ids = expired.map(u => u.id)

  const { error: updateError } = await supabase
    .from('users')
    .update({ is_pro: false })
    .in('id', ids)

  if (updateError) {
    console.error('[expire-trials] update error:', updateError.message)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  console.log(`[expire-trials] expired ${ids.length} trials`)

  return NextResponse.json({ ok: true, expired: ids.length })
}
