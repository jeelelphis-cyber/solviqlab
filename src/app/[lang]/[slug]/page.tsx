import { permanentRedirect } from 'next/navigation'
import { getInstrument, getProductSegment, getAllSlugs, SUPPORTED_LANGS } from '../../../lib/instruments'

export function generateStaticParams() {
  const slugs = getAllSlugs()
  return slugs.flatMap(slug =>
    SUPPORTED_LANGS.map(lang => ({ lang, slug }))
  )
}

export default function OldSlugRedirect({ params }: { params: { lang: string; slug: string } }) {
  const instrument = getInstrument(params.slug)
  if (!instrument) permanentRedirect(`/${params.lang}`)
  const product = getProductSegment(instrument.category)
  permanentRedirect(`/${params.lang}/${product}/${params.slug}`)
}
