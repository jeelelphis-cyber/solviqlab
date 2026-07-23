import { EventBus } from '../events/bus'
import { UserEngine } from '../user/engine'
import { ProfileEngine } from '../profile/engine'
import { RecommendationEngine } from '../recommendation/engine'
import { AssessmentEngine } from '../assessment/index'
import { MemoryProvider, createStorageProvider } from '../user/storage'
import type { StorageProvider } from '../user/storage'
import { createPlatformPipeline } from './platform-pipeline'
import { buildHandlers } from './pipeline'

// ── PlatformRuntime ───────────────────────────────────────────────────────────

export interface PlatformRuntime {
  readonly bus: EventBus
  readonly userEngine: UserEngine
  readonly profileEngine: ProfileEngine
  readonly recommendationEngine: RecommendationEngine
  readonly assessmentEngine: AssessmentEngine
}

export interface PlatformRuntimeOptions {
  readonly storage?: StorageProvider
}

// createPlatformRuntime() wires all engines to the EventBus via PipelineDefinition.
// Tests pass MemoryProvider. Browser uses createStorageProvider().
export function createPlatformRuntime(options: PlatformRuntimeOptions = {}): PlatformRuntime {
  const storage = options.storage ?? createStorageProvider()

  const profileEngine        = new ProfileEngine(storage)
  const userEngine           = new UserEngine(storage, profileEngine)
  const recommendationEngine = new RecommendationEngine()
  const assessmentEngine     = new AssessmentEngine()
  const bus                  = new EventBus()

  // Build the pipeline from the declarative definition (F-2: V3-10F.1)
  const pipeline = createPlatformPipeline({
    userEngine,
    profileEngine,
    recommendationEngine,
    assessmentEngine,
  })

  // Register handlers — ordering comes from the definition, not from this file
  buildHandlers(pipeline).forEach(handler => bus.register(handler))

  return { bus, userEngine, profileEngine, recommendationEngine, assessmentEngine }
}

// ── Browser Singleton ─────────────────────────────────────────────────────────
// One runtime per browser session. Import this in components.
let _browserRuntime: PlatformRuntime | null = null

export function getBrowserRuntime(): PlatformRuntime {
  if (typeof window === 'undefined') {
    // SSR — return a fresh memory-backed runtime (no-op, not persisted)
    return createPlatformRuntime({ storage: new MemoryProvider() })
  }

  if (!_browserRuntime) {
    _browserRuntime = createPlatformRuntime()
    _browserRuntime.bus.connectToBrowser()
  }

  return _browserRuntime
}
