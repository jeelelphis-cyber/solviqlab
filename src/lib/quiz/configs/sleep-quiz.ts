import type { QuizConfig } from '../types'

// Epworth Sleepiness Scale (ESS)
// Developed by Dr. Murray Johns, Epworth Hospital, Melbourne, 1991
// Johns MW. A new method for measuring daytime sleepiness. Sleep. 1991 (PMID: 1798888)
// Global standard — used by sleep labs, NHS, Mayo Clinic, APA

const ESS_OPTIONS = [
  { value: 0, label: 'Would never doze' },
  { value: 1, label: 'Slight chance of dozing' },
  { value: 2, label: 'Moderate chance of dozing' },
  { value: 3, label: 'High chance of dozing' },
]

export const sleepQuiz: QuizConfig = {
  slug:          'sleep-quiz',
  cluster:       'sleep',
  icon:          '🌙',
  title:         'Sleep Quality Quiz (Epworth Sleepiness Scale)',
  description:   'The Epworth Sleepiness Scale is the global clinical standard for measuring excessive daytime sleepiness. Used by sleep specialists worldwide to detect sleep disorders.',
  clinicalScale: 'Epworth Sleepiness Scale',
  medicalNote:   'A high score may indicate a sleep disorder such as sleep apnea or narcolepsy. Please consult a healthcare provider if concerned.',
  sources: [
    { label: 'Johns MW. A new method for measuring daytime sleepiness: the Epworth Sleepiness Scale. Sleep. 1991', url: 'https://pubmed.ncbi.nlm.nih.gov/1798888/' },
    { label: 'American Academy of Sleep Medicine — Clinical Guidelines' },
    { label: 'NHS Sleep Disorders Diagnostic Criteria' },
  ],
  questions: [
    {
      id:      'ess1',
      text:    'Sitting and reading',
      hint:    'Falling asleep while reading is one of the earliest signs of chronic sleep deprivation.',
      source:  'ESS Item 1',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess2',
      text:    'Watching TV',
      hint:    'Even passive activities like TV should not cause sleepiness if you are getting adequate, quality sleep.',
      source:  'ESS Item 2',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess3',
      text:    'Sitting inactive in a public place (e.g., a theater or meeting)',
      hint:    'Struggling to stay awake in quiet public settings is a key diagnostic marker for excessive sleepiness.',
      source:  'ESS Item 3',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess4',
      text:    'As a passenger in a car for an hour without a break',
      hint:    'The steady motion of a car ride is a standard drowsiness trigger. High scores here indicate serious sleep debt.',
      source:  'ESS Item 4',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess5',
      text:    'Lying down to rest in the afternoon when circumstances permit',
      hint:    'The ability to fall asleep quickly during afternoon rest reflects your true sleep pressure level.',
      source:  'ESS Item 5',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess6',
      text:    'Sitting and talking to someone',
      hint:    'Falling asleep during a conversation is a clinically significant sign of excessive daytime sleepiness.',
      source:  'ESS Item 6',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess7',
      text:    'Sitting quietly after a lunch without alcohol',
      hint:    'Post-lunch dips are normal, but high dozing likelihood here without alcohol indicates a sleep disorder.',
      source:  'ESS Item 7',
      type:    'likert',
      options: ESS_OPTIONS,
    },
    {
      id:      'ess8',
      text:    'In a car, while stopped for a few minutes in traffic',
      hint:    'Drowsiness while driving or stopped in traffic is a direct safety risk and key clinical indicator.',
      source:  'ESS Item 8',
      type:    'likert',
      options: ESS_OPTIONS,
    },
  ],
  scoring: {
    max:       24,
    normalize: false,
    buckets: [
      {
        min:         0,
        max:         7,
        label:       'Normal Sleep',
        severity:    'none',
        description: 'Your daytime sleepiness is within the normal range. Your sleep appears to be adequately restoring you.',
        actions: [
          'Maintain your current sleep schedule — consistency is the most powerful sleep protector',
          'Keep your bedroom below 18°C (65°F) — the optimal temperature for deep sleep',
          'Limit caffeine after 2 PM to protect sleep architecture',
        ],
        miaHook: 'Your sleep foundation is solid. I want to show you how to make it even more restorative — there is still a level above where you are now.',
      },
      {
        min:         8,
        max:         9,
        label:       'Mild Excessive Sleepiness',
        severity:    'mild',
        description: 'Slightly elevated daytime sleepiness. May indicate mild sleep deprivation or early-stage sleep issues.',
        actions: [
          'Add 30 minutes to your sleep window for the next 2 weeks and track energy levels',
          'Audit your bedroom for light and noise — both fragment sleep without waking you fully',
          'Avoid screens for 45 minutes before bed this week',
        ],
        miaHook: 'Your score is borderline — which means small changes make a big difference right now. I can show you exactly where your sleep is leaking.',
      },
      {
        min:         10,
        max:         15,
        label:       'Moderate Excessive Sleepiness',
        severity:    'moderate',
        description: 'Moderate excessive daytime sleepiness. This level is linked to impaired driving, reduced productivity, and metabolic issues.',
        actions: [
          'See a doctor about a potential sleep disorder — at this score, sleep apnea screening is appropriate',
          'Stop all alcohol 3 hours before bed — it fragments sleep architecture even if it helps you fall asleep',
          'Set a non-negotiable bedtime for the next 30 days and protect it',
        ],
        miaHook: 'At this level, your sleep is affecting everything — your weight, your mood, your focus. I have a protocol that targets this specifically.',
      },
      {
        min:         16,
        max:         24,
        label:       'Severe Excessive Sleepiness',
        severity:    'severe',
        description: 'Severe daytime sleepiness. This significantly increases accident risk and is associated with serious sleep disorders. Medical evaluation is strongly recommended.',
        actions: [
          'Schedule a sleep study (polysomnography) with your doctor — this score warrants investigation',
          'Do not drive if feeling drowsy — your reflexes are impaired at this sleepiness level',
          'Avoid operating heavy machinery until evaluated by a specialist',
        ],
        miaHook: 'I want to be direct: a score this high needs medical attention, not just a sleep routine. Let me help you figure out the right first step.',
      },
    ],
  },
  seoContent: {
    intro: `The Epworth Sleepiness Scale (ESS) was developed by Dr. Murray Johns at Epworth Hospital in Melbourne, Australia in 1991. It has since become the global clinical standard for measuring excessive daytime sleepiness (EDS), used in sleep laboratories, hospitals, and research institutions worldwide.\n\nUnlike sleep diaries or subjective feeling assessments, the ESS measures your likelihood of dozing in 8 specific situations — providing an objective picture of how sleep-deprived you truly are. Scores range from 0 to 24. A score above 10 indicates excessive sleepiness that warrants clinical evaluation.\n\nSleep disorders affect 50–70 million people in the US alone (CDC, 2023). Untreated excessive daytime sleepiness increases the risk of road accidents by 2.5×, contributes to weight gain, depression, cardiovascular disease, and significantly reduces quality of life. Taking this quiz is the first step toward understanding your sleep health.`,
    faq: [
      {
        q: 'What is the Epworth Sleepiness Scale?',
        a: 'The ESS is a validated 8-item questionnaire that measures daytime sleepiness by asking how likely you are to doze off in common situations. It is the global standard used by sleep specialists and was published in the journal Sleep in 1991.',
      },
      {
        q: 'What is a normal Epworth score?',
        a: 'A score of 0–7 is considered normal. Scores of 8–9 suggest mild excessive sleepiness; 10–15 moderate; and 16–24 severe. The majority of healthy adults score between 4 and 8.',
      },
      {
        q: 'What causes excessive daytime sleepiness?',
        a: 'The most common causes include insufficient sleep duration, obstructive sleep apnea, narcolepsy, restless leg syndrome, poor sleep quality, medications, and depression.',
      },
      {
        q: 'Should I see a doctor if I scored above 10?',
        a: 'Yes. A score of 10 or above warrants clinical evaluation. Your doctor may order a polysomnography (sleep study) to rule out sleep apnea or other disorders.',
      },
      {
        q: 'Can poor sleep quality cause weight gain?',
        a: 'Yes. Sleep deprivation dysregulates ghrelin and leptin — the hunger hormones — increasing appetite and cravings for high-calorie foods. Studies show that sleeping fewer than 6 hours per night increases obesity risk by 23%.',
      },
    ],
  },
  seoKeywords: [
    'Epworth Sleepiness Scale',
    'sleep quality quiz',
    'excessive daytime sleepiness test',
    'sleep apnea quiz',
    'am I sleep deprived',
    'sleep disorder test online',
    'ESS score meaning',
  ],
}
