import { getJourneyPosition } from '@/lib/journey/config'
import { getStepReward } from '@/lib/journey/rewards'
import { getJourneyStrings } from '@/lib/journey/strings'

interface Props {
  readonly slug: string
  readonly lang: string
}

export function AIConsultCard({ slug, lang }: Props) {
  const pos = getJourneyPosition(slug)
  const reward = getStepReward(slug)
  const s = getJourneyStrings(lang)

  const isLocked = !pos || pos.stepsUntilUnlock > 0
  const aiPct = reward
    ? Math.min((pos?.progressPercent ?? 0) + reward.aiReadinessContribution, 100)
    : (pos?.progressPercent ?? 0)

  // Specific unlock message based on steps remaining
  const stepsLeft = pos?.stepsUntilUnlock ?? null
  const unlockMsg = stepsLeft === 1
    ? s.aiUnlockHint('')
    : stepsLeft !== null && stepsLeft > 1
      ? `Complete ${stepsLeft} more steps to unlock`
      : null

  return (
    <div
      className={[
        'rounded-2xl border p-4 relative overflow-hidden transition-all',
        isLocked
          ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'
          : 'border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
      ].join(' ')}
    >
      {/* Locked overlay */}
      {isLocked && (
        <div className="absolute inset-0 rounded-2xl z-10 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[2px] rounded-2xl" />
          <div className="relative flex flex-col items-center gap-2 text-center px-4">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 20 20">
                <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            {unlockMsg && (
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-[140px] leading-snug">
                {unlockMsg}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Card body (blurred when locked) */}
      <div className={isLocked ? 'blur-[2px] select-none pointer-events-none' : ''}>
        <div className="flex items-start gap-3">
          <div className={[
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center',
            isLocked ? 'bg-slate-200 dark:bg-slate-700' : 'bg-violet-100 dark:bg-violet-900/50',
          ].join(' ')}>
            <svg className={['w-4 h-4', isLocked ? 'text-slate-400' : 'text-violet-600 dark:text-violet-400'].join(' ')} fill="none" viewBox="0 0 20 20">
              <path d="M10 2C6.686 2 4 4.686 4 8c0 2.122 1.07 3.99 2.7 5.1L6 16h8l-.7-2.9C14.93 11.99 16 10.122 16 8c0-3.314-2.686-6-6-6z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
              <path d="M7.5 8.5h5M8.5 11h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {s.aiConsultTitle}
              </h3>
              {isLocked && (
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                  {s.aiConsultLocked}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {s.aiConsultDescription}
            </p>
          </div>
        </div>

        {/* AI readiness progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wide">
              AI Readiness
            </span>
            <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400">
              {aiPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
              style={{ width: `${Math.max(aiPct, 4)}%` }}
            />
          </div>
        </div>

        {/* Feature preview */}
        <div className="mt-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-slate-100/80 dark:border-slate-700/50 p-2.5 space-y-1">
          {['Personalized health insights', 'Trend analysis across results', 'Actionable next steps'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-violet-400 dark:bg-violet-500 flex-shrink-0" />
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
