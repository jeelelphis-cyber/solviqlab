// Per UX Bible Part III — The Unlock Mechanic:
// Every step must preview what it unlocks — as a promise of personal value.
// "After this: Assessment → Strategy → Plan → Coach"

interface Props {
  readonly steps: readonly string[]
}

export function JourneyUnlock({ steps }: Props) {
  if (steps.length === 0) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider shrink-0">
        After this:
      </span>
      {steps.map((step, i) => (
        <span key={step} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-slate-300 dark:text-slate-600 text-[10px]" aria-hidden="true">→</span>
          )}
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {step}
          </span>
        </span>
      ))}
    </div>
  )
}
