import type { IntentCluster } from '../assessment/types'

// Maps instrument slugs to their Intent Cluster.
// Used by JourneyExperience to call getIntentState(cluster).
const SLUG_TO_CLUSTER: Record<string, IntentCluster> = {
  // Weight cluster
  'bmi-calculator':             'weight',
  'body-fat-calculator':        'weight',
  'calorie-calculator':         'weight',
  'ideal-weight-calculator':    'weight',
  'macro-calculator':           'weight',
  'protein-calculator':         'weight',
  'tdee-calculator':            'weight',
  'water-intake-calculator':    'weight',
  'body-shape-calculator':      'weight',
  'waist-hip-ratio-calculator': 'weight',
  'weight-assessment':          'weight',
  // Sleep cluster
  'sleep-calculator':           'sleep',
  'sleep-debt-calculator':      'sleep',
  'sleep-assessment':           'sleep',
  // Finance cluster
  'savings-calculator':         'finance',
  'compound-interest-calculator': 'finance',
  'loan-calculator':            'finance',
  'mortgage-calculator':        'finance',
  'investment-calculator':      'finance',
  'budget-calculator':          'finance',
  'emergency-fund-calculator':  'finance',
  'retirement-calculator':      'finance',
}

export function getClusterForSlug(slug: string): IntentCluster {
  return SLUG_TO_CLUSTER[slug] ?? 'weight'
}
