'use client'
import { useState, useEffect } from 'react'
import { calculateDueDate } from '../../instruments/due-date-calculator/lib/calculate.js'
import type { DueDateCalculatorOutput, DueDateMethod } from '../../instruments/due-date-calculator/lib/types.js'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

function t(key: string, translations: Record<string, unknown>): string {
  return (translations[key] as string | undefined) ?? key
}

function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!))
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

const TRIMESTER_COLORS: Record<number, { bg: string; text: string; border: string; badge: string; bar: string }> = {
  1: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    badge: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    bar: 'bg-blue-500',
  },
  2: {
    bg: 'bg-green-50 dark:bg-green-950/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    badge: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    bar: 'bg-green-500',
  },
  3: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    badge: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    bar: 'bg-purple-500',
  },
}

export function DueDateCalculatorClient({ translations, lang: _lang }: Props) {
  const tr = (key: string) => t(key, translations)

  const [method, setMethod] = useState<DueDateMethod>('lmp')
  const [date, setDate] = useState('')
  const [result, setResult] = useState<DueDateCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showAllMilestones, setShowAllMilestones] = useState(false)

  useEffect(() => {
    if (!result) return
    window.dispatchEvent(new CustomEvent('solviqlab:result', {
      detail: { slug: 'due-date-calculator', name: 'Due Date Calculator', value: result.daysRemaining, label: `Trimester ${result.trimester}`, unit: 'days', metadata: result }
    }))
  }, [result])

  function calculate() {
    try {
      const r = calculateDueDate({ method, date })
      setResult(r)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setDate('')
    setResult(null)
    setError(null)
    setShowAllMilestones(false)
  }

  function copyResult() {
    if (!result) return
    const text = [
      'Due Date Summary',
      `Due Date: ${result.dueDate}`,
      `Gestational Age: ${result.gestationalAge}`,
      `Trimester: ${result.trimester}`,
      `Days Remaining: ${result.isOverdue ? `${Math.abs(result.daysRemaining)} days overdue` : `${result.daysRemaining} days`}`,
      `LMP: ${result.lmpDate}`,
      `Conception Date: ${result.conceptionDate}`,
      `1st Trimester End: ${result.trimester1End}`,
      `2nd Trimester End: ${result.trimester2End}`,
    ].join('\n')
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const colors = result ? (TRIMESTER_COLORS[result.trimester] ?? TRIMESTER_COLORS[1]!) : null
  const today = new Date().toISOString().slice(0, 10)

  const pastMilestones = result?.milestones.filter(m => m.isPast) ?? []
  const futureMilestones = result?.milestones.filter(m => !m.isPast) ?? []
  const nextFour = futureMilestones.slice(0, 4)
  const extraFuture = futureMilestones.slice(4)

  const progressPct = result
    ? Math.min(100, Math.max(0, Math.round((result.daysPregnant / 280) * 100)))
    : 0

  const methodButtons: { id: DueDateMethod; label: string }[] = [
    { id: 'lmp', label: tr('opt_lmp') },
    { id: 'conception', label: tr('opt_conception') },
    { id: 'ivf3', label: tr('opt_ivf3') },
    { id: 'ivf5', label: tr('opt_ivf5') },
  ]

  const trimesterLabel = result
    ? (tr(`trimester_${result.trimester}`) ?? '')
    : ''

  return (
    <div className="space-y-6">
      {/* YMYL Top Disclaimer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        {tr('ymyl_disclaimer')}
      </div>

      {/* Method Selector */}
      <div>
        <div className="block text-sm font-medium text-content-secondary mb-2">{tr('label_method')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {methodButtons.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => { setMethod(id); setResult(null); setError(null) }}
              className={`py-2 px-3 text-sm rounded-lg border font-medium transition-colors text-center ${
                method === id
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-surface-input border-border-default text-content-secondary hover:border-border-hover hover:text-content-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date Input */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1">
          {tr('label_date')}
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          max={today}
          className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          disabled={!date}
          className="flex-1 bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          {tr('calculate')}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 border border-border-default text-content-secondary hover:text-content-primary hover:border-border-hover rounded-lg transition-colors"
        >
          {tr('reset')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && colors && (
        <div className="space-y-4">

          {/* Due Date Hero Card */}
          <div className={`border rounded-xl p-5 ${colors.bg} ${colors.border}`}>
            {/* Overdue badge */}
            {result.isOverdue && (
              <div className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700">
                {Math.abs(result.daysRemaining)} {tr('days_overdue')}
              </div>
            )}

            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wide mb-1 ${colors.text} opacity-70`}>
                  {tr('label_dueDate')}
                </div>
                {/* Hero date with day of week */}
                <div className={`text-2xl sm:text-3xl font-bold ${colors.text}`}>
                  {formatDisplayDate(result.dueDate)}
                </div>
              </div>
              {/* Trimester Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${colors.badge} ${colors.border}`}>
                T{result.trimester} — {trimesterLabel}
              </span>
            </div>

            {/* Gestational age badge */}
            <div className="mt-2">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
                {result.gestationalAge} pregnant
              </span>
            </div>

            {/* Key dates row: T1 End / T2 End / Due Date */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <div className="text-xs text-content-tertiary mb-0.5">{tr('label_trimester1End')}</div>
                <div className={`text-xs font-semibold ${colors.text}`}>{formatShortDate(result.trimester1End)}</div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <div className="text-xs text-content-tertiary mb-0.5">{tr('label_trimester2End')}</div>
                <div className={`text-xs font-semibold ${colors.text}`}>{formatShortDate(result.trimester2End)}</div>
              </div>
              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2">
                <div className="text-xs text-content-tertiary mb-0.5">{tr('label_dueDate')}</div>
                <div className={`text-xs font-semibold ${colors.text}`}>{formatShortDate(result.dueDate)}</div>
              </div>
            </div>

            {/* Days remaining / overdue */}
            <div className="mt-4 flex flex-wrap gap-4">
              <div>
                <div className="text-xs text-content-tertiary mb-0.5">
                  {result.isOverdue ? tr('days_overdue') : tr('label_daysRemaining')}
                </div>
                <div className={`text-lg font-bold ${result.isOverdue ? 'text-red-600 dark:text-red-400' : colors.text}`}>
                  {result.isOverdue
                    ? `${Math.abs(result.daysRemaining)} ${tr('days_overdue')}`
                    : `${result.daysRemaining} ${tr('days_remaining')}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-content-tertiary mb-0.5">{tr('label_weeksPregnant')}</div>
                <div className={`text-lg font-bold ${colors.text}`}>
                  {result.weeksPregnant}w {result.daysPregnant % 7}d
                </div>
              </div>
            </div>

            {/* Progress Bar: gestational age 0 → 280 days */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-content-tertiary mb-1">
                <span>{tr('label_lmpDate')}: {formatShortDate(result.lmpDate)}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colors.bar}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-content-tertiary mt-1">
                <span>Week 0</span>
                <span>Week 40</span>
              </div>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{tr('result')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{tr('label_conceptionDate')}</div>
                <div className="text-sm font-semibold text-content-primary">{formatShortDate(result.conceptionDate)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{tr('label_lmpDate')}</div>
                <div className="text-sm font-semibold text-content-primary">{formatShortDate(result.lmpDate)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{tr('label_gestationalAge')}</div>
                <div className="text-sm font-semibold text-content-primary">{result.gestationalAge}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{tr('label_trimester')}</div>
                <div className="text-sm font-semibold text-content-primary">{trimesterLabel}</div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{tr('label_milestones')}</h3>

            <div className="space-y-2">
              {/* Past milestones — shown with checkmark */}
              {pastMilestones.map(m => (
                <div key={m.week} className="flex items-center gap-3 py-2 border-b border-border-default last:border-0 opacity-60">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-content-tertiary">Week {m.week} · {formatShortDate(m.date)}</div>
                    <div className="text-sm text-content-secondary truncate">{m.label}</div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${
                    m.trimester === 1 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    m.trimester === 2 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>T{m.trimester}</span>
                </div>
              ))}

              {/* Next 4 upcoming milestones */}
              {nextFour.map(m => (
                <div key={m.week} className="flex items-center gap-3 py-2 border-b border-border-default last:border-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center">
                    <span className="text-accent-primary text-xs font-bold">{m.week}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-content-tertiary">Week {m.week} · {formatShortDate(m.date)}</div>
                    <div className="text-sm text-content-primary font-medium truncate">{m.label}</div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${
                    m.trimester === 1 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    m.trimester === 2 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>T{m.trimester}</span>
                </div>
              ))}

              {/* Remaining milestones (toggle) */}
              {showAllMilestones && extraFuture.map(m => (
                <div key={m.week} className="flex items-center gap-3 py-2 border-b border-border-default last:border-0">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center">
                    <span className="text-content-tertiary text-xs font-bold">{m.week}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-content-tertiary">Week {m.week} · {formatShortDate(m.date)}</div>
                    <div className="text-sm text-content-secondary truncate">{m.label}</div>
                  </div>
                  <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${
                    m.trimester === 1 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                    m.trimester === 2 ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}>T{m.trimester}</span>
                </div>
              ))}
            </div>

            {extraFuture.length > 0 && (
              <button
                onClick={() => setShowAllMilestones(v => !v)}
                className="mt-3 text-xs text-accent-primary hover:underline"
              >
                {showAllMilestones ? tr('hide_milestones') : tr('show_all_milestones')}
              </button>
            )}
          </div>

          {/* Actions: Copy + Print */}
          <div className="flex gap-2">
            <button
              onClick={copyResult}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors"
            >
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors"
            >
              ⎙ Print
            </button>
          </div>
          <ShareButtons text={`My baby's due date: ${result.dueDate} — calculated free at SolviqLab`} className="mt-2" />

          {/* YMYL Bottom Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
            {tr('ymyl_disclaimer')}
          </div>
        </div>
      )}
    </div>
  )
}
