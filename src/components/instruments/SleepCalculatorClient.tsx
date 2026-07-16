'use client'
import { useState } from 'react'
import { calculateSleepCalculator } from '../../instruments/sleep-calculator/lib/calculate.js'
import type { SleepCalculatorOutput } from '../../instruments/sleep-calculator/lib/types.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

interface CycleCardProps {
  label: string
  time: string
  tag: string
  tagColor: string
  isOptimal?: boolean
}

function CycleCard({ label, time, tag, tagColor, isOptimal }: CycleCardProps) {
  return (
    <div className={`rounded-lg p-4 border ${isOptimal ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-surface-elevated border-border-default'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-content-secondary">{label}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
      </div>
      <div className={`text-2xl font-bold ${isOptimal ? 'text-green-700 dark:text-green-300' : 'text-content-primary'}`}>
        {time}
      </div>
    </div>
  )
}

function SleepCycleBar({ mode }: { mode: 'waketime' | 'bedtime' }) {
  const cycles = [
    { label: '4 cycles', hours: 6, color: '#EAB308', quality: 'Light' },
    { label: '5 cycles', hours: 7.5, color: '#22C55E', quality: 'Optimal' },
    { label: '6 cycles', hours: 9, color: '#16A34A', quality: 'Optimal' },
    { label: '7 cycles', hours: 10.5, color: '#94A3B8', quality: 'Too long' },
  ]
  const total = 10.5
  return (
    <div className="mt-4">
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
        {cycles.map(c => (
          <div
            key={c.label}
            style={{ width: `${(c.hours / total) * 100}%`, backgroundColor: c.color }}
            title={`${c.label}: ${c.hours}h`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-content-tertiary mt-1">
        <span>6h</span>
        <span>7.5h</span>
        <span>9h</span>
        <span>10.5h</span>
      </div>
      <p className="text-xs text-content-tertiary mt-2 text-center">
        {mode === 'waketime' ? 'Each time = ideal bedtime for complete sleep cycles' : 'Each time = ideal wake-up time after complete sleep cycles'}
      </p>
    </div>
  )
}

export function SleepCalculatorClient({ translations }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [mode, setMode] = useState<'waketime' | 'bedtime'>('waketime')
  const [targetTime, setTargetTime] = useState('')
  const [fallAsleepMinutes, setFallAsleepMinutes] = useState('15')
  const [result, setResult] = useState<SleepCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function calculate() {
    try {
      setResult(calculateSleepCalculator({ mode, targetTime, fallAsleepMinutes: parseInt(fallAsleepMinutes, 10) }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setTargetTime(''); setFallAsleepMinutes('15')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const label = mode === 'waketime' ? 'Bedtimes' : 'Wake times'
    const text = `Sleep Schedule (${label})\n4 cycles (6h): ${result.cycle4Time}\n5 cycles (7.5h): ${result.cycle5Time} ✓ Optimal\n6 cycles (9h): ${result.cycle6Time} ✓ Optimal\n7 cycles (10.5h): ${result.cycle7Time}`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const timeLabel = mode === 'waketime' ? 'Wake-up Time' : 'Bedtime'
  const resultLabel = mode === 'waketime' ? 'Go to sleep at:' : 'Wake up at:'

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_mode') ?? 'Mode'}
          </label>
          <div className="flex rounded-lg border border-border-default overflow-hidden">
            <button
              onClick={() => setMode('waketime')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === 'waketime' ? 'bg-accent-primary text-white' : 'bg-surface-input text-content-secondary hover:text-content-primary'}`}
            >
              {t('opt_waketime') ?? 'Wake up at...'}
            </button>
            <button
              onClick={() => setMode('bedtime')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mode === 'bedtime' ? 'bg-accent-primary text-white' : 'bg-surface-input text-content-secondary hover:text-content-primary'}`}
            >
              {t('opt_bedtime') ?? 'Sleep at...'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {timeLabel}
          </label>
          <input
            type="time" value={targetTime} onChange={e => setTargetTime(e.target.value)}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_fallAsleepMinutes') ?? 'Minutes to Fall Asleep'}
          </label>
          <input
            type="number" value={fallAsleepMinutes} onChange={e => setFallAsleepMinutes(e.target.value)}
            min={0} max={60} placeholder="15"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={calculate}
          className="flex-1 bg-accent-primary hover:bg-accent-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          {t('calculate') ?? 'Calculate'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2.5 border border-border-default text-content-secondary hover:text-content-primary hover:border-border-hover rounded-lg transition-colors"
        >
          {t('reset') ?? 'Reset'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Verdict Card — Best option highlighted */}
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">😴</span>
              <span className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400">Best Option</span>
            </div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{result.cycle5Time}</div>
            <div className="text-sm text-green-600 dark:text-green-400 mt-1">
              {resultLabel.replace(':', '')} — 5 cycles (7.5 hours)
            </div>
            <SleepCycleBar mode={mode} />
          </div>

          {/* Cycle Cards */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-1">{t('result') ?? 'Your Sleep Schedule'}</h3>
            <p className="text-xs text-content-tertiary mb-4">{resultLabel}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CycleCard
                label={t('label_cycle4') ?? '4 Cycles — 6 hours'}
                time={result.cycle4Time}
                tag={t('tag_light') ?? 'Light'}
                tagColor="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
              />
              <CycleCard
                label={t('label_cycle5') ?? '5 Cycles — 7.5 hours'}
                time={result.cycle5Time}
                tag={t('tag_optimal') ?? 'Optimal'}
                tagColor="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                isOptimal
              />
              <CycleCard
                label={t('label_cycle6') ?? '6 Cycles — 9 hours'}
                time={result.cycle6Time}
                tag={t('tag_optimal') ?? 'Optimal'}
                tagColor="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                isOptimal
              />
              <CycleCard
                label={t('label_cycle7') ?? '7 Cycles — 10.5 hours'}
                time={result.cycle7Time}
                tag={t('tag_too_much') ?? 'Too Long'}
                tagColor="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
              />
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <p className="text-sm text-content-secondary mb-2">
              Each sleep cycle lasts 90 minutes and includes light sleep, deep sleep (NREM), and REM. Waking mid-cycle causes grogginess — timing your alarm to cycle boundaries is the key to waking up refreshed.
            </p>
            <p className="text-xs text-content-tertiary italic">{result.recommendation}</p>
          </div>

          {/* Actions */}
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

          {/* Sources */}
          <div className="border border-border-default rounded-xl overflow-hidden">
            <button
              onClick={() => setSourcesOpen(o => !o)}
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-content-secondary hover:text-content-primary transition-colors"
            >
              <span>Methodology & Sources</span>
              <span>{sourcesOpen ? '▲' : '▼'}</span>
            </button>
            {sourcesOpen && (
              <div className="px-5 pb-4 text-xs text-content-tertiary space-y-1 border-t border-border-default pt-3">
                <p>• Average sleep cycle duration: 90 minutes (National Sleep Foundation)</p>
                <p>• Formula: bedtime = wake time − fall-asleep latency − (cycles × 90 min)</p>
                <p>• Adults need 7–9 hours per night (American Academy of Sleep Medicine, 2015)</p>
                <p>• Sleep inertia (grogginess) peaks when waking during slow-wave (NREM3) sleep</p>
                <p>• Individual variation: cycles range 80–120 minutes — use this as a guide, not a prescription</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
