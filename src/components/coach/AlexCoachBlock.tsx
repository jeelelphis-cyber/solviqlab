'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getBrowserRuntime } from '@/lib/runtime'
import { getT } from '@/lib/i18n/ui'
import type { InstrumentResult } from '@/lib/products/types'

const FINANCE_CLUSTERS = new Set(['finance'])

function detectCluster(slug: string, metadata: Record<string, unknown>): string {
  if (typeof metadata['cluster'] === 'string') return metadata['cluster']
  if (slug.includes('budget') || slug.includes('loan') || slug.includes('mortgage') ||
      slug.includes('savings') || slug.includes('investment') || slug.includes('compound') ||
      slug.includes('debt') || slug.includes('retirement') || slug.includes('tax') ||
      slug.includes('finance') || slug.includes('salary') || slug.includes('roi')) return 'finance'
  return ''
}

interface AlexCoachBlockProps {
  readonly lang?: string
}

export function AlexCoachBlock({ lang = 'en' }: AlexCoachBlockProps) {
  const [visible, setVisible] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  const t = getT(lang)

  useEffect(() => {
    getBrowserRuntime()

    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return
      const cluster = detectCluster(detail.slug, detail.metadata)
      if (!cluster || !FINANCE_CLUSTERS.has(cluster)) return
      setVisible(true)
      setTimeout(() => {
        blockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }

    window.addEventListener('solviqlab:result', onResult)
    return () => window.removeEventListener('solviqlab:result', onResult)
  }, [])

  if (!visible) return null

  return (
    <div
      ref={blockRef}
      className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-5 transition-all duration-500 animate-fade-in"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
          {t('alex.block.ready')}
        </span>
      </div>

      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{t('alex.block.role')}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('alex.block.message')}
          </p>
        </div>
      </div>

      <Link
        href={`/${lang}/coach/alex`}
        className="block w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold text-sm text-center hover:opacity-90 active:scale-[0.98] transition-all"
      >
        {t('alex.block.cta')}
      </Link>
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-2">{t('alex.block.free')}</p>
    </div>
  )
}
