'use client'
import { useState, useEffect } from 'react'
import { calculateTip } from '../../instruments/tip-calculator/lib/calculate.js'
import type { TipCalculatorOutput } from '../../instruments/tip-calculator/lib/types.js'
import { CurrencySelector, useCurrency } from '../ui/CurrencySelector'
import { formatAmount } from '../../lib/currencies'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

const TIP_PRESETS = [10, 15, 18, 20, 25]

export function TipCalculatorClient({ translations, lang }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [billAmount, setBillAmount] = useState('')
  const [tipPercent, setTipPercent] = useState(18)
  const [numPeople, setNumPeople] = useState(1)
  const [taxPercent, setTaxPercent] = useState('')
  const [showTax, setShowTax] = useState(false)
  const [result, setResult] = useState<TipCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currency, setCurrency] = useCurrency(lang)
  const [copied, setCopied] = useState(false)

  // Auto-calculate on any input change
  useEffect(() => {
    const bill = parseFloat(billAmount)
    if (!billAmount || isNaN(bill)) {
      setResult(null)
      setError(null)
      return
    }
    try {
      const tax = showTax && taxPercent ? parseFloat(taxPercent) : 0
      setResult(calculateTip({
        billAmount: bill,
        tipPercent,
        numPeople,
        taxPercent: isNaN(tax) ? 0 : tax,
      }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }, [billAmount, tipPercent, numPeople, taxPercent, showTax])

  function calculate() {
    const bill = parseFloat(billAmount)
    if (!billAmount || isNaN(bill)) {
      setError('Please enter a bill amount.')
      return
    }
    try {
      const tax = showTax && taxPercent ? parseFloat(taxPercent) : 0
      setResult(calculateTip({
        billAmount: bill,
        tipPercent,
        numPeople,
        taxPercent: isNaN(tax) ? 0 : tax,
      }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setBillAmount('')
    setTipPercent(18)
    setNumPeople(1)
    setTaxPercent('')
    setShowTax(false)
    setResult(null)
    setError(null)
  }

  function adjustPeople(delta: number) {
    setNumPeople(p => Math.max(1, Math.min(100, p + delta)))
  }

  function copyResult() {
    if (!result) return
    const lines = [
      `Tip Calculator Results`,
      `Bill: ${formatAmount(parseFloat(billAmount), currency, lang)}`,
      `Tip (${tipPercent}%): ${formatAmount(result.tipAmount, currency, lang)}`,
      `Total Bill: ${formatAmount(result.totalBill, currency, lang)}`,
    ]
    if (numPeople > 1) {
      lines.push(`Tip Per Person: ${formatAmount(result.tipPerPerson, currency, lang)}`)
      lines.push(`Total Per Person: ${formatAmount(result.totalPerPerson, currency, lang)}`)
    }
    void navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareResult() {
    if (!result) return
    const text = `Tip (${tipPercent}%): ${formatAmount(result.tipAmount, currency, lang)} | Total: ${formatAmount(result.totalBill, currency, lang)}`
    void navigator.share?.({ title: 'Tip Calculator Results', text, url: window.location.href })
  }

  return (
    <div className="space-y-6">
      {/* Currency Selector */}
      <div className="flex justify-end">
        <CurrencySelector lang={lang} currency={currency} onChange={setCurrency} />
      </div>

      {/* Bill Amount */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1">
          {t('label_billAmount') ?? 'Bill Amount'} <span className="text-content-tertiary">({currency.symbol})</span>
        </label>
        <input
          type="number"
          value={billAmount}
          onChange={e => setBillAmount(e.target.value)}
          min={0.01}
          max={100000}
          step={0.01}
          placeholder="e.g. 85.00"
          className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
      </div>

      {/* Quick Tip Presets */}
      <div>
        <div className="text-sm font-medium text-content-secondary mb-2">
          {t('tip_presets') ?? 'Quick Tip'}
        </div>
        <div className="flex gap-2 flex-wrap">
          {TIP_PRESETS.map(pct => (
            <button
              key={pct}
              onClick={() => setTipPercent(pct)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                tipPercent === pct
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'bg-surface-input border-border-default text-content-secondary hover:border-accent-primary hover:text-accent-primary'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>

      {/* Tip Percent Slider + Number */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1">
          {t('label_tipPercent') ?? 'Tip Percentage'}
          <span className="ml-2 text-accent-primary font-bold">{tipPercent}%</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={30}
            step={1}
            value={tipPercent}
            onChange={e => setTipPercent(Number(e.target.value))}
            className="flex-1 h-2 bg-border-default rounded-full appearance-none cursor-pointer accent-accent-primary"
          />
          <input
            type="number"
            value={tipPercent}
            onChange={e => setTipPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
            min={0}
            max={100}
            className="w-20 bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary text-center focus:outline-none focus:ring-2 focus:ring-accent-primary"
          />
        </div>
      </div>

      {/* Number of People — Stepper */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1">
          {t('label_numPeople') ?? 'Number of People'}
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => adjustPeople(-1)}
            className="w-10 h-10 rounded-lg border border-border-default bg-surface-input text-content-secondary text-xl font-bold hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center"
            aria-label="Decrease people"
          >
            −
          </button>
          <span className="text-2xl font-bold text-content-primary w-12 text-center">{numPeople}</span>
          <button
            onClick={() => adjustPeople(1)}
            className="w-10 h-10 rounded-lg border border-border-default bg-surface-input text-content-secondary text-xl font-bold hover:border-accent-primary hover:text-accent-primary transition-colors flex items-center justify-center"
            aria-label="Increase people"
          >
            +
          </button>
          <span className="text-sm text-content-tertiary">{t('people_label') ?? 'people'}</span>
        </div>
      </div>

      {/* Tax — Collapsible */}
      <div>
        <button
          onClick={() => setShowTax(o => !o)}
          className="text-sm text-accent-primary hover:underline font-medium flex items-center gap-1"
        >
          <span>{showTax ? '▾' : '▸'}</span>
          <span>{showTax ? (t('hide_tax') ?? 'Hide Tax') : (t('add_tax') ?? 'Add Tax')}</span>
        </button>
        {showTax && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-content-secondary mb-1">
              {t('label_taxPercent') ?? 'Tax Percentage'} (%)
            </label>
            <input
              type="number"
              value={taxPercent}
              onChange={e => setTaxPercent(e.target.value)}
              min={0}
              max={30}
              step={0.1}
              placeholder="e.g. 8"
              className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
            />
          </div>
        )}
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
          {/* Main Tip Highlight */}
          <div className="bg-accent-primary/10 border border-accent-primary/30 rounded-xl p-5 text-center">
            <div className="text-sm font-medium text-content-secondary mb-1">
              {t('label_tipAmount') ?? 'Tip Amount'}
            </div>
            <div className="text-4xl font-bold text-accent-primary mb-1">
              {formatAmount(result.tipAmount, currency, lang)}
            </div>
            <div className="text-sm text-content-tertiary">{tipPercent}% tip</div>
          </div>

          {/* Breakdown Grid */}
          <div className="bg-surface-card border border-border-default rounded-xl p-5">
            <div className="text-sm font-medium text-content-secondary mb-3">
              {t('breakdown_label') ?? 'Breakdown'}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {showTax && parseFloat(taxPercent || '0') > 0 && (
                <>
                  <div className="bg-surface-elevated rounded-lg p-3">
                    <div className="text-xs text-content-tertiary mb-1">{t('label_taxAmount') ?? 'Tax Amount'}</div>
                    <div className="text-lg font-semibold text-content-primary">{formatAmount(result.taxAmount, currency, lang)}</div>
                  </div>
                  <div className="bg-surface-elevated rounded-lg p-3">
                    <div className="text-xs text-content-tertiary mb-1">{t('label_billWithTax') ?? 'Bill with Tax'}</div>
                    <div className="text-lg font-semibold text-content-primary">{formatAmount(result.billWithTax, currency, lang)}</div>
                  </div>
                </>
              )}
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_tipAmount') ?? 'Tip Amount'}</div>
                <div className="text-lg font-semibold text-accent-primary">{formatAmount(result.tipAmount, currency, lang)}</div>
              </div>
              <div className="bg-surface-elevated rounded-lg p-3 border-2 border-accent-primary/30">
                <div className="text-xs text-content-tertiary mb-1">{t('label_totalBill') ?? 'Total Bill'}</div>
                <div className="text-lg font-semibold text-content-primary">{formatAmount(result.totalBill, currency, lang)}</div>
              </div>
            </div>

            {/* Bill + Tax + Tip = Total row */}
            <div className="mt-4 pt-3 border-t border-border-default text-xs text-content-tertiary text-center">
              {formatAmount(parseFloat(billAmount) || 0, currency, lang)}
              {showTax && parseFloat(taxPercent || '0') > 0 && ` + ${formatAmount(result.taxAmount, currency, lang)} tax`}
              {` + ${formatAmount(result.tipAmount, currency, lang)} tip = `}
              <span className="font-semibold text-content-primary">{formatAmount(result.totalBill, currency, lang)}</span>
            </div>
          </div>

          {/* Per Person — prominently shown when numPeople > 1 */}
          {numPeople > 1 && (
            <div className="bg-surface-card border border-border-default rounded-xl p-5">
              <div className="text-sm font-medium text-content-secondary mb-3">
                {t('per_person') ?? 'Per Person'} × {numPeople} {t('people_label') ?? 'people'}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-elevated rounded-lg p-3">
                  <div className="text-xs text-content-tertiary mb-1">{t('label_tipPerPerson') ?? 'Tip Per Person'}</div>
                  <div className="text-2xl font-bold text-accent-primary">{formatAmount(result.tipPerPerson, currency, lang)}</div>
                </div>
                <div className="bg-surface-elevated rounded-lg p-3 border-2 border-accent-primary/30">
                  <div className="text-xs text-content-tertiary mb-1">{t('label_totalPerPerson') ?? 'Total Per Person'}</div>
                  <div className="text-2xl font-bold text-content-primary">{formatAmount(result.totalPerPerson, currency, lang)}</div>
                </div>
              </div>
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
        </div>
      )}
    </div>
  )
}
