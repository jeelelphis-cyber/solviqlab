import type { ResultEvent, EventHandler, HandlerContext, PlatformEvent } from './types'

// ── Middleware ────────────────────────────────────────────────────────────────

type Next = () => Promise<void>
type Middleware = (event: ResultEvent, next: Next) => Promise<void>

// Validates required fields before handlers run
const validationMiddleware: Middleware = async (event, next) => {
  if (!event.eventId) throw new Error('[EventBus] Event missing eventId')
  if (!event.slug)    throw new Error('[EventBus] Event missing slug')
  if (!event.type)    throw new Error('[EventBus] Event missing type')
  await next()
}

// Prevents the same event from being processed twice (React StrictMode, double-clicks)
function idempotencyMiddleware(processedIds: Set<string>): Middleware {
  return async (event, next) => {
    if (processedIds.has(event.eventId)) return
    processedIds.add(event.eventId)
    await next()
  }
}

// ── EventBus ──────────────────────────────────────────────────────────────────

export class EventBus {
  private readonly handlers: EventHandler[] = []
  private readonly processedIds = new Set<string>()
  private readonly middlewares: Middleware[] = []
  private platformEventListeners: Array<(event: PlatformEvent) => void> = []

  constructor() {
    // Middleware chain (order matters)
    this.middlewares = [
      validationMiddleware,
      idempotencyMiddleware(this.processedIds),
    ]
  }

  // ── Registration ─────────────────────────────────────────────────────────────

  register(handler: EventHandler): void {
    this.handlers.push(handler)
    // Keep sorted by priority (ascending — lower number runs first)
    this.handlers.sort((a, b) => a.priority - b.priority)
  }

  onPlatformEvent(listener: (event: PlatformEvent) => void): () => void {
    this.platformEventListeners.push(listener)
    return () => {
      this.platformEventListeners = this.platformEventListeners.filter(l => l !== listener)
    }
  }

  // ── Dispatch ──────────────────────────────────────────────────────────────────

  async dispatch(event: ResultEvent): Promise<readonly PlatformEvent[]> {
    const platformEvents: PlatformEvent[] = []

    const ctx: HandlerContext = {
      emit: (pe) => platformEvents.push(pe),
    }

    // Run middleware chain
    const runMiddlewares = this.buildMiddlewareChain(event, async () => {
      await this.runHandlers(event, ctx)
    })

    await runMiddlewares()

    // Broadcast platform events to listeners (after all handlers complete)
    platformEvents.forEach(pe => {
      this.platformEventListeners.forEach(l => {
        try { l(pe) } catch {}
      })
      // Also dispatch to browser window if available
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(pe.type, { detail: pe }))
      }
    })

    return platformEvents
  }

  // ── Browser Integration ───────────────────────────────────────────────────────

  // Connect to window.addEventListener — call once at app bootstrap.
  // After this, every solviqlab:result CustomEvent flows through the EventBus.
  connectToBrowser(): () => void {
    if (typeof window === 'undefined') return () => {}

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ResultEvent
      if (detail?.type === 'solviqlab:result') {
        this.dispatch(detail).catch(err =>
          console.error('[EventBus] dispatch error:', err)
        )
      }
    }

    window.addEventListener('solviqlab:result', handler)
    return () => window.removeEventListener('solviqlab:result', handler)
  }

  // ── Internals ─────────────────────────────────────────────────────────────────

  private buildMiddlewareChain(event: ResultEvent, final: Next): Next {
    const chain = [...this.middlewares].reverse()
    return chain.reduce<Next>(
      (next, mw) => () => mw(event, next),
      final
    )
  }

  private async runHandlers(event: ResultEvent, ctx: HandlerContext): Promise<void> {
    const syncHandlers  = this.handlers.filter(h => !h.async)
    const asyncHandlers = this.handlers.filter(h => h.async)

    // Sync handlers run in order — if one fails, log and continue
    for (const handler of syncHandlers) {
      try {
        await handler.handle(event, ctx)
      } catch (err) {
        console.error(`[EventBus] Handler "${handler.name}" failed:`, err)
      }
    }

    // Async handlers fire-and-forget — errors are silent
    asyncHandlers.forEach(handler => {
      Promise.resolve(handler.handle(event, ctx)).catch(() => {})
    })
  }

  // ── Diagnostics ───────────────────────────────────────────────────────────────

  get registeredHandlers(): readonly string[] {
    return this.handlers.map(h => `[P${h.priority}] ${h.name}`)
  }

  get processedEventCount(): number {
    return this.processedIds.size
  }
}
