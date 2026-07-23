'use client'

import { useState, useCallback, useEffect } from 'react'
import { calculatePercentageCalculator } from '../../instruments/percentage-calculator/calculate.js'
import { PercentageCalculatorInputSchema } from '../../instruments/percentage-calculator/validate.js'
import { getInterpretation } from '../../instruments/percentage-calculator/interpret.js'
import type { PercentageMode, PercentageDirection, PercentageCalculatorInput, PercentageCalculatorOutput } from '../../instruments/percentage-calculator/types.js'
import { ShareButtons } from '../ShareButtons.js'
interface Props {
  translations: Record<string, unknown>
  lang: string
}

const MODES: PercentageMode[] = ['percent-of', 'is-what-percent', 'percent-change', 'percent-adjust']

export function PercentageCalculatorClient({ translations, lang }: Props) {
  const t = translations as { form: Record<string, string>; result: Record<string, string>; validation: Record<string, string> }

  const [mode, setMode] = useState<PercentageMode>('percent-of')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [direction, setDirection] = useState<PercentageDirection>('increase')
  const [result, setResult] = useState<PercentageCalculatorOutput | null>(null)

  const modeLabels: Record<PercentageMode, string> = {
    'percent-of': t.form['mode_percent_of'] ?? 'What is X% of Y?',
    'is-what-percent': t.form['mode_is_what_percent'] ?? 'X is what % of Y?',
    'percent-change': t.form['mode_percent_change'] ?? '% change from X to Y?',
    'percent-adjust': t.form['mode_percent_adjust'] ?? 'Increase / Decrease X by Y%',
  }

  const calculate = useCallback(() => {
    const raw = mode === 'percent-adjust'
      ? { mode, a: parseFloat(a.replace(',', '.')), b: parseFloat(b.replace(',', '.')), direction }
      : { mode, a: parseFloat(a.replace(',', '.')), b: parseFloat(b.replace(',', '.')) }
    const parsed = PercentageCalculatorInputSchema.safeParse(raw as unknown)
    if (!parsed.success) { setResult(null); return }
    setResult(calculatePercentageCalculator(parsed.data as PercentageCalculatorInput))
  }, [mode, a, b, direction])

  // Real-time calculation
  useEffect(() => {
    if (a && b) calculate()
    else setResult(null)
  }, [a, b, mode, direction, calculate])

  useEffect(() => {
    if (!result) return
    window.dispatchEvent(new CustomEvent('solviqlab:result', {
      detail: { slug: 'percentage-calculator', name: 'Percentage Calculator', value: result.result, label: 'Result', unit: '%', metadata: result }
    }))
  }, [result])

  const reset = () => { setA(''); setB(''); setResult(null) }

  const formatResult = (r: PercentageCalculatorOutput): string => {
    const v = r.roundedResult
    if (mode === 'percent-of') return v.toLocaleString()
    if (mode === 'is-what-percent') return `${v}%`
    if (mode === 'percent-change') return `${v > 0 ? '+' : ''}${v}%`
    return v.toLocaleString()
  }

  const resultColor = result
    ? mode === 'percent-change'
      ? result.isIncrease ? 'text-green-600' : 'text-red-600'
      : 'text-content-primary'
    : 'text-content-primary'

  const interpretation = result
    ? getInterpretation(result, lang as 'en' | 'es' | 'pt')
    : null

  const fieldALabel = mode === 'percent-of' ? 'X (%)' : mode === 'is-what-percent' ? 'X' : mode === 'percent-change' ? 'From (X)' : 'X (base value)'
  const fieldBLabel = mode === 'percent-of' ? 'Y (base)' : mode === 'is-what-percent' ? 'Y (total)' : mode === 'percent-change' ? 'To (Y)' : 'Y (%)'

  return (
    <div className="space-y-6">
      {/* Mode selector */}
      <div>
        <label className="block text-sm font-medium text-content-primary mb-2">
          {t.form['mode_label'] ?? 'Calculation type'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setResult(null) }}
              className={`px-4 py-2.5 text-sm font-medium rounded-lg border text-left transition-colors min-h-[44px] ${
                mode === m
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-surface-card border-border-default text-content-secondary hover:bg-surface-hover'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-primary mb-1">{fieldALabel}</label>
          <input
            type="number"
            value={a}
            onChange={(e) => setA(e.target.value)}
            placeholder={t.form['field_a_placeholder'] ?? 'e.g. 25'}
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-surface-card text-content-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-content-primary mb-1">{fieldBLabel}</label>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(e.target.value)}
            placeholder={t.form['field_b_placeholder'] ?? 'e.g. 200'}
            className="w-full px-3 py-2 border border-border-default rounded-lg bg-surface-card text-content-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Direction toggle for percent-adjust */}
      {mode === 'percent-adjust' && (
        <div className="flex rounded-lg border border-border-default overflow-hidden w-fit">
          {(['increase', 'decrease'] as PercentageDirection[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                direction === d
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-content-secondary hover:bg-surface-hover'
              }`}
            >
              {d === 'increase' ? (t.form['direction_increase'] ?? 'Increase') : (t.form['direction_decrease'] ?? 'Decrease')}
            </button>
          ))}
        </div>
      )}

      {/* Reset */}
      <button
        onClick={reset}
        className="px-4 py-2 text-sm text-content-secondary border border-border-default rounded-lg hover:bg-surface-hover transition-colors"
      >
        {t.form['reset_button'] ?? 'Reset'}
      </button>

      {/* Result — shows in real time */}
      {result && (
        <div className="bg-surface-card rounded-xl border border-border-default p-6">
          <div className="text-sm text-content-secondary mb-1">{t.result['title'] ?? 'Result'}</div>
          <div className={`text-5xl font-bold mb-3 ${resultColor}`}>
            {formatResult(result)}
          </div>

          {/* Formula breakdown */}
          <div className="text-sm text-content-secondary bg-surface-page rounded-lg px-4 py-2 font-mono">
            {mode === 'percent-of' && `${a}% × ${b} = ${result.roundedResult}`}
            {mode === 'is-what-percent' && `(${a} ÷ ${b}) × 100 = ${result.roundedResult}%`}
            {mode === 'percent-change' && `((${b} − ${a}) ÷ |${a}|) × 100 = ${result.roundedResult}%`}
            {mode === 'percent-adjust' && `${a} × (1 ${direction === 'increase' ? '+' : '−'} ${b}÷100) = ${result.roundedResult}`}
          </div>

          {/* Interpretation */}
          {interpretation?.primary && (
            <p className="text-content-secondary text-sm mt-3 border-t border-border-default pt-3">
              {interpretation.primary}
            </p>
          )}
          <ShareButtons text={`Result: ${result.roundedResult}${mode === 'is-what-percent' || mode === 'percent-change' ? '%' : ''} — calculated free at SolviqLab`} className="mt-3" />
        </div>
      )}
    </div>
  )
}
