'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { getBrowserRuntime } from '@/lib/runtime'
import { productRegistry } from '@/lib/products/registry'
import { createStorageProvider } from '@/lib/user/storage'
import { AccountAutoSave } from '@/components/account/AccountAutoSave'
import '@/lib/products/catalog'

const GRAPH_LS_KEY = (uid: string) => `solviqlab:user:graph:${uid}`

// PlatformProvider — initializes the EventBus and ProductRegistry at app level.
// Must be rendered above any calculator or journey component.
// After mount: solviqlab:result events flow through EventBus → GraphMappers → UserGraph.
export function PlatformProvider({ children }: { readonly children: React.ReactNode }) {
  const { data: session } = useSession()
  const userId = (session?.user as { id?: string } | undefined)?.id
  const pulledRef = useRef(false)

  useEffect(() => {
    const runtime = getBrowserRuntime()
    const getUserId = () => runtime.userEngine.getUser()?.id ?? 'demo'
    const disconnect = productRegistry.connect(createStorageProvider(), runtime.graph.updater, getUserId)
    return disconnect
  }, [])

  useEffect(() => {
    if (!userId) return

    // Pull cloud graph once on login — overwrite localStorage if cloud is newer
    if (!pulledRef.current) {
      pulledRef.current = true
      fetch('/api/graph/sync')
        .then(r => r.json())
        .then((data: { graph: Record<string, unknown> | null }) => {
          if (!data.graph) return
          try { localStorage.setItem(GRAPH_LS_KEY(userId), JSON.stringify(data.graph)) } catch {}
        })
        .catch(() => {})
    }

    // Push local graph to cloud every 60s and on tab hide
    function push() {
      try {
        const raw = localStorage.getItem(GRAPH_LS_KEY(userId!))
        if (!raw) return
        const graph = JSON.parse(raw) as Record<string, unknown>
        fetch('/api/graph/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ graph, version: (graph.version as number) ?? 1 }),
        }).catch(() => {})
      } catch {}
    }

    const interval = setInterval(push, 60_000)
    const onHide = () => { if (document.visibilityState === 'hidden') push() }
    document.addEventListener('visibilitychange', onHide)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [userId])

  return <><AccountAutoSave />{children}</>
}
