import { getJourneyPosition } from '@/lib/journey/config'
import { getJourneyStrings } from '@/lib/journey/strings'

interface Props {
  readonly slug: string
  readonly lang: string
}

export function UnlockCard({ slug, lang }: Props) {
  const pos = getJourneyPosition(slug)
  if (!pos) return null
  if (pos.stepsUntilUnlock <= 0) return null  // already unlocked, don't show

  const s = getJourneyStrings(lang)
  const { journey, stepsUntilUnlock, currentIndex, totalSteps } = pos

  // Show dots representing progress toward unlock
  const unlockAt = journey.unlockAtStep
  const dotsTotal = Math.min(unlockAt, totalSteps)
  const dotsFilled = Math.min(currentIndex, dotsTotal)

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-5">
      <div className="flex items-start gap-4">
        {/* Lock icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 20 20">
            <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            {s.stepsToUnlock(stepsUntilUnlock, journey.unlockReward)}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
            {s.stepsRemaining(stepsUntilUnlock)}
          </p>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: dotsTotal }).map((_, i) => (
              <div
                key={i}
                className={[
                  'w-2 h-2 rounded-full transition-colors',
                  i < dotsFilled
                    ? 'bg-amber-500 dark:bg-amber-400'
                    : 'bg-amber-200 dark:bg-amber-800',
                ].join(' ')}
              />
            ))}
            <span className="ml-1 text-xs text-amber-600 dark:text-amber-500">
              {dotsFilled}/{dotsTotal}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
