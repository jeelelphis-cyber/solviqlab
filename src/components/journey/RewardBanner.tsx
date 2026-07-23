import { getStepReward } from '@/lib/journey/rewards'
import { getJourneyPosition } from '@/lib/journey/config'

interface Props {
  readonly slug: string
  readonly lang: string
}

export function RewardBanner({ slug }: Props) {
  const reward = getStepReward(slug)
  const pos = getJourneyPosition(slug)
  if (!reward || !pos) return null

  const aiPct = Math.min(pos.progressPercent + reward.aiReadinessContribution, 100)

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3">

      {/* Step completed */}
      <div className="flex items-center gap-3 flex-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 px-4 py-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 16 16">
            <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {reward.completionLabel}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            {reward.profileInsight}
          </p>
        </div>
      </div>

      {/* AI readiness */}
      <div className="flex items-center gap-3 flex-1 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/50 px-4 py-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
          <svg className="w-4 h-4 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 16 16">
            <path d="M8 2C5.24 2 3 4.24 3 7c0 1.86.99 3.49 2.46 4.4L5 13h6l-.46-1.6A5 5 0 0013 7c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-violet-800 dark:text-violet-300">AI Consultation</p>
            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">{aiPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-violet-100 dark:bg-violet-900/50 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
              style={{ width: `${aiPct}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}
