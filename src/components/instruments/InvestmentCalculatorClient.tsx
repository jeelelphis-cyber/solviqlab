'use client'
import { useState } from 'react'
import { calculateInvestmentCalculator } from '../../instruments/investment-calculator/lib/calculate.js'
import type { InvestmentCalculatorOutput } from '../../instruments/investment-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

type GrowthTier = 'modest' | 'good' | 'excellent' | 'outstanding'

const GROWTH_CONFIG: Record<GrowthTier, {
  verdict: string
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
  interpretation: string
  cta: string
  ctaHref: string
}> = {
  modest: {
    verdict: 'Modest Growth',
    icon: '📊',
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
    interpretation: 'Your investment grows less than 50% over the period. This may reflect conservative assumptions or a short time horizon. Consider increasing the return rate or extending the period.',
    cta: 'Plan your retirement with these returns →',
    ctaHref: '/retirement-calculator',
  },
  good: {
    verdict: 'Good Growth',
    icon: '✅',
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    borderClass: 'border-green-300 dark:border-green-700',
    interpretation: 'Solid investment growth. You\'re outpacing inflation and building real wealth. Consistent contributions over time are your biggest advantage here.',
    cta: 'See how this fits into retirement →',
    ctaHref: '/retirement-calculator',
  },
  excellent: {
    verdict: 'Excellent Growth',
    icon: '🚀',
    colorClass: 'text-blue-700 dark:text-blue-400',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-300 dark:border-blue-700',
    interpretation: 'Your money is working hard — tripling or more over this period. This is the power of compound interest. The longer you stay invested, the more dramatic the effect.',
    cta: 'Project your retirement with this growth →',
    ctaHref: '/retirement-calculator',
  },
  outstanding: {
    verdict: 'Outstanding Growth',
    icon: '🏆',
    colorClass: 'text-purple-700 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-300 dark:border-purple-700',
    interpretation: 'Exceptional returns. At this growth rate, your portfolio is compounding dramatically. Even small additional contributions now will have outsized impact on your final value.',
    cta: 'Model your early retirement →',
    ctaHref: '/retirement-calculator',
  },
}

function getGrowthTier(finalValue: number, totalContributions: number): GrowthTier {
  if (totalContributions === 0) return 'modest'
  const multiplier = finalValue / totalContributions
  if (multiplier < 1.5) return 'modest'
  if (multiplier < 3) return 'good'
  if (multiplier < 5) return 'excellent'
  return 'outstanding'
}

function GrowthBar({ totalContributions, totalInterest }: { totalContributions: number; totalInterest: number }) {
  const total = totalContributions + totalInterest
  const principalPct = total > 0 ? (totalContributions / total) * 100 : 100
  const returnPct = 100 - principalPct

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-content-tertiary mb-1">
        <span>Invested</span>
        <span>Returns</span>
      </div>
      <div className="flex h-5 rounded-full overflow-hidden">
        <div
          className="bg-blue-400 flex items-center justify-center text-[10px] text-white font-semibold transition-all"
          style={{ width: `${principalPct}%` }}
        >
          {principalPct > 15 ? `${principalPct.toFixed(0)}%` : ''}
        </div>
        <div
          className="bg-green-500 flex items-center justify-center text-[10px] text-white font-semibold flex-1 transition-all"
          style={{ width: `${returnPct}%` }}
        >
          {returnPct > 15 ? `${returnPct.toFixed(0)}%` : ''}
        </div>
      </div>
      <div className="flex justify-between text-xs font-medium mt-1">
        <span className="text-blue-600 dark:text-blue-400">Principal</span>
        <span className="text-green-600 dark:text-green-400">Compound Returns</span>
      </div>
    </div>
  )
}

export function InvestmentCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [initialAmount, setInitialAmount] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('0')
  const [annualReturn, setAnnualReturn] = useState('7')
  const [years, setYears] = useState('10')
  const [result, setResult] = useState<InvestmentCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function calculate() {
    try {
      setResult(calculateInvestmentCalculator({
        initialAmount: parseFloat(initialAmount),
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        annualReturn: parseFloat(annualReturn),
        years: parseFloat(years),
      }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setInitialAmount(''); setMonthlyContribution('0'); setAnnualReturn('7'); setYears('10')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Investment Results\nFinal Value: ${result.finalValue} | Total Invested: ${result.totalContributions} | Returns: ${result.totalInterest}${result.doublingTime ? ` | Doubling Time: ${result.doublingTime} years` : ''}`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tier = result ? getGrowthTier(result.finalValue, result.totalContributions) : null
  const config = tier ? GROWTH_CONFIG[tier] : null

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_initialAmount') ?? 'Initial Investment'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number" value={initialAmount} onChange={e => setInitialAmount(e.target.value)}
            min={0} placeholder="e.g. 10000"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_monthlyContribution') ?? 'Monthly Contribution'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)}
            min={0} placeholder="0"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_annualReturn') ?? 'Annual Return Rate'} <span className="text-content-tertiary">(%)</span>
          </label>
          <input
            type="number" value={annualReturn} onChange={e => setAnnualReturn(e.target.value)}
            min={0} max={50} step={0.1} placeholder="7"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_years') ?? 'Investment Period'} <span className="text-content-tertiary">({t('unit_years') ?? 'years'})</span>
          </label>
          <input
            type="number" value={years} onChange={e => setYears(e.target.value)}
            min={1} max={50} placeholder="10"
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
              {formatAmount(result.finalValue, currency, lang)}
            </div>
            <div className="text-sm text-content-secondary mt-1">final value after {years} years</div>
            <GrowthBar totalContributions={result.totalContributions} totalInterest={result.totalInterest} />
          </div>

          {/* Stats */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Investment Breakdown'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalContributions') ?? 'Total Invested'}</div>
                <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatAmount(result.totalContributions, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalInterest') ?? 'Total Returns'}</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(result.totalInterest, currency, lang)}</div>
              </div>
              {result.doublingTime !== null && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3 col-span-2">
                  <div className="text-xs text-amber-600 dark:text-amber-400 mb-1">{t('label_doublingTime') ?? 'Doubling Time (Rule of 72)'}</div>
                  <div className="text-xl font-bold text-amber-700 dark:text-amber-300">
                    {result.doublingTime} <span className="text-sm font-normal">{t('unit_years') ?? 'years'}</span>
                  </div>
                  <div className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">at {annualReturn}% annual return</div>
                </div>
              )}
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
          <ShareButtons text={`My investment final value: ${formatAmount(result.finalValue, currency, lang)} — calculated free at SolviqLab`} className="mt-2" />

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
                <p>• Compound interest: FV = P × (1+r/12)^(12n) + PMT × [((1+r/12)^(12n) − 1) / (r/12)]</p>
                <p>• Rule of 72: doubling time = 72 ÷ annual rate — approximation accurate within ±1 year for 6-10% rates</p>
                <p>• Historical S&P 500 average return: ~10% nominal, ~7% real (inflation-adjusted)</p>
                <p>• Past returns do not guarantee future results</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
