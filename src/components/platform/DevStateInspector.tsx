'use client'

// Dev-only panel showing full platform state.
// Activate: ?devInspector=1 or Ctrl+Shift+D
import { useEffect, useState, useCallback } from 'react'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import type { SolviqUser } from '@/lib/user'

interface InspectorState {
  user: SolviqUser | null
  profile: Record<string, unknown> | null
  nextRec: Record<string, unknown> | null
  journeyStates: unknown[]
  eventCount: number
}

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false
  // Next.js app router strips search from window.location; use URLSearchParams on href
  const params = new URLSearchParams(window.location.href.split('?')[1] ?? '')
  return (
    params.has('devInspector') ||
    localStorage.getItem('solviqlab:dev:inspector') === 'true'
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-700 pt-2 mt-2">
      <div className="text-slate-400 text-[10px] uppercase tracking-widest mb-1">{title}</div>
      {children}
    </div>
  )
}

function KV({ label, value }: { label: string; value: unknown }) {
  const display = value === null ? 'null' : value === undefined ? '—' : String(value)
  return (
    <div className="flex gap-2 text-[11px]">
      <span className="text-slate-500 shrink-0 w-32 truncate">{label}</span>
      <span className="text-slate-200 truncate flex-1">{display}</span>
    </div>
  )
}

export function DevStateInspector() {
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(true)
  const [state, setState] = useState<InspectorState>({
    user: null,
    profile: null,
    nextRec: null,
    journeyStates: [],
    eventCount: 0,
  })

  const refresh = useCallback(() => {
    const runtime = getBrowserRuntime()
    const user = runtime.userEngine.getUser()
    const userId = runtime.userEngine.getUserId()
    const profile = userId ? runtime.profileEngine.getOrCreateProfile(userId) : null
    const nextRec = runtime.userEngine.getNextRecommendation()

    setState(prev => ({
      user,
      profile: profile as Record<string, unknown> | null,
      nextRec: nextRec as Record<string, unknown> | null,
      journeyStates: runtime.userEngine.getAllJourneyStates() as unknown[],
      eventCount: prev.eventCount,
    }))
  }, [])

  useEffect(() => {
    const active = isEnabled()
    setEnabled(active)
    if (!active) return

    refresh()

    const EVENTS = [
      'platform:intent_state_updated',
      'platform:profile_recalculated',
      'platform:recommendation_updated',
      'platform:assessment_triggered',
      'solviqlab:result',
    ]

    const handler = () => {
      setState(prev => ({ ...prev, eventCount: prev.eventCount + 1 }))
      refresh()
    }

    EVENTS.forEach(e => window.addEventListener(e, handler))

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, handler))
      window.removeEventListener('keydown', onKey)
    }
  }, [refresh])

  if (!enabled) return null

  const { user, profile, nextRec, journeyStates, eventCount } = state
  const domains = profile ? (profile as { domains?: Record<string, { confidence: number; signals: unknown[] }> }).domains ?? {} : {}

  return (
    <div className="fixed top-4 left-4 z-50 w-80 font-mono text-xs">
      <div className="bg-slate-950 border border-slate-600 rounded-xl overflow-hidden shadow-2xl">
        <div
          className="flex items-center justify-between px-3 py-2 bg-slate-800 cursor-pointer select-none"
          onClick={() => setOpen(o => !o)}
        >
          <span className="text-cyan-400 font-semibold">🔬 Dev State Inspector</span>
          <span className="text-slate-500 text-[10px]">events: {eventCount} {open ? '▼' : '▶'}</span>
        </div>

        {open && (
          <div className="max-h-[80vh] overflow-y-auto p-3 space-y-0">

            <Section title="User">
              <KV label="id" value={user?.id?.slice(0, 12) + '…'} />
              <KV label="type" value={user?.type} />
              <KV label="results" value={user?.result_history.length} />
              <KV label="completed_slugs" value={user?.completed_slugs.length} />
              <KV label="last_active" value={user?.last_active_at?.slice(11, 19)} />
            </Section>

            <Section title="Profile — Domain Confidence">
              {Object.entries(domains).length === 0 && (
                <div className="text-slate-600">no profile data yet</div>
              )}
              {Object.entries(domains).map(([domain, dp]) => (
                <div key={domain} className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 w-20 shrink-0">{domain}</span>
                  <div className="flex-1 bg-slate-800 rounded h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all"
                      style={{ width: `${dp.confidence ?? 0}%` }}
                    />
                  </div>
                  <span className="text-slate-300 w-8 text-right">{dp.confidence ?? 0}%</span>
                </div>
              ))}
            </Section>

            <Section title="Next Recommendation (P-16)">
              {nextRec ? (
                <>
                  <KV label="slug" value={(nextRec as { instrument_slug?: string }).instrument_slug} />
                  <KV label="reason" value={(nextRec as { reason?: string }).reason} />
                  <KV label="priority" value={(nextRec as { priority?: string }).priority} />
                </>
              ) : (
                <div className="text-slate-600">none stored yet</div>
              )}
            </Section>

            <Section title="Journey States">
              {(journeyStates as Array<{ journey_id: string; completed_count: number; total_steps: number; progress_percent: number; ai_readiness: number }>).map(js => (
                <div key={js.journey_id} className="flex items-center gap-2 text-[11px] mb-1">
                  <span className="text-slate-500 w-20 shrink-0 truncate">{js.journey_id}</span>
                  <div className="flex-1 bg-slate-800 rounded h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${js.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-slate-300 w-8 text-right">{js.progress_percent}%</span>
                  <span className="text-yellow-500 w-8 text-right">AI:{js.ai_readiness}</span>
                </div>
              ))}
              {journeyStates.length === 0 && <div className="text-slate-600">no journeys started</div>}
            </Section>

            <div className="pt-2 mt-2 border-t border-slate-700 text-[10px] text-slate-600">
              Ctrl+Shift+D to toggle · ?devInspector=1
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
