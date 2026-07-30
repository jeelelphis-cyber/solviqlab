import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { createServiceClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'danisshane68@gmail.com'

async function getStats() {
  const supabase = createServiceClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalUsers },
    { count: activeTrials },
    { count: proUsers },
    { count: eventsToday },
    { count: coachMsgToday },
    { count: coachMsgWeek },
    { count: newUsersToday },
    { data: recentEvents },
    { data: topEvents },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .gt('trial_expires_at', now.toISOString()).eq('is_pro', true),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .eq('stripe_status', 'active'),
    supabase.from('platform_events').select('*', { count: 'exact', head: true })
      .gte('timestamp', todayStart),
    supabase.from('platform_events').select('*', { count: 'exact', head: true })
      .eq('name', 'COACH_MESSAGE_SENT').gte('timestamp', todayStart),
    supabase.from('platform_events').select('*', { count: 'exact', head: true })
      .eq('name', 'COACH_MESSAGE_SENT').gte('timestamp', weekStart),
    supabase.from('users').select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart),
    supabase.from('platform_events')
      .select('name, timestamp, payload, user_id')
      .order('timestamp', { ascending: false })
      .limit(20),
    supabase.from('platform_events')
      .select('name')
      .gte('timestamp', weekStart),
  ])

  // Count events by name
  const eventCounts: Record<string, number> = {}
  for (const e of topEvents ?? []) {
    eventCounts[e.name] = (eventCounts[e.name] ?? 0) + 1
  }
  const sortedEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return {
    totalUsers: totalUsers ?? 0,
    activeTrials: activeTrials ?? 0,
    proUsers: proUsers ?? 0,
    eventsToday: eventsToday ?? 0,
    coachMsgToday: coachMsgToday ?? 0,
    coachMsgWeek: coachMsgWeek ?? 0,
    newUsersToday: newUsersToday ?? 0,
    recentEvents: recentEvents ?? [],
    sortedEvents,
  }
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '20px 24px', border: '1px solid #334155' }}>
      <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
      <div style={{ color: '#f1f5f9', fontSize: 32, fontWeight: 700, margin: '8px 0 4px' }}>{value}</div>
      {sub && <div style={{ color: '#64748b', fontSize: 12 }}>{sub}</div>}
    </div>
  )
}

export default async function AdminPage() {
  const session = await getServerSession()
  const email = session?.user?.email

  if (!email || email !== ADMIN_EMAIL) {
    redirect('/en')
  }

  const stats = await getStats()

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{ background: '#0f172a', minHeight: '100vh', color: '#f1f5f9', fontFamily: 'system-ui, sans-serif', padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>SolviqLab Platform</h1>
            <div style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{dateStr} · {timeStr}</div>
          </div>
          <div style={{ background: '#10b981', color: '#fff', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
            LIVE
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Active Trials" value={stats.activeTrials} sub="trial_expires_at > now" />
        <StatCard label="PRO (Stripe)" value={stats.proUsers} sub="stripe_status = active" />
        <StatCard label="New Today" value={stats.newUsersToday} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Events Today" value={stats.eventsToday} />
        <StatCard label="Coach Msgs Today" value={stats.coachMsgToday} />
        <StatCard label="Coach Msgs (7d)" value={stats.coachMsgWeek} />
        <StatCard label="Conversion" value={stats.totalUsers > 0 ? `${Math.round((stats.activeTrials / stats.totalUsers) * 100)}%` : '—'} sub="users → trial" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Top Events This Week */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
            Top Events (7 days)
          </h2>
          {stats.sortedEvents.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 14 }}>No events yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.sortedEvents.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: '#cbd5e1', fontFamily: 'monospace' }}>{name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#818cf8' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
            Recent Events
          </h2>
          {stats.recentEvents.length === 0 ? (
            <div style={{ color: '#475569', fontSize: 14 }}>No events yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {stats.recentEvents.slice(0, 12).map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #0f172a' }}>
                  <span style={{ fontSize: 12, color: '#a5b4fc', fontFamily: 'monospace' }}>{e.name}</span>
                  <span style={{ fontSize: 11, color: '#475569' }}>
                    {new Date(e.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, color: '#334155', fontSize: 12, textAlign: 'center' }}>
        SolviqLab Platform Dashboard · Admin only · Auto-refreshes on page reload
      </div>
    </div>
  )
}
