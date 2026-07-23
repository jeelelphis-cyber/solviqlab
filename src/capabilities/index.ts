import type { ClusterRegistrator } from './types'
import { registerWeightCluster } from './health/weight'

// THE ONLY PLACE to add new capability clusters.
// Adding Mental Health: import registerMentalHealthCluster, add to array. Done.
// Bootstrap (registerAllCapabilities) never knows which clusters exist — it
// only iterates this array. Engines only read CapabilityCatalog.
const CAPABILITY_CLUSTERS: ClusterRegistrator[] = [
  registerWeightCluster,
  // registerSleepCluster,      — V3-10E
  // registerFinanceCluster,    — future
  // registerMentalHealthCluster — future
]

export function registerAllCapabilities(): void {
  CAPABILITY_CLUSTERS.forEach(register => register())
}
