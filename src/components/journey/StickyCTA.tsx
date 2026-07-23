'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

interface Props {
  readonly href: string
  readonly text: string
  readonly subtext: string | null
  readonly urgency: 'low' | 'medium' | 'high' | 'critical'
  readonly trackingLabel: string
  readonly nextName: string
}

const URGENCY_BTN = {
  low:      'bg-blue-600 hover:bg-blue-700',
  medium:   'bg-blue-600 hover:bg-blue-700',
  high:     'bg-amber-500 hover:bg-amber-600',
  critical: 'bg-emerald-600 hover:bg-emerald-700',
}

const SCROLL_THRESHOLD = 380   // px — appears after user scrolls past the calculator

export function StickyCTA({ href, text, subtext, urgency, trackingLabel, nextName }: Props) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const handleScroll = useCallback(() => {
    if (dismissed) return
    setVisible(window.scrollY > SCROLL_THRESHOLD)
  }, [dismissed])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const dismiss = () => {
    setDismissed(true)
    setVisible(false)
  }

  const handleClick = () => {
    // Fire analytics event
    try {
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).gtag) {
        ;(window as unknown as { gtag: (...a: unknown[]) => void }).gtag('event', 'journey_sticky_cta_clicked', {
          journey_label: trackingLabel,
          next_step: nextName,
        })
      }
    } catch {}
    dismiss()
  }

  if (!visible || dismissed) return null

  return (
    <div
      role="complementary"
      aria-label="Journey next step"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4"
      style={{ animation: 'slide-up 200ms ease-out' }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-900/10 dark:shadow-black/30 px-4 py-3">

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mb-0.5">
              Recommended next step
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {nextName}
            </p>
          </div>

          {/* CTA button */}
          <Link
            href={href}
            onClick={handleClick}
            data-journey-sticky={trackingLabel}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 ${URGENCY_BTN[urgency]} text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
          >
            {text}
            {subtext && <span className="text-white/70 font-normal hidden sm:inline">· {subtext}</span>}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M2 7h10M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
