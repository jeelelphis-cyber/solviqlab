'use client'

import { useState } from 'react'

interface Props {
  readonly week: number
  readonly cluster: string
  readonly onSubmit: (data: {
    week: number
    actual_value: number
    subjective_score: number
    notes: string | null
  }) => void
  readonly onClose: () => void
}

const CLUSTER_CONFIG: Record<string, { label: string; unit: string; placeholder: string }> = {
  weight:  { label: 'Current weight', unit: 'kg',    placeholder: 'e.g. 83.5' },
  sleep:   { label: 'Average sleep',  unit: 'hours', placeholder: 'e.g. 7.2' },
  finance: { label: 'Amount saved',   unit: '€',     placeholder: 'e.g. 250' },
}

export function CheckInModal({ week, cluster, onSubmit, onClose }: Props) {
  const config = CLUSTER_CONFIG[cluster] ?? CLUSTER_CONFIG['weight']!
  const [value,     setValue]     = useState('')
  const [score,     setScore]     = useState(7)
  const [notes,     setNotes]     = useState('')
  const [error,     setError]     = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseFloat(value)
    if (isNaN(n) || n <= 0) {
      setError('Please enter a valid value')
      return
    }
    onSubmit({
      week,
      actual_value:     n,
      subjective_score: score,
      notes:            notes.trim() || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white">Week {week} Check-In</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Metric */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {config.label}
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder={config.placeholder}
                step="0.1"
                className="flex-1 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5
                           bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="text-slate-500 text-sm">{config.unit}</span>
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Subjective score */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              How well did you stick to the plan? {score}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>Struggled</span>
              <span>Perfect</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations about this week..."
              rows={2}
              className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-2.5
                         bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none
                         resize-none text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl
                       hover:bg-blue-700 transition-colors"
          >
            Save Check-In
          </button>
        </form>
      </div>
    </div>
  )
}
