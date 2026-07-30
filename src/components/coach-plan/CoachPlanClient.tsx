'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { getT } from '@/lib/i18n/ui'
import { GraphRepository } from '@/lib/graph/repository'
import { createStorageProvider } from '@/lib/user/storage'

import { PERSONAS } from '@/lib/coach-personas'
import type { PersonaId } from '@/lib/coach-personas'
import type { CoachPersonaConfig } from '@/lib/coach-personas/types'

const PROMO_END = new Date('2026-08-26T23:59:59')
const PROMO_KEY = 'solviq_promo_activated'

function getPromoUnlocked(): boolean {
  try { return localStorage.getItem(PROMO_KEY) === '1' } catch { return false }
}

function activatePromo(): void {
  try { localStorage.setItem(PROMO_KEY, '1') } catch {}
}

function useCountdown() {
  const [diff, setDiff] = useState(PROMO_END.getTime() - Date.now())
  useEffect(() => {
    const id = setInterval(() => setDiff(PROMO_END.getTime() - Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  return { days, hours, mins, secs, expired: diff <= 0 }
}

// ── Read graph + name via GraphRepository ────────────────────────────────────

function readContext(personaId: string, userId: string | null): { name: string; graphSummary: string } {
  try {
    const savedName = localStorage.getItem(`${personaId}_user_name`) ?? ''
    if (!userId) return { name: savedName, graphSummary: '' }
    const graph = new GraphRepository(createStorageProvider()).get(userId)
    if (!graph) return { name: savedName, graphSummary: '' }
    const parts: string[] = []
    if (graph.assessments.items.length)
      parts.push('Quiz results: ' + graph.assessments.items.map(a => `${a.clusterId}=${a.score}`).join(', '))
    if (graph.goals.items.length)
      parts.push('Goals: ' + graph.goals.items.map(g => g.text).join('; '))
    if (graph.identity.age) parts.push(`Age: ${graph.identity.age}`)
    return { name: savedName || graph.identity.name || '', graphSummary: parts.join('. ') }
  } catch {
    return { name: '', graphSummary: '' }
  }
}

// ── Plan item types ───────────────────────────────────────────────────────────

interface PlanItem {
  title: string
  description: string
  timeframe: string
  priority: 'high' | 'medium' | 'low'
}

// ── Generate plan via DeepSeek ────────────────────────────────────────────────

async function generatePlan(
  persona: CoachPersonaConfig,
  name: string,
  lang: string,
  graphSummary: string,
): Promise<PlanItem[]> {
  const systemPrompt = persona.planSystemPromptTemplate(name, lang, graphSummary)

  const res = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Build my personal plan.' },
      ],
      provider: 'deepseek',
    }),
  })

  const data = await res.json()
  const text: string = data.content ?? data.text ?? ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array in response')
  return JSON.parse(match[0]) as PlanItem[]
}

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority, lang }: { priority: string; lang: string }) {
  const t = getT(lang)
  const colors = {
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-slate-700 text-slate-400 border-slate-600',
  }
  const label = priority === 'high' ? t('coach.priority.high')
    : priority === 'medium' ? t('coach.priority.medium')
    : t('coach.priority.low')
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[priority as keyof typeof colors] ?? colors.low}`}>
      {label}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CoachPlanClient({ lang, personaId }: { lang: string; personaId: PersonaId }) {
  const persona: CoachPersonaConfig = PERSONAS[personaId]
  const t = getT(lang)
  const pid = persona.id
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(() => {
    setError(false)
    setLoading(true)
    const { name: n, graphSummary } = readContext(pid, userId)
    setName(n)
    generatePlan(persona, n, lang, graphSummary)
      .then(items => { setPlan(items); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [pid, lang, persona])

  useEffect(() => { load() }, [load])

  const [promoUnlocked, setPromoUnlocked] = useState(false)
  const countdown = useCountdown()

  useEffect(() => { setPromoUnlocked(getPromoUnlocked()) }, [])

  function handleActivatePromo() {
    activatePromo()
    setPromoUnlocked(true)
  }

  const FREE_ITEMS = promoUnlocked ? Infinity : 2

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${persona.avatarGradient} flex items-center justify-center text-white font-bold text-sm`}>
            {persona.avatarLetter}
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {name ? `${persona.name} — ${name}` : persona.name}
            </p>
            <p className="text-slate-500 text-xs">{t(`${pid}.header.subtitle`)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">{t(`${pid}.header.status`)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-8">

          {/* Title */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-lg">✓</span>
              <p className="text-slate-400 text-sm">{t(`${pid}.step.reviewed`)}</p>
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug mb-2">
              {t(`${pid}.plan.ready`, { name: name || '…' })}
            </h1>
            <p className="text-slate-400 text-sm">{t(`${pid}.plan.subtitle`)}</p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-slate-800 rounded w-full mb-2" />
                  <div className="h-3 bg-slate-800 rounded w-4/5" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-slate-400 text-sm mb-4">
                {t(`${pid}.chat.error`)}
              </p>
              <button
                onClick={load}
                className={`px-5 py-2 rounded-xl bg-gradient-to-r ${persona.avatarGradient} text-white text-sm font-semibold`}
              >
                {t('coach.plan.retry')}
              </button>
            </div>
          )}

          {/* Plan items */}
          {!loading && !error && plan.length > 0 && (
            <div className="flex flex-col gap-3">
              {plan.map((item, i) => {
                const isLocked = i >= FREE_ITEMS
                return (
                  <div
                    key={i}
                    className={`relative border rounded-2xl p-5 transition-all ${
                      isLocked
                        ? 'bg-slate-900/50 border-slate-800 opacity-60'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                        isLocked
                          ? 'bg-slate-800 text-slate-500'
                          : i === 0
                            ? `bg-gradient-to-br ${persona.avatarGradient} text-white`
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isLocked ? '🔒' : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={`font-semibold text-sm ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                            {isLocked ? '••••••••••' : item.title}
                          </p>
                          {!isLocked && <PriorityBadge priority={item.priority} lang={lang} />}
                        </div>
                        <p className={`text-sm leading-relaxed ${isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                          {isLocked ? t('coach.plan.locked') : item.description}
                        </p>
                        {!isLocked && (
                          <p className="text-xs text-slate-500 mt-2">⏱ {item.timeframe}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Promo gate / activated banner */}
              {!promoUnlocked ? (
                <div className="mt-4 bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                    🎁 Launch Offer
                  </div>
                  <p className="text-white font-bold text-xl mb-1">30 Days Free</p>
                  <p className="text-slate-400 text-sm mb-4">{t(`${pid}.plan.unlock.subtitle`)}</p>

                  {/* Countdown */}
                  {!countdown.expired && (
                    <div className="flex items-center justify-center gap-3 mb-5">
                      {[
                        { v: countdown.days, l: 'days' },
                        { v: countdown.hours, l: 'hrs' },
                        { v: countdown.mins, l: 'min' },
                        { v: countdown.secs, l: 'sec' },
                      ].map(({ v, l }) => (
                        <div key={l} className="flex flex-col items-center bg-slate-800 rounded-xl px-3 py-2 min-w-[52px]">
                          <span className="text-white font-bold text-lg leading-none">{String(v).padStart(2, '0')}</span>
                          <span className="text-slate-500 text-xs mt-0.5">{l}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleActivatePromo}
                    className={`w-full py-4 rounded-2xl bg-gradient-to-r ${persona.avatarGradient} text-white font-bold text-base shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
                  >
                    Activate 30 Days Free →
                  </button>
                  <p className="text-slate-600 text-xs mt-3">No credit card · No account required · Offer ends Aug 26</p>
                </div>
              ) : (
                <div className="mt-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 text-center">
                  <p className="text-emerald-400 font-bold text-sm mb-1">✓ Full access activated</p>
                  <p className="text-slate-500 text-xs">Your 30-day free plan is active until Aug 26, 2026</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
