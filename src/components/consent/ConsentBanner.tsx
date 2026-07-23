'use client'

import { useState, useEffect, useCallback } from 'react'
import Script from 'next/script'
import { loadConsent, saveConsent } from '../../lib/consent/storage'
import type { ConsentState } from '../../lib/consent/types'
import { CONSENT_STRINGS } from '../../lib/consent/strings'
import type { ConsentLang } from '../../lib/consent/strings'

// Custom event dispatched by CookieSettingsButton in the footer.
const OPEN_CONSENT_EVENT = 'solviqlab:open-consent'

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

type WindowWithGtag = Window & { gtag?: (...args: unknown[]) => void }

function updateConsentMode(params: Record<string, string>) {
  const w = window as WindowWithGtag
  if (typeof w.gtag === 'function') {
    w.gtag('consent', 'update', params)
  }
}

export function ConsentBanner({ lang }: { lang: string }) {
  const s = CONSENT_STRINGS[lang as ConsentLang] ?? CONSENT_STRINGS.en

  const [consent, setConsent] = useState<ConsentState | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [draftAnalytics, setDraftAnalytics] = useState(false)

  // On mount: restore prior consent or show banner.
  useEffect(() => {
    const saved = loadConsent()
    if (saved) {
      setConsent(saved)
      // Restore GA4 Consent Mode v2 state within wait_for_update window.
      updateConsentMode({
        analytics_storage: saved.analytics ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    } else {
      setShowBanner(true)
    }

    // Footer "Cookie Settings" button opens the preferences modal.
    const openModal = () => {
      const current = loadConsent()
      setDraftAnalytics(current?.analytics ?? false)
      setShowModal(true)
      setShowBanner(false)
    }
    window.addEventListener(OPEN_CONSENT_EVENT, openModal)
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, openModal)
  }, [])

  const commit = useCallback((state: ConsentState) => {
    saveConsent(state)
    setConsent(state)
    updateConsentMode({
      analytics_storage: state.analytics ? 'granted' : 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    })
    setShowBanner(false)
    setShowModal(false)
  }, [])

  const acceptAll = useCallback(() => {
    commit({ v: 1, ts: Date.now(), necessary: true, analytics: true, marketing: false })
  }, [commit])

  const rejectAll = useCallback(() => {
    commit({ v: 1, ts: Date.now(), necessary: true, analytics: false, marketing: false })
  }, [commit])

  const openPreferences = useCallback(() => {
    setDraftAnalytics(loadConsent()?.analytics ?? false)
    setShowModal(true)
    setShowBanner(false)
  }, [])

  const savePreferences = useCallback(() => {
    commit({ v: 1, ts: Date.now(), necessary: true, analytics: draftAnalytics, marketing: false })
  }, [commit, draftAnalytics])

  return (
    <>
      {/*
        Clarity script — mounted only when analytics consent is granted.
        next/script deduplicates by id="clarity-init" across navigations.
      */}
      {consent?.analytics && CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}

      {/* ── Banner ──────────────────────────────────────────────────────────── */}
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-5 animate-in slide-in-from-bottom duration-300"
        >
          <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-[0_-4px_32px_rgba(0,0,0,0.12)] border border-slate-200 dark:border-slate-700 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {s.bannerTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {s.bannerText}
                </p>
              </div>
              <div className="flex flex-col xs:flex-row sm:flex-col md:flex-row gap-2 flex-shrink-0">
                <button
                  onClick={openPreferences}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  {s.managePrefs}
                </button>
                <button
                  onClick={rejectAll}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  {s.rejectAll}
                </button>
                <button
                  onClick={acceptAll}
                  className="px-3.5 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {s.acceptAll}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Preferences Modal ────────────────────────────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-modal-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 id="consent-modal-title" className="text-base font-semibold text-slate-900 dark:text-white">
                  {s.modalTitle}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-3">

                {/* Necessary — always on */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.necessaryTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.necessaryDesc}</p>
                  </div>
                  <span className="flex-shrink-0 mt-0.5 text-xs font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                    {s.alwaysOn}
                  </span>
                </div>

                {/* Analytics — toggleable */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.analyticsTitle}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.analyticsDesc}</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={draftAnalytics}
                    aria-label={s.analyticsTitle}
                    onClick={() => setDraftAnalytics(v => !v)}
                    className={`flex-shrink-0 mt-0.5 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                      draftAnalytics ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                        draftAnalytics ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* Actions */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={rejectAll}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {s.rejectAll}
                </button>
                <button
                  onClick={savePreferences}
                  className="px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {s.savePrefs}
                </button>
                <button
                  onClick={acceptAll}
                  className="col-span-2 px-4 py-2.5 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-700 dark:hover:bg-slate-100 transition-colors"
                >
                  {s.acceptAll}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
