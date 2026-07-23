'use client'

// ─────────────────────────────────────────────────────────────────────────────
// RegistrationPrompt — "Save your progress" CTA
//
// Appears only after meaningful value has been demonstrated.
// Never interrupts. Never blocks.
//
// V3-03: UI only — no actual auth. Links to future /register page.
// V3-04: Will wire to Google OAuth / magic link.
// ─────────────────────────────────────────────────────────────────────────────

import type { RegistrationTriggerResult, JourneyState } from '@/lib/user'
import { getRegistrationPromptStrings } from '@/lib/ui-strings'

interface Props {
  readonly lang: string
  readonly trigger: RegistrationTriggerResult
  readonly journeyState: JourneyState | null
  readonly onDismiss: () => void
}


const URGENCY_STYLE = {
  low:    'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
  medium: 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40',
  high:   'border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40',
}

export function RegistrationPrompt({ lang, trigger, journeyState, onDismiss }: Props) {
  const s = getRegistrationPromptStrings(lang)
  const style = URGENCY_STYLE[trigger.urgency]

  return (
    <div className={`mt-4 rounded-2xl border ${style} p-5 shadow-sm`}>
      <div className="flex items-start gap-4">

        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 20 20">
            <path d="M10 2a6 6 0 016 6v1h1a1 1 0 010 2H3a1 1 0 010-2h1V8a6 6 0 016-6z" stroke="currentColor" strokeWidth="1.25" />
            <path d="M8 14a2 2 0 104 0" stroke="currentColor" strokeWidth="1.25" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
            {s.title}
          </h4>

          {/* Trigger message */}
          {trigger.message && (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              {trigger.message}
            </p>
          )}

          {/* Progress summary */}
          {journeyState && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ width: `${journeyState.progress_percent}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                {journeyState.progress_percent}%
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <a
              href={`/${lang}/register`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
                <path d="M12 7A5 5 0 112 7a5 5 0 0110 0z" stroke="currentColor" strokeWidth="1.25" />
                <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
              </svg>
              {s.cta}
            </a>
            <span className="text-xs text-slate-400 dark:text-slate-500">{s.sub}</span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          aria-label={s.dismiss}
          className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {s.dismiss}
        </button>
      </div>
    </div>
  )
}
