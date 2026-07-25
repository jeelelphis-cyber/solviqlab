// ─────────────────────────────────────────────────────────────────────────────
// ProductRegistry — the single source of truth for all registered products.
//
// Responsibilities:
//   1. Store registered ProductManifests
//   2. Listen to solviqlab:result events (browser only)
//   3. Run GraphMapper automatically when a product result fires
//   4. Provide lookup by slug / cluster
//
// Design: singleton instance, connect() called once from PlatformProvider.
// ─────────────────────────────────────────────────────────────────────────────

import type { ProductManifest, RegisteredProduct, InstrumentResult } from './types'
import type { StorageProvider } from '../user/storage'
import type { GraphUpdater }    from '../graph/updater'

const DEFAULT_COACH = { id: 'mia' as const }

export class ProductRegistry {
  private readonly products = new Map<string, RegisteredProduct>()
  private connected = false

  // ── Registration ───────────────────────────────────────────────────────────

  register(manifest: ProductManifest): void {
    const entry: RegisteredProduct = {
      ...manifest,
      coach:        manifest.coach ?? DEFAULT_COACH,
      registeredAt: new Date().toISOString(),
    }
    this.products.set(manifest.slug, entry)
  }

  // ── Lookup ─────────────────────────────────────────────────────────────────

  get(slug: string): RegisteredProduct | null {
    return this.products.get(slug) ?? null
  }

  getAll(): RegisteredProduct[] {
    return Array.from(this.products.values())
  }

  getByCluster(cluster: string): RegisteredProduct[] {
    return this.getAll().filter(p => p.cluster === cluster)
  }

  has(slug: string): boolean {
    return this.products.has(slug)
  }

  count(): number {
    return this.products.size
  }

  // ── Browser Event Wiring ───────────────────────────────────────────────────
  //
  // Called once from PlatformProvider (client component).
  // After this, every solviqlab:result event auto-runs the GraphMapper.

  connect(
    storage:  StorageProvider,
    updater:  GraphUpdater,
    getUserId: () => string,
  ): () => void {
    if (this.connected) return () => undefined
    this.connected = true

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as InstrumentResult | undefined
      if (!detail?.slug) return

      const product = this.products.get(detail.slug)
      if (!product?.graphMapper) return

      const userId = getUserId()
      if (!userId) return

      try {
        product.graphMapper.map(detail, userId, updater)
      } catch (err) {
        console.warn(`[ProductRegistry] GraphMapper failed for ${detail.slug}:`, err)
      }
    }

    window.addEventListener('solviqlab:result', handler)

    return () => {
      window.removeEventListener('solviqlab:result', handler)
      this.connected = false
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

export const productRegistry = new ProductRegistry()
