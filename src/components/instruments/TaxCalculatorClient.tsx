'use client'
import { useState, useEffect } from 'react'
import { calculateTaxCalculator } from '../../instruments/tax-calculator/lib/calculate.js'
import type { TaxCalculatorOutput } from '../../instruments/tax-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

type RateTier = 'low' | 'moderate' | 'high' | 'very_high'

const RATE_CONFIG: Record<RateTier, {
  verdict: string
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
  barColor: string
  interpretation: string
  cta: string
  ctaHref: string
}> = {
  low: {
    verdict: 'Low Tax Burden',
    icon: '✅',
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    borderClass: 'border-green-300 dark:border-green-700',
    barColor: '#16A34A',
    interpretation: 'Your effective tax rate is low. You may benefit from maximizing tax-advantaged accounts like 401(k) or IRA to keep more of your income.',
    cta: 'Plan your retirement savings →',
    ctaHref: '/retirement-calculator',
  },
  moderate: {
    verdict: 'Moderate Tax Burden',
    icon: '📊',
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
    barColor: '#CA8A04',
    interpretation: 'Your effective rate is typical for your income range. Contributing pre-tax to a 401(k) could reduce your taxable income and drop you into a lower bracket.',
    cta: 'See your retirement projection →',
    ctaHref: '/retirement-calculator',
  },
  high: {
    verdict: 'High Tax Burden',
    icon: '⚠️',
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-300 dark:border-orange-700',
    barColor: '#EA580C',
    interpretation: 'Your effective rate is above average. At this level, tax optimization strategies like HSA contributions, itemized deductions, or tax-loss harvesting can make a significant difference.',
    cta: 'Grow your wealth with investing →',
    ctaHref: '/investment-calculator',
  },
  very_high: {
    verdict: 'Very High Tax Burden',
    icon: '🔴',
    colorClass: 'text-red-700 dark:text-red-400',
    bgClass: 'bg-red-50 dark:bg-red-950/40',
    borderClass: 'border-red-300 dark:border-red-700',
    barColor: '#DC2626',
    interpretation: 'You\'re in the highest effective rate range. This is common for high earners. A tax professional can help identify deductions, credits, and strategies specific to your situation.',
    cta: 'Calculate your investment growth →',
    ctaHref: '/investment-calculator',
  },
}

function getRateTier(effectiveRate: number): RateTier {
  if (effectiveRate < 10) return 'low'
  if (effectiveRate < 20) return 'moderate'
  if (effectiveRate < 28) return 'high'
  return 'very_high'
}

