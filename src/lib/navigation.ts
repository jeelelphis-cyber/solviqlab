// ─── CALCO Navigation Engine v2 — Multilingual ───────────────────────────────
// Single source of truth for ALL navigation.
// Adding a new language: add keys to LABELS below — nothing else to change.
// ─────────────────────────────────────────────────────────────────────────────

export interface NavSubcategory {
  id: string
  label: string
  instruments: string[]
}

export interface NavCategory {
  id: string
  label: string
  icon: string
  color: string
  subcategories: NavSubcategory[]
}

export interface Journey {
  id: string
  label: string
  description: string
  instruments: string[]
}

// ── Translation Labels ────────────────────────────────────────────────────────
const LABELS: Record<string, {
  categories: Record<string, string>
  subcategories: Record<string, string>
  journeys: Record<string, { label: string; description: string }>
}> = {
  en: {
    categories: {
      health: 'Health',
      finance: 'Finance',
      math: 'Math',
      conversion: 'Converters',
    },
    subcategories: {
      'body-weight':    'Body & Weight',
      'metabolism':     'Metabolism & Calories',
      'reproductive':   'Reproductive Health',
      'loans':          'Loans & Mortgage',
      'investments':    'Investments & Savings',
      'taxes-salary':   'Taxes & Salary',
      'taxes-shopping': 'Taxes & Shopping',
      'arithmetic':     'Arithmetic',
      'advanced':       'Advanced',
      'physical':       'Physical',
      'area-volume':    'Area & Volume',
    },
    journeys: {
      'weight-loss':  { label: 'Weight Loss Journey',    description: 'Understand your body, set targets, and track progress.' },
      'fitness':      { label: 'Fitness & Performance',  description: 'Optimize your metabolism and body composition.' },
      'home-buying':  { label: 'Buying a Home',          description: 'Calculate what you can afford before you sign.' },
      'investing':    { label: 'Growing Wealth',         description: 'See how your money compounds over time.' },
    },
  },
  uk: {
    categories: { health: "Здоров'я", finance: 'Фінанси', math: 'Математика', conversion: 'Конвертери' },
    subcategories: {
      'body-weight': 'Тіло та вага', 'metabolism': 'Метаболізм та калорії', 'reproductive': "Репродуктивне здоров'я",
      'loans': 'Кредити та іпотека', 'investments': 'Інвестиції та заощадження',
      'taxes-salary': 'Податки та зарплата', 'taxes-shopping': 'Податки та покупки',
      'arithmetic': 'Арифметика', 'advanced': 'Розширені', 'physical': 'Фізичні величини', 'area-volume': "Площа та об'єм",
    },
    journeys: {
      'weight-loss': { label: 'Схуднення', description: 'Зрозумійте своє тіло, встановіть цілі і відстежуйте прогрес.' },
      'fitness': { label: 'Фітнес та результати', description: 'Оптимізуйте метаболізм і склад тіла.' },
      'home-buying': { label: 'Купівля житла', description: 'Розрахуйте що ви можете дозволити перед підписанням.' },
      'investing': { label: 'Примноження капіталу', description: 'Подивіться як ваші гроші ростуть з часом.' },
    },
  },
  es: {
    categories: { health: 'Salud', finance: 'Finanzas', math: 'Matemáticas', conversion: 'Conversores' },
    subcategories: {
      'body-weight': 'Cuerpo y Peso', 'metabolism': 'Metabolismo y Calorías', 'reproductive': 'Salud Reproductiva',
      'loans': 'Préstamos e Hipoteca', 'investments': 'Inversiones y Ahorros',
      'taxes-salary': 'Impuestos y Salario', 'taxes-shopping': 'Impuestos y Compras',
      'arithmetic': 'Aritmética', 'advanced': 'Avanzado', 'physical': 'Físicas', 'area-volume': 'Área y Volumen',
    },
    journeys: {
      'weight-loss': { label: 'Viaje de Pérdida de Peso', description: 'Entiende tu cuerpo, fija metas y sigue tu progreso.' },
      'fitness': { label: 'Fitness y Rendimiento', description: 'Optimiza tu metabolismo y composición corporal.' },
      'home-buying': { label: 'Comprar una Casa', description: 'Calcula lo que puedes pagar antes de firmar.' },
      'investing': { label: 'Hacer Crecer tu Dinero', description: 'Mira cómo tu dinero crece con el tiempo.' },
    },
  },
  pt: {
    categories: { health: 'Saúde', finance: 'Finanças', math: 'Matemática', conversion: 'Conversores' },
    subcategories: {
      'body-weight': 'Corpo e Peso', 'metabolism': 'Metabolismo e Calorias', 'reproductive': 'Saúde Reprodutiva',
      'loans': 'Empréstimos e Hipoteca', 'investments': 'Investimentos e Poupança',
      'taxes-salary': 'Impostos e Salário', 'taxes-shopping': 'Impostos e Compras',
      'arithmetic': 'Aritmética', 'advanced': 'Avançado', 'physical': 'Físicas', 'area-volume': 'Área e Volume',
    },
    journeys: {
      'weight-loss': { label: 'Jornada de Emagrecimento', description: 'Entenda seu corpo, defina metas e acompanhe o progresso.' },
      'fitness': { label: 'Fitness e Desempenho', description: 'Otimize seu metabolismo e composição corporal.' },
      'home-buying': { label: 'Comprar uma Casa', description: 'Calcule o que você pode pagar antes de assinar.' },
      'investing': { label: 'Fazer Crescer seu Dinheiro', description: 'Veja como seu dinheiro cresce ao longo do tempo.' },
    },
  },
  fr: {
    categories: { health: 'Santé', finance: 'Finance', math: 'Maths', conversion: 'Convertisseurs' },
    subcategories: {
      'body-weight': 'Corps et Poids', 'metabolism': 'Métabolisme et Calories', 'reproductive': 'Santé Reproductive',
      'loans': 'Prêts et Hypothèque', 'investments': 'Investissements et Épargne',
      'taxes-salary': 'Taxes et Salaire', 'taxes-shopping': 'Taxes et Achats',
      'arithmetic': 'Arithmétique', 'advanced': 'Avancé', 'physical': 'Physiques', 'area-volume': 'Aire et Volume',
    },
    journeys: {
      'weight-loss': { label: 'Parcours Perte de Poids', description: 'Comprenez votre corps, fixez des objectifs et suivez vos progrès.' },
      'fitness': { label: 'Fitness et Performance', description: 'Optimisez votre métabolisme et votre composition corporelle.' },
      'home-buying': { label: 'Acheter une Maison', description: 'Calculez ce que vous pouvez vous permettre avant de signer.' },
      'investing': { label: 'Faire Fructifier son Argent', description: 'Voyez comment votre argent se multiplie au fil du temps.' },
    },
  },
  de: {
    categories: { health: 'Gesundheit', finance: 'Finanzen', math: 'Mathematik', conversion: 'Umrechner' },
    subcategories: {
      'body-weight': 'Körper & Gewicht', 'metabolism': 'Stoffwechsel & Kalorien', 'reproductive': 'Reproduktive Gesundheit',
      'loans': 'Kredite & Hypotheken', 'investments': 'Investitionen & Ersparnisse',
      'taxes-salary': 'Steuern & Gehalt', 'taxes-shopping': 'Steuern & Einkaufen',
      'arithmetic': 'Arithmetik', 'advanced': 'Erweitert', 'physical': 'Physikalisch', 'area-volume': 'Fläche & Volumen',
    },
    journeys: {
      'weight-loss': { label: 'Gewichtsabnahme-Reise', description: 'Verstehen Sie Ihren Körper, setzen Sie Ziele und verfolgen Sie Fortschritte.' },
      'fitness': { label: 'Fitness & Leistung', description: 'Optimieren Sie Ihren Stoffwechsel und Ihre Körperzusammensetzung.' },
      'home-buying': { label: 'Ein Haus Kaufen', description: 'Berechnen Sie, was Sie sich leisten können, bevor Sie unterschreiben.' },
      'investing': { label: 'Vermögen Aufbauen', description: 'Sehen Sie, wie Ihr Geld im Laufe der Zeit wächst.' },
    },
  },
  pl: {
    categories: { health: 'Zdrowie', finance: 'Finanse', math: 'Matematyka', conversion: 'Przeliczniki' },
    subcategories: {
      'body-weight': 'Ciało i Waga', 'metabolism': 'Metabolizm i Kalorie', 'reproductive': 'Zdrowie Reprodukcyjne',
      'loans': 'Kredyty i Hipoteka', 'investments': 'Inwestycje i Oszczędności',
      'taxes-salary': 'Podatki i Wynagrodzenie', 'taxes-shopping': 'Podatki i Zakupy',
      'arithmetic': 'Arytmetyka', 'advanced': 'Zaawansowane', 'physical': 'Fizyczne', 'area-volume': 'Powierzchnia i Objętość',
    },
    journeys: {
      'weight-loss': { label: 'Podróż Odchudzania', description: 'Poznaj swoje ciało, wyznacz cele i śledź postępy.' },
      'fitness': { label: 'Fitness i Wydajność', description: 'Zoptymalizuj swój metabolizm i skład ciała.' },
      'home-buying': { label: 'Kupno Domu', description: 'Oblicz, na co Cię stać przed podpisaniem umowy.' },
      'investing': { label: 'Pomnażanie Majątku', description: 'Zobacz, jak Twoje pieniądze rosną w czasie.' },
    },
  },
}

