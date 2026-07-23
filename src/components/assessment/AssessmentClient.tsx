'use client'

import { useState, useEffect, useCallback } from 'react'
import type {
  AssessmentResult,
  AssessmentQuestion,
  QuestionAnswers,
  GateResult,
  Insight,
  DimensionScore,
} from '@/lib/assessment/types'
import {
  getAssessmentConfig,
  getAssessmentEngine,
  buildResolvedSignals,
} from '@/lib/assessment'
import { getEngine, getProfileEngineFromUser } from '@/lib/user'
import { emitAssessmentEvent } from '@/lib/assessment/events'

// ── Sub-components ────────────────────────────────────────────────────────────

function InsightChip({ insight }: { insight: Insight }) {
  const colors = {
    achievement:  'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning:      'bg-amber-50 border-amber-200 text-amber-800',
    opportunity:  'bg-blue-50 border-blue-200 text-blue-700',
    contradiction:'bg-red-50 border-red-200 text-red-700',
  }
  const icons = {
    achievement:  '✓',
    warning:      '⚠',
    opportunity:  '→',
    contradiction:'≠',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[insight.type]}`}>
      <div className="flex items-start gap-2">
        <span className="text-sm font-bold mt-0.5">{icons[insight.type]}</span>
        <div>
          <p className="text-sm font-semibold">{insight.title}</p>
          <p className="text-xs mt-1 leading-relaxed opacity-80">{insight.body}</p>
        </div>
      </div>
    </div>
  )
}

function DimensionBar({ dim }: { dim: DimensionScore }) {
  const color = dim.score >= 80 ? 'bg-emerald-500'
    : dim.score >= 60 ? 'bg-blue-500'
    : dim.score >= 40 ? 'bg-amber-500'
    : 'bg-red-500'

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{dim.label}</span>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{dim.score}/100</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${dim.score}%` }}
        />
      </div>
    </div>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
    : score >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200'
    : score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-600 bg-red-50 border-red-200'
  return (
    <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-2xl border text-3xl font-bold ${color}`}>
      {score}<span className="text-base font-normal opacity-60">/100</span>
    </div>
  )
}

// ── Gate Screen ───────────────────────────────────────────────────────────────

function GateScreen({ gate, lang }: { gate: GateResult; lang: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
        Assessment not ready yet
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Complete a few more calculators to build enough data for your assessment.
      </p>
      {gate.missing_instruments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Recommended next:
          </p>
          {gate.missing_instruments.slice(0, 3).map(slug => (
            <a
              key={slug}
              href={`/${lang}/calculators/${slug}`}
              className="block w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Gap Questions Form ────────────────────────────────────────────────────────

function GapQuestionsForm({
  questions,
  onSubmit,
}: {
  questions: readonly AssessmentQuestion[]
  onSubmit: (answers: QuestionAnswers) => void
}) {
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({})

  const allRequired = questions.filter(q => q.required)
  const canSubmit = allRequired.every(q => answers[q.id] !== undefined)

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          A couple of quick questions
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          This helps personalize your assessment.
        </p>
      </div>

      {questions.map(q => (
        <div key={q.id}>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {q.label_key}
            {!q.required && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
          </label>
          {q.type === 'select' && q.options && (
            <div className="space-y-2">
              {q.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                    answers[q.id] === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  {opt.label_key}
                </button>
              ))}
            </div>
          )}
          {q.type === 'number' && (
            <input
              type="number"
              min={q.min}
              max={q.max}
              onChange={e => setAnswers(prev => ({ ...prev, [q.id]: Number(e.target.value) }))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={q.unit ? `Enter ${q.unit}` : ''}
            />
          )}
        </div>
      ))}

      <button
        onClick={() => onSubmit(answers)}
        disabled={!canSubmit}
        className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
      >
        Run My Assessment →
      </button>
    </div>
  )
}

// ── Result Screen ─────────────────────────────────────────────────────────────

function ResultScreen({ result, lang }: { result: AssessmentResult; lang: string }) {
  const confidenceLabel = {
    insufficient: 'Preliminary',
    preliminary: 'Preliminary',
    established: 'Established',
    comprehensive: 'Comprehensive',
  }[result.confidence]

  const confidenceColor = {
    insufficient: 'text-slate-400',
    preliminary: 'text-amber-500',
    established: 'text-blue-500',
    comprehensive: 'text-emerald-500',
  }[result.confidence]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
              {result.cluster.charAt(0).toUpperCase() + result.cluster.slice(1)} Assessment
            </p>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              {result.narrative.headline}
            </h2>
          </div>
          <ScoreBadge score={result.overall_score} />
        </div>

        {result.narrative.profile_type && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Your profile
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {result.narrative.profile_type}
            </p>
            {result.narrative.profile_description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {result.narrative.profile_description}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-1 mt-3">
          <span className="text-xs text-slate-400">Data confidence:</span>
          <span className={`text-xs font-semibold ${confidenceColor}`}>{confidenceLabel}</span>
        </div>
      </div>

      {/* Dimension Scores */}
      {result.dimension_scores.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Breakdown
          </h3>
          <div className="space-y-4">
            {result.dimension_scores.map(dim => (
              <DimensionBar key={dim.dimension_id} dim={dim} />
            ))}
          </div>
        </div>
      )}

      {/* Key Insights */}
      {result.narrative.key_points.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Key insights
          </h3>
          {result.narrative.key_points.map(insight => (
            <InsightChip key={insight.id} insight={insight} />
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-950/30 p-6">
        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-3">
          Next recommended step
        </p>
        <a
          href={`/${lang}/calculators/${result.narrative.cta_product_id}`}
          className="block w-full text-center py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors"
        >
          {result.narrative.cta_label}
        </a>
        <a
          href={`/${lang}/dashboard`}
          className="block w-full text-center py-2 mt-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          View my dashboard →
        </a>
      </div>
    </div>
  )
}

// ── Main Client Component ─────────────────────────────────────────────────────

export function AssessmentClient({ cluster, lang }: { cluster: string; lang: string }) {
  const [gate, setGate]         = useState<GateResult | null>(null)
  const [questions, setQuestions] = useState<readonly AssessmentQuestion[]>([])
  const [result, setResult]     = useState<AssessmentResult | null>(null)
  const [running, setRunning]   = useState(false)

  useEffect(() => {
    const config = getAssessmentConfig(cluster)
    if (!config) return

    const profileEngine = getProfileEngineFromUser()
    if (!profileEngine) return

    const userEngine = getEngine()
    const user = userEngine?.getUser()
    const profile = profileEngine.getProfile(user?.id ?? null)

    const engine = getAssessmentEngine()
    const gateResult = engine.canRun(config, profile)
    setGate(gateResult)

    if (gateResult.can_run) {
      const signals = buildResolvedSignals(profile)
      const gapQs = engine.getGapQuestions(config, signals)
      setQuestions(gapQs)

      // If no gap questions, run immediately
      if (gapQs.length === 0) {
        runAssessment({})
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster])

  const runAssessment = useCallback((answers: QuestionAnswers) => {
    const config = getAssessmentConfig(cluster)
    if (!config) return

    const profileEngine = getProfileEngineFromUser()
    if (!profileEngine) return

    const userEngine = getEngine()
    const user = userEngine?.getUser()
    const profile = profileEngine.getProfile(user?.id ?? null)

    setRunning(true)
    emitAssessmentEvent({ type: 'AssessmentStarted', cluster: config.cluster, confidence: 'preliminary' })

    const engine = getAssessmentEngine()
    const assessmentResult = engine.run(config, profile, answers, lang)

    // Write output signals back to ProfileEngine
    const completedSlugs = profile.timeline.map(t => t.instrument_slug)
    const outputSignals = assessmentResult.dimension_scores.map(d => ({
      id: `${config.id}:${d.dimension_id}`,
      instrument_slug: config.id,
      domain: 'weight' as const,   // output_signals from config carry the real domain
      metric: `${d.dimension_id}_score`,
      value: d.score,
      label: null,
      unit: 'score/100',
      status: d.score >= 80 ? 'optimal' as const
        : d.score >= 60 ? 'normal' as const
        : d.score >= 40 ? 'warning' as const
        : 'critical' as const,
      confidence_contribution: 0,
      recorded_at: assessmentResult.completed_at,
    }))

    profileEngine.writeSignalsDirect({ userId: user?.id ?? null, signals: outputSignals, completedSlugs })

    emitAssessmentEvent({
      type: 'AssessmentCompleted',
      cluster: config.cluster,
      score: assessmentResult.overall_score,
      confidence: assessmentResult.confidence,
    })

    window.dispatchEvent(new CustomEvent('solviqlab:result', {
      detail: {
        slug: `${config.cluster}-assessment`,
        name: `${config.cluster.charAt(0).toUpperCase() + config.cluster.slice(1)} Assessment`,
        value: assessmentResult.overall_score,
        label: assessmentResult.confidence,
        unit: 'score',
        metadata: assessmentResult,
      }
    }))

    setResult(assessmentResult)
    setRunning(false)
  }, [cluster, lang])

  // ── Render states ───────────────────────────────────────────────────────────

  if (!gate) {
    return (
      <div className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 h-64" />
    )
  }

  if (!gate.can_run) {
    return <GateScreen gate={gate} lang={lang} />
  }

  if (result) {
    return <ResultScreen result={result} lang={lang} />
  }

  if (running) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <div className="animate-spin text-4xl mb-4">⚙️</div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Computing your assessment...</p>
      </div>
    )
  }

  if (questions.length > 0) {
    return <GapQuestionsForm questions={questions} onSubmit={runAssessment} />
  }

  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 h-64" />
  )
}
