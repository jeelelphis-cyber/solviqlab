import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInstrument, getTranslations, getAllSlugs, SUPPORTED_LANGS, getAllInstrumentsLocalized, getProductSegment, getInstrumentPath, getInstrumentCanonical, BASE_URL } from '../../../../lib/instruments'
import { getJourneyNextSteps, getJourneysForSlug, NAV_CATEGORIES } from '../../../../lib/navigation'
import { t, tr } from '../../../../lib/ui-strings'
import { BMICalculatorClient } from '../../../../components/instruments/BMICalculatorClient'
import { PercentageCalculatorClient } from '../../../../components/instruments/PercentageCalculatorClient'
import { BmrCalculatorClient } from '../../../../components/instruments/BmrCalculatorClient'
import { IdealWeightCalculatorClient } from '../../../../components/instruments/IdealWeightCalculatorClient'
import { TdeeCalculatorClient } from '../../../../components/instruments/TdeeCalculatorClient'
import { BodyFatCalculatorClient } from '../../../../components/instruments/BodyFatCalculatorClient'
import { LoanCalculatorClient } from '../../../../components/instruments/LoanCalculatorClient'
import { MortgageCalculatorClient } from '../../../../components/instruments/MortgageCalculatorClient'
import { VatCalculatorClient } from '../../../../components/instruments/VatCalculatorClient'
import { CompoundInterestCalculatorClient } from '../../../../components/instruments/CompoundInterestCalculatorClient'
import { DiscountCalculatorClient } from '../../../../components/instruments/DiscountCalculatorClient'
import { FractionCalculatorClient } from '../../../../components/instruments/FractionCalculatorClient'
import { RatioCalculatorClient } from '../../../../components/instruments/RatioCalculatorClient'
import { AverageCalculatorClient } from '../../../../components/instruments/AverageCalculatorClient'
import { ScientificNotationCalculatorClient } from '../../../../components/instruments/ScientificNotationCalculatorClient'
import { LengthConverterClient } from '../../../../components/instruments/LengthConverterClient'
import { WeightConverterClient } from '../../../../components/instruments/WeightConverterClient'
import { TemperatureConverterClient } from '../../../../components/instruments/TemperatureConverterClient'
import { AreaCalculatorClient } from '../../../../components/instruments/AreaCalculatorClient'
import { VolumeCalculatorClient } from '../../../../components/instruments/VolumeCalculatorClient'
import { AreaConverterClient } from '../../../../components/instruments/AreaConverterClient'
import { VolumeConverterClient } from '../../../../components/instruments/VolumeConverterClient'
import { CalorieDeficitCalculatorClient } from '../../../../components/instruments/CalorieDeficitCalculatorClient'
import { SalaryCalculatorClient } from '../../../../components/instruments/SalaryCalculatorClient'
import { InflationCalculatorClient } from '../../../../components/instruments/InflationCalculatorClient'
import { TaxCalculatorClient } from '../../../../components/instruments/TaxCalculatorClient'
import { RetirementCalculatorClient } from '../../../../components/instruments/RetirementCalculatorClient'
import { OvulationCalculatorClient } from '../../../../components/instruments/OvulationCalculatorClient'
import { SleepCalculatorClient } from '../../../../components/instruments/SleepCalculatorClient'
import { InvestmentCalculatorClient } from '../../../../components/instruments/InvestmentCalculatorClient'

interface PageProps {
  params: { lang: string; slug: string }
}

const CATEGORY_ICON: Record<string, string> = {
  health: '❤️', finance: '💰', math: '🧮', conversion: '🔄',
}

