'use client'

import type { AccessDecision } from '@/lib/premium/types'
import { getPaywallCopy, getTierLabel } from '@/lib/premium/i18n'
import { SUBSCRIPTION_PLANS } from '@/lib/premium/plans'
import { getBrowserRuntime } from '@/lib/runtime/platform'

interface Props {
  readonly decision: AccessDecision
  readonly lang: string
}

export function PaywallCard({ decision, lang }: Props) {
  const copy        = getPaywallCopy(decision.feature, lang)
  const targetTier  = decision.requiredTier
  const targetLabel = targetTier ? getTierLabel(targetTier, lang) : null
  const plan        = targetTier ? SUBSCRIPTION_PLANS.find(p => p.tier === targetTier) : null

  function handleUpgradeClick() {
    if (!targetTier) return
    try {
      const runtime = getBrowserRuntime()
      runtime.premium.analytics.trackUpgradeClick(decision.feature, targetTier)
    } catch { /* non-critical */ }
  }

  return (
    <div className="rounded-2xl border border-violet-200 dark:border-violet-800
                    bg-violet-50 dark:bg-violet-950/30 p-6 space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400
                      uppercase tracking-widest">
          {copy.tierLabel}
        </p>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
          {copy.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {copy.body}
        </p>
      </div>

      {plan && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {targetLabel} — ${plan.price.monthly}/mo or ${plan.price.annual}/yr
        </p>
      )}

      <button
        onClick={handleUpgradeClick}
        className="w-full py-3 px-5 min-h-[44px]
                   bg-violet-600 hover:bg-violet-700 text-white
                   text-sm font-semibold rounded-xl
                   active:scale-[0.98] transition-all duration-150"
      >
        {copy.cta}
      </button>
    </div>
  )
}
