// ─────────────────────────────────────────────────────────────────────────────
// Product Catalog — registers all SolviqLAB products.
//
// CEO Decision №006: any new product = one call to registerProduct().
// The engine handles everything else automatically.
//
// Adding a new product:
//   1. Create a GraphMapper (or reuse existing one for the cluster)
//   2. Call registerProduct() below
//   3. Done. UserGraph, Session, Journey, Mia — all connected.
// ─────────────────────────────────────────────────────────────────────────────

import { registerProduct }        from './register'
import { WeightJourney }          from './journeys/weight'
import { SleepJourney }           from './journeys/sleep'
import {
  BMIGraphMapper,
  BodyFatGraphMapper,
  TDEEGraphMapper,
  IdealWeightGraphMapper,
} from './mappers/weight'
import { SleepGraphMapper } from './mappers/sleep'

// ── Weight Cluster ─────────────────────────────────────────────────────────

registerProduct({
  slug:                'bmi-calculator',
  name:                'BMI Calculator',
  cluster:             'weight',
  category:            'calculator',
  graphMapper:         new BMIGraphMapper(),
  journey:             WeightJourney,
  triggersAssessment:  false,
  assessmentCluster:   'weight',
})

registerProduct({
  slug:        'body-fat-calculator',
  name:        'Body Fat Calculator',
  cluster:     'weight',
  category:    'calculator',
  graphMapper: new BodyFatGraphMapper(),
  journey:     WeightJourney,
})

registerProduct({
  slug:        'tdee-calculator',
  name:        'TDEE Calculator',
  cluster:     'weight',
  category:    'calculator',
  graphMapper: new TDEEGraphMapper(),
  journey:     WeightJourney,
})

registerProduct({
  slug:        'ideal-weight-calculator',
  name:        'Ideal Weight Calculator',
  cluster:     'weight',
  category:    'calculator',
  graphMapper: new IdealWeightGraphMapper(),
  journey:     WeightJourney,
})

registerProduct({
  slug:     'calorie-deficit-calculator',
  name:     'Calorie Deficit Calculator',
  cluster:  'weight',
  category: 'calculator',
  journey:  WeightJourney,
})

registerProduct({
  slug:     'calorie-calculator',
  name:     'Calorie Calculator',
  cluster:  'weight',
  category: 'calculator',
  journey:  WeightJourney,
})

registerProduct({
  slug:     'bmr-calculator',
  name:     'BMR Calculator',
  cluster:  'weight',
  category: 'calculator',
  journey:  WeightJourney,
})

registerProduct({
  slug:                'weight-assessment',
  name:                'Weight Assessment',
  cluster:             'weight',
  category:            'assessment',
  journey:             WeightJourney,
  triggersAssessment:  true,
  assessmentCluster:   'weight',
})

// ── Sleep Cluster ──────────────────────────────────────────────────────────

registerProduct({
  slug:        'sleep-calculator',
  name:        'Sleep Calculator',
  cluster:     'sleep',
  category:    'calculator',
  graphMapper: new SleepGraphMapper(),
  journey:     SleepJourney,
})

registerProduct({
  slug:                'sleep-assessment',
  name:                'Sleep Assessment',
  cluster:             'sleep',
  category:            'assessment',
  journey:             SleepJourney,
  triggersAssessment:  true,
  assessmentCluster:   'sleep',
})

// ── Finance Cluster (placeholder — mappers TBD) ────────────────────────────

registerProduct({ slug: 'mortgage-calculator',         name: 'Mortgage Calculator',          cluster: 'finance',    category: 'calculator' })
registerProduct({ slug: 'loan-calculator',             name: 'Loan Calculator',              cluster: 'finance',    category: 'calculator' })
registerProduct({ slug: 'savings-calculator',          name: 'Savings Calculator',           cluster: 'finance',    category: 'calculator' })
registerProduct({ slug: 'compound-interest-calculator',name: 'Compound Interest Calculator', cluster: 'finance',    category: 'calculator' })
registerProduct({ slug: 'retirement-calculator',       name: 'Retirement Calculator',        cluster: 'finance',    category: 'calculator' })

// ── Pregnancy / Family Cluster ─────────────────────────────────────────────

registerProduct({ slug: 'pregnancy-calculator', name: 'Pregnancy Calculator', cluster: 'pregnancy', category: 'calculator' })
registerProduct({ slug: 'due-date-calculator',  name: 'Due Date Calculator',  cluster: 'pregnancy', category: 'calculator' })
registerProduct({ slug: 'ovulation-calculator', name: 'Ovulation Calculator', cluster: 'pregnancy', category: 'calculator' })

// ── Utility (no cluster — converters, math tools) ─────────────────────────

registerProduct({ slug: 'tip-calculator',                name: 'Tip Calculator',                cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'percentage-calculator',         name: 'Percentage Calculator',         cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'discount-calculator',           name: 'Discount Calculator',           cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'vat-calculator',                name: 'VAT Calculator',                cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'fraction-calculator',           name: 'Fraction Calculator',           cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'average-calculator',            name: 'Average Calculator',            cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'ratio-calculator',              name: 'Ratio Calculator',              cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'scientific-notation-calculator',name: 'Scientific Notation Calculator',cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'area-calculator',               name: 'Area Calculator',               cluster: 'utility', category: 'calculator' })
registerProduct({ slug: 'volume-calculator',             name: 'Volume Calculator',             cluster: 'utility', category: 'calculator' })
