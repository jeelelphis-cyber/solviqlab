'use client'
import { useState } from 'react'
import { calculateSalaryCalculator } from '../../instruments/salary-calculator/lib/calculate.js'
import type { SalaryCalculatorOutput } from '../../instruments/salary-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

type SalaryTier = 'entry' | 'average' | 'above' | 'top'

const TIER_CONFIG: Record<SalaryTier, {
  verdict: string
  icon: string
  colorClass: string
  bgClass: string
  borderClass: string
  barColor: string
  interpretation: string
  nextStep: string
  cta: string
  ctaHref: string
}> = {
  entry: {
    verdict: 'Below Average',
    icon: '📊',
    colorClass: 'text-orange-700 dark:text-orange-400',
    bgClass: 'bg-orange-50 dark:bg-orange-950/40',
    borderClass: 'border-orange-300 dark:border-orange-700',
    barColor: '#EA580C',
    interpretation: 'Your salary is below the US median. Even small raises compound significantly — a 10% increase now can mean $200K+ extra over a career.',
    nextStep: 'See how much of your salary goes to federal taxes.',
    cta: 'Calculate your taxes →',
    ctaHref: '/tax-calculator',
  },
  average: {
    verdict: 'Near Median',
    icon: '📈',
    colorClass: 'text-yellow-700 dark:text-yellow-400',
    bgClass: 'bg-yellow-50 dark:bg-yellow-950/40',
    borderClass: 'border-yellow-300 dark:border-yellow-700',
    barColor: '#CA8A04',
    interpretation: 'Your salary is close to the US median ($59K). You\'re in good company — focus on maximizing your take-home and growing your savings rate.',
    nextStep: 'Find out how much of this goes to taxes.',
    cta: 'Calculate your taxes →',
    ctaHref: '/tax-calculator',
  },
  above: {
    verdict: 'Above Average',
    icon: '✅',
    colorClass: 'text-green-700 dark:text-green-400',
    bgClass: 'bg-green-50 dark:bg-green-950/40',
    borderClass: 'border-green-300 dark:border-green-700',
    barColor: '#16A34A',
    interpretation: 'Your salary is above the US median. This puts you in a strong position to build wealth — even a 15% savings rate could retire you years early.',
    nextStep: 'See your retirement projection at this income level.',
    cta: 'Plan your retirement →',
    ctaHref: '/retirement-calculator',
  },
  top: {
    verdict: 'Top Earner',
    icon: '🏆',
    colorClass: 'text-purple-700 dark:text-purple-400',
    bgClass: 'bg-purple-50 dark:bg-purple-950/40',
    borderClass: 'border-purple-300 dark:border-purple-700',
    barColor: '#9333EA',
    interpretation: 'You\'re in the top income bracket. At this level, tax strategy and investment allocation are your biggest levers for building long-term wealth.',
    nextStep: 'Understand your federal tax burden at this income.',
    cta: 'Calculate your taxes →',
    ctaHref: '/tax-calculator',
  },
}

function getSalaryTier(annual: number): SalaryTier {
  if (annual < 45000) return 'entry'
  if (annual < 75000) return 'average'
  if (annual < 120000) return 'above'
  return 'top'
}

function SalaryScaleBar({ annual }: { annual: number }) {
  const MAX = 200000
  const zones = [
    { label: '<$45K', color: '#EA580C', pct: 22.5 },
    { label: '$45–75K', color: '#CA8A04', pct: 15 },
    { label: '$75–120K', color: '#16A34A', pct: 22.5 },
    { label: '$120K+', color: '#9333EA', pct: 40 },
  ]
  const markerPct = Math.min((annual / MAX) * 100, 99)

  return (
    <div className="mt-4">
      <div className="relative h-3 rounded-full overflow-hidden flex">
        {zones.map(z => (
          <div key={z.label} style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
        ))}
      </div>
      <div className="relative h-4" style={{ marginTop: '-2px' }}>
        <div
          className="absolute top-0 w-0.5 h-4 bg-content-primary"
          style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <div className="flex justify-between text-xs text-content-tertiary mt-1">
        <span>$0</span>
        <span>$45K</span>
        <span>$75K</span>
        <span>$120K</span>
        <span>$200K+</span>
      </div>
    </div>
  )
}

