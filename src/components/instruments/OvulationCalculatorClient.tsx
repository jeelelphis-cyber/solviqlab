'use client'
import { useState } from 'react'
import { calculateOvulationCalculator } from '../../instruments/ovulation-calculator/lib/calculate.js'
import type { OvulationCalculatorOutput } from '../../instruments/ovulation-calculator/lib/types.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!))
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!))
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function daysLabel(n: number) {
  if (n === 0) return 'Today'
  if (n > 0) return `In ${n} day${n === 1 ? '' : 's'}`
  return `${Math.abs(n)} day${Math.abs(n) === 1 ? '' : 's'} ago`
}

function CycleTimeline({ result, cycleLength }: { result: OvulationCalculatorOutput; cycleLength: number }) {
  const phases = [
    { label: 'Period', days: 5, color: '#F87171', description: 'Menstruation' },
    { label: 'Follicular', days: Math.max(0, parseInt(result.fertileWindowStart.split('-')[2] ?? '14', 10) - 6), color: '#FCD34D', description: 'Follicular phase' },
    { label: 'Fertile', days: 6, color: '#34D399', description: 'Fertile window (6 days)' },
    { label: 'Luteal', days: Math.max(0, cycleLength - 5 - Math.max(0, parseInt(result.fertileWindowStart.split('-')[2] ?? '14', 10) - 6) - 6), color: '#A78BFA', description: 'Luteal phase' },
  ]
  const total = phases.reduce((s, p) => s + p.days, 0) || cycleLength

  return (
    <div className="mt-4">
      <div className="flex h-4 rounded-full overflow-hidden">
        {phases.filter(p => p.days > 0).map(p => (
          <div
            key={p.label}
            style={{ width: `${(p.days / total) * 100}%`, backgroundColor: p.color }}
            title={`${p.label}: ${p.days} days`}
          />
        ))}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {phases.filter(p => p.days > 0).map(p => (
          <div key={p.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-xs text-content-tertiary">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function OvulationCalculatorClient({ translations }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [lastPeriodDate, setLastPeriodDate] = useState('')
  const [cycleLength, setCycleLength] = useState('28')
  const [result, setResult] = useState<OvulationCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function calculate() {
    try {
      setResult(calculateOvulationCalculator({ lastPeriodDate, cycleLength: parseInt(cycleLength, 10) }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setLastPeriodDate(''); setCycleLength('28')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Ovulation Estimate\nOvulation: ${result.ovulationDate}\nFertile Window: ${result.fertileWindowStart} → ${result.fertileWindowEnd}\nNext Period: ${result.nextPeriodDate}`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isUpcoming = result && result.daysUntilOvulation >= 0
  const inFertileWindow = result && result.daysUntilOvulation >= -1 && result.daysUntilOvulation <= 5

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        {t('ymyl_disclaimer') ?? 'This calculator provides estimates only. Individual cycles vary. Not a substitute for medical advice or contraception. Consult a healthcare provider.'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_lastPeriodDate') ?? 'First Day of Last Period'}
          </label>
          <input
            type="date" value={lastPeriodDate} onChange={e => setLastPeriodDate(e.target.value)}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_cycleLength') ?? 'Average Cycle Length'} <span className="text-content-tertiary">(days)</span>
          </label>
          <input
            type="number" value={cycleLength} onChange={e => setCycleLength(e.target.value)}
            min={21} max={45} placeholder="28"
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
          {/* Verdict — Ovulation date */}
          <div className={`border rounded-xl p-5 ${inFertileWindow ? 'bg-green-50 dark:bg-green-950/40 border-green-300 dark:border-green-700' : isUpcoming ? 'bg-pink-50 dark:bg-pink-950/40 border-pink-300 dark:border-pink-700' : 'bg-surface-card border-border-default'}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{inFertileWindow ? '🌸' : isUpcoming ? '📅' : '📊'}</span>
              <span className={`text-sm font-semibold uppercase tracking-wide ${inFertileWindow ? 'text-green-700 dark:text-green-400' : isUpcoming ? 'text-pink-700 dark:text-pink-400' : 'text-content-secondary'}`}>
                {inFertileWindow ? 'In Fertile Window' : isUpcoming ? 'Ovulation Upcoming' : 'Ovulation Passed'}
              </span>
            </div>
            <div className={`text-2xl font-bold mb-1 ${inFertileWindow ? 'text-green-700 dark:text-green-300' : isUpcoming ? 'text-pink-700 dark:text-pink-300' : 'text-content-primary'}`}>
              {formatDisplayDate(result.ovulationDate)}
            </div>
            <div className={`text-sm ${inFertileWindow ? 'text-green-600 dark:text-green-400' : 'text-content-secondary'}`}>
              {daysLabel(result.daysUntilOvulation)}
            </div>
            <CycleTimeline result={result} cycleLength={parseInt(cycleLength, 10)} />
          </div>

          {/* Fertile Window */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Your Cycle Details'}</h3>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-3">
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">Fertile Window</div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-green-700 dark:text-green-300">{formatShortDate(result.fertileWindowStart)}</span>
                <span className="text-content-tertiary">→</span>
                <span className="text-base font-semibold text-green-700 dark:text-green-300">{formatShortDate(result.fertileWindowEnd)}</span>
                <span className="text-xs text-green-600 dark:text-green-400">(6 days)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_fertileWindowStart') ?? 'Window Start'}</div>
                <div className="text-sm font-semibold text-content-primary">{formatDisplayDate(result.fertileWindowStart)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_fertileWindowEnd') ?? 'Window End'}</div>
                <div className="text-sm font-semibold text-content-primary">{formatDisplayDate(result.fertileWindowEnd)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 col-span-2">
                <div className="text-xs text-content-tertiary mb-1">{t('label_nextPeriodDate') ?? 'Next Period'}</div>
                <div className="text-sm font-semibold text-content-primary">{formatDisplayDate(result.nextPeriodDate)}</div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <p className="text-sm text-content-secondary mb-2">
              Your most fertile days are the 2–3 days before ovulation and the day of ovulation itself. The egg survives 12–24 hours after release, while sperm can survive up to 5 days — making the pre-ovulation window critical.
            </p>
            <p className="text-xs text-content-tertiary">Cycle tracking becomes more accurate over multiple months of data. Consider using a basal body temperature thermometer or LH surge test for confirmation.</p>
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
                <p>• Ovulation day: last period + (cycle length − 14 days)</p>
                <p>• Fertile window: ovulation day −5 to ovulation day (6 days total)</p>
                <p>• Average cycle: 28 days; normal range 21–35 days (ACOG)</p>
                <p>• Egg viability: 12–24 hours post-ovulation (American Society for Reproductive Medicine)</p>
                <p>• Sperm viability: up to 5 days in fertile cervical mucus</p>
                <p>• This tool does not account for irregular cycles, PCOS, or other conditions</p>
                <p>• Not a contraceptive method — consult a healthcare provider for family planning</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
