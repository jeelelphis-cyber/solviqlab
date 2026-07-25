'use client'

// ─────────────────────────────────────────────────────────────────────────────
// MiaCoachBlock — appears after a health calculator result.
//
// Listens to the solviqlab:result event. When a health/wellness product fires,
// smoothly reveals MiaCoachExperience below the calculator card.
//
// No props needed — self-contained. Add <MiaCoachBlock /> once per page.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from 'react'
import { MiaCoachExperience }           from './MiaCoachExperience'
import { getBrowserRuntime }            from '@/lib/runtime'
import { getJourneyStrings }            from '@/lib/journey/strings'
import type { InstrumentResult }        from '@/lib/products/types'

const HEALTH_CLUSTERS = new Set(['weight', 'sleep', 'pregnancy'])

function detectCluster(slug: string, metadata: Record<string, unknown>): string {
  if (typeof metadata['cluster'] === 'string') return metadata['cluster']
  if (slug.includes('sleep'))                                                          return 'sleep'
  if (slug.includes('pregnancy') || slug.includes('due-date') || slug.includes('ovulation')) return 'pregnancy'
  if (slug.includes('bmi') || slug.includes('body-fat') || slug.includes('tdee') ||
      slug.includes('weight') || slug.includes('calorie') || slug.includes('bmr'))    return 'weight'
  return ''
}

interface MiaCoachBlockProps {
  readonly lang?: string
}

export function MiaCoachBlock({ lang = 'en' }: MiaCoachBlockProps) {
  const s = getJourneyStrings(lang)
  const [visible, setVisible] = useState(false)
  const [result,  setResult]  = useState<InstrumentResult | null>(null)
  const [userId,  setUserId]  = useState<string>('demo')
  const blockRef              = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const runtime = getBrowserRuntime()
    setUserId(runtime.userEngine.getUser()?.id ?? 'demo')

    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return

      const cluster = detectCluster(detail.slug, detail.metadata)
      if (!cluster || !HEALTH_CLUSTERS.has(cluster)) return

      setResult(detail)
      setVisible(true)

      setTimeout(() => {
        blockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }

    window.addEventListener('solviqlab:result', onResult)
    return () => window.removeEventListener('solviqlab:result', onResult)
  }, [])

  if (!visible || !result) return null

  const cluster = detectCluster(result.slug, result.metadata) || 'weight'
  const score   = typeof result.value === 'number' ? Math.round(result.value) : null

  return (
    <div
      ref={blockRef}
      className="mt-4 rounded-2xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-gray-900 overflow-hidden transition-all duration-500 animate-fade-in"
    >
      <div className="flex items-center gap-2 px-5 pt-4 pb-0">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 tracking-wide uppercase">
          {s.miaIsReady}
        </span>
      </div>

      <MiaCoachExperience
        userId={userId}
        score={score}
        cluster={cluster}
      />
    </div>
  )
}
