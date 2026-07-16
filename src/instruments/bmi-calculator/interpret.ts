import type { BMIOutput, BMICategory } from './types.js'

type LanguageCode = 'en' | 'es' | 'pt' | 'uk'
interface InterpretationMatrix {
  primary?: string
  nextStep?: string
  disclaimer?: string
}

const MATRIX: Record<BMICategory, Record<string, InterpretationMatrix>> = {
  underweight_severe: {
    en: {
      primary: 'Your BMI indicates severe underweight. This may signal significant nutritional deficiency.',
      nextStep: 'Consult a healthcare provider promptly. A registered dietitian can help develop a safe weight gain plan.',
      disclaimer: 'BMI is a screening tool, not a diagnostic measure. Individual factors vary.',
    },
    es: {
      primary: 'Su IMC indica bajo peso severo. Esto puede señalar una deficiencia nutricional significativa.',
      nextStep: 'Consulte a un profesional de salud de inmediato.',
      disclaimer: 'El IMC es una herramienta de evaluación, no un diagnóstico.',
    },
    pt: {
      primary: 'Seu IMC indica baixo peso severo. Isso pode sinalizar deficiência nutricional significativa.',
      nextStep: 'Consulte um profissional de saúde imediatamente.',
      disclaimer: 'O IMC é uma ferramenta de triagem, não um diagnóstico.',
    },
    uk: {
      primary: 'Ваш ІМТ вказує на різко виражену недостатню вагу. Це може свідчити про значний дефіцит харчування.',
      nextStep: 'Якнайшвидше зверніться до лікаря. Дієтолог допоможе скласти безпечний план набору ваги.',
      disclaimer: 'ІМТ — інструмент скринінгу, а не діагностична міра. Індивідуальні фактори можуть відрізнятися.',
    },
  },
  underweight: {
    en: {
      primary: 'Your BMI is below the healthy range. Being underweight can affect energy levels and immunity.',
      nextStep: 'Consider speaking with a healthcare provider or nutritionist about healthy ways to reach a normal weight.',
      disclaimer: 'BMI does not account for muscle mass, bone density, or body composition.',
    },
    es: {
      primary: 'Su IMC está por debajo del rango saludable.',
      nextStep: 'Considere consultar a un nutricionista sobre formas saludables de alcanzar un peso normal.',
      disclaimer: 'El IMC no considera la masa muscular ni la composición corporal.',
    },
    pt: {
      primary: 'Seu IMC está abaixo da faixa saudável.',
      nextStep: 'Considere consultar um nutricionista sobre formas saudáveis de atingir um peso normal.',
      disclaimer: 'O IMC não considera massa muscular nem composição corporal.',
    },
    uk: {
      primary: 'Ваш ІМТ нижче норми. Недостатня вага може впливати на рівень енергії та імунітет.',
      nextStep: 'Зверніться до лікаря або дієтолога щодо здорових способів досягнення нормальної ваги.',
      disclaimer: 'ІМТ не враховує м\'язову масу, щільність кісток або склад тіла.',
    },
  },
  normal: {
    en: {
      primary: 'Your BMI is within the healthy range. This is associated with lower risk of weight-related health conditions.',
      nextStep: 'Maintain your healthy weight through balanced nutrition and regular physical activity.',
    },
    es: {
      primary: 'Su IMC está dentro del rango saludable.',
      nextStep: 'Mantenga su peso saludable con nutrición equilibrada y actividad física regular.',
    },
    pt: {
      primary: 'Seu IMC está dentro da faixa saudável.',
      nextStep: 'Mantenha seu peso saudável com nutrição equilibrada e atividade física regular.',
    },
    uk: {
      primary: 'Ваш ІМТ в межах норми. Це пов\'язано з нижчим ризиком захворювань, пов\'язаних із вагою.',
      nextStep: 'Підтримуйте здорову вагу завдяки збалансованому харчуванню та регулярній фізичній активності.',
    },
  },
  overweight: {
    en: {
      primary: 'Your BMI is above the healthy range. Even modest weight reduction can improve metabolic health markers.',
      nextStep: 'Focus on sustainable lifestyle changes: whole foods, regular movement, and adequate sleep.',
      disclaimer: 'Athletes with high muscle mass may have elevated BMI without excess body fat.',
    },
    es: {
      primary: 'Su IMC está por encima del rango saludable.',
      nextStep: 'Enfóquese en cambios sostenibles: alimentación saludable y actividad regular.',
      disclaimer: 'Los atletas con alta masa muscular pueden tener IMC elevado sin exceso de grasa.',
    },
    pt: {
      primary: 'Seu IMC está acima da faixa saudável.',
      nextStep: 'Foque em mudanças sustentáveis: alimentação saudável e atividade regular.',
      disclaimer: 'Atletas com alta massa muscular podem ter IMC elevado sem excesso de gordura.',
    },
    uk: {
      primary: 'Ваш ІМТ вище норми. Навіть помірне зниження ваги може покращити показники метаболічного здоров\'я.',
      nextStep: 'Зосередьтеся на сталих змінах способу життя: цільні продукти, регулярна активність і достатній сон.',
      disclaimer: 'Спортсмени з великою м\'язовою масою можуть мати підвищений ІМТ без надлишку жиру.',
    },
  },
  obese_1: {
    en: {
      primary: 'Your BMI indicates Class I obesity. This is associated with increased risk of type 2 diabetes, heart disease, and joint problems.',
      nextStep: 'Work with a healthcare team to create a structured weight management plan.',
      disclaimer: 'BMI is one of several risk factors. A complete health assessment requires additional measurements.',
    },
    es: {
      primary: 'Su IMC indica obesidad Clase I.',
      nextStep: 'Trabaje con un equipo de salud para crear un plan estructurado de manejo del peso.',
      disclaimer: 'El IMC es uno de varios factores de riesgo.',
    },
    pt: {
      primary: 'Seu IMC indica obesidade Classe I.',
      nextStep: 'Trabalhe com uma equipe de saúde para criar um plano estruturado de controle de peso.',
      disclaimer: 'O IMC é um dos vários fatores de risco.',
    },
    uk: {
      primary: 'Ваш ІМТ вказує на ожиріння I ступеня. Це пов\'язано з підвищеним ризиком цукрового діабету 2 типу, серцевих захворювань та проблем із суглобами.',
      nextStep: 'Співпрацюйте з командою лікарів для розробки структурованого плану управління вагою.',
      disclaimer: 'ІМТ — один із кількох факторів ризику. Повна оцінка здоров\'я потребує додаткових вимірювань.',
    },
  },
  obese_2: {
    en: {
      primary: 'Your BMI indicates Class II obesity. Health risks are substantially elevated. Medical supervision is recommended.',
      nextStep: 'Consult with a physician who specializes in weight management. Medical interventions may be appropriate.',
      disclaimer: 'This is a screening tool. A qualified medical professional should evaluate your full health profile.',
    },
    es: {
      primary: 'Su IMC indica obesidad Clase II. Se recomienda supervisión médica.',
      nextStep: 'Consulte a un médico especializado en manejo del peso.',
      disclaimer: 'Esta es una herramienta de evaluación. Un médico debe evaluar su perfil completo de salud.',
    },
    pt: {
      primary: 'Seu IMC indica obesidade Classe II. Supervisão médica é recomendada.',
      nextStep: 'Consulte um médico especializado em controle de peso.',
      disclaimer: 'Esta é uma ferramenta de triagem. Um médico deve avaliar seu perfil completo de saúde.',
    },
    uk: {
      primary: 'Ваш ІМТ вказує на ожиріння II ступеня. Ризики для здоров\'я суттєво підвищені. Рекомендується медичний нагляд.',
      nextStep: 'Зверніться до лікаря, який спеціалізується на управлінні вагою.',
      disclaimer: 'Це інструмент скринінгу. Кваліфікований медичний спеціаліст має оцінити ваш повний профіль здоров\'я.',
    },
  },
  obese_3: {
    en: {
      primary: 'Your BMI indicates Class III (severe) obesity. This category carries the highest risk of serious health complications.',
      nextStep: 'Please work closely with a medical team. Structured programs and medical interventions exist that are safe and effective.',
      disclaimer: 'This calculator is a screening tool only. It does not constitute medical advice. Please consult a qualified healthcare provider.',
    },
    es: {
      primary: 'Su IMC indica obesidad Clase III (severa).',
      nextStep: 'Por favor trabaje con un equipo médico. Existen programas estructurados seguros y efectivos.',
      disclaimer: 'Esta calculadora es solo una herramienta de evaluación. No constituye consejo médico.',
    },
    pt: {
      primary: 'Seu IMC indica obesidade Classe III (severa).',
      nextStep: 'Por favor trabalhe com uma equipe médica. Existem programas estruturados seguros e eficazes.',
      disclaimer: 'Esta calculadora é apenas uma ferramenta de triagem. Não constitui conselho médico.',
    },
    uk: {
      primary: 'Ваш ІМТ вказує на ожиріння III ступеня (важке). Ця категорія несе найвищий ризик серйозних ускладнень для здоров\'я.',
      nextStep: 'Будь ласка, тісно співпрацюйте з медичною командою. Існують безпечні та ефективні структуровані програми та медичні втручання.',
      disclaimer: 'Цей калькулятор — лише інструмент скринінгу. Він не є медичною порадою. Будь ласка, зверніться до кваліфікованого лікаря.',
    },
  },
}

export function getInterpretation(output: BMIOutput, language: LanguageCode): InterpretationMatrix {
  const matrix = MATRIX[output.category]
  return matrix[language] ?? matrix['en']!
}
