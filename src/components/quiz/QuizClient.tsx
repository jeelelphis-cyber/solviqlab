'use client'

// ─────────────────────────────────────────────────────────────────────────────
// QuizClient — Sprint M-2 (clinical scales, branching, hints, rich results)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import type { QuizConfig, QuizAnswer, QuizResult, QuizQuestion } from '@/lib/quiz/types'
import type { QuizTranslation }  from '@/lib/quiz/translation-types'
import { quizEngine }    from '@/lib/quiz/engine'
import { saveQuizResult } from '@/lib/graph/updater'
import { analytics }     from '@/lib/analytics'
import { getT }          from '@/lib/i18n/ui'

// ── localStorage helpers ──────────────────────────────────────────────────────
function persistQuizResult(result: QuizResult): void {
  if (typeof window === 'undefined') return
  try {
    const key      = 'solviq:quiz:results'
    const raw      = localStorage.getItem(key)
    const existing = raw ? (JSON.parse(raw) as QuizResult[]) : []
    const filtered = existing.filter(r => r.slug !== result.slug)
    localStorage.setItem(key, JSON.stringify([...filtered, result]))

    const graphKeys = Object.keys(localStorage).filter(k => k.startsWith('graph:'))
    for (const gk of graphKeys) {
      const raw2 = localStorage.getItem(gk)
      if (!raw2) continue
      try {
        const graph   = JSON.parse(raw2) as Parameters<typeof saveQuizResult>[0]
        const updated = saveQuizResult(graph, result)
        localStorage.setItem(gk, JSON.stringify(updated))
      } catch {}
    }
  } catch {}
}

function dispatchResultEvent(result: QuizResult, name?: string): void {
  if (typeof window === 'undefined') return
  const ts = Date.now()
  window.dispatchEvent(new CustomEvent('solviqlab:result', {
    detail: {
      type: 'solviqlab:result', eventId: `quiz:${result.slug}:${ts}`,
      slug: result.slug, name: name ?? result.slug, value: result.score,
      label: result.bucket, category: 'quiz', unit: null,
      metadata: { miaHook: result.miaHook, bucket: result.bucket, severity: result.severity },
      timestamp: ts,
    },
  }))
}

