import type { QuizConfig } from '../types'

export const stressQuiz: QuizConfig = {
  slug:        'stress-quiz',
  cluster:     'mental',
  icon:        '🧠',
  title:       'Stress Level Quiz',
  description: 'Measure where your stress really sits — not just what you think it is, but what your body is telling you.',
  questions: [
    {
      id:          'str1',
      text:        'How often do you feel genuinely overwhelmed by everything on your plate?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Almost never', max: 'Almost every day' },
    },
    {
      id:   'str2',
      text: 'After work or a busy day, can you actually switch off and relax?',
      type: 'yesno',
    },
    {
      id:   'str3',
      text: 'How often do you feel irritable or snappy without a clear reason?',
      type: 'single',
      options: [
        { value: 4, label: 'Rarely — I\'m generally patient' },
        { value: 3, label: 'Sometimes — usually when overloaded' },
        { value: 2, label: 'Often — it creeps up on me' },
        { value: 1, label: 'Almost daily — I notice it' },
      ],
    },
    {
      id:   'str4',
      text: 'Do you experience physical signs of stress — like headaches, jaw tension, or tight shoulders?',
      type: 'yesno',
    },
    {
      id:          'str5',
      text:        'How would you honestly rate your overall stress level this past week?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    10,
      scaleLabels: { min: 'Very calm', max: 'Extremely stressed' },
    },
    {
      id:   'str6',
      text: 'How often do you take time to do something that genuinely recharges you?',
      type: 'single',
      options: [
        { value: 4, label: 'Daily — I protect this time' },
        { value: 3, label: 'A few times a week' },
        { value: 2, label: 'Rarely — I don\'t have time' },
        { value: 1, label: 'Never — I run on empty' },
      ],
    },
  ],
  scoring: {
    max: 27,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Low Stress',
        description: 'You\'re managing life\'s pressures well. Your coping strategies are working, and your body is not in chronic alert mode.',
        miaHook:     'You\'re in a good place with stress — I want to help you build resilience for the harder months ahead.',
      },
      {
        min:         40,
        max:         69,
        label:       'Moderate Stress',
        description: 'You\'re carrying a real load. It\'s manageable right now, but without intervention, chronic stress has a way of compounding.',
        miaHook:     'Your stress is at the level where it starts affecting sleep, weight, and mood — let me show you 3 micro-habits that work.',
      },
      {
        min:         0,
        max:         39,
        label:       'High Stress',
        description: 'Your body is in sustained stress mode. This affects your immune system, weight, sleep, and emotional regulation.',
        miaHook:     'What I see in your results concerns me a little — not to alarm you, but because there\'s a clear path out of this.',
      },
    ],
  },
  seoKeywords: ['stress level quiz', 'am I too stressed', 'stress test quiz', 'chronic stress quiz'],
}
