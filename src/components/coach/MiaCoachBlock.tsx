'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getBrowserRuntime } from '@/lib/runtime'
import { getT } from '@/lib/i18n/ui'
import type { InstrumentResult } from '@/lib/products/types'

const HEALTH_CLUSTERS = new Set(['weight', 'sleep', 'pregnancy'])

const MIA_PHOTO = 'https://files2.heygen.ai/avatar/v3/1f58c0f60faa4cb5bf6c465615e3fb18_39260/preview_target.webp'

function detectCluster(slug: string, metadata: Record<string, unknown>): string {
  if (typeof metadata['cluster'] === 'string') return metadata['cluster']
  if (slug.includes('sleep')) return 'sleep'
  if (slug.includes('pregnancy') || slug.includes('due-date') || slug.includes('ovulation')) return 'pregnancy'
  if (slug.includes('bmi') || slug.includes('body-fat') || slug.includes('tdee') ||
      slug.includes('weight') || slug.includes('calorie') || slug.includes('bmr')) return 'weight'
  return ''
}

interface MiaCoachBlockProps {
  readonly lang?: string
}

export function MiaCoachBlock({ lang = 'en' }: MiaCoachBlockProps) {
  const [visible, setVisible] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)
  const t = getT(lang)

  useEffect(() => {
    getBrowserRuntime()

    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return
      const cluster = detectCluster(detail.slug, detail.metadata)
      if (!cluster || !HEALTH_CLUSTERS.has(cluster)) return
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
      className="mt-4 rounded-2xl overflow-hidden border border-rose-900/30 bg-slate-900 animate-fade-in"
    >
      <div className="flex">
        {/* Photo */}
        <div className="relative w-32 sm:w-40 shrink-0 bg-gradient-to-b from-rose-950 to-purple-950">
          <img
            src={MIA_PHOTO}
            alt="Mia"
            className="w-full h-full object-cover object-top"
            style={{ minHeight: '180px' }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-900/40" />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between p-4 flex-1 min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[10px] font-semibold text-emerald-400 tracking-wide uppercase">
                {t('mia.block.ready')}
              </span>
            </div>
            <p className="text-white font-bold text-sm leading-tight mb-0.5">Mia</p>
            <p className="text-rose-300 text-[11px] font-medium mb-2">{t('mia.block.role')}</p>
            <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
              {t('mia.block.message')}
            </p>
          </div>

          <Link
            href={`/${lang}/coach/mia`}
            className="mt-3 block w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs text-center hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {t('mia.block.cta')}
          </Link>
          <p className="text-[10px] text-slate-500 text-center mt-1.5">{t('mia.block.free')}</p>
        </div>
      </div>
    </div>
  )
}
