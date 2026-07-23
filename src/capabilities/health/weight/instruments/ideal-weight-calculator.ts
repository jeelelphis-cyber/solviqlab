import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'ideal-weight-calculator',
  name: 'Ideal Weight Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: ['height', 'gender'],
  profileSignals: [
    { domain: 'weight', metric: 'ideal_weight_range', confidence_contribution: 20 },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'weight-assessment',
    nextName: 'Weight Assessment',
    nextPage: '/assessment/weight',
  },
})
