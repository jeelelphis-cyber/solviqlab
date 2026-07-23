import type { ClusterStrategyConfig } from '../types'

export const weightStrategyConfig: ClusterStrategyConfig = {
  cluster:              'weight',
  defaultStrategyId:    'balanced',
  goalInputRequired:    true,
  goalUnit:             'kg',
  goalDescription:      'Target weight in kg',
  strategies: [
    {
      id:              'balanced',
      name:            'Balanced Approach',
      description:     'Steady 0.5 kg/week loss — medically recommended, sustainable.',
      weeklyChangeRate: -0.5,
      durationHint:    '16–24 weeks',
      riskLevel:       'low',
      recommendedWhen: { minAssessmentScore: 40 },
    },
    {
      id:              'fast-track',
      name:            'Fast Track',
      description:     'Aggressive 0.75 kg/week — requires strict adherence and medical clearance.',
      weeklyChangeRate: -0.75,
      durationHint:    '12–16 weeks',
      riskLevel:       'medium',
      recommendedWhen: { minAssessmentScore: 65 },
      disqualifiedWhen: {
        minAssessmentScore: 65,  // disqualify when score < 65 (insufficient health data)
        reason:             'insufficient_profile_confidence',
      },
    },
    {
      id:              'muscle-preserve',
      name:            'Muscle Preservation',
      description:     'Slow 0.35 kg/week with strength training focus — best for active users.',
      weeklyChangeRate: -0.35,
      durationHint:    '24–36 weeks',
      riskLevel:       'low',
      recommendedWhen: { minAssessmentScore: 30 },
    },
  ],
}
