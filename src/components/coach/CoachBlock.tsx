'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { getBrowserRuntime } from '@/lib/runtime'
import { t as uiT, type UIStrings } from '@/lib/ui-strings'
import type { InstrumentResult } from '@/lib/products/types'

// ─── Coach Registry ───────────────────────────────────────────────────────────
// To add a new coach: add one entry here. Nothing else changes.

export interface CoachConfig {
  id: string
  clusters: string[]
  slugPatterns?: string[]
  name: string
  photo: string
  gradientPhoto: string
  gradientCta: string
  roleColor: string
  borderColor: string
  getRole: (s: UIStrings) => string
  getSpec: (s: UIStrings) => string
  getCta:  (s: UIStrings) => string
  href:    (lang: string) => string
}

export const COACH_REGISTRY: CoachConfig[] = [
  {
    id: 'mia',
    clusters: ['weight', 'sleep', 'pregnancy'],
    slugPatterns: ['bmi', 'body-fat', 'tdee', 'calorie', 'bmr', 'sleep', 'pregnancy', 'due-date', 'ovulation', 'weight'],
    name: 'Mia',
    photo: 'https://files2.heygen.ai/avatar/v3/1f58c0f60faa4cb5bf6c465615e3fb18_39260/preview_target.webp',
    gradientPhoto: 'bg-gradient-to-br from-rose-500/30 to-purple-700/30',
    gradientCta:   'bg-gradient-to-r from-rose-500 to-purple-600',
    roleColor:     'text-rose-300',
    borderColor:   'hover:border-rose-400/40',
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
    borderColor:   'hover:border-blue-400/40',
    getRole: s => s.coachAlexRole,
    getSpec: s => s.coachAlexSpec,
    getCta:  s => s.coachTalkTo('Alex'),
    href:    lang => `/${lang}/coach/alex`,
  },
  // Add more coaches here ↓
  // { id: 'eva', clusters: ['mental'], name: 'Eva', ... }
]

// ─── Detection ────────────────────────────────────────────────────────────────
function detectCoach(slug: string, metadata: Record<string, unknown>): CoachConfig | null {
  const cluster = typeof metadata['cluster'] === 'string' ? metadata['cluster'] : null
  if (cluster) {
    const match = COACH_REGISTRY.find(c => c.clusters.includes(cluster))
    if (match) return match
  }
  for (const coach of COACH_REGISTRY) {
    if (coach.slugPatterns?.some(p => slug.includes(p))) return coach
  }
  return null
}

// ─── Primary card (relevant coach) ───────────────────────────────────────────
function PrimaryCoachCard({ coach, lang, s }: { coach: CoachConfig; lang: string; s: UIStrings }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900">
      <div className="flex">
        <div className={`relative w-28 sm:w-36 shrink-0 overflow-hidden ${coach.gradientPhoto}`}>
          <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover object-top" style={{ minHeight: '170px' }} loading="lazy" />
        </div>
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
            <Link href={coach.href(lang)} className={`block w-full py-2 rounded-xl text-white text-xs font-bold text-center hover:opacity-90 active:scale-[0.98] transition-all ${coach.gradientCta}`}>
              {coach.getCta(s)}
            </Link>
            <p className="text-center text-[9px] text-white/30 mt-1">{s.coachFreeSession}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mini card (other coaches) ────────────────────────────────────────────────
function MiniCoachCard({ coach, lang, s }: { coach: CoachConfig; lang: string; s: UIStrings }) {
  return (
    <Link
      href={coach.href(lang)}
      className={`group flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all ${coach.borderColor}`}
    >
      <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${coach.gradientPhoto}`}>
        <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover object-top" loading="lazy" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-white text-xs font-semibold">{coach.name}</p>
        <p className={`text-[10px] truncate ${coach.roleColor}`}>{coach.getRole(s)}</p>
      </div>
      <span className="text-white/30 text-xs group-hover:text-white/60 transition-colors shrink-0">→</span>
    </Link>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface CoachBlockProps {
  readonly lang?: string
}

export function CoachBlock({ lang = 'en' }: CoachBlockProps) {
  const [primaryCoach, setPrimaryCoach] = useState<CoachConfig | null>(null)
  const blockRef = useRef<HTMLDivElement>(null)
  const s = uiT(lang)

  useEffect(() => {
    getBrowserRuntime()

    function onResult(e: Event) {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return
      const matched = detectCoach(detail.slug, detail.metadata)
      // Show block even if no coach matched — we'll still show all coaches
      setPrimaryCoach(matched ?? null)
      // Use a sentinel to indicate "show block"
      setShowBlock(true)
      setTimeout(() => {
        blockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }

    window.addEventListener('solviqlab:result', onResult)
    return () => window.removeEventListener('solviqlab:result', onResult)
  }, [])

  const [showBlock, setShowBlock] = useState(false)

  if (!showBlock) return null

  const otherCoaches = COACH_REGISTRY.filter(c => c.id !== primaryCoach?.id)

  return (
    <div ref={blockRef} className="mt-4 space-y-3 animate-fade-in">
      {/* Primary: relevant coach (if any) */}
      {primaryCoach && (
        <PrimaryCoachCard coach={primaryCoach} lang={lang} s={s} />
      )}

      {/* Other coaches — always show, no false context */}
      {otherCoaches.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wide mb-2.5">
            {s.coachMeetOthers ?? 'Also on SolviqLab'}
          </p>
          <div className="space-y-2">
            {otherCoaches.map(coach => (
              <MiniCoachCard key={coach.id} coach={coach} lang={lang} s={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
