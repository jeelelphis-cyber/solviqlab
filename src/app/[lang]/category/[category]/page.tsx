import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getAllInstrumentsLocalized, SUPPORTED_LANGS, getInstrumentPath } from '../../../../lib/instruments'
import { getNavCategories } from '../../../../lib/navigation'
import { t } from '../../../../lib/ui-strings'

const CATEGORY_ICONS: Record<string, string> = {
  health: '❤️', finance: '💰', math: '🧮', conversion: '🔄',
}

const CATEGORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  en: {
    health:     'Free health calculators for BMI, BMR, body fat, ideal weight, TDEE, and more. Based on WHO and medical standards.',
    finance:    'Free financial calculators for mortgage, loans, compound interest, VAT, and discounts. Based on CFPB guidelines.',
    math:       'Free math calculators for percentages, fractions, ratios, averages, and scientific notation.',
    conversion: 'Free unit converters for length, weight, temperature, area, and volume. Accurate and instant.',
  },
  uk: {
    health:     'Безкоштовні калькулятори для розрахунку ІМТ, ОМ, відсотка жиру, ідеальної ваги, TDEE та інше. На основі стандартів ВООЗ.',
    finance:    'Безкоштовні фінансові калькулятори: іпотека, кредити, складний відсоток, ПДВ та знижки. На основі стандартів CFPB.',
    math:       'Безкоштовні математичні калькулятори: відсотки, дроби, відношення, середні значення та наукова нотація.',
    conversion: "Безкоштовні конвертери: довжина, вага, температура, площа та об'єм. Точно та миттєво.",
  },
}

const VALID_CATEGORIES = ['health', 'finance', 'math', 'conversion']

interface PageProps {
  params: { lang: string; category: string }
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.flatMap(lang =>
    VALID_CATEGORIES.map(category => ({ lang, category }))
  )
}

export function generateMetadata({ params }: PageProps): Metadata {
  const { lang, category } = params
  const cats = getNavCategories(lang)
  const cat = cats.find(c => c.id === category)
  if (!cat) return { title: 'Not Found' }
  const desc = CATEGORY_DESCRIPTIONS[lang]?.[category] ?? CATEGORY_DESCRIPTIONS['en']![category] ?? ''
  return {
    title: { absolute: `${cat.label} Calculators — Free Online Tools | SolviqLab` },
    description: desc,
    alternates: {
      canonical: `https://solviqlab.com/${lang}/category/${category}`,
      languages: Object.fromEntries(
        ['en','uk','es','pt','fr','de','pl'].map(l => [l, `https://solviqlab.com/${l}/category/${category}`])
      ),
    },
    openGraph: {
      title: `${cat.label} Calculators | SolviqLab`,
      description: desc,
      url: `https://solviqlab.com/${lang}/category/${category}`,
      images: [{ url: `https://solviqlab.com/og/${category}-category`, width: 1200, height: 630 }],
    },
  }
}

export default function CategoryPage({ params }: PageProps) {
  const { lang, category } = params
  if (!VALID_CATEGORIES.includes(category)) notFound()

  const s = t(lang)
  const cats = getNavCategories(lang)
  const cat = cats.find(c => c.id === category)
  if (!cat) notFound()

  const icon = CATEGORY_ICONS[category] ?? '🔢'
  const description = CATEGORY_DESCRIPTIONS[lang]?.[category] ?? CATEGORY_DESCRIPTIONS['en']![category] ?? ''
  const instruments = getAllInstrumentsLocalized(lang).filter(i => i.category === category)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <div className="mb-4">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
        >
          <span className="text-base leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
          {s.breadcrumbHome}
        </Link>
      </div>

      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-8">
        <ol itemScope itemType="https://schema.org/BreadcrumbList" className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
            <Link href={`/${lang}`} itemProp="item" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span itemProp="name">{s.breadcrumbHome}</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li aria-hidden="true">›</li>
          <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
            <span itemProp="name" className="text-slate-700 dark:text-slate-300">{cat.label}</span>
            <meta itemProp="position" content="2" />
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{icon}</span>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{s.categoryPageAll(cat.label)}</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{description}</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{s.categoryPageCount(instruments.length)}</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {instruments.map(inst => (
          <Link
            key={inst.slug}
            href={getInstrumentPath(lang, inst.slug, inst.category)}
            className="group block bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {inst.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {inst.seoDescription}
            </p>
            <span className="inline-block mt-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
              {s.categoryPageCalc}
            </span>
          </Link>
        ))}
      </div>

      {/* Back to all */}
      <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
        <Link href={`/${lang}`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {s.categoryPageBack}
        </Link>
      </div>
    </div>
  )
}
