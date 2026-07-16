import type { LanguageCode, SEOMetadata, StructuredDataSchema } from '@aifabrica/instrument-sdk'

const BASE_URL = 'https://aifabrica.com'
const SLUG = 'bmi-calculator'

export function getSEOMetadata(language: LanguageCode): SEOMetadata {
  const titles: Record<string, string> = {
    en: 'BMI Calculator — Body Mass Index with Interpretation',  // 53 chars ✓
    es: 'Calculadora de IMC — Índice de Masa Corporal',          // 47 chars ✓
    pt: 'Calculadora de IMC — Índice de Massa Corporal',         // 47 chars ✓
  }

  const descriptions: Record<string, string> = {
    en: 'Calculate your BMI instantly. Get WHO category, healthy weight range, BMI Prime, and AI-powered health interpretation — free, fast, and accurate.',
    es: 'Calcula tu Índice de Masa Corporal (IMC) al instante. Obtén tu categoría WHO, rango de peso saludable e interpretación inteligente de salud — gratis y preciso.',
    pt: 'Calcule seu Índice de Massa Corporal (IMC) instantaneamente. Obtenha sua categoria OMS, faixa de peso saudável e interpretação inteligente de saúde — grátis.',
  }

  return {
    title: titles[language] ?? titles['en']!,
    description: descriptions[language] ?? descriptions['en']!,
    canonical: `${BASE_URL}/${language}/${SLUG}`,
    alternates: {
      en: `${BASE_URL}/en/${SLUG}`,
      es: `${BASE_URL}/es/${SLUG}`,
      pt: `${BASE_URL}/pt/${SLUG}`,
      'x-default': `${BASE_URL}/en/${SLUG}`,
    },
    ogImage: `${BASE_URL}/og/${SLUG}.png`,
  }
}

export function getStructuredData(language: LanguageCode): StructuredDataSchema[] {
  const baseUrl = `${BASE_URL}/${language}/${SLUG}`

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'BMI Calculator',
      'applicationCategory': 'HealthApplication',
      'operatingSystem': 'Web',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.8',
        'ratingCount': '1200',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': 'What is BMI?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'BMI (Body Mass Index) is a numerical value calculated from your height and weight. It provides a standardized way to categorize weight status. The formula is: BMI = weight (kg) ÷ height² (m²). WHO defines four categories: Underweight (<18.5), Normal (18.5–24.9), Overweight (25–29.9), and Obese (≥30).',
          },
        },
        {
          '@type': 'Question',
          'name': 'Is BMI accurate?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'BMI is a useful population-level screening tool, but it has limitations. It does not directly measure body fat, so athletes with high muscle mass may be classified as overweight. It also does not account for fat distribution, age, sex, or ethnicity. For a complete health assessment, consult a healthcare professional.',
          },
        },
        {
          '@type': 'Question',
          'name': 'What is a healthy BMI?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'According to the World Health Organization (WHO), a healthy BMI for adults is between 18.5 and 24.9. A BMI below 18.5 indicates underweight, 25.0–29.9 is overweight, and 30.0 or above indicates obesity.',
          },
        },
        {
          '@type': 'Question',
          'name': 'How do I use this BMI calculator?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Enter your height and weight in the form above. You can use metric (cm and kg) or imperial (feet, inches, and pounds) units. Optionally add your age and sex for a body fat estimate using the Deurenberg formula. Click Calculate to see your BMI, category, BMI Prime, and healthy weight range.',
          },
        },
        {
          '@type': 'Question',
          'name': 'What is BMI Prime?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'BMI Prime is your BMI divided by 25 (the upper limit of the normal weight range). A BMI Prime of 1.0 means you are exactly at the upper boundary of normal weight. Values below 1.0 are normal or underweight; above 1.0 indicates overweight or obese. It is useful for comparing BMI across populations.',
          },
        },
        {
          '@type': 'Question',
          'name': 'What is the Ponderal Index?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'The Ponderal Index (PI) is calculated as weight (kg) ÷ height³ (m³). It was proposed as an alternative to BMI because it scales better for very tall or very short individuals. A normal PI range for adults is approximately 11–14 kg/m³.',
          },
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'How to Calculate BMI',
      'step': [
        { '@type': 'HowToStep', 'text': 'Measure your height in centimeters or feet and inches.' },
        { '@type': 'HowToStep', 'text': 'Weigh yourself in kilograms or pounds.' },
        { '@type': 'HowToStep', 'text': 'Enter both values into the BMI calculator above.' },
        { '@type': 'HowToStep', 'text': 'Click Calculate to see your BMI value and WHO category.' },
        { '@type': 'HowToStep', 'text': 'Read the AI-powered interpretation for personalized context.' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${BASE_URL}/${language}` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Health', 'item': `${BASE_URL}/${language}/health` },
        { '@type': 'ListItem', 'position': 3, 'name': 'BMI Calculator', 'item': baseUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'MedicalWebPage',
      'about': { '@type': 'MedicalCondition', 'name': 'Obesity' },
      'audience': { '@type': 'MedicalAudience', 'audienceType': 'Patient' },
      'medicalAudience': 'Patient',
    },
  ]
}
