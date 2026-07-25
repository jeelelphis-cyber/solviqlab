import type { QuizConfig } from '../types'

export const hydrationQuiz: QuizConfig = {
  slug:        'hydration-quiz',
  cluster:     'lifestyle',
  icon:        '💧',
  title:       'Hydration Health Quiz',
  description: 'Most people are mildly dehydrated without knowing it. Find out if water is a missing piece of your health puzzle.',
  questions: [
    {
      id:   'hyd1',
      text: 'How many glasses of water (250ml) do you drink on a typical day?',
      type: 'single',
      options: [
        { value: 4, label: '8 or more — I drink consistently' },
        { value: 3, label: '5–7 glasses' },
        { value: 2, label: '3–4 glasses' },
        { value: 1, label: 'Fewer than 3 — I forget to drink' },
      ],
    },
    {
      id:   'hyd2',
      text: 'Do you often feel thirsty during the day?',
      type: 'yesno',
    },
    {
      id:   'hyd3',
      text: 'What color is your urine most of the time? (Be honest!)',
      type: 'single',
      options: [
        { value: 4, label: 'Pale yellow — almost clear' },
        { value: 3, label: 'Light yellow' },
        { value: 2, label: 'Dark yellow or amber' },
        { value: 1, label: 'Very dark — I don\'t notice much' },
      ],
    },
    {
      id:   'hyd4',
      text: 'Do you regularly drink coffee, tea, or alcohol without balancing with water?',
      type: 'yesno',
    },
    {
      id:   'hyd5',
      text: 'Do you experience headaches, dry skin, or difficulty concentrating regularly?',
      type: 'single',
      options: [
        { value: 4, label: 'None of these — I feel fine' },
        { value: 3, label: 'One of these occasionally' },
        { value: 2, label: 'Two of these regularly' },
        { value: 1, label: 'All three — pretty much daily' },
      ],
    },
    {
      id:          'hyd6',
      text:        'How active are you physically? (More activity = higher water needs)',
      type:        'scale',
      scaleMin:    1,
      scaleMax:    5,
      scaleLabels: { min: 'Very sedentary', max: 'Very active daily' },
    },
  ],
  scoring: {
    max: 25,
    buckets: [
      {
        min:         70,
        max:         100,
        label:       'Well Hydrated',
        description: 'Your hydration habits are solid. Your body is getting the water it needs to function at its best.',
        miaHook:     'Your hydration is good — let\'s look at what else might be affecting your energy and performance.',
      },
      {
        min:         40,
        max:         69,
        label:       'Mildly Dehydrated',
        description: 'You\'re not drinking quite enough. Mild dehydration affects your mood, focus, and metabolism more than most people realize.',
        miaHook:     'Mild dehydration is silently affecting your energy and weight management — adding 3 glasses a day can change this fast.',
      },
      {
        min:         0,
        max:         39,
        label:       'Dehydrated',
        description: 'Your water intake is significantly below what your body needs. This is likely affecting your concentration, skin, kidneys, and energy.',
        miaHook:     'Dehydration explains a lot of what you might be blaming on other things — let me show you an easy way to fix this.',
      },
    ],
  },
  seoKeywords: ['hydration quiz', 'am I drinking enough water', 'dehydration test', 'water intake quiz'],
}
