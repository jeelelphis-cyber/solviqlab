'use client'
import { useState, useEffect } from 'react'
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

// ── Chat placeholder ──────────────────────────────────────────────────────────

function ChatStage() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      from: 'mia',
      text: "Thank you. Let us start.\n\nOne question — and I want you to be specific:\n\nWhat is taking the most out of you right now? Not what you think you should say. What is actually draining you.",
    },
  ])
  const [sent, setSent] = useState(false)

  function handleSend() {
    if (!input.trim() || sent) return
    setMessages(m => [
      ...m,
      { from: 'user', text: input.trim() },
      {
        from: 'mia',
        text: "I hear you. That is important — and it tells me a lot.\n\nI am going to ask you a few more questions so I can build your plan. This will take about 5 minutes.\n\nLet us keep going.",
      },
    ])
    setSent(true)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full min-h-[60vh]">
      {/* Messages */}
      <div className="flex-1 flex flex-col gap-4 pb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.from === 'mia' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">
                M
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                msg.from === 'mia'
                  ? 'bg-slate-800 text-slate-100 rounded-tl-sm'
                  : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-tr-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      {!sent ? (
        <div className="mt-auto flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Write honestly..."
            rows={3}
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
        <div className="mt-6 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-center">
          <p className="text-slate-400 text-sm mb-3">
            The full intake conversation with Mia is coming soon.
          </p>
          <Link
            href="/en/assessment/weight"
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
  const [step, setStep] = useState(0) // 0,1,2 = commitment questions; 3 = chat
  const [animating, setAnimating] = useState(false)

  function handleYes() {
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setAnimating(false)
    }, 400)
  }

  const isDone = step >= STEPS.length

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Mia</p>
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

        {!isDone ? (
          // ── Commitment stage ────────────────────────────────────────────────
          <div
            className={`flex flex-col gap-6 transition-all duration-400 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
          >
            {/* Progress */}
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-emerald-400' : i === step ? 'bg-purple-500' : 'bg-slate-800'}`}
                />
              ))}
            </div>

            {/* Mia avatar + name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <div>
                <p className="text-white font-semibold">Mia</p>
                <p className="text-slate-400 text-xs">reviewed your results</p>
              </div>
            </div>

            {/* Context text */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <p className="text-slate-300 text-sm leading-relaxed">
                {STEPS[step].context}
              </p>
            </div>

            {/* Question */}
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {STEPS[step].question}
            </h2>

            {/* YES button */}
            <button
              onClick={handleYes}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              {STEPS[step].yes}
            </button>

            {/* Skip */}
            <button
              onClick={() => setStep(STEPS.length)}
              className="text-slate-600 text-xs text-center hover:text-slate-500 transition-colors"
            >
              Skip for now
            </button>
          </div>
        ) : (
          // ── Chat stage ──────────────────────────────────────────────────────
          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <span className="text-emerald-400 text-sm font-medium">✓</span>
              <p className="text-slate-400 text-sm">You're committed. Let's figure this out together.</p>
            </div>
            <ChatStage />
          </div>
        )}
      </div>
    </div>
  )
}
