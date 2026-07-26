'use client'

import { useEffect } from 'react'
import { getBrowserRuntime } from '@/lib/runtime'
import { productRegistry } from '@/lib/products/registry'
import { createStorageProvider } from '@/lib/user/storage'
import { AccountAutoSave } from '@/components/account/AccountAutoSave'
import '@/lib/products/catalog'

// PlatformProvider — initializes the EventBus and ProductRegistry at app level.
// Must be rendered above any calculator or journey component.
// After mount: solviqlab:result events flow through EventBus → GraphMappers → UserGraph.
export function PlatformProvider({ children }: { readonly children: React.ReactNode }) {
  useEffect(() => {
    const runtime = getBrowserRuntime()
    const getUserId = () => runtime.userEngine.getUser()?.id ?? 'demo'
    const disconnect = productRegistry.connect(createStorageProvider(), runtime.graph.updater, getUserId)
    return disconnect
  }, [])

  return <><AccountAutoSave />{children}</>
}
