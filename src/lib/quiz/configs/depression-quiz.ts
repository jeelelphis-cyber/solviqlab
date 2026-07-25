import type { QuizConfig } from '../types'

// PHQ-9 — Patient Health Questionnaire-9
// Validated by Kroenke, Spitzer & Williams, JGIM 2001 (PMID: 11556941)
// Used by WHO, NHS, APA, Mayo Clinic, CDC. Public domain.

const LIKERT_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

export const depressionQuiz: QuizConfig = {
  slug:          'depression-quiz',
  cluster:       'mental',
  icon:          '🧠',
  title:         'Depression Screening Quiz (PHQ-9)',
  description:   'The PHQ-9 is the gold-standard depression screening tool used by doctors worldwide. Takes 2 minutes. Based on 20+ years of clinical research.',
  clinicalScale: 'PHQ-9',
  medicalNote:   'This is a screening tool, not a clinical diagnosis. If you are in crisis, please contact a mental health professional or a crisis line immediately.',
  sources: [
    { label: 'Kroenke K, Spitzer RL, Williams JB. The PHQ-9. J Gen Intern Med. 2001', url: 'https://pubmed.ncbi.nlm.nih.gov/11556941/' },
    { label: 'WHO Mental Health — Depression fact sheet, 2023' },
    { label: 'American Psychiatric Association, DSM-5 Diagnostic Criteria' },
  ],
  questions: [
    {
      id:      'phq1',
      text:    'Little interest or pleasure in doing things',
      hint:    'Anhedonia — loss of enjoyment — is one of two core symptoms of depression.',
      source:  'PHQ-9 Item 1',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq2',
      text:    'Feeling down, depressed, or hopeless',
      hint:    'Persistent low mood is the second core diagnostic criterion for major depressive disorder.',
      source:  'PHQ-9 Item 2',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq3',
      text:    'Trouble falling or staying asleep, or sleeping too much',
      hint:    'Sleep disturbances occur in over 90% of people with depression and worsen cognitive function.',
      source:  'PHQ-9 Item 3',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq4',
      text:    'Feeling tired or having little energy',
      hint:    'Depression-related fatigue is neurobiological — caused by dysregulated serotonin and dopamine.',
      source:  'PHQ-9 Item 4',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq5',
      text:    'Poor appetite or overeating',
      hint:    'Appetite changes affect 70–80% of depressed individuals. Both extremes are clinical signals.',
      source:  'PHQ-9 Item 5',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq6',
      text:    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      hint:    'Persistent guilt and worthlessness are among the strongest predictors of depression severity.',
      source:  'PHQ-9 Item 6',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq7',
      text:    'Trouble concentrating on things, such as reading or watching television',
      hint:    'Depression reduces prefrontal cortex activity, directly impairing attention and memory.',
      source:  'PHQ-9 Item 7',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq8',
      text:    'Moving or speaking so slowly that other people noticed — or the opposite, being so fidgety or restless you moved much more than usual',
      hint:    'Psychomotor changes are observable signs that distinguish clinical depression from ordinary sadness.',
      source:  'PHQ-9 Item 8',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
    {
      id:      'phq9',
      text:    'Thoughts that you would be better off dead, or of hurting yourself in some way',
      hint:    'Any score above 0 here warrants professional attention regardless of total score.',
      source:  'PHQ-9 Item 9',
      type:    'likert',
      options: LIKERT_OPTIONS,
    },
  ],
  scoring: {
    max:       27,
    normalize: false,
    buckets: [
      {
        min:         0,
        max:         4,
        label:       'Minimal or No Depression',
        severity:    'none',
        description: 'Your score suggests no significant depressive symptoms. Continue maintaining your mental wellbeing.',
        actions: [
          'Maintain a consistent sleep schedule — the single most protective habit against depression',
          'Exercise 30 minutes most days. Physical activity reduces depression risk by 26% (Harvard, 2019)',
          'Prioritize one meaningful social connection per week',
        ],
        miaHook: 'Your mental baseline looks healthy. I want to help you protect it — because prevention is 10× easier than recovery.',
      },
      {
        min:         5,
        max:         9,
        label:       'Mild Depression',
        severity:    'mild',
        description: 'Mild depressive symptoms are present. These are real and deserve attention — they can progress without support.',
        actions: [
          'Start a 15-minute daily walk in natural light — proven to elevate mood within days',
          'Eliminate alcohol completely for 2 weeks and track your mood each evening',
          'Share how you are feeling with one trusted person this week',
        ],
        miaHook: 'Mild symptoms are the easiest to address. I have a 7-day mood reset protocol that targets exactly what your score shows.',
      },
      {
        min:         10,
        max:         14,
        label:       'Moderate Depression',
        severity:    'moderate',
        description: 'Moderate depression is significantly affecting daily functioning. Professional support alongside lifestyle changes is recommended.',
        actions: [
          'Contact a therapist or doctor this week — not next month',
          'Establish one daily anchor: same wake time every morning for 14 days',
          'Avoid major life decisions until you have professional support in place',
        ],
        miaHook: 'Your score tells me you are carrying something heavy right now. I want to help you take the first step — not alone.',
      },
      {
        min:         15,
        max:         19,
        label:       'Moderately Severe Depression',
        severity:    'severe',
        description: 'Your symptoms are significantly impacting your life. Effective treatments exist — please reach out to a healthcare provider soon.',
        actions: [
          'Schedule a doctor or psychiatrist appointment today, not this week',
          'Tell one trusted person your PHQ-9 score right now',
          'Remove sleep barriers tonight: dark room, no screens, consistent bedtime',
        ],
        miaHook: 'I am not going to give you a wellness tip right now. I want to help you find the right support — today.',
      },
      {
        min:         20,
        max:         27,
        label:       'Severe Depression',
        severity:    'severe',
        description: 'Severe depression. Please seek professional help immediately. You deserve proper care and effective treatments exist.',
        actions: [
          'Contact a crisis line or emergency room if you are in immediate danger',
          'Call one trusted person right now and share how you are feeling',
          'Do not make any major life decisions while in this state',
        ],
        miaHook: 'Your score is serious and I want you to know you are not alone. Please reach out to someone today.',
      },
    ],
  },
  seoContent: {
    intro: `The PHQ-9 (Patient Health Questionnaire-9) is the most widely used depression screening tool in the world. Developed by Drs. Robert Spitzer, Janet Williams, and Kurt Kroenke in 1999, it has been validated in over 8,000 patients and is used by the WHO, NHS, and primary care physicians globally.\n\nThis quiz measures the 9 core symptoms of major depressive disorder as defined by the DSM-5. Your total score — from 0 to 27 — maps to one of five severity levels, each supported by decades of clinical research. A score of 10 or above suggests moderate depression and warrants a conversation with a healthcare professional.\n\nDepression affects 280 million people worldwide (WHO, 2023). It is the leading cause of disability globally. With proper support, 80% of people experience significant improvement. Taking this quiz is the first step toward understanding what you are experiencing.`,
    faq: [
      {
        q: 'How accurate is the PHQ-9?',
        a: 'The PHQ-9 has a sensitivity of 88% and specificity of 88% for major depressive disorder using a cutoff of 10. It is validated in thousands of studies and is the global standard for depression screening in primary care.',
      },
      {
        q: 'What does a PHQ-9 score of 10 mean?',
        a: 'A score of 10–14 indicates moderate depression. Symptoms are significantly affecting daily functioning. Clinical guidelines recommend professional evaluation at this threshold.',
      },
      {
        q: 'Can I use this to diagnose myself?',
        a: 'No. The PHQ-9 is a screening tool, not a diagnostic instrument. Only a qualified mental health professional can diagnose depression. Your score is a meaningful signal for whether to seek support.',
      },
      {
        q: 'How often should I retake this quiz?',
        a: 'If in treatment, monthly retesting is standard to track progress. For general monitoring, every 4–6 weeks gives meaningful trend data.',
      },
      {
        q: 'What should I do if I scored high?',
        a: 'Contact a doctor or mental health professional. Your score is a signal that your symptoms deserve professional attention. If you have thoughts of self-harm, please contact a crisis line immediately.',
      },
    ],
  },
  seoKeywords: [
    'PHQ-9 test online',
    'depression screening quiz',
    'am I depressed quiz',
    'PHQ-9 score meaning',
    'depression test free',
    'Patient Health Questionnaire 9',
    'depression symptoms checker',
  ],
}