function getLabels(lang: string) {
  return LABELS[lang] ?? LABELS['en']!
}

// ── Raw Category Tree (IDs only) ──────────────────────────────────────────────
const CATEGORY_TREE = [
  {
    id: 'health', icon: '❤️', color: 'text-red-600',
    subcategories: [
      { id: 'body-weight',  instruments: ['bmi-calculator', 'body-fat-calculator', 'ideal-weight-calculator'] },
      { id: 'metabolism',   instruments: ['bmr-calculator', 'tdee-calculator', 'calorie-deficit-calculator', 'sleep-calculator'] },
      { id: 'reproductive', instruments: ['ovulation-calculator'] },
    ],
  },
  {
    id: 'finance', icon: '💰', color: 'text-emerald-600',
    subcategories: [
      { id: 'loans',          instruments: ['mortgage-calculator', 'loan-calculator'] },
      { id: 'investments',    instruments: ['compound-interest-calculator', 'investment-calculator', 'retirement-calculator', 'inflation-calculator'] },
      { id: 'taxes-salary',   instruments: ['tax-calculator', 'salary-calculator'] },
      { id: 'taxes-shopping', instruments: ['vat-calculator', 'discount-calculator'] },
    ],
  },
  {
    id: 'math', icon: '🧮', color: 'text-blue-600',
    subcategories: [
      { id: 'arithmetic', instruments: ['percentage-calculator', 'average-calculator', 'fraction-calculator', 'ratio-calculator'] },
      { id: 'advanced',   instruments: ['scientific-notation-calculator'] },
    ],
  },
  {
    id: 'conversion', icon: '🔄', color: 'text-purple-600',
    subcategories: [
      { id: 'physical',    instruments: ['length-converter', 'weight-converter', 'temperature-converter'] },
      { id: 'area-volume', instruments: ['area-calculator', 'area-converter', 'volume-calculator', 'volume-converter'] },
    ],
  },
]

