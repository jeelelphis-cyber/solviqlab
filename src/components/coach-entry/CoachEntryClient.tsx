'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Commitment steps ──────────────────────────────────────────────────────────

const STEPS = [
  {
    question: 'Do you want me to help you?',
    context: "I looked at your results. What you are going through is real — and it is fixable. But only if you actually want to change something.",
    yes: 'Yes, I want your help',
  },
  {
    question: 'Will you follow my recommendations — even when it feels hard?',
    context: "I will not ask you to quit your job or turn your life upside down. But I will ask you to do one specific thing each week. That is the deal.",
    yes: 'Yes, I will follow your guidance',
  },
  {
    question: 'Will you be honest with me — even when it is uncomfortable?',
    context: "I can only help with what I actually know. The more honest you are, the better your plan will be. That is all I ask.",
    yes: 'Yes, I will be honest with you',
  },
]

// ── Name stage ────────────────────────────────────────────────────────────────

function NameStage({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  function handleSubmit() {
    const trimmed = name.trim()
    if (!trimmed) return
    onDone(trimmed)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
          M
        </div>
        <div>
          <p className="text-white font-semibold">Mia</p>
          <p className="text-slate-400 text-xs">one more thing</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <p className="text-slate-300 text-sm leading-relaxed">
          Before we start — I want to know who I am talking to. Not an email. Not a username.
        </p>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
        What should I call you?
      </h2>

      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
        placeholder="Your first name"
        className="w-full px-5 py-4 rounded-2xl bg-slate-900 border-2 border-slate-700 focus:border-purple-500 text-white placeholder-slate-500 text-lg font-medium focus:outline-none transition-colors"
      />

      <button
        onClick={handleSubmit}
        disabled={!name.trim()}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100"
      >
        This is me →
      </button>
    </div>
  )
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
      parts.push('Quiz results: ' + assessments.map((a: { clusterId: string; score: number }) => `${a.clusterId}=${a.score}`).join(', '))
    }
    const goals: Array<{ text: string }> = graph?.goals?.items ?? []
    if (goals.length) {
      parts.push('Goals: ' + goals.map((g: { text: string }) => g.text).join('; '))
    }
    if (graph?.identity?.age) parts.push(`Age: ${graph.identity.age}`)

    return parts.join('. ')
  } catch {
    return ''
  }
}

// ── Chat stage ────────────────────────────────────────────────────────────────

type Message = { from: 'mia' | 'user'; text: string }

const MAX_TURNS = 5

function buildSystemPrompt(name: string, graphContext: string): string {
  return `You are Mia, a warm and direct personal health coach. You are talking with ${name}.

${graphContext ? `What you already know about ${name}: ${graphContext}` : ''}

Your approach:
- Respond directly to what ${name} shares — acknowledge their specific pain, do not give generic advice
- Ask ONE focused follow-up question per message to go deeper
- Be warm but concise — 3-5 sentences max per reply
- After ${MAX_TURNS} exchanges you will offer to build their personal plan
- Never mention you are an AI — you are Mia, their coach
- Write in plain conversational English, no bullet points or headers`
}

function ChatStage({ name }: { name: string }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      from: 'mia',
      text: `Hi ${name}. Let us start.\n\nOne question — and I want you to be specific:\n\nWhat is taking the most out of you right now? Not what you think you should say. What is actually draining you.`,
    },
  ])
  const [loading, setLoading] = useState(false)
  const [userTurns, setUserTurns] = useState(0)
  const [showPlan, setShowPlan] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const graphContext = useRef('')

  useEffect(() => {
    graphContext.current = readGraphContext()
  }, [])

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
      setTimeout(() => {
        setMessages(m => [...m, {
          from: 'mia',
          text: `I have heard enough to build your plan, ${name}.\n\nLet me put it together for you.`,
        }])
        setLoading(false)
        setShowPlan(true)
      }, 800)
      return
    }

    // Build message history for DeepSeek
    const history = [...messages, userMsg]
    const apiMessages = [
      { role: 'system', content: buildSystemPrompt(name, graphContext.current) },
      ...history.map(m => ({
        role: m.from === 'mia' ? 'assistant' : 'user',
        content: m.text,
      })),
    ]

    // Stream response
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
          const chunk = decoder.decode(value)
          for (const line of chunk.split('\n')) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.delta) {
                full += parsed.delta
                setMessages(m => [...m.slice(0, -1), { from: 'mia', text: full }])
              }
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch {
      setMessages(m => [...m.slice(0, -1), {
        from: 'mia',
        text: 'I am having trouble connecting right now. Please try again in a moment.',
      }])
    } finally {
      setLoading(false)
    }
  }, [loading, messages, name, userTurns])

  function handleSend() {
    sendMessage(input)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 pb-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.from === 'mia' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                M
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
              msg.from === 'mia'
                ? 'bg-slate-800 text-slate-100 rounded-tl-sm'
                : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-tr-sm'
            }`}>
              {msg.text || (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {showPlan ? (
        <div className="mt-2 p-5 rounded-2xl bg-slate-800 border border-slate-700 text-center">
          <p className="text-white font-semibold mb-1">Your plan is ready, {name}</p>
          <p className="text-slate-400 text-sm mb-5">Based on everything you shared with me</p>
          <Link
            href={`/en/assessment/weight`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            See your plan →
          </Link>
        </div>
      ) : (
        <div className="pt-4 flex gap-2 border-t border-slate-800">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Write honestly..."
            rows={3}
            autoFocus
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity self-end"
          >
            Send
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CoachEntryClient({ lang }: { lang: string }) {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [name, setName] = useState('')

  // 0,1,2 = commitment; 3 = name; 4 = chat
  const isCommitment = step < STEPS.length
  const isNameStep = step === STEPS.length
  const isChatStep = step > STEPS.length

  function handleYes() {
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setAnimating(false)
    }, 400)
  }

  function handleName(n: string) {
    setName(n)
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setAnimating(false)
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {name ? `Mia — talking with ${name}` : 'Mia'}
            </p>
            <p className="text-slate-500 text-xs">Your Health Coach</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-medium">Ready for you</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-5 py-8 overflow-y-auto">

        {isCommitment && (
          <div className={`flex flex-col gap-6 transition-all duration-300 ${animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
            {/* Progress — 3 commitment + 1 name + chat */}
            <div className="flex gap-1.5">
              {[...STEPS, { name: true }].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                  i < step ? 'bg-emerald-400' : i === step ? 'bg-purple-500' : 'bg-slate-800'
                }`} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">M</div>
              <div>
                <p className="text-white font-semibold">Mia</p>
                <p className="text-slate-400 text-xs">reviewed your results</p>
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
              Skip for now
            </button>
          </div>
        )}

        {isNameStep && (
          <div className={`transition-all duration-300 ${animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'}`}>
            <NameStage onDone={handleName} />
          </div>
        )}

        {isChatStep && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <span className="text-emerald-400 text-sm">✓</span>
              <p className="text-slate-400 text-sm">You are committed, {name}. Let us figure this out together.</p>
            </div>
            <ChatStage name={name} />
          </div>
        )}
      </div>
    </div>
  )
}
