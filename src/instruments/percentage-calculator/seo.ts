import type { LanguageCode, SEOMetadata, StructuredDataSchema } from '@aifabrica/instrument-sdk'

const BASE_URL = 'https://aifabrica.com'
const SLUG = 'percentage-calculator'

const TITLES: Record<string, string> = {
  en: 'Percentage Calculator — 4 Modes, Free & Instant',
  es: 'Calculadora de Porcentaje — 4 Modos, Gratis e Instantánea',
  pt: 'Calculadora de Porcentagem — 4 Modos, Grátis e Instantânea',
}

const DESCRIPTIONS: Record<string, string> = {
  en: 'Four percentage calculators in one: find % of a number, calculate % change, determine what % X is of Y, or adjust a value by any percentage. Free.',
  es: 'Cuatro calculadoras de porcentaje en una: % de un número, cambio porcentual, qué % es X de Y, o ajusta un valor por cualquier porcentaje. Gratis.',
  pt: 'Quatro calculadoras de porcentagem em uma: % de um número, variação percentual, que % X é de Y, ou ajuste um valor por qualquer porcentagem. Grátis.',
}

export function getSEOMetadata(language: LanguageCode): SEOMetadata {
  return {
    title: TITLES[language] ?? TITLES['en']!,
    description: DESCRIPTIONS[language] ?? DESCRIPTIONS['en']!,
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
  const pageUrl = `${BASE_URL}/${language}/${SLUG}`

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'Percentage Calculator',
      'applicationCategory': 'UtilityApplication',
      'operatingSystem': 'Web',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': getFAQItems(language),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${BASE_URL}/${language}` },
        { '@type': 'ListItem', 'position': 2, 'name': 'Percentage Calculator', 'item': pageUrl },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      'name': 'How to calculate a percentage',
      'step': [
        { '@type': 'HowToStep', 'name': 'Select calculation mode', 'text': 'Choose what type of percentage calculation you need.' },
        { '@type': 'HowToStep', 'name': 'Enter values', 'text': 'Type your numbers into fields A and B.' },
        { '@type': 'HowToStep', 'name': 'Get your result', 'text': 'The result appears instantly as you type.' },
      ],
    },
  ]
}

function getFAQItems(language: LanguageCode): unknown[] {
  const faqs: Record<string, Array<{ q: string; a: string }>> = {
    en: [
      { q: 'What is a percentage?', a: 'A percentage is a ratio expressed as a fraction of 100. For example, 25% means 25 out of every 100.' },
      { q: 'How do I find what percent X is of Y?', a: 'Divide X by Y and multiply by 100. Example: 30 is what % of 120? → (30 ÷ 120) × 100 = 25%.' },
      { q: 'How do I calculate percentage change?', a: 'Use the formula: ((New − Old) ÷ |Old|) × 100. A positive result is an increase; a negative result is a decrease.' },
      { q: 'What is X% of Y?', a: 'Multiply Y by X and divide by 100. Example: What is 15% of 200? → (15 ÷ 100) × 200 = 30.' },
      { q: 'How do I increase a number by a percentage?', a: 'Multiply the number by (1 + percentage ÷ 100). Example: 500 increased by 20% → 500 × 1.20 = 600.' },
      { q: 'How do I decrease a number by a percentage?', a: 'Multiply the number by (1 − percentage ÷ 100). Example: 500 decreased by 20% → 500 × 0.80 = 400.' },
    ],
    es: [
      { q: '¿Qué es un porcentaje?', a: 'Un porcentaje es una razón expresada como fracción de 100. Por ejemplo, 25% significa 25 de cada 100.' },
      { q: '¿Cómo calculo qué porcentaje es X de Y?', a: 'Divide X entre Y y multiplica por 100. Ejemplo: ¿30 es qué % de 120? → (30 ÷ 120) × 100 = 25%.' },
      { q: '¿Cómo calculo el cambio porcentual?', a: 'Usa la fórmula: ((Nuevo − Viejo) ÷ |Viejo|) × 100. Un resultado positivo es un aumento; negativo es una disminución.' },
      { q: '¿Cuánto es X% de Y?', a: 'Multiplica Y por X y divide entre 100. Ejemplo: ¿Cuánto es el 15% de 200? → (15 ÷ 100) × 200 = 30.' },
      { q: '¿Cómo aumento un número en un porcentaje?', a: 'Multiplica el número por (1 + porcentaje ÷ 100). Ejemplo: 500 aumentado en 20% → 500 × 1,20 = 600.' },
      { q: '¿Cómo disminuyo un número en un porcentaje?', a: 'Multiplica el número por (1 − porcentaje ÷ 100). Ejemplo: 500 disminuido en 20% → 500 × 0,80 = 400.' },
    ],
    pt: [
      { q: 'O que é uma porcentagem?', a: 'Uma porcentagem é uma razão expressa como fração de 100. Por exemplo, 25% significa 25 em cada 100.' },
      { q: 'Como calculo que porcentagem X é de Y?', a: 'Divida X por Y e multiplique por 100. Exemplo: 30 é qual % de 120? → (30 ÷ 120) × 100 = 25%.' },
      { q: 'Como calculo variação percentual?', a: 'Use a fórmula: ((Novo − Antigo) ÷ |Antigo|) × 100. Resultado positivo = aumento; negativo = queda.' },
      { q: 'Quanto é X% de Y?', a: 'Multiplique Y por X e divida por 100. Exemplo: Quanto é 15% de 200? → (15 ÷ 100) × 200 = 30.' },
      { q: 'Como aumento um número por uma porcentagem?', a: 'Multiplique o número por (1 + porcentagem ÷ 100). Exemplo: 500 aumentado 20% → 500 × 1,20 = 600.' },
      { q: 'Como reduzo um número por uma porcentagem?', a: 'Multiplique o número por (1 − porcentagem ÷ 100). Exemplo: 500 reduzido 20% → 500 × 0,80 = 400.' },
    ],
  }

  return (faqs[language] ?? faqs['en']!).map(({ q, a }) => ({
    '@type': 'Question',
    'name': q,
    'acceptedAnswer': { '@type': 'Answer', 'text': a },
  }))
}
