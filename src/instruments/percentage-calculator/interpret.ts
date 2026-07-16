import type { PercentageCalculatorOutput } from './types.js'
import { getPercentageBucket } from './types.js'

type LanguageCode = 'en' | 'es' | 'pt'
interface InterpretationMatrix {
  primary?: string
  nextStep?: string
  disclaimer?: string
}

type Bucket = 'tiny' | 'small' | 'medium' | 'large' | 'massive'

const PERCENT_OF_MATRIX: Record<Bucket, Record<LanguageCode, InterpretationMatrix>> = {
  tiny:    { en: { primary: 'A very small fraction — less than 1% of the total.' }, es: { primary: 'Una fracción muy pequeña, menos del 1% del total.' }, pt: { primary: 'Uma fração muito pequena — menos de 1% do total.' } },
  small:   { en: { primary: 'A small portion of the whole.' }, es: { primary: 'Una pequeña parte del total.' }, pt: { primary: 'Uma pequena parcela do total.' } },
  medium:  { en: { primary: 'A moderate share of the total amount.' }, es: { primary: 'Una parte moderada del total.' }, pt: { primary: 'Uma parcela moderada do total.' } },
  large:   { en: { primary: 'More than half of the total.' }, es: { primary: 'Más de la mitad del total.' }, pt: { primary: 'Mais da metade do total.' } },
  massive: { en: { primary: 'Over 100% — the result exceeds the base value.' }, es: { primary: 'Más del 100% del valor base.' }, pt: { primary: 'Mais de 100% do valor base.' } },
}

const CHANGE_MATRIX: Record<'increase' | 'decrease', Record<Bucket, Record<LanguageCode, InterpretationMatrix>>> = {
  increase: {
    tiny:    { en: { primary: 'A negligible increase of less than 1%.' }, es: { primary: 'Un aumento insignificante de menos del 1%.' }, pt: { primary: 'Um aumento insignificante de menos de 1%.' } },
    small:   { en: { primary: 'A small increase.' }, es: { primary: 'Un pequeño aumento.' }, pt: { primary: 'Um pequeno aumento.' } },
    medium:  { en: { primary: 'A significant increase worth noting.' }, es: { primary: 'Un aumento significativo.' }, pt: { primary: 'Um aumento significativo.' } },
    large:   { en: { primary: 'A substantial increase — more than 50%.' }, es: { primary: 'Un gran aumento, más del 50%.' }, pt: { primary: 'Um aumento substancial — mais de 50%.' } },
    massive: { en: { primary: 'An extraordinary increase — more than doubled.' }, es: { primary: 'Un aumento extraordinario — más del doble.' }, pt: { primary: 'Um aumento extraordinário — mais do dobro.' } },
  },
  decrease: {
    tiny:    { en: { primary: 'A negligible decrease of less than 1%.' }, es: { primary: 'Una disminución insignificante de menos del 1%.' }, pt: { primary: 'Uma queda insignificante de menos de 1%.' } },
    small:   { en: { primary: 'A small decrease.' }, es: { primary: 'Una pequeña disminución.' }, pt: { primary: 'Una pequeña disminución.' } },
    medium:  { en: { primary: 'A notable decrease worth attention.' }, es: { primary: 'Una disminución notable.' }, pt: { primary: 'Uma queda notável.' } },
    large:   { en: { primary: 'A large drop — more than 50%.' }, es: { primary: 'Una gran caída, más del 50%.' }, pt: { primary: 'Uma grande queda — mais de 50%.' } },
    massive: { en: { primary: 'An extreme drop — more than 100% decrease is not possible; value went negative.' }, es: { primary: 'Una caída extrema.' }, pt: { primary: 'Uma queda extrema.' } },
  },
}

export function getInterpretation(
  output: PercentageCalculatorOutput,
  language: LanguageCode,
): InterpretationMatrix {
  const lang = (['en', 'es', 'pt'].includes(language) ? language : 'en') as LanguageCode
  const bucket = getPercentageBucket(output.roundedResult)

  if (output.mode === 'percent-change') {
    const dir = output.isIncrease !== false ? 'increase' : 'decrease'
    return CHANGE_MATRIX[dir][bucket][lang] ?? CHANGE_MATRIX[dir][bucket].en!
  }

  const matrix = PERCENT_OF_MATRIX[bucket]
  return matrix[lang] ?? matrix.en!
}
