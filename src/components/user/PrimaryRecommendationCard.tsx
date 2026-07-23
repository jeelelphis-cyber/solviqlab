// ─────────────────────────────────────────────────────────────────────────────
// PrimaryRecommendationCard
//
// Renders the engine's primary recommendation with full explainability.
// Displays: title, reason, scoring factors, estimated time, CTA button.
// This is what the AI Coach will narrate in V3-07.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link'
import type { Recommendation } from '@/lib/recommendation'

interface Props {
  readonly recommendation: Recommendation
  readonly lang: string
}

const TYPE_STYLES: Record<string, { border: string; badge: string; icon: string }> = {
  next_calculator:  { border: 'border-blue-300 dark:border-blue-600',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',   icon: '→' },
  ai_consultation:  { border: 'border-violet-300 dark:border-violet-600', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: '✦' },
  registration:     { border: 'border-amber-300 dark:border-amber-600',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  icon: '★' },
  cross_journey:    { border: 'border-emerald-300 dark:border-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: '+' },
  return_tomorrow:  { border: 'border-slate-300 dark:border-slate-600',  badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',  icon: '◷' },
}

const EXPECTED_VALUE_LABEL: Record<string, string> = {
  very_high: 'Very High Impact',
  high:      'High Impact',
  medium:    'Medium Impact',
  low:       'Low Impact',
}

export function PrimaryRecommendationCard({ recommendation: rec }: Props) {
  const style = TYPE_STYLES[rec.type] ?? TYPE_STYLES['next_calculator']!

  const ctaContent = (
    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
      {rec.cta_label}
      {rec.estimated_minutes != null && rec.estimated_minutes > 0 && (
        <span className="opacity-75 font-normal">· {rec.estimated_minutes} min</span>
      )}
    </span>
  )

  return (
    <div className={`rounded-2xl border-2 ${style.border} bg-white dark:bg-slate-900 p-4 flex flex-col gap-3`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{style.icon}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
            Next Step
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {EXPECTED_VALUE_LABEL[rec.expected_value] ?? ''}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-300 dark:text-slate-600 shrink-0">
          {rec.score}/100
        </span>
      </div>

      {/* Title + Reason */}
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-snug">
          {rec.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
          {rec.reason}
        </p>
      </div>

      {/* Scoring factors — explainability layer for AI Coach */}
      {rec.scoring.factors.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rec.scoring.factors.slice(0, 4).map((f, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      {rec.cta_href ? (
        <Link href={rec.cta_href}>{ctaContent}</Link>
      ) : (
        <div>{ctaContent}</div>
      )}
    </div>
  )
}
