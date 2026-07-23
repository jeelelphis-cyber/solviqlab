import { registerWeightCluster } from './health/weight'

// Platform bootstrap — registers all capability manifests.
// Called once in app/layout.tsx (server component, runs at build time).
export function registerAllCapabilities(): void {
  registerWeightCluster()
  // registerSleepCluster()   — V3-10E
  // registerFinanceCluster() — future
}
