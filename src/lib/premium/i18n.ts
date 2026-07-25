import type { FeatureFlag, SubscriptionTier } from './types'

export interface PaywallCopy {
  readonly title: string
  readonly body: string
  readonly cta: string
  readonly tierLabel: string
}

type PaywallCopyMap = Partial<Record<FeatureFlag, PaywallCopy>>

const TIER_LABELS_EN: Record<SubscriptionTier, string> = {
  free:       'Free',
  pro:        'Pro',
  enterprise: 'Enterprise',
}

const EN: PaywallCopyMap = {
  multi_cluster: {
    title:     'Unlock all journeys',
    body:      'Access Weight, Sleep, Financial, and all other journeys with a Pro account.',
    cta:       'Upgrade to Pro',
    tierLabel: 'Pro Feature',
  },
  coach_advanced: {
    title:     'Advanced Coach insights',
    body:      'Get AI-powered recommendations tailored to your full history.',
    cta:       'Upgrade to Pro',
    tierLabel: 'Pro Feature',
  },
  coach_history_unlimited: {
    title:     'Unlimited Coach history',
    body:      'Your free account shows the last 10 messages. Pro gives you everything.',
    cta:       'Upgrade to Pro',
    tierLabel: 'Pro Feature',
  },
  export_data: {
    title:     'Export your data',
    body:      'Download all your results and journey history as CSV or JSON.',
    cta:       'Upgrade to Pro',
    tierLabel: 'Pro Feature',
  },
  sync_multi_device: {
    title:     'Access from any device',
    body:      'Your progress syncs automatically across all your devices.',
    cta:       'Upgrade to Pro',
    tierLabel: 'Pro Feature',
  },
  journey_insights: {
    title:     'Deep journey analytics',
    body:      'See trends, milestone charts, and progress breakdowns over time.',
    cta:       'Upgrade to Pro',
    tierLabel: 'Pro Feature',
  },
  ai_consultation: {
    title:     'AI Consultation',
    body:      'Have a real conversation with your AI health coach, powered by the latest models.',
    cta:       'Upgrade to Enterprise',
    tierLabel: 'Enterprise Feature',
  },
  priority_support: {
    title:     'Priority support',
    body:      'Get answers in hours, not days, from our dedicated support team.',
    cta:       'Upgrade to Enterprise',
    tierLabel: 'Enterprise Feature',
  },
}

const ES: PaywallCopyMap = {
  multi_cluster: {
    title:     'Desbloquea todos los caminos',
    body:      'Accede a Peso, Sueño, Finanzas y todos los demás caminos con una cuenta Pro.',
    cta:       'Actualizar a Pro',
    tierLabel: 'Función Pro',
  },
  coach_advanced: {
    title:     'Perspectivas avanzadas del Coach',
    body:      'Obtén recomendaciones con IA adaptadas a todo tu historial.',
    cta:       'Actualizar a Pro',
    tierLabel: 'Función Pro',
  },
  sync_multi_device: {
    title:     'Accede desde cualquier dispositivo',
    body:      'Tu progreso se sincroniza automáticamente en todos tus dispositivos.',
    cta:       'Actualizar a Pro',
    tierLabel: 'Función Pro',
  },
  export_data: {
    title:     'Exporta tus datos',
    body:      'Descarga todos tus resultados e historial de caminos en CSV o JSON.',
    cta:       'Actualizar a Pro',
    tierLabel: 'Función Pro',
  },
}

const LOCALES: Record<string, PaywallCopyMap> = { es: ES }

export function getPaywallCopy(feature: FeatureFlag, lang: string): PaywallCopy {
  const locale  = LOCALES[lang] ?? {}
  const copy    = locale[feature] ?? EN[feature]
  return copy ?? {
    title:     'Premium Feature',
    body:      'Upgrade your account to access this feature.',
    cta:       'Upgrade',
    tierLabel: 'Premium',
  }
}

export function getTierLabel(tier: SubscriptionTier, lang: string): string {
  if (lang === 'es') {
    const ES_LABELS: Record<SubscriptionTier, string> = { free: 'Gratis', pro: 'Pro', enterprise: 'Empresa' }
    return ES_LABELS[tier]
  }
  return TIER_LABELS_EN[tier]
}
