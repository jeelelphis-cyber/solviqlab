'use client'
import { useState, useEffect, useRef } from 'react'
import { CURRENCIES, getCurrencyForLang } from '../../lib/currencies'
import type { Currency } from '../../lib/currencies'

const LS_KEY = 'calco_currency'

export function useCurrency(lang: string): [Currency, (c: Currency) => void] {
  const [currency, setCurrencyState] = useState<Currency>(() => getCurrencyForLang(lang))

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      const found = CURRENCIES.find(c => c.code === stored)
      if (found) setCurrencyState(found)
    } else {
      setCurrencyState(getCurrencyForLang(lang))
    }
  }, [lang])

  function setCurrency(c: Currency) {
    setCurrencyState(c)
    localStorage.setItem(LS_KEY, c.code)
  }

  return [currency, setCurrency]
}

interface Props {
  lang: string
  currency: Currency
  onChange: (c: Currency) => void
}

export function CurrencySelector({ currency, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = CURRENCIES.filter(c =>
    c.code.toLowerCase().includes(query.toLowerCase()) ||
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.symbol.includes(query)
  )

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-semibold transition-colors ${
          open
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        title="Change currency"
      >
        <span>{currency.symbol}</span>
        <span className="text-xs text-slate-400">{currency.code}</span>
        <span className={`text-xs transition-transform duration-150 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search currency…"
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-400"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400 text-center">Not found</p>
            )}
            {filtered.map(c => (
              <button
                key={c.code}
                onClick={() => { onChange(c); setOpen(false); setQuery('') }}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                  c.code === currency.code
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="w-8 font-mono text-base">{c.symbol}</span>
                <span className="flex-1">{c.name}</span>
                <span className="text-xs text-slate-400 font-mono">{c.code}</span>
                {c.code === currency.code && <span className="text-blue-500 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
