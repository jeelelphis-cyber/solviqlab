'use client'

import { useEffect } from 'react'
import { getBrowserRuntime } from '@/lib/runtime'

// PlatformProvider — initializes the EventBus at app level.
// Must be rendered above any calculator or journey component.
// After mount: solviqlab:result events flow through EventBus → all handlers.
export function PlatformProvider({ children }: { readonly children: React.ReactNode }) {
  useEffect(() => {
    getBrowserRuntime()
    // getBrowserRuntime() is idempotent — safe to call multiple times.
    // On first call: creates runtime + connects EventBus to window.
    // On subsequent calls: returns the cached singleton.
  }, [])

  return <>{children}</>
}
