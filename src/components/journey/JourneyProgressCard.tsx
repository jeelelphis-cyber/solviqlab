import { getJourneyPosition, JOURNEY_DEFINITIONS } from '@/lib/journey/config'
import { getJourneyStrings } from '@/lib/journey/strings'
import type { JourneyState } from '@/lib/user/types'

interface Props {
  readonly slug: string
  readonly lang: string
  // When provided, shows real user progress. When absent, falls back to position-based.
  readonly liveState?: JourneyState | null
}

export function JourneyProgressCard({ slug, lang, liveState }: Props) {
  const pos = getJourneyPosition(slug)
  if (!pos && !liveState) return null

  const s = getJourneyStrings(lang)

  // Resolve journey definition
  const journey = liveState
    ? (JOURNEY_DEFINITIONS.find(j => j.id === liveState.journey_id) ?? pos?.journey)
    : pos?.journey
  if (!journey) return null

  // Real vs position-based progress
  const completedSlugs  = liveState?.completed_slugs ?? []
  const completedCount  = liveState?.completed_count ?? (pos?.completedCount ?? 0)
  const totalSteps      = journey.steps.length
  const progressPercent = liveState?.progress_percent ?? (pos?.progressPercent ?? 0)
  const currentIndex    = pos?.currentIndex ?? 0
  const isLive          = !!liveState

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{journey.emoji}</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">
            {journey.name}
          </span>
          {isLive && (
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900">
              live
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
          {s.stepN(Math.min(completedCount + 1, totalSteps), totalSteps)}
        </span>
      </div>

      {/* Steps list */}
      <ol className="space-y-2 mb-4">
        {journey.steps.map((step, i) => {
          const isCompleted = isLive
            ? completedSlugs.includes(step.slug)
            : i < currentIndex
          const isCurrent = !isCompleted && (isLive
            ? step.slug === slug
            : i === currentIndex)
          const isNext = !isCompleted && !isCurrent && (isLive
            ? !completedSlugs.includes(step.slug) && i === journey.steps.findIndex(s => !completedSlugs.includes(s.slug))
            : i === currentIndex + 1)

          return (
            <li key={step.slug} className="flex items-center gap-3">
              {/* Indicator */}
              <div className={[
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                isCompleted
                  ? 'bg-blue-600 dark:bg-blue-500'
                  : isCurrent
                    ? 'border-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
              ].join(' ')}>
                {isCompleted ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2.5 6l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                ) : (
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600">{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <span className={[
                'text-sm leading-tight flex-1',
                isCompleted
                  ? 'text-slate-400 dark:text-slate-500 line-through'
                  : isCurrent
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400',
              ].join(' ')}>
                {step.shortName}
              </span>

              {isCurrent && (
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
                  {s.currentLabel}
                </span>
              )}
              {isNext && !isCurrent && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  {s.upcomingLabel}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">{journey.profileLabel}</span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
            style={{ width: `${Math.max(progressPercent, 3)}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {completedCount} / {totalSteps} {s.completedLabel.toLowerCase()}
        </p>
      </div>
    </div>
  )
}
