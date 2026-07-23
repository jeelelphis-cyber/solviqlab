'use client'
import { useState, useEffect } from 'react'
import { calculateSavings } from '../../instruments/savings-calculator/lib/calculate.js'
import type { SavingsCalculatorOutput } from '../../instruments/savings-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'
import { ShareButtons } from '../ShareButtons.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

export function SavingsCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [initialDeposit, setInitialDeposit] = useState('5000')
  const [monthlyDeposit, setMonthlyDeposit] = useState('200')
  const [annualRate, setAnnualRate] = useState('4')
  const [years, setYears] = useState('10')
  const [compoundFrequency, setCompoundFrequency] = useState<'monthly' | 'quarterly' | 'annually'>('monthly')
  const [goalAmount, setGoalAmount] = useState('')
  const [result, setResult] = useState<SavingsCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)
  const [showAllYears, setShowAllYears] = useState(false)

  useEffect(() => {
    if (!result) return
    window.dispatchEvent(new CustomEvent('solviqlab:result', {
      detail: { slug: 'savings-calculator', name: 'Savings Calculator', value: result.finalBalance, label: 'Savings Goal', unit: 'USD', metadata: result }
    }))
  }, [result])

  function calculate() {
    try {
      const parsed = calculateSavings({
        initialDeposit: parseFloat(initialDeposit) || 0,
        monthlyDeposit: monthlyDeposit ? parseFloat(monthlyDeposit) : 0,
        annualRate: parseFloat(annualRate) || 0,
        years: parseInt(years, 10) || 1,
        compoundFrequency,
        goalAmount: goalAmount ? parseFloat(goalAmount) : undefined,
      })
      setResult(parsed)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setInitialDeposit('5000')
    setMonthlyDeposit('200')
    setAnnualRate('4')
    setYears('10')
    setCompoundFrequency('monthly')
    setGoalAmount('')
    setResult(null)
    setError(null)
    setShowAllYears(false)
  }

  function copyResult() {
    if (!result) return
    const text = [
      'Savings Calculator Results',
      `Final Balance: ${result.finalBalance}`,
      `Total Deposited: ${result.totalDeposited}`,
      `Total Interest: ${result.totalInterest}`,
      result.monthsToGoal !== null ? `Months to Goal: ${result.monthsToGoal}` : '',
    ].filter(Boolean).join('\n')
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareResult() {
    if (!result) return
    void navigator.share?.({
      title: t('title') ?? 'Savings Calculator',
      text: `Final Balance: ${result.finalBalance} | Interest Earned: ${result.totalInterest}`,
      url: window.location.href,
    })
  }

  // Determine which years to show in the table (default: 1,2,3,5,10 or all up to years)
  const allYears = result?.yearlyBreakdown ?? []
  const DEFAULT_SHOWN_YEARS = new Set([1, 2, 3, 5, 10])
  const visibleYears = showAllYears
    ? allYears
    : allYears.filter(row => DEFAULT_SHOWN_YEARS.has(row.year))

  const totalDeposited = result?.totalDeposited ?? 0
  const totalInterest = result?.totalInterest ?? 0
  const finalBalance = result?.finalBalance ?? 0
  const interestPct = finalBalance > 0 ? (totalInterest / finalBalance) * 100 : 0
  const depositedPct = finalBalance > 0 ? (totalDeposited / finalBalance) * 100 : 0

  // Format months to goal as "X months (Y years Z months)"
  function formatMonthsToGoal(months: number): string {
    const yrs = Math.floor(months / 12)
    const rem = months % 12
    if (yrs === 0) return `${months} ${t('months_suffix') ?? 'months'}`
    if (rem === 0) return `${yrs} ${t('years_suffix') ?? 'years'}`
    return `${months} ${t('months_suffix') ?? 'months'} (${yrs}y ${rem}m)`
  }

  const inputClass = 'w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary'
  const labelClass = 'block text-sm font-medium text-content-secondary mb-1'

  return (
    <div className="space-y-6">
      {/* Currency selector */}
      <div className="flex justify-end mb-4">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            {t('label_initialDeposit') ?? 'Initial Deposit'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number"
            value={initialDeposit}
            onChange={e => setInitialDeposit(e.target.value)}
            min={0}
            max={10000000}
            placeholder="e.g. 5000"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {t('label_monthlyDeposit') ?? 'Monthly Deposit'} <span className="text-content-tertiary">({currency.symbol}{t('per_month') ?? '/month'})</span>
          </label>
          <input
            type="number"
            value={monthlyDeposit}
            onChange={e => setMonthlyDeposit(e.target.value)}
            min={0}
            max={100000}
            placeholder="e.g. 200"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {t('label_annualRate') ?? 'Annual Interest Rate'} (%)
          </label>
          <input
            type="number"
            value={annualRate}
            onChange={e => setAnnualRate(e.target.value)}
            min={0}
            max={50}
            step={0.1}
            placeholder="e.g. 4"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {t('label_years') ?? 'Savings Period'} ({t('years_suffix') ?? 'years'})
          </label>
          <input
            type="number"
            value={years}
            onChange={e => setYears(e.target.value)}
            min={1}
            max={50}
            placeholder="e.g. 10"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            {t('label_compoundFrequency') ?? 'Compound Frequency'}
          </label>
          <select
            value={compoundFrequency}
            onChange={e => setCompoundFrequency(e.target.value as 'monthly' | 'quarterly' | 'annually')}
            className={inputClass}
          >
            <option value="monthly">{t('opt_monthly') ?? 'Monthly'}</option>
            <option value="quarterly">{t('opt_quarterly') ?? 'Quarterly'}</option>
            <option value="annually">{t('opt_annually') ?? 'Annually'}</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>
            {t('label_goalAmount') ?? 'Savings Goal (optional)'} <span className="text-content-tertiary">({currency.symbol})</span>
          </label>
          <input
            type="number"
            value={goalAmount}
            onChange={e => setGoalAmount(e.target.value)}
            min={0}
            placeholder="e.g. 100000"
            className={inputClass}
          />
        </div>
      </div>

      {/* Buttons */}
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Final Balance — Hero Card */}
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-700 rounded-xl p-5">
            <div className="text-sm font-semibold uppercase tracking-wide text-green-700 dark:text-green-400 mb-1">
              {t('label_finalBalance') ?? 'Final Balance'}
            </div>
            <div className="text-4xl font-bold text-green-700 dark:text-green-400">
              {formatAmount(result.finalBalance, currency, lang)}
            </div>
            <div className="text-sm text-content-secondary mt-1">
              {t('label_years') ?? 'after'} {years} {t('years_suffix') ?? 'years'}
            </div>
          </div>

          {/* Summary Grid */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <h3 className="text-sm font-medium text-content-secondary mb-3">{t('result') ?? 'Your Savings Results'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalDeposited') ?? 'Total Deposited'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.totalDeposited, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalInterest') ?? 'Total Interest Earned'}</div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">{formatAmount(result.totalInterest, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalInterest') ?? 'Interest'} %</div>
                <div className="text-lg font-semibold text-content-primary">{interestPct.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Growth Bar */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <div className="text-sm font-medium text-content-secondary mb-3">Growth Breakdown</div>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 transition-all"
                style={{ width: `${depositedPct}%` }}
                title={`Deposited: ${depositedPct.toFixed(1)}%`}
              />
              <div
                className="bg-green-500 transition-all"
                style={{ width: `${interestPct}%` }}
                title={`Interest: ${interestPct.toFixed(1)}%`}
              />
            </div>
            <div className="flex gap-4 mt-2 text-xs text-content-tertiary">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                {t('label_totalDeposited') ?? 'Deposited'} ({depositedPct.toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />
                {t('label_totalInterest') ?? 'Interest'} ({interestPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Months to Goal */}
          {goalAmount && (
            <div className="bg-surface-card border border-border-default rounded-xl p-5">
              <div className="text-sm font-medium text-content-secondary mb-1">
                {t('label_monthsToGoal') ?? 'Time to Reach Goal'}
              </div>
              <div className="text-xl font-bold text-content-primary">
                {result.monthsToGoal !== null
                  ? formatMonthsToGoal(result.monthsToGoal)
                  : (t('notReachable') ?? 'Not reachable in 50 years')}
              </div>
              {result.monthsToGoal !== null && (
                <div className="text-xs text-content-tertiary mt-1">
                  Goal: {formatAmount(parseFloat(goalAmount), currency, lang)}
                </div>
              )}
            </div>
          )}

          {/* Yearly Breakdown Table */}
          {allYears.length > 0 && (
            <div className="bg-surface-card border border-border-default rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border-default">
                <h3 className="text-sm font-medium text-content-secondary">
                  {t('label_yearlyBreakdown') ?? 'Year-by-Year Breakdown'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-elevated">
                      <th className="px-4 py-2 text-left text-xs font-medium text-content-tertiary">{t('label_year') ?? 'Year'}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-content-tertiary">{t('label_balance') ?? 'Balance'}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-content-tertiary">{t('label_deposited') ?? 'Deposited'}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-content-tertiary">{t('label_interest') ?? 'Interest'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleYears.map((row, idx) => (
                      <tr
                        key={row.year}
                        className={idx % 2 === 0 ? 'bg-surface-card' : 'bg-surface-elevated'}
                      >
                        <td className="px-4 py-2 text-content-primary font-medium">{row.year}</td>
                        <td className="px-4 py-2 text-right text-content-primary font-semibold">
                          {formatAmount(row.balance, currency, lang)}
                        </td>
                        <td className="px-4 py-2 text-right text-content-secondary">
                          {formatAmount(row.totalDeposited, currency, lang)}
                        </td>
                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">
                          {formatAmount(row.interestEarned, currency, lang)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allYears.length > 5 && (
                <div className="px-5 py-3 border-t border-border-default">
                  <button
                    onClick={() => setShowAllYears(v => !v)}
                    className="text-sm text-accent-primary hover:underline"
                  >
                    {showAllYears
                      ? (t('hide_years') ?? 'Hide details')
                      : (t('show_all_years') ?? `Show all ${allYears.length} years`).replace('{n}', String(allYears.length))}
                  </button>
                </div>
              )}
            </div>
          )}

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
          <ShareButtons text={`My savings will grow to ${result.finalBalance} — calculated free at SolviqLab`} className="mt-2" />
        </div>
      )}
    </div>
  )
}
