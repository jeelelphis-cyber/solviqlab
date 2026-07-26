'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getT } from '@/lib/i18n/ui'

// ── i18n language names for Mia's system prompt ───────────────────────────────

const LANG_NAMES: Record<string, string> = {
  en: 'English', uk: 'Ukrainian', es: 'Spanish', pt: 'Portuguese',
  fr: 'French', de: 'German', pl: 'Polish', tr: 'Turkish', it: 'Italian', nl: 'Dutch',
}

// ── Graph context helper ──────────────────────────────────────────────────────

function readGraphContext(): string {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('graph:'))
    if (!keys.length) return ''
    const graph = JSON.parse(localStorage.getItem(keys[0]) ?? '{}')
    const parts: string[] = []
    const assessments: Array<{ clusterId: string; score: number }> = graph?.assessments?.items ?? []
    if (assessments.length) {
      parts.push('Quiz results: ' + assessments.map(a => `${a.clusterId}=${a.score}`).join(', '))
    }
    const goals: Array<{ text: string }> = graph?.goals?.items ?? []
    if (goals.length) {
      parts.push('Goals: ' + goals.map(g => g.text).join('; '))
    }
    if (graph?.identity?.age) parts.push(`Age: ${graph.identity.age}`)
    return parts.join('. ')
  } catch {
    return ''
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────────

type Message = { from: 'mia' | 'user'; text: string }

const MAX_TURNS = 5

function buildSystemPrompt(name: string, lang: string, graphContext: string): string {
  const language = LANG_NAMES[lang] ?? 'English'
  return `You are Mia, a warm and direct personal health coach. You are talking with ${name}.

${graphContext ? `What you already know about ${name}: ${graphContext}` : ''}

Your approach:
- Respond directly to what ${name} shares — acknowledge their specific pain, do not give generic advice
- Ask ONE focused follow-up question per message to go deeper
- Be warm but concise — 3-5 sentences max per reply
- After ${MAX_TURNS} exchanges you will offer to build their personal plan
- Never mention you are an AI — you are Mia, their coach
- Always respond in ${language}, no matter what language the user writes in`
}

function MiaAvatar({ size = 8 }: { size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold shrink-0`}
      style={{ width: size * 4, height: size * 4, fontSize: size * 1.5 }}>
      M
    </div>
  )
}

function TypingDots() {
  return (
    <span className="flex gap-1 items-center h-4">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  )
}

function ChatStage({ name, lang }: { name: string; lang: string }) {
  const t = getT(lang)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { from: 'mia', text: t('coach.chat.opening', { name }) },
  ])
  const [loading, setLoading] = useState(false)
  const [userTurns, setUserTurns] = useState(0)
  const [showPlan, setShowPlan] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const graphContext = useRef('')

  useEffect(() => { graphContext.current = readGraphContext() }, [])

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const sendMessage = useCallback(async (userText: string) => {
    if (!userText.trim() || loading) return

    const userMsg: Message = { from: 'user', text: userText.trim() }
    const newTurns = userTurns + 1
    setUserTurns(newTurns)
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    if (newTurns >= MAX_TURNS) {
      try { localStorage.setItem('mia_user_name', name) } catch { /* ignore */ }
      setTimeout(() => {
        setMessages(m => [...m, { from: 'mia', text: `${t('coach.plan.ready', { name })}\n\n${t('coach.plan.subtitle')}` }])
        setLoading(false)
        setShowPlan(true)
      }, 800)
      return
    }

    const history = [...messages, userMsg]
    const apiMessages = [
      { role: 'system', content: buildSystemPrompt(name, lang, graphContext.current) },
      ...history.map(m => ({ role: m.from === 'mia' ? 'assistant' : 'user', content: m.text })),
    ]

    const placeholder: Message = { from: 'mia', text: '' }
    setMessages(m => [...m, placeholder])

    try {
      const res = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, stream: true, provider: 'deepseek' }),
      })

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          for (const line of decoder.decode(value).split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.delta) {
                full += parsed.delta
                setMessages(m => [...m.slice(0, -1), { from: 'mia', text: full }])
              }
            } catch { /* ignore */ }
          }
        }
      }
    } catch {
      setMessages(m => [...m.slice(0, -1), { from: 'mia', text: t('coach.chat.error') }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, name, lang, userTurns, t])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.from === 'mia' && <MiaAvatar size={8} />}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ml-2 ${
              msg.from === 'mia'
                ? 'bg-slate-800 text-slate-100 rounded-tl-sm ml-2'
                : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-tr-sm ml-0'
            }`}>
              {msg.text || <TypingDots />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {showPlan ? (
        <div className="mt-2 p-5 rounded-2xl bg-slate-800 border border-slate-700 text-center">
          <p className="text-white font-semibold mb-1">{t('coach.plan.ready', { name })}</p>
          <p className="text-slate-400 text-sm mb-5">{t('coach.plan.subtitle')}</p>
          <Link
            href={`/${lang}/coach/plan`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t('coach.plan.cta')}
          </Link>
        </div>
      ) : (
        <div className="pt-4 flex gap-2 border-t border-slate-800">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={t('coach.chat.placeholder')}
            rows={3}
            autoFocus
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity self-end"
          >
            {t('coach.chat.send')}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Name stage ────────────────────────────────────────────────────────────────

function NameStage({ onDone, lang }: { onDone: (name: string) => void; lang: string }) {
  const t = getT(lang)
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 100) }, [])

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onDone(trimmed)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <MiaAvatar size={12} />
        <div>
          <p className="text-white font-semibold">Mia</p>
          <p className="text-slate-400 text-xs">{t('coach.name.subtitle')}</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-300 text-sm leading-relaxed">{t('coach.name.context')}</p>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
        {t('coach.name.question')}
      </h2>

      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        placeholder={t('coach.name.placeholder')}
        className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-purple-500 text-white placeholder-slate-500 text-lg font-medium focus:outline-none transition-colors"
      />

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100"
      >
        {t('coach.name.cta')}
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CoachEntryClient({ lang }: { lang: string }) {
  const t = getT(lang)
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [name, setName] = useState('')

  const STEPS = [
    { question: t('coach.step1.question'), context: t('coach.step1.context'), yes: t('coach.step1.yes') },
    { question: t('coach.step2.question'), context: t('coach.step2.context'), yes: t('coach.step2.yes') },
    { question: t('coach.step3.question'), context: t('coach.step3.context'), yes: t('coach.step3.yes') },
  ]

  const isCommitment = step < STEPS.length
  const isNameStep = step === STEPS.length
  const isChatStep = step > STEPS.length

  function handleYes() {
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 400)
  }

  function handleName(n: string) {
    setName(n)
    setAnimating(true)
    setTimeout(() => { setStep(s => s + 1); setAnimating(false) }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <MiaAvatar size={9} />
          <div>
            <p className="text-white font-semibold text-sm">
              {name ? `Mia — ${name}` : 'Mia'}
            </p>
            <p className="text-slate-500 text-xs">{t('coach.header.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-medium">{t('coach.header.status')}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-5 py-8 overflow-y-auto">

        {isCommitment && (
          <div className={`flex flex-col gap-6 transition-all duration-300 ${animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
            <div className="flex gap-1.5">
              {[...STEPS, { placeholder: true }].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? 'bg-emerald-400' : i === step ? 'bg-purple-500' : 'bg-slate-800'
                }`} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <MiaAvatar size={12} />
              <div>
                <p className="text-white font-semibold">Mia</p>
                <p className="text-slate-400 text-xs">{t('coach.step.reviewed')}</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-300 text-sm leading-relaxed">{STEPS[step].context}</p>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {STEPS[step].question}
            </h2>

            <button
              onClick={handleYes}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {STEPS[step].yes}
            </button>

            <button
              onClick={() => setStep(STEPS.length + 1)}
              className="text-slate-600 text-xs text-center hover:text-slate-500 transition-colors"
            >
              {t('coach.skip')}
            </button>
          </div>
        )}

        {isNameStep && (
          <div className={`transition-all duration-300 ${animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
            <NameStage onDone={handleName} lang={lang} />
          </div>
        )}

        {isChatStep && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <span className="text-emerald-400 text-sm">✓</span>
              <p className="text-slate-400 text-sm">{t('coach.committed', { name })}</p>
            </div>
            <ChatStage name={name} lang={lang} />
          </div>
        )}
      </div>
    </div>
  )
}
