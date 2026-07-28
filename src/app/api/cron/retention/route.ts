import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { getRetentionEmail, type RetentionDay } from '@/lib/email/retention-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: Record<string, number> = { sent: 0, skipped: 0, errors: 0 }

  for (const day of [3, 7, 30] as RetentionDay[]) {
    const from = new Date()
    from.setDate(from.getDate() - day)
    from.setHours(0, 0, 0, 0)
    const to = new Date(from)
    to.setHours(23, 59, 59, 999)

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())

    if (error) { console.error(`day${day}:`, error.message); results.errors++; continue }
    if (!users?.length) continue

    for (const user of users) {
      const template = getRetentionEmail(day, user.name)
      const { error: sendErr } = await resend.emails.send({
        from: 'Mia from SolviqLab <mia@solviqlab.com>',
        to: user.email,
        subject: template.subject,
        html: template.html,
      })

      if (sendErr) { console.error('send:', sendErr); results.errors++ }
      else results.sent++
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
