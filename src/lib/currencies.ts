export interface Currency {
  code: string
  symbol: string
  name: string
  symbolPosition: 'before' | 'after'
  decimals: number  // 0 for zero-fraction currencies (JPY, KRW, IDR, VND, etc.)
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$',    name: 'US Dollar',           symbolPosition: 'before', decimals: 2 },
  { code: 'EUR', symbol: '€',    name: 'Euro',                symbolPosition: 'before', decimals: 2 },
  { code: 'GBP', symbol: '£',    name: 'British Pound',       symbolPosition: 'before', decimals: 2 },
  { code: 'UAH', symbol: '₴',    name: 'Ukrainian Hryvnia',   symbolPosition: 'before', decimals: 2 },
  { code: 'JPY', symbol: '¥',    name: 'Japanese Yen',        symbolPosition: 'before', decimals: 0 },
  { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan',        symbolPosition: 'before', decimals: 2 },
  { code: 'INR', symbol: '₹',    name: 'Indian Rupee',        symbolPosition: 'before', decimals: 2 },
  { code: 'CAD', symbol: 'CA$',  name: 'Canadian Dollar',     symbolPosition: 'before', decimals: 2 },
  { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',   symbolPosition: 'before', decimals: 2 },
  { code: 'CHF', symbol: 'Fr',   name: 'Swiss Franc',         symbolPosition: 'before', decimals: 2 },
  { code: 'KRW', symbol: '₩',    name: 'South Korean Won',    symbolPosition: 'before', decimals: 0 },
  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real',      symbolPosition: 'before', decimals: 2 },
  { code: 'MXN', symbol: 'MX$',  name: 'Mexican Peso',        symbolPosition: 'before', decimals: 2 },
  { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar',    symbolPosition: 'before', decimals: 2 },
  { code: 'HKD', symbol: 'HK$',  name: 'Hong Kong Dollar',    symbolPosition: 'before', decimals: 2 },
  { code: 'NOK', symbol: 'kr',   name: 'Norwegian Krone',     symbolPosition: 'after',  decimals: 2 },
  { code: 'SEK', symbol: 'kr',   name: 'Swedish Krona',       symbolPosition: 'after',  decimals: 2 },
  { code: 'DKK', symbol: 'kr',   name: 'Danish Krone',        symbolPosition: 'after',  decimals: 2 },
  { code: 'NZD', symbol: 'NZ$',  name: 'New Zealand Dollar',  symbolPosition: 'before', decimals: 2 },
  { code: 'PLN', symbol: 'zł',   name: 'Polish Zloty',        symbolPosition: 'after',  decimals: 2 },
  { code: 'CZK', symbol: 'Kč',   name: 'Czech Koruna',        symbolPosition: 'after',  decimals: 2 },
  { code: 'HUF', symbol: 'Ft',   name: 'Hungarian Forint',    symbolPosition: 'after',  decimals: 0 },
  { code: 'RON', symbol: 'lei',  name: 'Romanian Leu',        symbolPosition: 'after',  decimals: 2 },
  { code: 'BGN', symbol: 'лв',   name: 'Bulgarian Lev',       symbolPosition: 'after',  decimals: 2 },
  { code: 'RUB', symbol: '₽',    name: 'Russian Ruble',       symbolPosition: 'after',  decimals: 2 },
  { code: 'TRY', symbol: '₺',    name: 'Turkish Lira',        symbolPosition: 'before', decimals: 2 },
  { code: 'AED', symbol: 'د.إ',  name: 'UAE Dirham',          symbolPosition: 'after',  decimals: 2 },
  { code: 'SAR', symbol: '﷼',    name: 'Saudi Riyal',         symbolPosition: 'after',  decimals: 2 },
  { code: 'ILS', symbol: '₪',    name: 'Israeli Shekel',      symbolPosition: 'before', decimals: 2 },
  { code: 'ZAR', symbol: 'R',    name: 'South African Rand',  symbolPosition: 'before', decimals: 2 },
  { code: 'PHP', symbol: '₱',    name: 'Philippine Peso',     symbolPosition: 'before', decimals: 2 },
  { code: 'THB', symbol: '฿',    name: 'Thai Baht',           symbolPosition: 'before', decimals: 2 },
  { code: 'MYR', symbol: 'RM',   name: 'Malaysian Ringgit',   symbolPosition: 'before', decimals: 2 },
  { code: 'IDR', symbol: 'Rp',   name: 'Indonesian Rupiah',   symbolPosition: 'before', decimals: 0 },
  { code: 'VND', symbol: '₫',    name: 'Vietnamese Dong',     symbolPosition: 'after',  decimals: 0 },
  { code: 'PKR', symbol: '₨',    name: 'Pakistani Rupee',     symbolPosition: 'before', decimals: 2 },
  { code: 'BDT', symbol: '৳',    name: 'Bangladeshi Taka',    symbolPosition: 'before', decimals: 2 },
  { code: 'EGP', symbol: 'E£',   name: 'Egyptian Pound',      symbolPosition: 'before', decimals: 2 },
  { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',      symbolPosition: 'before', decimals: 2 },
  { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',     symbolPosition: 'before', decimals: 2 },
  { code: 'ARS', symbol: 'AR$',  name: 'Argentine Peso',      symbolPosition: 'before', decimals: 2 },
  { code: 'CLP', symbol: 'CL$',  name: 'Chilean Peso',        symbolPosition: 'before', decimals: 0 },
  { code: 'COP', symbol: 'CO$',  name: 'Colombian Peso',      symbolPosition: 'before', decimals: 0 },
  { code: 'PEN', symbol: 'S/',   name: 'Peruvian Sol',        symbolPosition: 'before', decimals: 2 },
  { code: 'KZT', symbol: '₸',    name: 'Kazakhstani Tenge',   symbolPosition: 'after',  decimals: 2 },
  { code: 'UZS', symbol: 'лв',   name: 'Uzbekistani Som',     symbolPosition: 'after',  decimals: 0 },
  { code: 'GEL', symbol: '₾',    name: 'Georgian Lari',       symbolPosition: 'after',  decimals: 2 },
  { code: 'AMD', symbol: '֏',    name: 'Armenian Dram',       symbolPosition: 'after',  decimals: 0 },
  { code: 'DZD', symbol: 'دج',   name: 'Algerian Dinar',      symbolPosition: 'after',  decimals: 2 },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham',     symbolPosition: 'after',  decimals: 2 },
]

const LANG_CURRENCY: Record<string, string> = {
  en: 'USD', uk: 'UAH', es: 'EUR', pt: 'BRL',
  fr: 'EUR', de: 'EUR', pl: 'PLN', ru: 'RUB',
  tr: 'TRY', ar: 'AED', he: 'ILS', ko: 'KRW',
  ja: 'JPY', zh: 'CNY', hi: 'INR', id: 'IDR',
  vi: 'VND', th: 'THB', ms: 'MYR', bn: 'BDT',
  sv: 'SEK', no: 'NOK', da: 'DKK', fi: 'EUR',
  cs: 'CZK', hu: 'HUF', ro: 'RON', bg: 'BGN',
  ka: 'GEL', hy: 'AMD', kk: 'KZT',
}

export function getCurrencyForLang(lang: string): Currency {
  const code = LANG_CURRENCY[lang] ?? 'USD'
  return CURRENCIES.find(c => c.code === code) ?? CURRENCIES[0]!
}

// Maps language code to BCP-47 locale for number formatting
const LANG_LOCALE: Record<string, string> = {
  en: 'en-US', uk: 'uk-UA', es: 'es-ES', pt: 'pt-BR',
  fr: 'fr-FR', de: 'de-DE', pl: 'pl-PL', ru: 'ru-RU',
  tr: 'tr-TR', ar: 'ar-SA', he: 'he-IL', ko: 'ko-KR',
  ja: 'ja-JP', zh: 'zh-CN', hi: 'hi-IN', id: 'id-ID',
  vi: 'vi-VN', th: 'th-TH', ms: 'ms-MY', bn: 'bn-BD',
  sv: 'sv-SE', no: 'nb-NO', da: 'da-DK', fi: 'fi-FI',
  cs: 'cs-CZ', hu: 'hu-HU', ro: 'ro-RO', bg: 'bg-BG',
  ka: 'ka-GE', hy: 'hy-AM', kk: 'kk-KZ',
}

/**
 * Format a monetary amount with correct symbol position, decimal places,
 * and locale-appropriate thousands separators.
 *
 * Examples:
 *   formatAmount(1234567, JPY, 'ja') → '¥1,234,567'
 *   formatAmount(1234.5, EUR, 'de')  → '1.234,50 €'
 *   formatAmount(15000000, IDR, 'id') → 'Rp15.000.000'
 *   formatAmount(1234.56, USD, 'en') → '$1,234.56'
 */
export function formatAmount(amount: number, currency: Currency, lang = 'en'): string {
  const locale = LANG_LOCALE[lang] ?? 'en-US'
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount)

  return currency.symbolPosition === 'before'
    ? `${currency.symbol}${formatted}`
    : `${formatted} ${currency.symbol}`
}
