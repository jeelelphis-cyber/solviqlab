import type { ReactNode } from 'react'

// Per UX Bible Part V — Border Radius:
// Cards: rounded-2xl (16px) outer, rounded-xl (12px) internal. Never mix.

interface Props {
  readonly children: ReactNode
}

export function JourneyCard({ children }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
      {children}
    </div>
  )
}
