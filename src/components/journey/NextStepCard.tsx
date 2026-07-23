import Link from 'next/link'
import { getNextStep, getJourneyPosition } from '@/lib/journey/config'
import { getJourneyStrings } from '@/lib/journey/strings'
import { buildCTA } from '@/lib/journey/cta'

interface Props {
  readonly slug: string
  readonly lang: string
}

// Urgency accent colours
const URGENCY_STYLES = {
  low:      { border: 'border-blue-100 dark:border-blue-900/50',    bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40',   dot: 'bg-blue-500',   badge: 'text-blue-600 dark:text-blue-400',   btn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',   urgencyBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900' },
  medium:   { border: 'border-blue-200 dark:border-blue-800/60',    bg: 'from-blue-50 to-violet-50 dark:from-blue-950/50 dark:to-violet-950/40',    dot: 'bg-blue-600',   badge: 'text-blue-700 dark:text-blue-300',   btn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',   urgencyBg: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900' },
  high:     { border: 'border-amber-200 dark:border-amber-800/50',  bg: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30',  dot: 'bg-amber-500',  badge: 'text-amber-700 dark:text-amber-400',  btn: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',  urgencyBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-900' },
  critical: { border: 'border-emerald-200 dark:border-emerald-800/50', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30', dot: 'bg-emerald-500', badge: 'text-emerald-700 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800', urgencyBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900' },
}

export function NextStepCard({ slug, lang }: Props) {
  const nextStep = getNextStep(slug)
  if (!nextStep) return null

  const pos = getJourneyPosition(slug)
  const s = getJourneyStrings(lang)

  // Build dynamic CTA
  const cta = pos
    ? buildCTA(pos, nextStep.nextName, nextStep.estimatedMinutes, lang)
    : null

  const urgency = cta?.urgency ?? 'low'
  const style = URGENCY_STYLES[urgency]
  const href = `/${lang}/calculators/${nextStep.nextSlug}`

  return (
    <div
      id="journey-next-step"
      className={`mt-6 rounded-2xl border ${style.border} bg-gradient-to-br ${style.bg} p-6 shadow-sm`}
    >
      {/* Header label */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${style.badge} uppercase tracking-widest`}>
          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
          {s.recommendedNextStep}
        </span>
        {pos && (
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
            {s.stepN(pos.currentIndex + 2, pos.totalSteps)}
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {nextStep.nextName}
          </h3>

          {/* Conversion psychology — reason */}
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
            {nextStep.reason}
          </p>
        </div>

        {/* Urgency message — "Why Now" hook */}
        {cta?.urgencyMessage && (
          <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${style.urgencyBg}`}>
            {cta.urgencyMessage}
          </div>
        )}

        {/* Benefits — "What You Get" */}
        <ul className="space-y-1.5">
          {nextStep.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 10 10">
                  <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* Meta row — time + profile contribution */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-slate-800/80 rounded-full px-3 py-1 border border-slate-200/80 dark:border-slate-700/80">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25" />
              <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
            {s.minutesLabel(nextStep.estimatedMinutes)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/30 rounded-full px-3 py-1 border border-emerald-200/80 dark:border-emerald-800/80">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5l3.5-.5L8 2z" />
            </svg>
            {s.profileContribution(nextStep.profileLabel, nextStep.profileContribution)}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">free · no signup</span>
        </div>

        {/* Primary CTA */}
        <Link
          href={href}
          data-journey-cta={cta?.trackingLabel ?? 'journey_cta'}
          data-journey-next={nextStep.nextSlug}
          className={`group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 ${style.btn} text-white font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
        >
          <span>{cta?.text ?? s.continueJourney}</span>
          {cta?.subtext && (
            <span className="text-white/70 font-normal">· {cta.subtext}</span>
          )}
          <svg
            className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform"
            fill="none" viewBox="0 0 16 16"
          >
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
