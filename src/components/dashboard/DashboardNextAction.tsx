import type { IntentPhase } from '@/lib/domain/intent-state'
import type { IntentCluster } from '@/lib/assessment/types'
import { ASSESSMENT_SLUGS }  from '@/lib/domain/intent-state'
import { CLUSTER_ASSESSMENT_NAME, TIME_ESTIMATE } from '@/components/journey/journey-copy'
import { getPhaseActionLabel, getPhaseActionWhy } from './dashboard-copy'
import { getT } from '@/lib/i18n/ui'

interface Props {
  readonly phase: IntentPhase
  readonly cluster: IntentCluster
  readonly lang: string
  readonly nextSlug: string | null
  readonly nextName: string | null
}

function resolveHref(
  phase: IntentPhase,
  cluster: IntentCluster,
  slug: string | null,
  lang: string,
): string {
  if (phase === 'assessment') return `/${lang}/assessment/${cluster}`
  if (phase === 'planning')   return `/${lang}/plan/${cluster}`
  if (!slug) return `/${lang}/assessment/${cluster}`
  if (ASSESSMENT_SLUGS.has(slug)) return `/${lang}/assessment/${slug.replace('-assessment', '')}`
  return `/${lang}/calculators/${slug}`
}

function resolveStepName(
  phase: IntentPhase,
  cluster: IntentCluster,
  slug: string | null,
  name: string | null,
  lang: string,
): string {
  const t = getT(lang)
  if (phase === 'assessment') return CLUSTER_ASSESSMENT_NAME[cluster]
  if (phase === 'planning')   return t('dashboard.set_goal')
  if (!slug) return CLUSTER_ASSESSMENT_NAME[cluster]
  return name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export function DashboardNextAction({ phase, cluster, lang, nextSlug, nextName }: Props) {
  const t        = getT(lang)
  const href     = resolveHref(phase, cluster, nextSlug, lang)
  const stepName = resolveStepName(phase, cluster, nextSlug, nextName, lang)
  const time     = TIME_ESTIMATE[nextSlug ?? ''] ?? TIME_ESTIMATE[`${cluster}-assessment`] ?? '3 min'
  const ctaLabel = getPhaseActionLabel(phase, lang)
  const whyNow   = getPhaseActionWhy(phase, lang)

  return (
    <div className="rounded-2xl bg-blue-600 text-white p-5 space-y-4">

      <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-200">
        {t('dashboard.today_action')}
      </p>

      <div className="flex items-start justify-between gap-3">
        <p className="text-xl font-bold leading-snug">
          {stepName}
        </p>
        <span className="shrink-0 text-[11px] font-medium bg-white/20 px-2.5 py-1 rounded-full">
          {time}
        </span>
      </div>

      <p className="text-[11px] text-blue-100 leading-relaxed">
        {whyNow}
      </p>

      <a
        href={href}
        className="group flex items-center justify-center gap-2 w-full
                   py-3 px-5 min-h-[44px]
                   bg-white text-blue-600 text-sm font-bold
                   rounded-xl hover:bg-blue-50 active:scale-[0.98]
                   transition-all duration-150"
      >
        {ctaLabel}
        <svg
          className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5"
          fill="none"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  )
}
