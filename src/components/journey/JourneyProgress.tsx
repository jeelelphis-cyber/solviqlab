import { progressText } from './journey-copy'

// Per UX Bible Part III — The Progress Bias:
// "You're 33% closer to your personal plan." — not "Step 2 of 6"
// Segment bar fills with staggered animation (80ms per segment, starts after 500ms delay)

interface Props {
  readonly step: number
  readonly total: number
}

export function JourneyProgress({ step, total }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-[600ms] ${
              i < step
                ? 'bg-blue-500'
                : 'bg-slate-200 dark:bg-slate-700'
            }`}
            style={i < step ? { transitionDelay: `${i * 80 + 500}ms` } : undefined}
          />
        ))}
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        {progressText(step, total)}
      </p>
    </div>
  )
}