export function SalaryCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [salaryType, setSalaryType] = useState<'hourly' | 'annual'>('hourly')
  const [amount, setAmount] = useState('')
  const [hoursPerWeek, setHoursPerWeek] = useState('40')
  const [weeksPerYear, setWeeksPerYear] = useState('52')
  const [result, setResult] = useState<SalaryCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  function calculate() {
    try {
      setResult(calculateSalaryCalculator({ salaryType, amount: parseFloat(amount), hoursPerWeek: parseFloat(hoursPerWeek), weeksPerYear: parseFloat(weeksPerYear) }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setAmount(''); setHoursPerWeek('40'); setWeeksPerYear('52')
    setResult(null); setError(null)
  }

  function copyResult() {
    if (!result) return
    const text = `Salary Breakdown\nHourly: ${result.hourly} | Daily: ${result.daily} | Weekly: ${result.weekly} | Monthly: ${result.monthly} | Annual: ${result.annual}`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareResult() {
    if (!result) return
    const url = window.location.href
    void navigator.share?.({ title: 'My Salary Breakdown', text: `My annual salary: ${result.annual}`, url })
  }

  const tier = result ? getSalaryTier(result.annual) : null
  const config = tier ? TIER_CONFIG[tier] : null

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_salaryType') ?? 'Salary Type'}
          </label>
          <select
            value={salaryType}
            onChange={e => setSalaryType(e.target.value as 'hourly' | 'annual')}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            <option value="hourly">{t('opt_hourly') ?? 'Hourly'}</option>
            <option value="annual">{t('opt_annual') ?? 'Annual'}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_amount') ?? 'Amount'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            min={0}
            placeholder={salaryType === 'hourly' ? 'e.g. 25' : 'e.g. 52000'}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_hoursPerWeek') ?? 'Hours Per Week'}
          </label>
          <input
            type="number"
            value={hoursPerWeek}
            onChange={e => setHoursPerWeek(e.target.value)}
            min={1} max={168}
            placeholder="40"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_weeksPerYear') ?? 'Weeks Per Year'}
          </label>
          <input
            type="number"
            value={weeksPerYear}
            onChange={e => setWeeksPerYear(e.target.value)}
            min={1} max={52}
            placeholder="52"
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
            <div className={`text-3xl font-bold mb-1 ${config.colorClass}`}>
              {formatAmount(result.annual, currency, lang)}
            </div>
            <div className="text-sm text-content-secondary">per year</div>
            <SalaryScaleBar annual={result.annual} />
          </div>

          {/* Breakdown Grid */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Pay Breakdown'}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_hourly') ?? 'Hourly'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.hourly, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_daily') ?? 'Daily'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.daily, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_weekly') ?? 'Weekly'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.weekly, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_biweekly') ?? 'Biweekly'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.biweekly, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_monthly') ?? 'Monthly'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.monthly, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 border-2 border-accent-primary/30">
                <div className="text-xs text-content-tertiary mb-1">{t('label_annual') ?? 'Annual'}</div>
                <div className="text-lg font-semibold text-accent-primary">{formatAmount(result.annual, currency, lang)}</div>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <p className="text-sm text-content-secondary mb-3">{config.interpretation}</p>
            <p className="text-xs text-content-tertiary mb-3">{config.nextStep}</p>
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
              onClick={shareResult}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors"
            >
              ↗ Share
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors"
            >
              ⎙ Print
            </button>
          </div>
          <ShareButtons text={`My annual salary: ${formatAmount(result.annual, currency, lang)} — calculated free at SolviqLab`} className="mt-2" />

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
                <p>• US median annual wage: ~$59,228 (BLS, 2023 Occupational Employment Statistics)</p>
                <p>• Annual salary = hourly × hours/week × weeks/year</p>
                <p>• Tier thresholds: &lt;$45K entry, $45–75K average, $75–120K above average, $120K+ top</p>
                <p>• Does not account for bonuses, equity, or benefits</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
