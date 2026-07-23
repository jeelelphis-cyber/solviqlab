import type { IntentCluster } from '../assessment/types'
import type { InstrumentManifest, ProfileSignalConfig } from './types'

// CapabilityCatalog — built from manifests, read by all engines.
// Replaces buildRegistry(), INSTRUMENT_PROFILE_MAP, CLUSTER_INSTRUMENTS, NEXT_STEP_DATA.
class CapabilityCatalogImpl {
  private readonly bySlug = new Map<string, InstrumentManifest>()

  register(manifest: InstrumentManifest): void {
    this.bySlug.set(manifest.slug, manifest)
  }

  registerMany(manifests: readonly InstrumentManifest[]): void {
    manifests.forEach(m => this.register(m))
  }

  getBySlug(slug: string): InstrumentManifest | undefined {
    return this.bySlug.get(slug)
  }

  getByCluster(cluster: IntentCluster): readonly InstrumentManifest[] {
    return [...this.bySlug.values()].filter(m => m.cluster === cluster)
  }

  getByType(type: InstrumentManifest['type']): readonly InstrumentManifest[] {
    return [...this.bySlug.values()].filter(m => m.type === type)
  }

  // Returns profile signal configs for a given instrument slug.
  // Used by ProfileEngine.processResult() instead of INSTRUMENT_PROFILE_MAP.
  getProfileSignals(slug: string): readonly ProfileSignalConfig[] {
    return this.bySlug.get(slug)?.profileSignals ?? []
  }

  // Returns all instruments that are steps in a given journey.
  getJourneyInstruments(journeyId: string): readonly InstrumentManifest[] {
    return [...this.bySlug.values()].filter(
      m => m.journeyStep?.journeyId === journeyId
    )
  }

  // Returns the next step config for a given slug (replaces NEXT_STEP_DATA).
  getNextStep(slug: string): JourneyNextStep | null {
    const manifest = this.bySlug.get(slug)
    if (!manifest?.journeyStep?.nextSlug) return null
    return {
      nextSlug: manifest.journeyStep.nextSlug,
      nextName: manifest.journeyStep.nextName ?? '',
      nextPage: manifest.journeyStep.nextPage ?? null,
    }
  }

  // Returns which cluster assessment is triggered by this instrument completing.
  getAssessmentTrigger(slug: string): IntentCluster | null {
    return this.bySlug.get(slug)?.triggersAssessmentFor ?? null
  }

  // All registered slugs — for iteration
  getAllSlugs(): readonly string[] {
    return [...this.bySlug.keys()]
  }

  // Total registered instruments
  get size(): number {
    return this.bySlug.size
  }
}

export interface JourneyNextStep {
  readonly nextSlug: string
  readonly nextName: string
  readonly nextPage: string | null
}

// Singleton — import this everywhere
export const CapabilityCatalog = new CapabilityCatalogImpl()
