import type { QuizConfig } from '../types'

// PSS-10 — Perceived Stress Scale (10-item version)
// Developed by Sheldon Cohen, Tom Kamarck & Robin Mermelstein, 1983
// Cohen S, Kamarck T, Mermelstein R. J Health Soc Behav. 1983 (PMID: 6668417)
// The most widely used psychological instrument for measuring stress perception
// Used by CDC, NIH, APA, Harvard, Stanford. Free to use for non-commercial purposes.

const PSS_OPTIONS_REGULAR = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly often' },
  { value: 4, label: 'Very often' },
]

// Items 4, 5, 7, 8 are reverse-scored in the PSS-10
const PSS_OPTIONS_REVERSED = [
  { value: 4, label: 'Never' },
  { value: 3, label: 'Almost never' },
  { value: 2, label: 'Sometimes' },
  { value: 1, label: 'Fairly often' },
  { value: 0, label: 'Very often' },
]

export const stressQuiz: QuizConfig = {
  slug:          'stress-quiz',
  cluster:       'mental',
  icon:          '⚡',
  title:         'Stress Level Quiz (PSS-10)',
  description:   'The Perceived Stress Scale is the most widely used stress measurement tool in the world. Used by Harvard, Stanford, CDC, and NIH research. Takes 3 minutes.',
  clinicalScale: 'PSS-10',
  medicalNote:   'This measures perceived stress, not a clinical diagnosis. Chronic high stress is a serious health risk. Please seek professional support if overwhelmed.',
  sources: [
    { label: 'Cohen S, Kamarck T, Mermelstein R. A global measure of perceived stress. J Health Soc Behav. 1983', url: 'https://pubmed.ncbi.nlm.nih.gov/6668417/' },
    { label: 'American Psychological Association — Stress in America Report, 2023' },
    { label: 'Cohen S. Contrasting the Hassles Scale and the Perceived Stress Scale. Am Psychol. 1986' },
  ],
  questions: [
    {
      id:      'pss1',
      text:    'In the last month, how often have you been upset because of something that happened unexpectedly?',
      hint:    'Emotional reactivity to unexpected events is one of the strongest indicators of overall stress load.',
      source:  'PSS-10 Item 1',
      type:    'likert',
      options: PSS_OPTIONS_REGULAR,
    },
    {
      id:      'pss2',
      text:    'In the last month, how often have you felt that you were unable to control the important things in your life?',
      hint:    'Perceived lack of control is the psychological core of stress — it activates the cortisol response.',
      source:  'PSS-10 Item 2',
      type:    'likert',
      options: PSS_OPTIONS_REGULAR,
    },
    {
      id:      'pss3',
      text:    'In the last month, how often have you felt nervous and stressed?',
      hint:    'Chronic nervous activation keeps the sympathetic nervous system in a near-constant alert state.',
      source:  'PSS-10 Item 3',
      type:    'likert',
      options: PSS_OPTIONS_REGULAR,
    },
    {
      id:      'pss4',
      text:    'In the last month, how often have you felt confident about your ability to handle your personal problems?',
      hint:    'Self-efficacy is a buffer against stress — this item is reverse-scored. Higher confidence = lower stress.',
      source:  'PSS-10 Item 4 (reverse-scored)',
      type:    'likert',
      options: PSS_OPTIONS_REVERSED,
    },
    {
      id:      'pss5',
      text:    'In the last month, how often have you felt that things were going your way?',
      hint:    'Positive appraisal of life direction is a protective factor. This item is reverse-scored.',
      source:  'PSS-10 Item 5 (reverse-scored)',
      type:    'likert',
      options: PSS_OPTIONS_REVERSED,
    },
    {
      id:      'pss6',
      text:    'In the last month, how often have you found that you could not cope with all the things that you had to do?',
      hint:    'Feeling overwhelmed by task load is a direct stress indicator and precursor to burnout.',
      source:  'PSS-10 Item 6',
      type:    'likert',
      options: PSS_OPTIONS_REGULAR,
    },
    {
      id:      'pss7',
      text:    'In the last month, how often have you been able to control irritations in your life?',
      hint:    'Regulation of irritations reflects emotional control capacity — this item is reverse-scored.',
      source:  'PSS-10 Item 7 (reverse-scored)',
      type:    'likert',
      options: PSS_OPTIONS_REVERSED,
    },
    {
      id:      'pss8',
      text:    'In the last month, how often have you felt that you were on top of things?',
      hint:    'A sense of mastery over circumstances is one of the core stress-buffering resources.',
      source:  'PSS-10 Item 8 (reverse-scored)',
      type:    'likert',
      options: PSS_OPTIONS_REVERSED,
    },
    {
      id:      'pss9',
      text:    'In the last month, how often have you been angered because of things that were outside of your control?',
      hint:    'Anger at uncontrollable events activates the HPA axis and elevates cortisol — a direct stress biomarker.',
      source:  'PSS-10 Item 9',
      type:    'likert',
      options: PSS_OPTIONS_REGULAR,
    },
    {
      id:      'pss10',
      text:    'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
      hint:    'Cognitive overwhelm — where problems feel insurmountable — is the strongest predictor of burnout.',
      source:  'PSS-10 Item 10',
      type:    'likert',
      options: PSS_OPTIONS_REGULAR,
    },
  ],
  scoring: {
    max:       40,
    normalize: false,
    buckets: [
      {
        min:         0,
        max:         13,
        label:       'Low Stress',
        severity:    'none',
        description: 'Your perceived stress is low. You have good coping resources and feel largely in control of your life.',
        actions: [
          'Maintain your stress management habits — consistency matters more than intensity',
          'Practice one proactive recovery activity per week (nature walk, sauna, social time)',
          'Document what is working for you now — you will want to return to this during harder periods',
        ],
        miaHook: 'Your stress is well-managed right now. I want to help you build resilience before the next difficult period arrives.',
      },
      {
        min:         14,
        max:         26,
        label:       'Moderate Stress',
        severity:    'mild',
        description: 'Moderate perceived stress. You are coping but feeling the pressure. Without intervention, this can escalate to burnout.',
        actions: [
          'Add a 5-minute daily decompression ritual after work — a walk, breathing exercise, or journal entry',
          'Identify your top 3 stressors this week and eliminate or reduce one of them',
          'Sleep is your most powerful stress recovery tool — prioritize 7-8 hours non-negotiably',
        ],
        miaHook: 'Moderate stress is where most people live without realizing it is slowly draining them. I have a protocol that targets exactly where your score shows the drain.',
      },
      {
        min:         27,
        max:         40,
        label:       'High Stress',
        severity:    'severe',
        description: 'High perceived stress. At this level, stress is significantly damaging your physical and mental health. Research links PSS scores above 27 to increased risk of depression, heart disease, and immune suppression.',
        actions: [
          'Remove one major commitment from your life this week — not eventually, this week',
          'Talk to a therapist, doctor, or trusted person today about your stress load',
          'Stop caffeine after noon and alcohol completely — both worsen the cortisol response',
        ],
        miaHook: 'Your score is in a range where your body is taking real physiological damage. I want to help you take immediate action — not a 30-day plan, but today.',
      },
    ],
  },
  seoContent: {
    intro: `The Perceived Stress Scale (PSS-10) was developed by Dr. Sheldon Cohen at Carnegie Mellon University in 1983. It is the most widely used psychological instrument for measuring stress perception in research and clinical settings, used by the CDC, NIH, Harvard, and Stanford in thousands of studies.\n\nUnlike stress measures that count stressful events, the PSS-10 measures how stressed you feel — your psychological appraisal of your own situation. This makes it uniquely accurate because two people can experience the same events and have completely different stress responses.\n\nScores range from 0 to 40. The average American scores 13 (Cohen et al., 2016). Scores above 27 are associated with significantly increased risk of depression, cardiovascular disease, and immune system suppression (APA Stress in America, 2023). Understanding your stress level is the first step toward managing it.`,
    faq: [
      {
        q: 'What is the PSS-10?',
        a: 'The Perceived Stress Scale (PSS-10) is a 10-item validated questionnaire developed by Dr. Sheldon Cohen in 1983. It is the most widely used tool in stress research globally, measuring how stressed, overwhelmed, and out of control you feel.',
      },
      {
        q: 'What is a normal PSS-10 score?',
        a: 'The average American PSS-10 score is approximately 13. Scores 0–13 indicate low stress, 14–26 moderate stress, and 27–40 high stress. Women tend to score slightly higher than men across all age groups.',
      },
      {
        q: 'Why are some questions reverse-scored?',
        a: 'Four items (4, 5, 7, 8) ask about positive feelings — confidence and control. These are scored in reverse because feeling more confident or in control indicates lower stress. This is standard PSS-10 protocol and is handled automatically in this quiz.',
      },
      {
        q: 'Can stress cause physical health problems?',
        a: 'Yes. Chronic high stress elevates cortisol, suppresses the immune system, increases inflammation, and significantly raises risk of heart disease, diabetes, depression, and obesity. The PSS-10 score above 27 is associated with these outcomes in multiple longitudinal studies.',
      },
      {
        q: 'How often should I retake this quiz?',
        a: 'Monthly retesting lets you track trends. Stress typically fluctuates with life circumstances, but chronic high scores (27+) for 2+ months warrant professional support.',
      },
    ],
  },
  seoKeywords: [
    'PSS-10 stress test online',
    'perceived stress scale',
    'am I stressed quiz',
    'stress level test',
    'chronic stress assessment',
    'PSS score meaning',
    'stress measurement tool',
  ],
}
