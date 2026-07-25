'use client'

import { coachAnalytics, navigationResolver } from '@/lib/coach'
import type { CoachMessage } from '@/lib/coach'
import { getTypeLabel } from '@/lib/coach/coach-i18n'

interface Props {
  readonly message: CoachMessage
  readonly lang:    string
}

const TYPE_STYLE: Record<string, string> = {
  insight:     'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
  explanation: 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900',
  celebration: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30',
  warning:     'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
  reflection:  'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
  preparation: 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30',
}

const TITLE_STYLE: Record<string, string> = {
  insight:     'text-blue-900 dark:text-blue-100',
  explanation: 'text-slate-900 dark:text-white',
  celebration: 'text-emerald-900 dark:text-emerald-100',
  warning:     'text-amber-900 dark:text-amber-100',
  reflection:  'text-blue-900 dark:text-blue-100',
  preparation: 'text-violet-900 dark:text-violet-100',
}

const LABEL_STYLE: Record<string, string> = {
  insight:     'text-blue-500',
  explanation: 'text-slate-400',
  celebration: 'text-emerald-500',
  warning:     'text-amber-500',
  reflection:  'text-blue-500',
  preparation: 'text-violet-500',
}

export function CoachMessageCard({ message, lang }: Props) {
  return (
    <div className={`rounded-2xl border p-6 space-y-3 ${TYPE_STYLE[message.type] ?? TYPE_STYLE.insight}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest ${LABEL_STYLE[message.type] ?? LABEL_STYLE.insight}`}>
        {getTypeLabel(message.type, lang)}
      </p>
      <h3 className={`text-base font-bold leading-snug ${TITLE_STYLE[message.type] ?? TITLE_STYLE.insight}`}>
        {message.title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        {message.body}
      </p>
      {message.actions.map(action => (
        <a
          key={action.actionId}
          href={navigationResolver.resolve(action.actionId, message.cluster, lang)}
          onClick={() => coachAnalytics.trackCTA(message, action.actionId)}
          className={`group flex items-center justify-center gap-2 w-full py-3 px-5 min-h-[44px] rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
            action.type === 'primary'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'border border-current text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
          }`}
        >
          {action.label}
          <svg className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" fill="none" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ))}
    </div>
  )
}
