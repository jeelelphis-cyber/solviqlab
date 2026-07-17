'use client'
import { useState, useCallback } from 'react'
import { convertCurrency } from '../../instruments/currency-converter/lib/calculate.js'
import type { CurrencyConverterOutput } from '../../instruments/currency-converter/lib/types.js'
import { CURRENCIES } from '../../lib/currencies.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

const POPULAR_PAIRS: { from: string; to: string; label: string }[] = [
  { from: 'USD', to: 'EUR', label: 'USD→EUR' },
  { from: 'USD', to: 'GBP', label: 'USD→GBP' },
  { from: 'USD', to: 'UAH', label: 'USD→UAH' },
  { from: 'EUR', to: 'GBP', label: 'EUR→GBP' },
  { from: 'USD', to: 'JPY', label: 'USD→JPY' },
]

function formatResultAmount(amount: number, code: string): string {
  const currency = CURRENCIES.find(c => c.code === code)
  if (!currency) return `${amount.toLocaleString()} ${code}`
  const decimals = currency.decimals
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return currency.symbolPosition === 'before'
    ? `${currency.symbol}${formatted}`
    : `${formatted} ${currency.symbol}`
}

export function CurrencyConverterClient({ translations }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [amount, setAmount] = useState('1')
  const [fromCurrency, setFromCurrency] = useState('USD')
  const [toCurrency, setToCurrency] = useState('EUR')
  const [result, setResult] = useState<CurrencyConverterOutput | null>(() => {
    try {
      return convertCurrency({ amount: 1, fromCurrency: 'USD', toCurrency: 'EUR' })
    } catch {
      return null
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const doConvert = useCallback((amt: string, from: string, to: string) => {
    const parsed = parseFloat(amt)
    if (amt === '' || isNaN(parsed)) {
      setResult(null)
      setError(null)
      return
    }
    try {
      setResult(convertCurrency({ amount: parsed, fromCurrency: from, toCurrency: to }))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }, [])

  function handleAmountChange(val: string) {
    setAmount(val)
    doConvert(val, fromCurrency, toCurrency)
  }

  function handleFromChange(val: string) {
    setFromCurrency(val)
    doConvert(amount, val, toCurrency)
  }

  function handleToChange(val: string) {
    setToCurrency(val)
    doConvert(amount, fromCurrency, val)
  }

  function handleSwap() {
    const newFrom = toCurrency
    const newTo = fromCurrency
    setFromCurrency(newFrom)
    setToCurrency(newTo)
    doConvert(amount, newFrom, newTo)
  }

  function handlePopularPair(from: string, to: string) {
    setFromCurrency(from)
    setToCurrency(to)
    doConvert(amount, from, to)
  }

  function handleCalculate() {
    doConvert(amount, fromCurrency, toCurrency)
  }

  function handleReset() {
    setAmount('1')
    setFromCurrency('USD')
    setToCurrency('EUR')
    setError(null)
    try {
      setResult(convertCurrency({ amount: 1, fromCurrency: 'USD', toCurrency: 'EUR' }))
    } catch {
      setResult(null)
    }
  }

  function handleCopy() {
    if (!result) return
    const text = `${amount} ${result.fromCode} = ${result.result} ${result.toCode} (rate: ${result.rate})`
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fromCurrencyData = CURRENCIES.find(c => c.code === fromCurrency)
  const toCurrencyData = CURRENCIES.find(c => c.code === toCurrency)

  return (
    <div className="space-y-5">
      {/* Popular Pairs */}
      <div>
        <div className="text-xs text-content-tertiary mb-2 font-medium uppercase tracking-wide">
          {t('popular_pairs') ?? 'Popular pairs'}
        </div>
        <div className="flex flex-wrap gap-2">
          {POPULAR_PAIRS.map(pair => (
            <button
              key={pair.label}
              onClick={() => handlePopularPair(pair.from, pair.to)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                fromCurrency === pair.from && toCurrency === pair.to
                  ? 'bg-accent-primary text-white border-accent-primary'
                  : 'border-border-default text-content-secondary hover:border-accent-primary hover:text-accent-primary'
              }`}
            >
              {pair.label}
            </button>
          ))}
        </div>
      </div>

      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-content-secondary mb-1">
          {t('label_amount') ?? 'Amount'}
        </label>
        <input
          type="number"
          value={amount}
          onChange={e => handleAmountChange(e.target.value)}
          min={0}
          max={1000000000}
          placeholder="1"
          className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2.5 text-content-primary text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-accent-primary"
        />
      </div>

      {/* Currency Selectors with Swap */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        {/* From Currency */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_fromCurrency') ?? 'From Currency'}
          </label>
          <select
            value={fromCurrency}
            onChange={e => handleFromChange(e.target.value)}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
          {fromCurrencyData && (
            <div className="mt-1 text-xs text-content-tertiary">
              {fromCurrencyData.symbol} {fromCurrencyData.name}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="pb-7">
          <button
            onClick={handleSwap}
            title={t('swap_button') ?? 'Swap'}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-border-default text-content-secondary hover:text-accent-primary hover:border-accent-primary transition-colors text-lg"
            aria-label="Swap currencies"
          >
            ⇄
          </button>
        </div>

        {/* To Currency */}
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">
            {t('label_toCurrency') ?? 'To Currency'}
          </label>
          <select
            value={toCurrency}
            onChange={e => handleToChange(e.target.value)}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2.5 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name} ({c.symbol})
              </option>
            ))}
          </select>
          {toCurrencyData && (
            <div className="mt-1 text-xs text-content-tertiary">
              {toCurrencyData.symbol} {toCurrencyData.name}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCalculate}
          className="flex-1 bg-accent-primary hover:bg-accent-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          {t('calculate') ?? 'Convert'}
        </button>
        <button
          onClick={handleReset}
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

      {/* Result Card */}
      {result && (
        <div className="bg-surface-card border border-border-default rounded-xl p-5 space-y-4">
          {/* Primary result */}
          <div>
            <div className="text-xs text-content-tertiary mb-1 uppercase tracking-wide">
              {t('label_result') ?? 'Converted Amount'}
            </div>
            <div className="text-3xl font-bold text-accent-primary">
              {formatResultAmount(result.result, result.toCode)}
            </div>
            <div className="text-sm text-content-secondary mt-1">
              {amount} {result.fromCode} = {formatResultAmount(result.result, result.toCode)}
            </div>
          </div>

          {/* Rate and Inverse Rate */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-default">
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-content-tertiary mb-1">{t('label_rate') ?? 'Exchange Rate'}</div>
              <div className="text-sm font-semibold text-content-primary">
                1 {result.fromCode} = {result.rate} {result.toCode}
              </div>
            </div>
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-content-tertiary mb-1">{t('label_inverseRate') ?? 'Inverse Rate'}</div>
              <div className="text-sm font-semibold text-content-primary">
                1 {result.toCode} = {result.inverseRate} {result.fromCode}
              </div>
            </div>
          </div>

          {/* Copy button */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border-default rounded-lg text-content-secondary hover:text-content-primary hover:border-border-hover transition-colors"
            >
              {copied ? '✓ Copied' : '⎘ Copy'}
            </button>
          </div>
        </div>
      )}

      {/* Rate Disclaimer */}
      <p className="text-xs text-content-tertiary leading-relaxed">
        {t('rate_disclaimer') ?? 'Rates are approximate reference values. For transactions, use your bank\'s rate.'}
      </p>
    </div>
  )
}
