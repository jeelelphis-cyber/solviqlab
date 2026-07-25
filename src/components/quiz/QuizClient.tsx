'use client'

// ─────────────────────────────────────────────────────────────────────────────
// QuizClient — step-by-step quiz flow with result screen
// Sprint M-1
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { QuizConfig, QuizAnswer, QuizResult } from '@/lib/quiz/types'
import { quizEngine }  from '@/lib/quiz/engine'
import { saveQuizResult } from '@/lib/graph/updater'
import { analytics }   from '@/lib/analytics'

// ── Minimal localStorage graph helper (no repo needed in client) ──────────────
function persistQuizResult(result: QuizResult): void {
  if (typeof window === 'undefined') return
  try {
    const key = 'solviq:quiz:results'
    const raw = localStorage.getItem(key)
    const existing: QuizResult[] = raw ? (JSON.parse(raw) as QuizResult[]) : []
    const filtered = existing.filter(r => r.slug !== result.slug)
    localStorage.setItem(key, JSON.stringify([...filtered, result]))

    // Also update UserGraph in localStorage if present
    const graphKeys = Object.keys(localStorage).filter(k => k.startsWith('graph:'))
    for (const gk of graphKeys) {
      const raw2 = localStorage.getItem(gk)
      if (!raw2) continue
      try {
        const graph = JSON.parse(raw2) as Parameters<typeof saveQuizResult>[0]
        const updated = saveQuizResult(graph, result)
        localStorage.setItem(gk, JSON.stringify(updated))
      } catch {}
    }
  } catch {}
}

// ── Dispatch solviqlab:result browser event ───────────────────────────────────
function dispatchResultEvent(result: QuizResult): void {
  if (typeof window === 'undefined') return
  const ts = Date.now()
  window.dispatchEvent(new CustomEvent('solviqlab:result', {
    detail: {
      type:      'solviqlab:result',
      eventId:   `quiz:${result.slug}:${ts}`,
      slug:      result.slug,
      name:      result.slug,
      value:     result.score,
      label:     result.bucket,
      category:  'quiz',
      unit:      null,
      metadata:  { miaHook: result.miaHook, bucket: result.bucket },
      timestamp: ts,
    },
  }))
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  config: QuizConfig
  lang:   string
}

type QuestionState = 'answering' | 'result'

