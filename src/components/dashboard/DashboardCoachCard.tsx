import type { IntentCluster } from '@/lib/assessment/types'
import { getT } from '@/lib/i18n/ui'

interface Props {
  readonly cluster: IntentCluster
  readonly lang: string
}

const MIA_CONFIG = {
  name:        'Mia',
  photo:       'https://files2.heygen.ai/avatar/v3/1f58c0f60faa4cb5bf6c465615e3fb18_39260/preview_target.webp',
  gradient:    'from-rose-500/30 to-purple-700/30',
  btnGradient: 'from-rose-500 to-purple-600',
  borderHover: 'hover:border-rose-400/40',
  roleKey:     'dashboard.coach.mia.role',
  bodyKey:     'dashboard.coach.mia.body',
  href:        (lang: string) => `/${lang}/coach/mia`,
}

const ALEX_CONFIG = {
  name:        'Alex',
  photo:       'https://files2.heygen.ai/avatar/v3/25ef6c86b1e946969d9a684870c47dfe_14947/preview_talk_1.webp',
  gradient:    'from-blue-500/30 to-cyan-700/30',
  btnGradient: 'from-blue-500 to-cyan-600',
  borderHover: 'hover:border-blue-400/40',
  roleKey:     'dashboard.coach.alex.role',
  bodyKey:     'dashboard.coach.alex.body',
  href:        (lang: string) => `/${lang}/coach/alex`,
}

function resolveCoachConfig(cluster: IntentCluster) {
  return cluster === 'finance' ? ALEX_CONFIG : MIA_CONFIG
}

export function DashboardCoachCard({ cluster, lang }: Props) {
  const t      = getT(lang)
  const config = resolveCoachConfig(cluster)

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {t('dashboard.coach.label')}
        </p>
      </div>

      <a
        href={config.href(lang)}
        className={`group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${config.borderHover}`}
      >
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} overflow-hidden shrink-0`}>
          <img
            src={config.photo}
            alt={config.name}
            className="w-full h-full object-cover object-top"
            loading="lazy"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-bold text-slate-900 dark:text-white text-sm">{config.name}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-500 dark:text-emerald-400 text-[9px] font-semibold uppercase tracking-wide">
                {t('dashboard.coach.online')}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
            {t(config.bodyKey)}
          </p>
        </div>

        {/* CTA */}
        <div className={`shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r ${config.btnGradient} text-white text-xs font-semibold`}>
          {t('dashboard.coach.cta', { name: config.name })}
        </div>
      </a>
    </div>
  )
}
