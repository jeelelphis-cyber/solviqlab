'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { FeatureFlag } from '@/lib/premium/types'
import type { AccessDecision } from '@/lib/premium/types'
import { getBrowserRuntime } from '@/lib/runtime/platform'
import { PaywallCard } from './PaywallCard'

interface Props {
  readonly feature: FeatureFlag
  readonly lang: string
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

function resolveDecision(feature: FeatureFlag): AccessDecision {
  try {
    const runtime = getBrowserRuntime()
    const user    = runtime.userEngine.getUser()
    return runtime.premium.accessPolicy.evaluate(feature, user)
  } catch {
    // SSR / error — deny access safely
    return {
      allowed:      false,
      feature,
      requiredTier: 'pro',
      currentTier:  'free',
      reason:       'tier_insufficient',
    }
  }
}

export function PaywallGate({ feature, lang, children, fallback }: Props) {
  const decision    = resolveDecision(feature)
  const analyticsFired = useRef(false)

  // Fire paywall_shown analytics once when denied
  useEffect(() => {
    if (decision.allowed || analyticsFired.current) return
    analyticsFired.current = true
    try {
      const runtime = getBrowserRuntime()
      runtime.premium.analytics.trackPaywallShown(decision)
    } catch { /* non-critical */ }
  }, [decision.allowed, decision.feature])

  if (decision.allowed) return <>{children}</>

  return <>{fallback ?? <PaywallCard decision={decision} lang={lang} />}</>
}
