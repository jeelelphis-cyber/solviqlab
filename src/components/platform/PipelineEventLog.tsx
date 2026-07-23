'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  id: string
  type: string
  detail: string
  ts: number
}

const PLATFORM_EVENTS = [
  'platform:intent_state_updated',
  'platform:profile_recalculated',
  'platform:assessment_triggered',
  'platform:recommendation_updated',
  'platform:journey_step_completed',
  'solviqlab:result',
]

const EVENT_COLOR: Record<string, string> = {
  'solviqlab:result':                  'text-blue-400',
  'platform:intent_state_updated':     'text-green-400',
  'platform:profile_recalculated':     'text-yellow-400',
  'platform:assessment_triggered':     'text-purple-400',
  'platform:recommendation_updated':   'text-emerald-400',
  'platform:journey_step_completed':   'text-cyan-400',
}

// Dev-only floating event log — shows platform events in real-time.
// Only renders when NEXT_PUBLIC_PLATFORM_LOG=true.
export function PipelineEventLog() {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [open, setOpen] = useState(true)

  const enabled = typeof window !== 'undefined' &&
    (window.location.search.includes('platformLog=1') ||
     localStorage.getItem('solviqlab:dev:eventLog') === 'true')

  useEffect(() => {
    if (!enabled) return

    const handlers: Array<() => void> = []

    for (const eventType of PLATFORM_EVENTS) {
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail ?? {}
        const key = eventType === 'solviqlab:result' ? 'slug' :
                    eventType === 'platform:assessment_triggered' ? 'cluster' :
                    eventType === 'platform:recommendation_updated' ? 'topSlug' :
                    eventType === 'platform:profile_recalculated' ? 'domainsChanged' :
                    'changedFields'
        const val = detail[key]
        const label = Array.isArray(val) ? val.join(', ') : String(val ?? '')

        setEntries(prev => [
          {
            id: `${Date.now()}-${Math.random()}`,
            type: eventType.replace('platform:', 'P:').replace('solviqlab:', ''),
            detail: label,
            ts: Date.now(),
          },
          ...prev.slice(0, 19),  // keep last 20
        ])
      }

      window.addEventListener(eventType, handler)
      handlers.push(() => window.removeEventListener(eventType, handler))
    }

    return () => handlers.forEach(h => h())
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 font-mono text-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
        <div
          className="flex items-center justify-between px-3 py-2 bg-slate-800 cursor-pointer select-none"
          onClick={() => setOpen(o => !o)}
        >
          <span className="text-slate-300 font-semibold">⚡ Platform Events</span>
          <span className="text-slate-500">{open ? '▼' : '▶'}</span>
        </div>

        {open && (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
            {entries.length === 0 && (
              <div className="px-3 py-4 text-slate-500 text-center">
                Waiting for events…
              </div>
            )}
            {entries.map(entry => (
              <div key={entry.id} className="px-3 py-1.5 flex gap-2 items-baseline">
                <span className={`shrink-0 ${EVENT_COLOR[
                  PLATFORM_EVENTS.find(e =>
                    e.replace('platform:', 'P:').replace('solviqlab:', '') === entry.type
                  ) ?? ''
                ] ?? 'text-slate-400'}`}>
                  {entry.type}
                </span>
                {entry.detail && (
                  <span className="text-slate-400 truncate">{entry.detail}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
