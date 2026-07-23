import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'weight-assessment',
  name: 'Weight Assessment',
  type: 'assessment',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: [],
  profileSignals: [
    { domain: 'weight', metric: 'weight_assessment_score', confidence_contribution: 40 },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'weight-loss-planner',
    nextName: 'Weight Loss Planner',
    nextPage: '/planner/weight',
  },
})
