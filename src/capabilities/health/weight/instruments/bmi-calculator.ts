import { defineInstrument } from '../../../../lib/catalog'

export default defineInstrument({
  slug: 'bmi-calculator',
  name: 'BMI Calculator',
  type: 'calculator',
  capability: 'health',
  cluster: 'weight',
  emits: ['solviqlab:result'],
  requiredInputs: ['weight', 'height'],
  profileSignals: [
    {
      domain: 'weight',
      metric: 'bmi',
      confidence_contribution: 30,
      status_map: {
        'Underweight': 'warning', 'Normal Weight': 'optimal', 'Normal weight': 'optimal',
        'Overweight': 'warning', 'Obese': 'critical', 'Obese Class I': 'critical',
        'Obese Class II': 'critical', 'Obese Class III': 'critical',
      },
    },
    {
      domain: 'fitness',
      metric: 'bmi_fitness_proxy',
      confidence_contribution: 15,
      status_map: {
        'Underweight': 'warning', 'Normal Weight': 'optimal', 'Normal weight': 'optimal',
        'Overweight': 'warning', 'Obese': 'critical', 'Obese Class I': 'critical',
        'Obese Class II': 'critical', 'Obese Class III': 'critical',
      },
    },
  ],
  journeyStep: {
    journeyId: 'weight-management',
    nextSlug: 'body-fat-calculator',
    nextName: 'Body Fat Calculator',
  },
})