function TaxRateBar({ effectiveRate, marginalRate }: { effectiveRate: number; marginalRate: number }) {
  const zones = [
    { label: '0%', color: '#16A34A', pct: 25 },
    { label: '10%', color: '#CA8A04', pct: 25 },
    { label: '20%', color: '#EA580C', pct: 20 },
    { label: '28%', color: '#DC2626', pct: 30 },
  ]
  const effectivePct = Math.min((effectiveRate / 40) * 100, 99)
  const marginalPct = Math.min((marginalRate / 40) * 100, 99)

  return (
    <div className="mt-4">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {zones.map(z => (
          <div key={z.label} style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
        ))}
      </div>
      <div className="relative h-5" style={{ marginTop: '-2px' }}>
        <div
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${effectivePct}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-0.5 h-4 bg-content-primary" />
          <span className="text-[10px] text-content-primary font-semibold whitespace-nowrap">Eff. {effectiveRate}%</span>
        </div>
        {marginalRate !== effectiveRate && (
          <div
            className="absolute top-0 flex flex-col items-center opacity-50"
            style={{ left: `${marginalPct}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0.5 h-4 bg-content-secondary" />
          </div>
        )}
      </div>
      <div className="flex justify-between text-xs text-content-tertiary mt-1">
        <span>0%</span>
        <span>10%</span>
        <span>20%</span>
        <span>28%</span>
        <span>40%</span>
      </div>
    </div>
  )
}

export function TaxCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [income, setIncome] = useState('')
  const [filingStatus, setFilingStatus] = useState<'single' | 'married_jointly' | 'head_of_household'>('single')
  const [result, setResult] = useState<TaxCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  useEffect(() => {
    if (!result) return
    window.dispatchEvent(new CustomEvent('solviqlab:result', {
      detail: { slug: 'tax-calculator', name: 'Tax Calculator', value: result.takeHomePay, label: 'Take Home Pay', unit: 'USD', metadata: result }
    }))
  }, [result])

  function calculate() {
    try {
      setResult(calculateTaxCalculator({ income: parseFloat(income), filingStatus }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setIncome(''); setFilingStatus('single')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Federal Tax Estimate\nTake-Home: ${result.takeHomePay} | Federal Tax: ${result.federalTax} | Effective Rate: ${result.effectiveRate}% | Marginal Rate: ${result.marginalRate}%`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tier = result ? getRateTier(result.effectiveRate) : null
  const config = tier ? RATE_CONFIG[tier] : null

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
        {t('ymyl_disclaimer') ?? 'Estimates based on 2024 US federal tax brackets. Does not include state taxes, FICA, or tax credits. Consult a tax professional.'}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_income') ?? 'Gross Annual Income'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number"
            value={income}
            onChange={e => setIncome(e.target.value)}
            min={0}
            placeholder="e.g. 75000"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_filingStatus') ?? 'Filing Status'}
          </label>
          <select
            value={filingStatus}
            onChange={e => setFilingStatus(e.target.value as 'single' | 'married_jointly' | 'head_of_household')}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="single">{t('opt_single') ?? 'Single'}</option>
            <option value="married_jointly">{t('opt_married_jointly') ?? 'Married Filing Jointly'}</option>
            <option value="head_of_household">{t('opt_head_of_household') ?? 'Head of Household'}</option>
          </select>
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
            <div className="flex items-baseline gap-3 mt-1">
              <span className={`text-4xl font-bold ${config.colorClass}`}>{result.effectiveRate}%</span>
              <span className="text-sm text-content-secondary">effective rate</span>
            </div>
            <TaxRateBar effectiveRate={result.effectiveRate} marginalRate={result.marginalRate} />
          </div>

          {/* Breakdown */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Tax Breakdown'}</h3>

            {/* Take-home bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-content-tertiary mb-1">
                <span>Take-Home</span>
                <span>Federal Tax</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 transition-all"
                  style={{ width: `${(result.takeHomePay / (result.takeHomePay + result.federalTax)) * 100}%` }}
                />
                <div className="bg-red-400 flex-1" />
              </div>
              <div className="flex justify-between text-xs font-semibold mt-1">
                <span className="text-green-600 dark:text-green-400">{formatAmount(result.takeHomePay, currency, lang)}</span>
                <span className="text-red-500">{formatAmount(result.federalTax, currency, lang)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_effectiveRate') ?? 'Effective Rate'}</div>
                <div className="text-lg font-semibold text-content-primary">{result.effectiveRate}%</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_marginalRate') ?? 'Marginal Rate'}</div>
                <div className="text-lg font-semibold text-content-primary">{result.marginalRate}%</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_standardDeduction') ?? 'Standard Deduction'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.standardDeduction, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_taxableIncome') ?? 'Taxable Income'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.taxableIncome, currency, lang)}</div>
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
          <ShareButtons text={`My effective tax rate: ${result.effectiveRate}% — calculated free at SolviqLab`} className="mt-2" />

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
                <p>• 2024 IRS tax brackets (IRS Rev. Proc. 2023-34)</p>
                <p>• Standard deductions: Single $14,600 | MFJ $29,200 | HoH $21,900</p>
                <p>• Effective rate = federal tax ÷ gross income</p>
                <p>• Does not include: FICA (7.65%), state/local taxes, AMT, credits, or deductions beyond standard</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