const JOURNEY_TREE = [
  { id: 'weight-loss', instruments: ['bmi-calculator', 'tdee-calculator', 'calorie-deficit-calculator', 'ideal-weight-calculator', 'body-fat-calculator'] },
  { id: 'fitness',     instruments: ['bmr-calculator', 'tdee-calculator', 'body-fat-calculator', 'bmi-calculator'] },
  { id: 'home-buying', instruments: ['mortgage-calculator', 'loan-calculator', 'compound-interest-calculator'] },
  { id: 'investing',   instruments: ['compound-interest-calculator', 'loan-calculator'] },
]

// ── Public API ────────────────────────────────────────────────────────────────

export function getNavCategories(lang = 'en'): NavCategory[] {
  const l = getLabels(lang)
  return CATEGORY_TREE.map(cat => ({
    id: cat.id,
    icon: cat.icon,
    color: cat.color,
    label: l.categories[cat.id] ?? cat.id,
    subcategories: cat.subcategories.map(sub => ({
      id: sub.id,
      label: l.subcategories[sub.id] ?? sub.id,
      instruments: sub.instruments,
    })),
  }))
}

export function getJourneys(lang = 'en'): Journey[] {
  const l = getLabels(lang)
  return JOURNEY_TREE.map(j => ({
    id: j.id,
    instruments: j.instruments,
    label: l.journeys[j.id]?.label ?? j.id,
    description: l.journeys[j.id]?.description ?? '',
  }))
}

// Backwards-compat: default English export (for components that don't have lang yet)
export const NAV_CATEGORIES: NavCategory[] = getNavCategories('en')
export const JOURNEYS: Journey[] = getJourneys('en')

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getCategoryForSlug(slug: string, lang = 'en'): NavCategory | undefined {
  return getNavCategories(lang).find(cat =>
    cat.subcategories.some(sub => sub.instruments.includes(slug))
  )
}

export function getSubcategoryForSlug(slug: string, lang = 'en'): NavSubcategory | undefined {
  for (const cat of getNavCategories(lang)) {
    const sub = cat.subcategories.find(s => s.instruments.includes(slug))
    if (sub) return sub
  }
  return undefined
}

export function getJourneysForSlug(slug: string, lang = 'en'): Journey[] {
  return getJourneys(lang).filter(j => j.instruments.includes(slug))
}

export function getJourneyNextSteps(slug: string, maxCount = 4, lang = 'en'): string[] {
  const journeys = getJourneysForSlug(slug, lang)
  if (journeys.length === 0) return []
  const journey = journeys[0]!
  const idx = journey.instruments.indexOf(slug)
  const after = journey.instruments.slice(idx + 1)
  const before = journey.instruments.slice(0, idx)
  return [...after, ...before].slice(0, maxCount)
}