// ── Severity styles ───────────────────────────────────────────────────────────
const SEVERITY_STYLE: Record<string, { ring: string; text: string; bg: string; badge: string }> = {
  none:     { ring: 'ring-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  mild:     { ring: 'ring-amber-400',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-900/20',     badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  moderate: { ring: 'ring-orange-400',  text: 'text-orange-600 dark:text-orange-400',   bg: 'bg-orange-50 dark:bg-orange-900/20',   badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  severe:   { ring: 'ring-red-400',     text: 'text-red-600 dark:text-red-400',         bg: 'bg-red-50 dark:bg-red-900/20',         badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

function getSeverityStyle(severity?: string, score?: number) {
  if (severity && SEVERITY_STYLE[severity]) return SEVERITY_STYLE[severity]!
  if (score !== undefined) {
    if (score >= 70) return SEVERITY_STYLE['none']!
    if (score >= 40) return SEVERITY_STYLE['mild']!
    return SEVERITY_STYLE['severe']!
  }
  return SEVERITY_STYLE['none']!
}

// ─────────────────────────────────────────────────────────────────────────────

interface Props { config: QuizConfig; translation: QuizTranslation; lang: string }
type Phase = 'intro' | 'answering' | 'result'

export function QuizClient({ config, translation: tr, lang }: Props) {
  const t = getT(lang)
  const [phase,       setPhase]       = useState<Phase>('intro')
  const [answers,     setAnswers]     = useState<QuizAnswer[]>([])
  const [currentQ,    setCurrentQ]    = useState<QuizQuestion | null>(null)
  const [result,      setResult]      = useState<QuizResult | null>(null)
  const [selectedVal, setSelectedVal] = useState<number | null>(null)
  const [stepNum,     setStepNum]     = useState(0)

  const totalQ = config.questions.length

  // ── Start ─────────────────────────────────────────────────────────────────
  function handleStart() {
    const first = config.questions[0] ?? null
    setCurrentQ(first)
    setPhase('answering')
    setStepNum(1)
    analytics.track('quiz_started', { slug: config.slug })
  }

  // ── Answer ────────────────────────────────────────────────────────────────
  const handleAnswer = useCallback((value: number) => {
    if (!currentQ) return
    const newAnswers = [...answers, { questionId: currentQ.id, value }]
    setAnswers(newAnswers)
    setSelectedVal(null)

    const next = quizEngine.getNextQuestion(config, newAnswers)
    if (!next) {
      const computed = quizEngine.compute(config, newAnswers)
      // Overlay translated bucket text
      const bucketIdx = config.scoring.buckets.findIndex(b => b.label === computed.bucket)
      const tb = tr.buckets[bucketIdx] ?? tr.buckets[tr.buckets.length - 1]
      const translated: QuizResult = tb ? {
        ...computed,
        bucket:      tb.label,
        description: tb.description,
        actions:     tb.actions,
        miaHook:     tb.miaHook,
      } : computed
      setResult(translated)
      setPhase('result')
      persistQuizResult(translated)
      dispatchResultEvent(translated, tr.meta?.title)
      analytics.track('quiz_completed', { slug: computed.slug, score: computed.score, bucket: computed.bucket })
    } else {
      setCurrentQ(next)
      setStepNum(s => s + 1)
    }
  }, [answers, currentQ, config])

  // ── Restart ───────────────────────────────────────────────────────────────
  function handleRestart() {
    setPhase('intro')
    setAnswers([])
    setCurrentQ(null)
    setResult(null)
    setSelectedVal(null)
    setStepNum(0)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTRO
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
        <div className="text-5xl">{config.icon}</div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{tr.meta.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">{tr.meta.description}</p>
        </div>

        {config.clinicalScale && (
          <div className="flex items-center gap-2 rounded-full bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 px-3 py-1.5">
            <span className="text-violet-600 dark:text-violet-400 text-xs">✓</span>
            <span className="text-xs text-violet-700 dark:text-violet-300 font-medium">{t('quiz.clinically_validated')} · {config.clinicalScale}</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{t('quiz.questions_count', { n: totalQ })}</span>
          <span>·</span>
          <span>{t('quiz.free')}</span>
          <span>·</span>
          <span>{t('quiz.no_account')}</span>
        </div>

        {tr.meta.medicalNote && (
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs leading-relaxed border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            ⚕ {tr.meta.medicalNote}
          </p>
        )}

        <button
          onClick={handleStart}
          className="w-full max-w-xs rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 px-6 hover:opacity-90 active:scale-95 transition-all"
        >
          {t('quiz.start_btn')}
        </button>

        {config.sources && config.sources.length > 0 && (
          <p className="text-xs text-gray-400">
            {t('quiz.based_on')} {config.sources.map(s => s.label).join(' · ')}
          </p>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RESULT
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const style  = getSeverityStyle(result.severity, result.score)
    const ctaUrl = `/${lang}/coach/mia`

    // Display score: for normalized show 0-100, for raw show raw/max
    const normalize = config.scoring.normalize !== false
    const displayScore = normalize
      ? `${result.score}/100`
      : `${result.rawScore ?? result.score}/${config.scoring.max}`

    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4 text-center">
        {/* Score circle */}
        <div className={`relative w-28 h-28 rounded-full ring-4 ${style.ring} flex items-center justify-center ${style.bg}`}>
          <div>
            <div className={`text-3xl font-bold ${style.text}`}>{displayScore.split('/')[0]}</div>
            <div className="text-xs text-gray-400">/{displayScore.split('/')[1]}</div>
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-col items-center gap-2">
          <h2 className={`text-xl font-bold ${style.text}`}>{result.bucket}</h2>
          {result.severity && (
            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${style.badge}`}>
              {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} severity
            </span>
          )}
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed max-w-sm mx-auto mt-1">
            {result.description}
          </p>
        </div>

        {/* 3 Actions */}
        {result.actions && result.actions.length > 0 && (
          <div className="w-full max-w-sm rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 text-left">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('quiz.what_to_do')}</p>
            <div className="space-y-2.5">
              {result.actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${style.badge}`}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mia insight */}
        <div className="w-full max-w-sm rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 p-4 text-left">
          <div className="flex items-start gap-3">
            <img
              src="https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp"
              alt="Mia"
              className="w-9 h-9 rounded-full object-cover object-top border-2 border-violet-300 shrink-0"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div>
              <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 mb-0.5">{t('quiz.mia_coach')}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                &ldquo;{result.miaHook}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <a
          href={ctaUrl}
          className="w-full max-w-sm rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3.5 px-6 hover:opacity-90 active:scale-95 transition-all text-center block"
        >
          {t('quiz.get_plan')}
        </a>

        {/* Sources */}
        {config.sources && config.sources.length > 0 && (
          <div className="w-full max-w-sm text-left">
            <p className="text-xs text-gray-400 font-medium mb-1">{t('quiz.sources')}</p>
            <ul className="space-y-0.5">
              {config.sources.map((s, i) => (
                <li key={i} className="text-xs text-gray-400">
                  {s.url
                    ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">{s.label}</a>
                    : s.label
                  }
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={handleRestart}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors underline underline-offset-2"
        >
          {t('quiz.retake')}
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // QUESTION
  // ─────────────────────────────────────────────────────────────────────────
  if (!currentQ) return null

  const progress = Math.round(((stepNum - 1) / totalQ) * 100)

  return (
    <div className="flex flex-col gap-6 py-6 px-2">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>{t('quiz.question_of', { n: stepNum, total: totalQ })}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {config.clinicalScale && (
          <p className="text-right text-xs text-gray-400 mt-1">{config.clinicalScale}</p>
        )}
      </div>

      {/* Question */}
      <div>
        <p className="text-lg font-semibold text-gray-900 dark:text-white leading-snug">
          {tr.questions[currentQ.id]?.text ?? currentQ.text}
        </p>
        {(tr.questions[currentQ.id]?.hint ?? currentQ.hint) && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 leading-relaxed border-l-2 border-violet-200 dark:border-violet-700 pl-3">
            {tr.questions[currentQ.id]?.hint ?? currentQ.hint}
          </p>
        )}
      </div>

      {/* Answer inputs */}
      <div className="flex flex-col gap-2.5">
        {currentQ.type === 'likert' && currentQ.options && (
          currentQ.options.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="w-full min-h-[48px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-left text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-[0.98] transition-all font-medium"
            >
              {tr.likertOptions?.[i] ?? opt.label}
            </button>
          ))
        )}

        {currentQ.type === 'single' && currentQ.options && (
          currentQ.options.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="w-full min-h-[48px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-left text-gray-800 dark:text-gray-100 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 active:scale-[0.98] transition-all font-medium"
            >
              {tr.questions[currentQ.id]?.options?.[i] ?? opt.label}
            </button>
          ))
        )}

        {currentQ.type === 'yesno' && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: tr.yesnoOptions?.[0] ?? 'Yes', value: 1 },
              { label: tr.yesnoOptions?.[1] ?? 'No',  value: 4 },
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

        {currentQ.type === 'scale' && (
          <ScaleInput
            min={currentQ.scaleMin ?? 1}
            max={currentQ.scaleMax ?? 5}
            labels={tr.questions[currentQ.id]?.scaleLabels ?? currentQ.scaleLabels}
            selectedVal={selectedVal}
            onSelect={setSelectedVal}
            onConfirm={handleAnswer}
            continueLabel={t('quiz.continue')}
          />
        )}
      </div>

      {currentQ.source && (
        <p className="text-xs text-gray-300 dark:text-gray-600 text-right">{currentQ.source}</p>
      )}
    </div>
  )
}

// ── Scale Input ───────────────────────────────────────────────────────────────
interface ScaleInputProps {
  min: number; max: number
  labels?: { min: string; max: string }
  selectedVal: number | null
  onSelect: (v: number) => void
  onConfirm: (v: number) => void
  continueLabel?: string
}

function ScaleInput({ min, max, labels, selectedVal, onSelect, onConfirm, continueLabel = 'Continue →' }: ScaleInputProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const isMany = steps.length > 6

  return (
    <div className="flex flex-col gap-4">
      {isMany ? (
        <div className="flex flex-col gap-3">
          <input
            type="range" min={min} max={max} value={selectedVal ?? min}
            onChange={e => onSelect(Number(e.target.value))}
            className="w-full accent-violet-600 cursor-pointer"
          />
          <div className="text-center">
            <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">{selectedVal ?? min}</span>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 justify-center">
          {steps.map(v => (
            <button
              key={v} onClick={() => onSelect(v)}
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
          <span>{labels.min}</span><span>{labels.max}</span>
        </div>
      )}

      <button
        disabled={selectedVal === null}
        onClick={() => { if (selectedVal !== null) onConfirm(selectedVal) }}
        className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95 transition-all"
      >
        {continueLabel}
      </button>
    </div>
  )
}
