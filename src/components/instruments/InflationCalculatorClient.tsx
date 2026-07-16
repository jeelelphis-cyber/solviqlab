'use client'
import { useState } from 'react'
import { calculateInflationCalculator } from '../../instruments/inflation-calculator/lib/calculate.js'
import type { InflationCalculatorOutput } from '../../instruments/inflation-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

type ImpactTier = 'low' | 'moderate' | 'high' | 'severe'

const IMPACT_CONFIG: Record<ImpactTier, {
  verdict: string
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
  interpretation: string
  cta: string
  ctaHref: string
}> = {
  low: {
    verdict: 'Low Inflation Impact',
    icon: '✅',
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    borderClass: 'border-green-300 dark:border-green-700',
    interpretation: 'Inflation had a modest impact over this period. Your purchasing power is largely intact. Even so, keeping money in a savings account earning below the inflation rate still means a real loss.',
    cta: 'See how investing beats inflation →',
    ctaHref: '/investment-calculator',
  },
  moderate: {
    verdict: 'Moderate Impact',
    icon: '📊',
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
    interpretation: 'Your purchasing power has shrunk noticeably. This is why inflation-beating investments matter — leaving cash idle means losing real value every year.',
    cta: 'Calculate investment growth vs inflation →',
    ctaHref: '/investment-calculator',
  },
  high: {
    verdict: 'High Inflation Impact',
    icon: '⚠️',
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-300 dark:border-orange-700',
    interpretation: 'Over 40% of your purchasing power has been eroded. This illustrates why long-term cash holdings are risky — inflation is a silent tax that compounds every year.',
    cta: 'See how compound investing protects wealth →',
    ctaHref: '/investment-calculator',
  },
  severe: {
    verdict: 'Severe Erosion',
    icon: '🔴',
    colorClass: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-300 dark:border-red-700',
    interpretation: 'More than half your purchasing power is gone. High inflation over long periods is devastating to cash savings. Diversified investments, real assets, and inflation-linked bonds are essential.',
    cta: 'Build wealth that outpaces inflation →',
    ctaHref: '/investment-calculator',
  },
}

function getImpactTier(purchasingPowerLoss: number): ImpactTier {
  if (purchasingPowerLoss < 20) return 'low'
  if (purchasingPowerLoss < 40) return 'moderate'
  if (purchasingPowerLoss < 60) return 'high'
  return 'severe'
}

function PurchasingPowerBar({ original, adjusted }: { original: number; adjusted: number }) {
  const max = Math.max(original, adjusted)
  const origPct = max > 0 ? (original / max) * 100 : 100
  const adjPct = max > 0 ? (adjusted / max) * 100 : 100

  return (
    <div className="mt-4 space-y-2">
      <div>
        <div className="text-xs text-content-tertiary mb-1">Original amount</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-4 bg-blue-400 rounded-full" style={{ width: `${origPct}%` }} />
          <span className="text-xs font-medium text-content-primary w-16 text-right">{original.toFixed(0)}</span>
        </div>
      </div>
      <div>
        <div className="text-xs text-content-tertiary mb-1">Equivalent today</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-4 bg-orange-400 rounded-full" style={{ width: `${adjPct}%` }} />
          <span className="text-xs font-medium text-content-primary w-16 text-right">{adjusted.toFixed(0)}</span>
        </div>
      </div>
    </div>
  )
}

export function InflationCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [amount, setAmount] = useState('')
  const [fromYear, setFromYear] = useState('2000')
  const [toYear, setToYear] = useState('2024')
  const [inflationRate, setInflationRate] = useState('3.0')
  const [result, setResult] = useState<InflationCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function calculate() {
    try {
      setResult(calculateInflationCalculator({
        amount: parseFloat(amount),
        fromYear: parseInt(fromYear, 10),
        toYear: parseInt(toYear, 10),
        inflationRate: parseFloat(inflationRate),
      }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setAmount(''); setFromYear('2000'); setToYear('2024'); setInflationRate('3.0')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Inflation Calculation\nOriginal: ${amount} in ${fromYear} → ${result.adjustedAmount} in ${toYear} | Purchasing Power Lost: ${result.purchasingPowerLoss}% | Total Inflation: ${result.totalInflation}%`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tier = result ? getImpactTier(result.purchasingPowerLoss) : null
  const config = tier ? IMPACT_CONFIG[tier] : null

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_amount') ?? 'Original Amount'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number" value={amount} onChange={e => setAmount(e.target.value)}
            min={0} placeholder="e.g. 1000"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_inflationRate') ?? 'Annual Inflation Rate'} <span className="text-content-tertiary">(%)</span>
          </label>
          <input
            type="number" value={inflationRate} onChange={e => setInflationRate(e.target.value)}
            min={0} max={100} step={0.1} placeholder="3.0"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_fromYear') ?? 'From Year'}
          </label>
          <input
            type="number" value={fromYear} onChange={e => setFromYear(e.target.value)}
            min={1900} max={2100} placeholder="2000"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_toYear') ?? 'To Year'}
          </label>
          <input
            type="number" value={toYear} onChange={e => setToYear(e.target.value)}
            min={1900} max={2100} placeholder="2024"
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

      {result && config && (
        <div className="space-y-4">
          {/* Verdict Card */}
          <div className={`border rounded-xl p-5 ${config.bgClass} ${config.borderClass}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{config.icon}</span>
              <span className={`text-sm font-semibold uppercase tracking-wide ${config.colorClass}`}>{config.verdict}</span>
            </div>
            <div className={`text-3xl font-bold ${config.colorClass}`}>
              {formatAmount(result.adjustedAmount, currency, lang)}
            </div>
            <div className="text-sm text-content-secondary mt-1">equivalent in {toYear}</div>
            <PurchasingPowerBar original={parseFloat(amount)} adjusted={result.adjustedAmount} />
          </div>

          {/* Stats */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Inflation Impact'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3 col-span-2 sm:col-span-1">
                <div className="text-xs text-content-tertiary mb-1">{t('label_adjustedAmount') ?? 'Adjusted Amount'}</div>
                <div className="text-xl font-semibold text-accent-primary">{formatAmount(result.adjustedAmount, currency, lang)}</div>
                <div className="text-xs text-content-tertiary mt-1">in {toYear} dollars</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_yearsElapsed') ?? 'Years Elapsed'}</div>
                <div className="text-lg font-semibold text-content-primary">{result.yearsElapsed} yrs</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalInflation') ?? 'Total Inflation'}</div>
                <div className="text-lg font-semibold text-content-primary">{result.totalInflation}%</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_purchasingPowerLoss') ?? 'Purchasing Power Lost'}</div>
                <div className="text-lg font-semibold text-red-500">{result.purchasingPowerLoss}%</div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <p className="text-sm text-content-secondary mb-3">{config.interpretation}</p>
            <a href={config.ctaHref} className="inline-block text-sm font-semibold text-accent-primary hover:underline">
              {config.cta}
            </a>
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
                <p>• Formula: Adjusted = Original × (1 + rate/100)^years</p>
                <p>• Purchasing power loss = 1 − (1 / (1 + rate/100)^years) × 100</p>
                <p>• Historical US CPI average (1913–2023): ~3.1% per year (Bureau of Labor Statistics)</p>
                <p>• Use custom rate to model specific countries or periods</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
