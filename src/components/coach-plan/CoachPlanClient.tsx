'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getT } from '@/lib/i18n/ui'

const LANG_NAMES: Record<string, string> = {
  en: 'English', uk: 'Ukrainian', es: 'Spanish', pt: 'Portuguese',
  fr: 'French', de: 'German', pl: 'Polish', tr: 'Turkish', it: 'Italian', nl: 'Dutch',
}

// ── Read graph + name from localStorage ──────────────────────────────────────

function readContext(): { name: string; graphSummary: string } {
  try {
    const name = localStorage.getItem('mia_user_name') ?? ''
    const keys = Object.keys(localStorage).filter(k => k.startsWith('graph:'))
    if (!keys.length) return { name, graphSummary: '' }
    const graph = JSON.parse(localStorage.getItem(keys[0]) ?? '{}')
    const parts: string[] = []
    const assessments: Array<{ clusterId: string; score: number }> = graph?.assessments?.items ?? []
    if (assessments.length) {
      parts.push('Quiz results: ' + assessments.map(a => `${a.clusterId}=${a.score}`).join(', '))
    }
    const goals: Array<{ text: string }> = graph?.goals?.items ?? []
    if (goals.length) parts.push('Goals: ' + goals.map(g => g.text).join('; '))
    if (graph?.identity?.age) parts.push(`Age: ${graph.identity.age}`)
    return { name: name || graph?.identity?.name || '', graphSummary: parts.join('. ') }
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

async function generatePlan(name: string, lang: string, graphSummary: string): Promise<PlanItem[]> {
  const language = LANG_NAMES[lang] ?? 'English'
  const systemPrompt = `You are Mia, a personal health coach. You have just finished an intake conversation with ${name || 'your client'}.

${graphSummary ? `Context about this person: ${graphSummary}` : ''}

Generate a personalized 5-step action plan. Return ONLY a valid JSON array with exactly 5 objects. Each object must have:
- "title": short action title (max 6 words)
- "description": specific, personal explanation (1-2 sentences, refer to their situation)
- "timeframe": when to do it ("This week", "Daily", "Week 2", etc.)
- "priority": "high", "medium", or "low"

Write everything in ${language}. Be specific, not generic. Reference their actual situation if known.`

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

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array in response')
  return JSON.parse(match[0]) as PlanItem[]
}

// ── Priority badge ────────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-slate-700 text-slate-400 border-slate-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[priority as keyof typeof colors] ?? colors.low}`}>
      {priority}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CoachPlanClient({ lang }: { lang: string }) {
  const t = getT(lang)
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<PlanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const { name: n, graphSummary } = readContext()
    setName(n)
    generatePlan(n, lang, graphSummary)
      .then(items => { setPlan(items); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [lang])

  const FREE_ITEMS = 2

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {name ? `Mia — ${name}` : 'Mia'}
            </p>
            <p className="text-slate-500 text-xs">{t('coach.header.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-emerald-400 text-xs font-medium">Plan ready</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 py-8">

          {/* Title */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-lg">✓</span>
              <p className="text-slate-400 text-sm">Analysis complete</p>
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug mb-2">
              {name ? `${name}, here is your personal plan` : 'Your personal plan is ready'}
            </h1>
            <p className="text-slate-400 text-sm">
              Based on everything you shared with me. Start with priority items first.
            </p>
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
              <p className="text-slate-500 text-xs text-center mt-2">
                Mia is building your plan...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center">
              <p className="text-slate-400 text-sm mb-4">
                Could not load your plan right now. Please try again.
              </p>
              <button
                onClick={() => { setError(false); setLoading(true); const { name: n, graphSummary } = readContext(); generatePlan(n, lang, graphSummary).then(items => { setPlan(items); setLoading(false) }).catch(() => { setError(true); setLoading(false) }) }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-sm font-semibold"
              >
                Try again
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
                    {/* Step number */}
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5 ${
                        isLocked
                          ? 'bg-slate-800 text-slate-500'
                          : i === 0
                            ? 'bg-gradient-to-br from-rose-500 to-purple-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isLocked ? '🔒' : i + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className={`font-semibold text-sm ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                            {isLocked ? '••••••••••' : item.title}
                          </p>
                          {!isLocked && <PriorityBadge priority={item.priority} />}
                        </div>
                        <p className={`text-sm leading-relaxed ${isLocked ? 'text-slate-600' : 'text-slate-300'}`}>
                          {isLocked ? 'Unlock to see this step and all recommendations' : item.description}
                        </p>
                        {!isLocked && (
                          <p className="text-xs text-slate-500 mt-2">
                            ⏱ {item.timeframe}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Freemium gate CTA */}
              <div className="mt-4 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-6 text-center">
                <p className="text-white font-bold text-lg mb-1">
                  Unlock your full plan
                </p>
                <p className="text-slate-400 text-sm mb-2">
                  + daily check-ins with Mia + weekly adjustments
                </p>
                <div className="flex items-center justify-center gap-2 mb-5">
                  <span className="text-emerald-400 text-xs font-semibold bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
                    7 days free
                  </span>
                  <span className="text-slate-500 text-xs">then $12/month</span>
                </div>
                <Link
                  href={`/${lang}/register`}
                  className="block w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  Start 7 days free →
                </Link>
                <p className="text-slate-600 text-xs mt-3">No credit card required to start</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
