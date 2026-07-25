import type { QuizConfig } from '../types'

export const burnoutQuiz: QuizConfig = {
  slug:        'burnout-quiz',
  cluster:     'mental',
  icon:        '🔥',
  title:       'Burnout Risk Quiz',
  description: 'Burnout doesn\'t happen overnight. Check where you are on the spectrum before it gets harder to come back.',
  questions: [
    {
      id:   'bu1',
      text: 'Do you feel emotionally drained by your work or daily responsibilities — even before the day begins?',
      type: 'single',
      options: [
        { value: 4, label: 'No — I generally feel engaged' },
        { value: 3, label: 'Sometimes — on hard weeks' },
        { value: 2, label: 'Often — most weeks feel heavy' },
        { value: 1, label: 'Almost always — I\'m running on fumes' },
      ],
    },
    {
      id:   'bu2',
      text: 'Have you lost motivation or enthusiasm for things you used to enjoy?',
      type: 'yesno',
    },
    {
      id:   'bu3',
      text: 'How effective do you feel at work or in your main responsibilities lately?',
      type: 'single',
      options: [
        { value: 4, label: 'Highly effective — I\'m doing my best work' },
        { value: 3, label: 'Okay — getting things done' },
        { value: 2, label: 'Below my usual standard — I notice the drop' },
        { value: 1, label: 'Just going through the motions' },
      ],
    },
    {
      id:   'bu4',
      text: 'Do you find yourself becoming more cynical or detached from people around you?',
      type: 'yesno',
    },
    {
      id:          'bu5',
      text:        'How often do you take genuine breaks during the day — not just scrolling, but actual rest?',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Never', max: 'Multiple times a day' },
    },
    {
      id:   'bu6',
      text: 'When you imagine your week ahead, what\'s your first feeling?',
      type: 'single',
      options: [
        { value: 4, label: 'Energized — I have things I\'m looking forward to' },
        { value: 3, label: 'Neutral — just another week' },
        { value: 2, label: 'Dread — it feels like too much' },
        { value: 1, label: 'Dread — I can\'t see any light in it' },
      ],
    },
    {
      id:   'bu7',
      text: 'Do you feel like no matter how much you do, it\'s never enough?',
      type: 'yesno',
    },
  ],
  scoring: {
    max: 28,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Low Burnout Risk',
        description: 'You\'re holding up well. Your energy reserves are intact and you have healthy buffers in place.',
        miaHook:     'You\'re in good shape — now let\'s talk about how to stay this way when pressure builds.',
      },
      {
        min:         40,
        max:         69,
        label:       'Early Warning Signs',
        description: 'You\'re showing some of the early signals of burnout. This is the ideal time to act — before it becomes harder to recover.',
        miaHook:     'I see early burnout patterns in your answers — the good news is this stage is very recoverable with the right shifts.',
      },
      {
        min:         0,
        max:         39,
        label:       'Burnout Zone',
        description: 'Your answers suggest significant burnout. This affects your health, relationships, and productivity — it\'s not weakness, it\'s a real physiological state.',
        miaHook:     'What you\'re experiencing is real and serious — I want to help you map a recovery path that doesn\'t require you to quit everything.',
      },
    ],
  },
  seoKeywords: ['burnout quiz', 'am I burned out', 'burnout risk test', 'work burnout quiz'],
}