const BUCKET_COLORS: Record<string, { bg: string; ring: string; text: string }> = {
  good:    { bg: 'bg-emerald-50 dark:bg-emerald-900/20', ring: 'ring-emerald-400', text: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',    ring: 'ring-amber-400',    text: 'text-amber-600 dark:text-amber-400' },
  red:     { bg: 'bg-red-50 dark:bg-red-900/20',        ring: 'ring-red-400',      text: 'text-red-600 dark:text-red-400' },
}

function bucketStyle(score: number): typeof BUCKET_COLORS[string] {
  if (score >= 70) return BUCKET_COLORS['good']!
  if (score >= 40) return BUCKET_COLORS['amber']!
  return BUCKET_COLORS['red']!
}

// ─────────────────────────────────────────────────────────────────────────────

export function QuizClient({ config, lang }: Props) {
  const [step, setStep]           = useState(0)
  const [answers, setAnswers]     = useState<QuizAnswer[]>([])
  const [result, setResult]       = useState<QuizResult | null>(null)
  const [phase, setPhase]         = useState<QuestionState>('answering')
  const [selectedVal, setSelectedVal] = useState<number | null>(null)
  const [started, setStarted]     = useState(false)

  const questions = config.questions
  const current   = questions[step]
  const progress  = Math.round(((step) / questions.length) * 100)

  // ── Start ────────────────────────────────────────────────────────────────
  function handleStart() {
    setStarted(true)
    analytics.track('quiz_started', { slug: config.slug })
  }

  // ── Record answer and advance ─────────────────────────────────────────────
  const handleAnswer = useCallback((value: number) => {
    if (!current) return
    const newAnswers = [...answers, { questionId: current.id, value }]
    setAnswers(newAnswers)
    setSelectedVal(null)

    if (step + 1 >= questions.length) {
      // Last question — compute result
      const computed = quizEngine.compute(config, newAnswers)
      setResult(computed)
      setPhase('result')
      persistQuizResult(computed)
      dispatchResultEvent(computed)
      analytics.track('quiz_completed', {
        slug:   computed.slug,
        score:  computed.score,
        bucket: computed.bucket,
      })
    } else {
      setStep(s => s + 1)
    }
  }, [answers, current, step, questions.length, config])

  // ── Restart ───────────────────────────────────────────────────────────────
  function handleRestart() {
    setStep(0)
    setAnswers([])
    setResult(null)
    setPhase('answering')
    setSelectedVal(null)
    setStarted(false)
  }

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
        <div className="text-5xl">{config.icon}</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{config.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">{config.description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {questions.length} questions · Free · No account needed
        </div>
        <button
          onClick={handleStart}
          className="w-full max-w-xs rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 px-6 hover:opacity-90 active:scale-95 transition-all"
        >
          Start Quiz →
        </button>
      </div>
    )
  }

  // ── Result screen ─────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const style = bucketStyle(result.score)
    const ctaHref = `/${lang}/calculators/bmi-calculator`

    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
        {/* Score circle */}
        <div className={`relative w-28 h-28 rounded-full ring-4 ${style.ring} flex items-center justify-center ${style.bg}`}>
          <div>
            <div className={`text-4xl font-bold ${style.text}`}>{result.score}</div>
            <div className="text-xs text-gray-400">/100</div>
          </div>
        </div>

        {/* Bucket label */}
        <div>
          <h2 className={`text-xl font-bold mb-1 ${style.text}`}>{result.bucket}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto">
            {result.description}
          </p>
        </div>

        {/* Mia insight teaser */}
        <div className="w-full max-w-sm rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4 text-left">
          <div className="flex items-start gap-3">
            <img
              src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
              alt="Mia"
              className="w-9 h-9 rounded-full object-cover object-top border-2 border-violet-300 flex-shrink-0"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div>
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-0.5">Mia · Your Coach</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                &ldquo;{result.miaHook}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <a
          href={ctaHref}
          className="w-full max-w-sm rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 px-6 hover:opacity-90 active:scale-95 transition-all text-center block"
        >
          Get Mia&apos;s personalized insights →
        </a>

        <button
          onClick={handleRestart}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors underline underline-offset-2"
        >
          Retake quiz
        </button>
      </div>
    )
  }

  // ── Question screen ───────────────────────────────────────────────────────
  if (!current) return null

  return (
    <div className="flex flex-col gap-6 py-6 px-2">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Question {step + 1} of {questions.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question text */}
      <div className="min-h-[60px]">
        <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
          {current.text}
        </p>
      </div>

      {/* Answer inputs */}
      <div className="flex flex-col gap-2.5">
        {current.type === 'single' && current.options && (
          current.options.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="w-full min-h-[48px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-left text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-[0.98] transition-all font-medium"
            >
              {opt.label}
            </button>
          ))
        )}

        {current.type === 'yesno' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Yes', value: 1 },
              { label: 'No',  value: 4 },
            ].map(opt => (
              <button
                key={opt.label}
                onClick={() => handleAnswer(opt.value)}
                className="min-h-[56px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-95 transition-all"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {current.type === 'scale' && (
          <ScaleInput
            min={current.scaleMin ?? 1}
            max={current.scaleMax ?? 5}
            labels={current.scaleLabels}
            selectedVal={selectedVal}
            onSelect={setSelectedVal}
            onConfirm={handleAnswer}
          />
        )}
      </div>
    </div>
  )
}

// ── Scale Input ───────────────────────────────────────────────────────────────

interface ScaleInputProps {
  min:         number
  max:         number
  labels?:     { min: string; max: string }
  selectedVal: number | null
  onSelect:    (v: number) => void
  onConfirm:   (v: number) => void
}

function ScaleInput({ min, max, labels, selectedVal, onSelect, onConfirm }: ScaleInputProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const isMany = steps.length > 6

  return (
    <div className="flex flex-col gap-4">
      {isMany ? (
        // Slider for wide ranges (e.g. 1-10)
        <div className="flex flex-col gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={selectedVal ?? min}
            onChange={e => onSelect(Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
          <div className="text-center">
            <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {selectedVal ?? min}
            </span>
          </div>
        </div>
      ) : (
        // Buttons for small ranges (e.g. 1-5)
        <div className="flex gap-2 justify-center">
          {steps.map(v => (
            <button
              key={v}
              onClick={() => onSelect(v)}
              className={`flex-1 min-h-[48px] rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                selectedVal === v
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      )}

      {labels && (
        <div className="flex justify-between text-xs text-gray-400 px-1">
          <span>{labels.min}</span>
          <span>{labels.max}</span>
        </div>
      )}

      <button
        disabled={selectedVal === null}
        onClick={() => { if (selectedVal !== null) onConfirm(selectedVal) }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
      >
        Continue →
      </button>
    </div>
  )
}
