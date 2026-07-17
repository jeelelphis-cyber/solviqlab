'use client'
import { useState } from 'react'
import { calculateRetirementCalculator } from '../../instruments/retirement-calculator/lib/calculate.js'
import type { RetirementCalculatorOutput } from '../../instruments/retirement-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

type RetirementStatus = 'behind' | 'on_track' | 'ahead' | 'strong'

const STATUS_CONFIG: Record<RetirementStatus, {
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
  behind: {
    verdict: 'Behind Schedule',
    icon: '⚠️',
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-300 dark:border-orange-700',
    barColor: '#EA580C',
    interpretation: 'Your projected savings are below the typical retirement target. Increasing your monthly contribution — even by $200/month — can dramatically improve your outlook thanks to compound growth.',
    cta: 'See how compound investing works →',
    ctaHref: '/investment-calculator',
  },
  on_track: {
    verdict: 'On Track',
    icon: '📈',
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
    barColor: '#CA8A04',
    interpretation: 'You\'re making solid progress toward retirement. Keep your contributions consistent — time in the market matters more than timing the market.',
    cta: 'Optimize your investment returns →',
    ctaHref: '/investment-calculator',
  },
  ahead: {
    verdict: 'Ahead of Schedule',
    icon: '✅',
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    borderClass: 'border-green-300 dark:border-green-700',
    barColor: '#16A34A',
    interpretation: 'You\'re well-positioned for retirement. Consider whether you could retire earlier, or if you want to build a larger buffer against inflation and healthcare costs.',
    cta: 'Check your investment growth rate →',
    ctaHref: '/investment-calculator',
  },
  strong: {
    verdict: 'Retirement Ready',
    icon: '🏆',
    colorClass: 'text-purple-700 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-300 dark:border-purple-700',
    barColor: '#9333EA',
    interpretation: 'Excellent retirement position. Your projected savings can sustain a comfortable retirement income using the 4% withdrawal rule — you may even be able to retire early.',
    cta: 'Maximize your investment returns →',
    ctaHref: '/investment-calculator',
  },
}

function getRetirementStatus(projectedSavings: number, monthlyIncome: number): RetirementStatus {
  const annualIncome = monthlyIncome * 12
  const target = annualIncome * 25
  const ratio = projectedSavings / (target || 1)
  if (ratio < 0.5) return 'behind'
  if (ratio < 1.0) return 'on_track'
  if (ratio < 1.5) return 'ahead'
  return 'strong'
}

function RetirementProgressBar({ projectedSavings, monthlyIncome }: { projectedSavings: number; monthlyIncome: number }) {
  const target = monthlyIncome * 12 * 25
  const pct = target > 0 ? Math.min((projectedSavings / target) * 100, 150) : 0
  const displayPct = Math.min(pct, 100)

  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-content-tertiary mb-1">
        <span>Progress to 25× target</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-surface-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${displayPct}%`,
            backgroundColor: pct >= 100 ? '#16A34A' : pct >= 50 ? '#CA8A04' : '#EA580C',
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-content-tertiary mt-1">
        <span>$0</span>
        <span>{target > 0 ? `Target: ${Math.round(target / 1000)}K` : 'Target'}</span>
      </div>
    </div>
  )
}

export function RetirementCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [currentAge, setCurrentAge] = useState('')
  const [retirementAge, setRetirementAge] = useState('65')
  const [currentSavings, setCurrentSavings] = useState('')
  const [monthlyContribution, setMonthlyContribution] = useState('')
  const [annualReturn, setAnnualReturn] = useState('7')
  const [inflationRate, setInflationRate] = useState('3')
  const [result, setResult] = useState<RetirementCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function calculate() {
    try {
      setResult(calculateRetirementCalculator({
        currentAge: parseFloat(currentAge),
        retirementAge: parseFloat(retirementAge),
        currentSavings: parseFloat(currentSavings) || 0,
        monthlyContribution: parseFloat(monthlyContribution) || 0,
        annualReturn: parseFloat(annualReturn),
        inflationRate: parseFloat(inflationRate),
      }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setCurrentAge(''); setRetirementAge('65'); setCurrentSavings('')
    setMonthlyContribution(''); setAnnualReturn('7'); setInflationRate('3')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Retirement Projection\nProjected Savings: ${result.projectedSavings} | Monthly Income (4% rule): ${result.monthlyIncomeEstimate} | Real Value Today: ${result.realValueToday}`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const status = result ? getRetirementStatus(result.projectedSavings, result.monthlyIncomeEstimate) : null
  const config = status ? STATUS_CONFIG[status] : null

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_currentAge') ?? 'Current Age'}
          </label>
          <input
            type="number" value={currentAge} onChange={e => setCurrentAge(e.target.value)}
            min={18} max={80} placeholder="e.g. 30"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_retirementAge') ?? 'Retirement Age'}
          </label>
          <input
            type="number" value={retirementAge} onChange={e => setRetirementAge(e.target.value)}
            min={19} max={100} placeholder="65"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_currentSavings') ?? 'Current Savings'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number" value={currentSavings} onChange={e => setCurrentSavings(e.target.value)}
            min={0} placeholder="e.g. 50000"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_monthlyContribution') ?? 'Monthly Contribution'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number" value={monthlyContribution} onChange={e => setMonthlyContribution(e.target.value)}
            min={0} placeholder="e.g. 500"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_annualReturn') ?? 'Expected Annual Return'} <span className="text-content-tertiary">(%)</span>
          </label>
          <input
            type="number" value={annualReturn} onChange={e => setAnnualReturn(e.target.value)}
            min={0} max={30} step={0.1} placeholder="7"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_inflationRate') ?? 'Expected Inflation Rate'} <span className="text-content-tertiary">(%)</span>
          </label>
          <input
            type="number" value={inflationRate} onChange={e => setInflationRate(e.target.value)}
            min={0} max={20} step={0.1} placeholder="3"
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
              {formatAmount(result.projectedSavings, currency, lang)}
            </div>
            <div className="text-sm text-content-secondary mt-1">projected at retirement</div>
            <RetirementProgressBar projectedSavings={result.projectedSavings} monthlyIncome={result.monthlyIncomeEstimate} />
          </div>

          {/* Stats */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Retirement Projection'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_monthlyIncomeEstimate') ?? 'Est. Monthly Income'}</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(result.monthlyIncomeEstimate, currency, lang)}</div>
                <div className="text-xs text-content-tertiary mt-1">4% rule</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_realValueToday') ?? "Real Value (Today's $)"}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.realValueToday, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalContributions') ?? 'Total Contributions'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.totalContributions, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalGrowth') ?? 'Investment Growth'}</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(result.totalGrowth, currency, lang)}</div>
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
          <ShareButtons text={`My retirement savings projection: ${formatAmount(result.projectedSavings, currency, lang)} — calculated free at SolviqLab`} className="mt-2" />

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
                <p>• Future Value: FV = PV × (1+r)^n + PMT × [((1+r)^n − 1) / r]</p>
                <p>• 4% Rule: Bengen (1994), Trinity Study — safe withdrawal rate for 30-year retirement</p>
                <p>• Real value adjusted using compound inflation: PV = FV / (1+i)^n</p>
                <p>• 25× target = annual expenses × 25 (inverse of 4% withdrawal rule)</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
