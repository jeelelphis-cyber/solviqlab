'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getBrowserRuntime } from '@/lib/runtime'
import { t as uiT, type UIStrings } from '@/lib/ui-strings'
import type { InstrumentResult } from '@/lib/products/types'

// ─── Coach Registry ───────────────────────────────────────────────────────────
// To add a new coach: add one entry here. Nothing else changes.

interface CoachConfig {
  id: string
  clusters: string[]           // which clusters trigger this coach
  slugPatterns?: string[]      // optional: slug keyword fallback
  name: string
  photo: string
  gradientPhoto: string        // tailwind classes for photo bg
  gradientCta: string          // tailwind classes for CTA button
  roleColor: string            // tailwind text color for role
  getRole: (s: UIStrings) => string
  getSpec: (s: UIStrings) => string
  getCta:  (s: UIStrings) => string
  href:    (lang: string) => string
}

const COACH_REGISTRY: CoachConfig[] = [
  {
    id: 'mia',
    clusters: ['weight', 'sleep', 'pregnancy'],
    slugPatterns: ['bmi', 'body-fat', 'tdee', 'calorie', 'bmr', 'sleep', 'pregnancy', 'due-date', 'ovulation', 'weight'],
    name: 'Mia',
    photo: 'https://files2.heygen.ai/avatar/v3/1f58c0f60faa4cb5bf6c465615e3fb18_39260/preview_target.webp',
    gradientPhoto: 'bg-gradient-to-br from-rose-500/30 to-purple-700/30',
    gradientCta:   'bg-gradient-to-r from-rose-500 to-purple-600',
    roleColor:     'text-rose-300',
    getRole: s => s.coachMiaRole,
    getSpec: s => s.coachMiaSpec,
    getCta:  s => s.coachTalkTo('Mia'),
    href:    lang => `/${lang}/coach/mia`,
  },
  {
    id: 'alex',
    clusters: ['finance'],
    slugPatterns: ['loan', 'mortgage', 'savings', 'investment', 'compound', 'retirement', 'tax', 'salary', 'budget', 'roi', 'debt'],
    name: 'Alex',
    photo: 'https://files2.heygen.ai/avatar/v3/25ef6c86b1e946969d9a684870c47dfe_14947/preview_talk_1.webp',
    gradientPhoto: 'bg-gradient-to-br from-blue-500/30 to-cyan-700/30',
    gradientCta:   'bg-gradient-to-r from-blue-500 to-cyan-600',
    roleColor:     'text-blue-300',
    getRole: s => s.coachAlexRole,
    getSpec: s => s.coachAlexSpec,
    getCta:  s => s.coachTalkTo('Alex'),
    href:    lang => `/${lang}/coach/alex`,
  },
  // Add more coaches here, e.g.:
  // { id: 'eva', clusters: ['mental'], slugPatterns: ['anxiety', 'stress', 'burnout'], name: 'Eva', ... }
]

// ─── Cluster detection ────────────────────────────────────────────────────────
function detectCoach(slug: string, metadata: Record<string, unknown>): CoachConfig | null {
  const cluster = typeof metadata['cluster'] === 'string' ? metadata['cluster'] : null

  // 1. Match by cluster from event metadata
  if (cluster) {
    const match = COACH_REGISTRY.find(c => c.clusters.includes(cluster))
    if (match) return match
  }

  // 2. Fallback: match by slug keyword
  for (const coach of COACH_REGISTRY) {
    if (coach.slugPatterns?.some(p => slug.includes(p))) return coach
  }

  return null
}

// ─── Component ────────────────────────────────────────────────────────────────
interface CoachBlockProps {
  readonly lang?: string
}

export function CoachBlock({ lang = 'en' }: CoachBlockProps) {
  const [coach, setCoach] = useState<CoachConfig | null>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const s = uiT(lang)

  useEffect(() => {
    getBrowserRuntime()

    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return
      const matched = detectCoach(detail.slug, detail.metadata)
      if (!matched) return
      setCoach(matched)
      setTimeout(() => {
        blockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }

    window.addEventListener('solviqlab:result', onResult)
    return () => window.removeEventListener('solviqlab:result', onResult)
  }, [])

  if (!coach) return null

  return (
    <div
      ref={blockRef}
      className="mt-4 rounded-2xl overflow-hidden border border-white/10 bg-slate-900 animate-fade-in"
    >
      <div className="flex">
        {/* Photo */}
        <div className={`relative w-28 sm:w-36 shrink-0 overflow-hidden ${coach.gradientPhoto}`}>
          <img
            src={coach.photo}
            alt={coach.name}
            className="w-full h-full object-cover object-top"
            style={{ minHeight: '170px' }}
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-4 pt-3 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-white font-bold text-sm">{coach.name}</p>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-emerald-400 text-[9px] font-semibold uppercase tracking-wide">{s.coachOnlineNow}</span>
            </div>
          </div>
          <p className={`text-[11px] font-medium mb-0.5 ${coach.roleColor}`}>{coach.getRole(s)}</p>
          <p className="text-white/40 text-[10px] leading-tight mb-2">{coach.getSpec(s)}</p>

          <div className="mt-auto pt-1">
            <Link
              href={coach.href(lang)}
              className={`block w-full py-2 rounded-xl text-white text-xs font-bold text-center hover:opacity-90 active:scale-[0.98] transition-all ${coach.gradientCta}`}
            >
              {coach.getCta(s)}
            </Link>
            <p className="text-center text-[9px] text-white/30 mt-1">{s.coachFreeSession}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
