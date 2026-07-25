'use client'

import { useEffect, useState } from 'react'
import { getBrowserRuntime } from '../runtime/platform'
import type { RegistrationSuggestion } from './types'

export function useRegistrationTrigger(lang: string): RegistrationSuggestion | null {
  const [suggestion, setSuggestion] = useState<RegistrationSuggestion | null>(null)

  useEffect(() => {
    try {
      const runtime = getBrowserRuntime()
      const result  = runtime.identity.getSuggestion(lang)
      if (result.shouldSuggest) setSuggestion(result)
    } catch { /* non-critical */ }
  }, [lang])

  // Fire analytics once after suggestion is displayed
  useEffect(() => {
    if (!suggestion) return
    try {
      const runtime = getBrowserRuntime()
      runtime.identity.markSuggestionShown(suggestion)
    } catch { /* non-critical */ }
  }, [suggestion?.reason])

  return suggestion
}
