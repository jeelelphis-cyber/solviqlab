'use client'

import { CONSENT_STRINGS } from '../../lib/consent/strings'
import type { ConsentLang } from '../../lib/consent/strings'

export function CookieSettingsButton({ lang }: { lang: string }) {
  const s = CONSENT_STRINGS[lang as ConsentLang] ?? CONSENT_STRINGS.en

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent('solviqlab:open-consent'))}
      className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline-offset-2 hover:underline"
    >
      {s.cookieSettings}
    </button>
  )
}
