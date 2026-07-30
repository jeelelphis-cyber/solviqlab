import { EventBus } from '../events/bus'
import { UserEngine } from '../user/engine'
import { ProfileEngine } from '../profile/engine'
import { RecommendationEngine } from '../recommendation/engine'
import { AssessmentEngine } from '../assessment/index'
import { MemoryProvider, createStorageProvider } from '../user/storage'
import type { StorageProvider } from '../user/storage'
import { createPlatformPipeline } from './platform-pipeline'
import { buildHandlers } from './pipeline'
import { CoachHistoryRepository } from '../coach/history'
import { IdentityService } from '../identity/service'
import { LocalIdentityProvider } from '../identity/provider'
import { SyncEngine } from '../sync/engine'
import { NoOpCloudAdapter } from '../sync/cloud-adapter'
import { LocalWinsResolver } from '../sync/conflict'
import { RetentionEngine } from '../retention/engine'
import { DormancyDetector } from '../retention/detector'
import { ReminderPolicy } from '../retention/policy'
import { FeatureFlagEngine } from '../premium/flags'
import { EntitlementService } from '../premium/entitlements'
import { AccessPolicy } from '../premium/policy'
import { PremiumAnalytics } from '../premium/analytics'
import { LLMCoachService } from '../llm/coach-service'
import { MockLLMProvider } from '../llm/provider'
import { APIRouteProvider } from '../llm/providers/api-route-provider'
import { CompositeContextBuilder } from '../llm/context-builder'
import {
  IdentityContextSource,
  JourneyContextSource,
  RetentionContextSource,
  CoachContextSource,
} from '../llm/context-source'
import { PromptComposer } from '../llm/prompt-composer'
import { SafetyPolicy } from '../llm/safety-policy'
import { ConversationMemory } from '../llm/conversation-memory'
import { LLMAnalytics } from '../llm/analytics'
import { QuotaGuard } from '../llm/quota-guard'
import { CostEstimator } from '../llm/cost-estimator'
import { PromptPipeline } from '../llm/pipeline/prompt-pipeline'
import { RetryExecutor } from '../llm/pipeline/retry-executor'
import { ResponseValidator } from '../llm/pipeline/response-validator'
import { MetricsCollector } from '../llm/pipeline/metrics-collector'
import { GraphRepository } from '../graph/repository'
import { GraphUpdater } from '../graph/updater'
import { GraphContextSource } from '../graph/context-source'
import { AssessmentGraphSync } from '../graph/sync-service'

// ── PlatformRuntime ───────────────────────────────────────────────────────────

export interface PlatformRuntime {
  readonly bus: EventBus
  readonly userEngine: UserEngine
  readonly profileEngine: ProfileEngine
  readonly recommendationEngine: RecommendationEngine
  readonly assessmentEngine: AssessmentEngine
  readonly coachHistory: CoachHistoryRepository
  readonly identity: IdentityService
  readonly sync: SyncEngine
  readonly retention: RetentionEngine
  readonly premium: {
    readonly flags: FeatureFlagEngine
    readonly entitlements: EntitlementService
    readonly accessPolicy: AccessPolicy
    readonly analytics: PremiumAnalytics
  }
  readonly llmCoach: LLMCoachService
  readonly llmQuota: QuotaGuard
  readonly graph: {
    readonly repo:    GraphRepository
    readonly updater: GraphUpdater
  }
}

export interface PlatformRuntimeOptions {
  readonly storage?: StorageProvider
}

export function createPlatformRuntime(options: PlatformRuntimeOptions = {}): PlatformRuntime {
  const storage = options.storage ?? createStorageProvider()

  const profileEngine        = new ProfileEngine(storage)
  const userEngine           = new UserEngine(storage, profileEngine)
  const recommendationEngine = new RecommendationEngine()
  const assessmentEngine     = new AssessmentEngine()
  const coachHistory         = new CoachHistoryRepository(storage)
  const identityProvider     = new LocalIdentityProvider(userEngine)
  const identity             = new IdentityService(identityProvider)
  const sync                 = new SyncEngine(storage, new NoOpCloudAdapter(), new LocalWinsResolver())
  const retention            = new RetentionEngine(new DormancyDetector(), new ReminderPolicy(), storage)
  const premiumFlags         = new FeatureFlagEngine()
  const premiumEntitlements  = new EntitlementService(premiumFlags)
  const premium = {
    flags:        premiumFlags,
    entitlements: premiumEntitlements,
    accessPolicy: new AccessPolicy(premiumEntitlements, premiumFlags),
    analytics:    new PremiumAnalytics(),
  }

  const dormancyDetector = new DormancyDetector()

  // ── User Graph ─────────────────────────────────────────────────────────────
  const graphRepo    = new GraphRepository(storage)
  const graphUpdater = new GraphUpdater(graphRepo)
  const graphSync    = new AssessmentGraphSync(graphUpdater)

  // Browser uses APIRouteProvider (keys stay on server).
  // Server-side / tests fall back to MockLLMProvider (no network).
  const llmProvider = typeof window !== 'undefined'
    ? new APIRouteProvider()
    : new MockLLMProvider()

  // ── LLM sub-components ─────────────────────────────────────────────────────
  let currentLang = 'en'
  const contextBuilder = new CompositeContextBuilder([
    new GraphContextSource(graphRepo, () => currentLang, () => userEngine.getUser()?.id ?? ''),
    new IdentityContextSource(userEngine),
    new JourneyContextSource(userEngine),
    new RetentionContextSource(userEngine, dormancyDetector),
    new CoachContextSource(coachHistory),
  ])

  const llmCoach = new LLMCoachService(
    new PromptPipeline(contextBuilder, new PromptComposer()),
    new RetryExecutor(llmProvider),
    new ResponseValidator(new SafetyPolicy()),
    new ConversationMemory(storage),
    new MetricsCollector(new LLMAnalytics(), undefined, new CostEstimator()),
  )

  const llmQuota = new QuotaGuard(storage)

  const bus = new EventBus()

  identity.init()

  const pipeline = createPlatformPipeline({
    userEngine,
    profileEngine,
    recommendationEngine,
    assessmentEngine,
    graphSync,
    graphRepo,
  })
  buildHandlers(pipeline).forEach(handler => bus.register(handler))

  return {
    bus, userEngine, profileEngine, recommendationEngine, assessmentEngine,
    coachHistory, identity, sync, retention, premium, llmCoach, llmQuota,
    graph: { repo: graphRepo, updater: graphUpdater },
  }
}

// ── Browser Singleton ─────────────────────────────────────────────────────────
let _browserRuntime: PlatformRuntime | null = null

export function getBrowserRuntime(): PlatformRuntime {
  if (typeof window === 'undefined') {
    return createPlatformRuntime({ storage: new MemoryProvider() })
  }

  if (!_browserRuntime) {
    _browserRuntime = createPlatformRuntime()
    _browserRuntime.bus.connectToBrowser()
  }

  return _browserRuntime
}
