'use client'
import { useState, useRef, useEffect } from 'react'
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

// ── Chat stage ────────────────────────────────────────────────────────────────

function ChatStage({ name }: { name: string }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      from: 'mia',
      text: `Hi ${name}. Let us start.\n\nOne question — and I want you to be specific:\n\nWhat is taking the most out of you right now, ${name}? Not what you think you should say. What is actually draining you.`,
    },
  ])
  const [sent, setSent] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  function handleSend() {
    if (!input.trim() || sent) return
    setMessages(m => [
      ...m,
      { from: 'user', text: input.trim() },
      {
        from: 'mia',
        text: `I hear you, ${name}. That is important — and it tells me a lot.\n\nI am going to ask you a few more questions so I can build your plan. This will take about 5 minutes.\n\nLet us keep going.`,
      },
    ])
    setSent(true)
    setInput('')
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
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!sent ? (
        <div className="pt-4 flex gap-2 border-t border-slate-800">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Write honestly..."
            rows={3}
            autoFocus
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-40 hover:opacity-90 transition-opacity self-end"
          >
            Send
          </button>
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center">
          <p className="text-slate-300 text-sm font-medium mb-1">
            Building your plan, {name}...
          </p>
          <p className="text-slate-500 text-xs mb-4">Full intake conversation coming soon</p>
          <Link
            href={`/en/assessment/weight`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Continue with assessment →
          </Link>
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
    <div className="bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
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
      <div className="flex-1 flex flex-col max-w-xl mx-auto w-full px-5 py-8">

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
