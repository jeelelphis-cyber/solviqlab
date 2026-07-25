'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { IntentCluster } from '@/lib/assessment/types'

interface AssessmentTriggeredDetail {
  type: 'platform:assessment_triggered'
  cluster: IntentCluster
  userId: string
  timestamp: number
}

interface Props {
  readonly lang: string
}

const CLUSTER_LABELS: Record<string, Record<string, string>> = {
  en: { weight: 'Weight',  sleep: 'Sleep',  finance: 'Finance' },
  uk: { weight: 'Здоров\'я', sleep: 'Сон',  finance: 'Фінанси' },
  es: { weight: 'Peso',    sleep: 'Sueño',  finance: 'Finanzas' },
}

const BANNER_COPY: Record<string, { title: (l: string) => string; sub: string; btn: string }> = {
  en: { title: l => `${l} Assessment unlocked`,           sub: 'You have enough data for a personalised assessment.', btn: 'Start →' },
  uk: { title: l => `${l} — оцінка розблокована`,         sub: 'У тебе достатньо даних для персональної оцінки.',     btn: 'Почати →' },
  es: { title: l => `Evaluación de ${l} desbloqueada`,    sub: 'Tienes suficientes datos para una evaluación personal.', btn: 'Empezar →' },
}

// Shows a dismissible banner when the Assessment becomes available.
// Triggered by platform:assessment_triggered from EventBus P30 handler.
export function AssessmentUnlockedBanner({ lang }: Props) {
  const [cluster, setCluster] = useState<IntentCluster | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AssessmentTriggeredDetail>).detail
      if (detail?.cluster) {
        setCluster(detail.cluster)
        setDismissed(false)
      }
    }

    window.addEventListener('platform:assessment_triggered', handler)
    return () => window.removeEventListener('platform:assessment_triggered', handler)
  }, [])

  if (!cluster || dismissed) return null

  const labels = CLUSTER_LABELS[lang] ?? CLUSTER_LABELS.en!
  const copy   = BANNER_COPY[lang]   ?? BANNER_COPY.en!
  const label  = labels[cluster] ?? cluster
  const href   = `/${lang}/assessment/${cluster}`

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
      <div className="bg-emerald-600 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-300">
        <span className="text-2xl mt-0.5">🎯</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">
            {copy.title(label)}
          </p>
          <p className="text-emerald-100 text-xs mt-0.5">
            {copy.sub}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={href}
            className="bg-white text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            {copy.btn}
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-emerald-200 hover:text-white text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
