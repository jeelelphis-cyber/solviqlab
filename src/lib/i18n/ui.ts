import en from '@/locales/en.json'
import uk from '@/locales/uk.json'
import de from '@/locales/de.json'
import pt from '@/locales/pt.json'
import pl from '@/locales/pl.json'
import nl from '@/locales/nl.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import it from '@/locales/it.json'
import tr from '@/locales/tr.json'

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en, uk, de, pt, pl, nl, es, fr, it, tr,
}

export function getT(lang: string) {
  const dict = TRANSLATIONS[lang] ?? TRANSLATIONS.en!
  return (key: string, params?: Record<string, string | number>): string => {
    const template = (dict[key] ?? TRANSLATIONS.en![key] ?? key) as string
    if (!params) return template
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''))
  }
}