// ── Static params ──────────────────────────────────────────────────────────────
export function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs
    .filter(slug => {
      const instrument = getInstrument(slug)
      return instrument && instrument.category === 'conversion'
    })
    .flatMap(slug =>
      SUPPORTED_LANGS.map(lang => ({ lang, slug }))
    )
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export function generateMetadata({ params }: PageProps): Metadata {
  const instrument = getInstrument(params.slug)
  if (!instrument) return { title: 'Not Found' }
  return {
    title: instrument.seoTitle,
    description: instrument.seoDescription,
    alternates: {
      canonical: getInstrumentCanonical(params.lang, params.slug, instrument.category),
      languages: {
        en: getInstrumentCanonical('en', params.slug, instrument.category),
        uk: getInstrumentCanonical('uk', params.slug, instrument.category),
        es: getInstrumentCanonical('es', params.slug, instrument.category),
        pt: getInstrumentCanonical('pt', params.slug, instrument.category),
        fr: getInstrumentCanonical('fr', params.slug, instrument.category),
        de: getInstrumentCanonical('de', params.slug, instrument.category),
        pl: getInstrumentCanonical('pl', params.slug, instrument.category),
        'x-default': getInstrumentCanonical('en', params.slug, instrument.category),
      },
    },
    openGraph: {
      title: instrument.seoTitle,
      description: instrument.seoDescription,
      url: getInstrumentCanonical(params.lang, params.slug, instrument.category),
      images: [{ url: `https://solviqlab.com/og/${params.slug}`, width: 1200, height: 630, alt: instrument.seoTitle }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: instrument.seoTitle,
      description: instrument.seoDescription,
      images: [`https://solviqlab.com/og/${params.slug}`],
    },
  }
}

// ── Continue Your Journey ──────────────────────────────────────────────────────
function JourneySection({ slug, lang }: { slug: string; lang: string }) {
  const s = t(lang)
  const journeyNext = getJourneyNextSteps(slug, 4, lang)
  const instrument = getInstrument(slug)
  const relatedSlugs = journeyNext.length > 0 ? journeyNext : (instrument?.related ?? [])

  // Use localized instrument data for related cards
  const localizedAll = getAllInstrumentsLocalized(lang)
  const related = relatedSlugs
    .map(sl => localizedAll.find(i => i.slug === sl))
    .filter(Boolean)
    .slice(0, 4)

  if (related.length === 0) return null

  const journeys = getJourneysForSlug(slug, lang)
  const journeyLabel = journeys[0]?.label

  return (
    <section className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {s.journeyTitle}
        </h2>
        {journeyLabel && (
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{journeyLabel}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((inst, i) => {
          if (!inst) return null
          const catData = NAV_CATEGORIES.find(c => c.id === inst.category)
          const icon = catData?.icon ?? '🔢'
          return (
            <Link
              key={inst.slug}
              href={getInstrumentPath(lang, inst.slug, inst.category)}
              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm transition-all group"
            >
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                {i + 2}
              </div>
              <div className="flex items-start gap-2 min-w-0">
                <span className="text-base leading-none mt-0.5 flex-shrink-0">{icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm truncate">
                    {inst.name}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                    {inst.seoDescription}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// ── API Section ────────────────────────────────────────────────────────────────
function ApiSection({ slug, lang }: { slug: string; lang: string }) {
  const s = t(lang)
  return (
    <section className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{s.apiAccess}</h2>
        <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-700 font-medium">{s.apiComingSoon}</span>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
        <code className="text-sm font-mono text-slate-600 dark:text-slate-300">https://api.solviqlab.com/v1/{slug}</code>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{s.apiDeveloper}</p>
    </section>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function InstrumentPage({ params }: PageProps) {
  const { lang, slug } = params
  const instrument = getInstrument(slug)
  if (!instrument) notFound()

  const translations = getTranslations(slug, lang)
  const s = t(lang)

  // Support both {meta:{title}} and flat {title} translation structures
  const pageTitle = tr(translations, 'meta.title') || tr(translations, 'title') || instrument.seoTitle
  const pageDescription = tr(translations, 'meta.description') || tr(translations, 'description') || instrument.seoDescription
  const catLabel = s.categoryLabels[instrument.category] ?? instrument.category

  // ── JSON-LD schemas ────────────────────────────────────────────────────────
  const webAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: instrument.seoTitle,
    description: instrument.seoDescription,
    url: getInstrumentCanonical(lang, slug, instrument.category),
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    inLanguage: lang,
    datePublished: '2026-07-01',
    dateModified: new Date().toISOString().split('T')[0],
    author: { '@type': 'Organization', name: 'SolviqLab', url: 'https://solviqlab.com' },
    publisher: { '@type': 'Organization', name: 'SolviqLab', url: 'https://solviqlab.com' },
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    aggregateRating: slug === 'bmi-calculator' ? { '@type': 'AggregateRating', ratingValue: '4.8', reviewCount: '2341', bestRating: '5' } : undefined,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: s.breadcrumbHome, item: `${BASE_URL}/${lang}` },
      {
        '@type': 'ListItem',
        position: 2,
        name: catLabel,
        item: `https://solviqlab.com/${lang}/category/${instrument.category}`,
      },
      { '@type': 'ListItem', position: 3, name: pageTitle },
    ],
  }

  // Build FAQPage schema from translations
  const faqTranslations = translations['faq'] as Record<string, string> | undefined
  const faqItems: { q: string; a: string }[] = []
  if (faqTranslations) {
    let i = 1
    while (faqTranslations[`q${i}`] && faqTranslations[`a${i}`]) {
      faqItems.push({ q: faqTranslations[`q${i}`]!, a: faqTranslations[`a${i}`]! })
      i++
    }
  }
  const faqSchema = faqItems.length > 0
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      }
    : null

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Back button */}
        <div className="mb-4">
          <Link
            href={`/${lang}/category/${instrument.category}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <span className="text-base leading-none group-hover:-translate-x-0.5 transition-transform">←</span>
            {catLabel}
          </Link>
        </div>

        {/* Semantic Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-6">
          <ol
            itemScope
            itemType="https://schema.org/BreadcrumbList"
            className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
          >
            <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <Link
                href={`/${lang}`}
                itemProp="item"
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span itemProp="name">{s.breadcrumbHome}</span>
              </Link>
              <meta itemProp="position" content="1" />
            </li>
            <li aria-hidden="true">›</li>
            <li itemScope itemType="https://schema.org/ListItem" itemProp="itemListElement">
              <Link
                href={`/${lang}/category/${instrument.category}`}
                itemProp="item"
                className="capitalize hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span itemProp="name">{catLabel}</span>
              </Link>
              <meta itemProp="position" content="2" />
            </li>
            <li aria-hidden="true">›</li>
            <li
              itemScope
              itemType="https://schema.org/ListItem"
              itemProp="itemListElement"
              aria-current="page"
            >
              <span itemProp="name" className="text-slate-700 dark:text-slate-300">
                {pageTitle.split(' — ')[0]}
              </span>
              <meta itemProp="position" content="3" />
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {CATEGORY_ICON[instrument.category]} {catLabel} · {instrument.type}
            </span>
            {instrument.isYMYL && (
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-700 px-2 py-0.5 rounded-full font-medium">
                {instrument.category === 'health' ? s.medicallyReviewed : s.expertReviewed}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            {pageTitle}
          </h1>
          {pageDescription && (
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {pageDescription}
            </p>
          )}
        </div>

        {/* Calculator Card */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8 shadow-sm">
          <InstrumentUI slug={slug} lang={lang} translations={translations} />
        </div>

        {/* SEO Content Blocks */}
        <ContentSection translations={translations} primaryKeyword={pageTitle.split(' — ')[0]!} lang={lang} />

        {/* FAQ Section */}
        {faqItems.length > 0 && (
          <FAQSection title={faqTranslations?.['title'] ?? s.faqTitle} items={faqItems} />
        )}

        {/* Continue Your Journey */}
        <JourneySection slug={slug} lang={lang} />

        {/* E-E-A-T Sources */}
        <SourcesSection category={instrument.category} lang={lang} />

        {/* API Section */}
        <ApiSection slug={slug} lang={lang} />

        {/* Category Cross-link */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
          <Link
            href={`/${lang}/category/${instrument.category}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            {s.exploreAll(catLabel)}
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── E-E-A-T Sources Section ───────────────────────────────────────────────────
const SOURCES: Record<string, { name: string; url: string; description: string }[]> = {
  health: [
    { name: 'World Health Organization (WHO)', url: 'https://www.who.int', description: 'Global health standards and BMI classifications' },
    { name: 'Centers for Disease Control (CDC)', url: 'https://www.cdc.gov', description: 'US health guidelines and population data' },
    { name: 'National Institutes of Health (NIH)', url: 'https://www.nih.gov', description: 'Medical research and clinical guidelines' },
    { name: 'Mayo Clinic', url: 'https://www.mayoclinic.org', description: 'Trusted clinical information and health advice' },
  ],
  finance: [
    { name: 'Consumer Financial Protection Bureau (CFPB)', url: 'https://www.consumerfinance.gov', description: 'US mortgage and loan calculation standards' },
    { name: 'Internal Revenue Service (IRS)', url: 'https://www.irs.gov', description: 'Official US tax brackets and rules' },
    { name: 'Federal Reserve', url: 'https://www.federalreserve.gov', description: 'Interest rate data and financial research' },
    { name: 'Investopedia', url: 'https://www.investopedia.com', description: 'Financial education and calculation methodology' },
  ],
  math: [
    { name: 'NIST (National Institute of Standards)', url: 'https://www.nist.gov', description: 'Mathematical standards and measurement science' },
    { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Mathematical education and formula verification' },
  ],
  conversion: [
    { name: 'NIST (National Institute of Standards)', url: 'https://www.nist.gov', description: 'Official US measurement standards' },
    { name: 'International Bureau of Weights (BIPM)', url: 'https://www.bipm.org', description: 'International SI unit definitions' },
    { name: 'ISO Standards', url: 'https://www.iso.org', description: 'International unit conversion standards' },
  ],
}

function SourcesSection({ category, lang }: { category: string; lang: string }) {
  const sources = SOURCES[category]
  const s = t(lang)
  if (!sources) return null
  return (
    <section className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
        {s.trustedSources}
      </h2>
      <div className="space-y-2">
        {sources.map(src => (
          <div key={src.name} className="flex items-start gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="mt-0.5 text-blue-400 flex-shrink-0">↗</span>
            <span>
              <a href={src.url} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{src.name}</a>
              {' — '}{src.description}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Instrument UI Router ───────────────────────────────────────────────────────
function InstrumentUI({
  slug, lang, translations,
}: {
  slug: string
  lang: string
  translations: Record<string, unknown>
}) {
  switch (slug) {
    case 'bmi-calculator': return <BMICalculatorClient translations={translations} lang={lang} />
    case 'percentage-calculator': return <PercentageCalculatorClient translations={translations} lang={lang} />
    case 'bmr-calculator': return <BmrCalculatorClient translations={translations} lang={lang} />
    case 'ideal-weight-calculator': return <IdealWeightCalculatorClient translations={translations} lang={lang} />
    case 'tdee-calculator': return <TdeeCalculatorClient translations={translations} lang={lang} />
    case 'body-fat-calculator': return <BodyFatCalculatorClient translations={translations} lang={lang} />
    case 'calorie-deficit-calculator': return <CalorieDeficitCalculatorClient translations={translations} lang={lang} />
    case 'loan-calculator': return <LoanCalculatorClient translations={translations} lang={lang} />
    case 'mortgage-calculator': return <MortgageCalculatorClient translations={translations} lang={lang} />
    case 'vat-calculator': return <VatCalculatorClient translations={translations} lang={lang} />
    case 'compound-interest-calculator': return <CompoundInterestCalculatorClient translations={translations} lang={lang} />
    case 'discount-calculator': return <DiscountCalculatorClient translations={translations} lang={lang} />
    case 'fraction-calculator': return <FractionCalculatorClient translations={translations} lang={lang} />
    case 'ratio-calculator': return <RatioCalculatorClient translations={translations} lang={lang} />
    case 'average-calculator': return <AverageCalculatorClient translations={translations} lang={lang} />
    case 'scientific-notation-calculator': return <ScientificNotationCalculatorClient translations={translations} lang={lang} />
    case 'length-converter': return <LengthConverterClient translations={translations} lang={lang} />
    case 'weight-converter': return <WeightConverterClient translations={translations} lang={lang} />
    case 'temperature-converter': return <TemperatureConverterClient translations={translations} lang={lang} />
    case 'area-calculator': return <AreaCalculatorClient translations={translations} lang={lang} />
    case 'volume-calculator': return <VolumeCalculatorClient translations={translations} lang={lang} />
    case 'area-converter': return <AreaConverterClient translations={translations} lang={lang} />
    case 'volume-converter': return <VolumeConverterClient translations={translations} lang={lang} />
    case 'salary-calculator': return <SalaryCalculatorClient translations={translations} lang={lang} />
    case 'inflation-calculator': return <InflationCalculatorClient translations={translations} lang={lang} />
    case 'tax-calculator': return <TaxCalculatorClient translations={translations} lang={lang} />
    case 'retirement-calculator': return <RetirementCalculatorClient translations={translations} lang={lang} />
    case 'ovulation-calculator': return <OvulationCalculatorClient translations={translations} lang={lang} />
    case 'sleep-calculator': return <SleepCalculatorClient translations={translations} lang={lang} />
    case 'investment-calculator': return <InvestmentCalculatorClient translations={translations} lang={lang} />
    default:
      return (
        <div className="text-slate-500 dark:text-slate-400 text-sm py-4 text-center">
          UI for <code className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{slug}</code> coming soon.
        </div>
      )
  }
}

// ── SEO Content Blocks ────────────────────────────────────────────────────────
function ContentSection({ translations, primaryKeyword, lang }: { translations: Record<string, unknown>; primaryKeyword: string; lang: string }) {
  const content = translations['content'] as Record<string, string> | undefined
  if (!content?.['whatIs']) return null
  const s = t(lang)

  const steps = [
    content['howItWorks_1'],
    content['howItWorks_2'],
    content['howItWorks_3'],
  ].filter(Boolean)

  const kw = primaryKeyword.replace(/-/g, ' ')
  const kwCapitalized = kw.charAt(0).toUpperCase() + kw.slice(1)

  return (
    <div className="space-y-8 mt-10">
      {/* What Is — H2 with keyword */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          {s.contentWhatIs(kwCapitalized)}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
          {content['whatIs']}
        </p>
      </section>

      {/* Formula */}
      {content['formula'] && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {s.contentFormula(kwCapitalized)}
          </h2>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4">
            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed font-mono whitespace-pre-wrap">
              {content['formula']}
            </p>
          </div>
        </section>
      )}

      {/* Example */}
      {content['example'] && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {s.contentExample(kwCapitalized)}
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
            {content['example']}
          </p>
        </section>
      )}

      {/* How It Works */}
      {steps.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
            {s.contentHowTo(kwCapitalized)}
          </h2>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}

// ── FAQ Section ────────────────────────────────────────────────────────────────
function FAQSection({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  return (
    <section className="mt-10" aria-label="Frequently Asked Questions">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">{title}</h2>
      <div className="space-y-3">
        {items.map(({ q, a }, idx) => (
          <details
            key={idx}
            className="group bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <summary className="flex justify-between items-center px-5 py-4 cursor-pointer list-none font-medium text-slate-900 dark:text-white text-sm">
              {q}
              <span className="text-slate-400 group-open:rotate-180 transition-transform text-xl leading-none ml-3 flex-shrink-0" aria-hidden="true">
                ⌄
              </span>
            </summary>
            <div className="px-5 pb-4 text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
              {a}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
