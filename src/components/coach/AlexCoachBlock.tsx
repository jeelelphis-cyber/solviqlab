'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getBrowserRuntime } from '@/lib/runtime'
import { t as uiT } from '@/lib/ui-strings'
import type { InstrumentResult } from '@/lib/products/types'

const FINANCE_CLUSTERS = new Set(['finance'])

const ALEX_PHOTO = 'https://files2.heygen.ai/avatar/v3/25ef6c86b1e946969d9a684870c47dfe_14947/preview_talk_1.webp'

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
  const s = uiT(lang)

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
      className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 animate-fade-in"
    >
      <div className="flex">
        {/* Photo — same as homepage card */}
        <div className="relative w-28 sm:w-36 shrink-0 bg-gradient-to-br from-blue-500/30 to-cyan-700/30 overflow-hidden">
          <img
            src={ALEX_PHOTO}
            alt="Alex"
            className="w-full h-full object-cover object-top"
            style={{ minHeight: '170px' }}
            loading="lazy"
          />
        </div>

        {/* Content — same fields as homepage */}
        <div className="flex flex-col flex-1 px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-bold text-sm">Alex</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-400 text-[9px] font-semibold uppercase tracking-wide">{s.coachOnlineNow}</span>
            </div>
          </div>
          <p className="text-blue-300 text-[11px] font-medium mb-0.5">{s.coachAlexRole}</p>
          <p className="text-white/40 text-[10px] leading-tight mb-2">{s.coachAlexSpec}</p>

          <div className="mt-auto pt-1">
            <Link
              href={`/${lang}/coach/alex`}
              className="block w-full py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs font-bold text-center hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {s.coachTalkTo('Alex')}
            </Link>
            <p className="text-center text-[9px] text-white/30 mt-1">{s.coachFreeSession}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
