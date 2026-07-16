'use client'
import { useState } from 'react'
import { calculateAreaCalculator } from '../../instruments/area-calculator/lib/calculate.js'
import type { AreaCalculatorOutput } from '../../instruments/area-calculator/lib/types.js'

interface Props {
  translations: Record<string, unknown>
  lang: string
}

export function AreaCalculatorClient({ translations }: Props) {
  const t = (key: string) => translations[key] as string | undefined

  const [shape, setShape] = useState('rectangle')
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [h, setH] = useState('')
  const [result, setResult] = useState<AreaCalculatorOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  const needsB = ['rectangle', 'triangle', 'trapezoid', 'ellipse'].includes(shape)
  const needsH = shape === 'trapezoid'

  function calculate() {
    try {
      const input = {
        shape: shape as 'rectangle' | 'square' | 'circle' | 'triangle' | 'trapezoid' | 'ellipse',
        a: parseFloat(a),
        ...(b ? { b: parseFloat(b) } : {}),
        ...(h ? { h: parseFloat(h) } : {}),
      }
      setResult(calculateAreaCalculator(input))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      setResult(null)
    }
  }

  function reset() {
    setShape('rectangle'); setA(''); setB(''); setH('')
    setResult(null); setError(null)
  }

  // Label for 'a' input depends on shape
  const labelA = shape === 'circle' ? (t('label_radius') ?? 'Radius')
    : shape === 'ellipse' ? (t('label_semi_axis_a') ?? 'Semi-axis A')
    : shape === 'trapezoid' ? (t('label_base1') ?? 'Base 1 (top)')
    : (t('label_a') ?? 'Length / Base')

  const labelB = shape === 'rectangle' ? (t('label_width') ?? 'Width')
    : shape === 'triangle' ? (t('label_height') ?? 'Height')
    : shape === 'ellipse' ? (t('label_semi_axis_b') ?? 'Semi-axis B')
    : shape === 'trapezoid' ? (t('label_base2') ?? 'Base 2 (bottom)')
    : ''

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">{t('label_shape') ?? 'Shape'}</label>
          <select value={shape} onChange={e => { setShape(e.target.value); setResult(null) }}
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary">
            <option value="rectangle">{t('opt_rectangle') ?? 'Rectangle'}</option>
            <option value="square">{t('opt_square') ?? 'Square'}</option>
            <option value="circle">{t('opt_circle') ?? 'Circle'}</option>
            <option value="triangle">{t('opt_triangle') ?? 'Triangle'}</option>
            <option value="trapezoid">{t('opt_trapezoid') ?? 'Trapezoid'}</option>
            <option value="ellipse">{t('opt_ellipse') ?? 'Ellipse'}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-secondary mb-1">{labelA}</label>
          <input type="number" value={a} onChange={e => setA(e.target.value)} min={0} max={1000000000}
            placeholder="0"
            className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
        </div>

        {needsB && (
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">{labelB}</label>
            <input type="number" value={b} onChange={e => setB(e.target.value)} min={0} max={1000000000}
              placeholder="0"
              className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
          </div>
        )}

        {needsH && (
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1">
              {t('label_height') ?? 'Height'}
            </label>
            <input type="number" value={h} onChange={e => setH(e.target.value)} min={0} max={1000000000}
              placeholder="0"
              className="w-full bg-surface-input border border-border-default rounded-lg px-3 py-2 text-content-primary focus:outline-none focus:ring-2 focus:ring-accent-primary" />
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={calculate}
          className="flex-1 bg-accent-primary hover:bg-accent-primary-hover text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
          {t('calculate') ?? 'Calculate'}
        </button>
        <button onClick={reset}
          className="px-4 py-2.5 border border-border-default text-content-secondary hover:text-content-primary hover:border-border-hover rounded-lg transition-colors">
          {t('reset') ?? 'Reset'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-surface-card border border-border-default rounded-xl p-5">
          <h3 className="text-sm font-medium text-content-secondary mb-4">{t('result') ?? 'Result'}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-elevated rounded-lg p-3">
              <div className="text-xs text-content-tertiary mb-1">{t('label_area') ?? 'Area'}</div>
              <div className="text-lg font-semibold text-content-primary">
                {result.area.toLocaleString()}<span className="text-sm text-content-secondary"> units²</span>
              </div>
            </div>
            {result.perimeter > 0 && (
              <div className="bg-surface-elevated rounded-lg p-3">
                <div className="text-xs text-content-tertiary mb-1">{t('label_perimeter') ?? 'Perimeter'}</div>
                <div className="text-lg font-semibold text-content-primary">
                  {result.perimeter.toLocaleString()}<span className="text-sm text-content-secondary"> units</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
