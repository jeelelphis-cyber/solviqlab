#!/usr/bin/env node
// Adds all missing per-instrument translation keys

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const INST = p => path.join(ROOT, 'src/instruments', p)

function patch(file, keys) {
  if (!fs.existsSync(file)) { console.log(`⚠️  SKIP (no file): ${file}`); return }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  let changed = false
  for (const [k, v] of Object.entries(keys)) {
    if (!(k in data)) { data[k] = v; changed = true }
  }
  if (changed) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
    console.log(`✅ patched: ${file.replace(ROOT + '/', '')}`)
  } else {
    console.log(`— already ok: ${file.replace(ROOT + '/', '')}`)
  }
}

// ── 1. average-calculator — placeholder_numbers (same in all langs, it's numeric)
const avgFix = { placeholder_numbers: 'e.g. 4, 8, 15, 16, 23, 42' }
for (const lang of ['uk','es','pt','fr','de','pl','tr','it','nl']) {
  patch(INST(`average-calculator/translations/${lang}.json`), avgFix)
}

// ── 2. calorie-calculator — section_weight_loss, section_weight_gain
const calorieFix = {
  uk: { section_weight_loss: 'Схуднення', section_weight_gain: 'Набір ваги' },
  es: { section_weight_loss: 'Pérdida de peso', section_weight_gain: 'Aumento de peso' },
  pt: { section_weight_loss: 'Perda de peso', section_weight_gain: 'Ganho de peso' },
  fr: { section_weight_loss: 'Perte de poids', section_weight_gain: 'Prise de poids' },
  de: { section_weight_loss: 'Gewichtsverlust', section_weight_gain: 'Gewichtszunahme' },
  pl: { section_weight_loss: 'Utrata wagi', section_weight_gain: 'Przyrost masy' },
  tr: { section_weight_loss: 'Kilo kaybı', section_weight_gain: 'Kilo alımı' },
  it: { section_weight_loss: 'Perdita di peso', section_weight_gain: 'Aumento di peso' },
  nl: { section_weight_loss: 'Gewichtsverlies', section_weight_gain: 'Gewichtstoename' },
}
for (const [lang, keys] of Object.entries(calorieFix)) {
  patch(INST(`calorie-calculator/translations/${lang}.json`), keys)
}

// ── 3. length-converter / weight-converter — label_from, label_to, label_result
const converterLabels = {
  uk: { label_from: 'З', label_to: 'До', label_result: 'Результат' },
  es: { label_from: 'De', label_to: 'A', label_result: 'Resultado' },
  pt: { label_from: 'De', label_to: 'Para', label_result: 'Resultado' },
  fr: { label_from: 'De', label_to: 'En', label_result: 'Résultat' },
  de: { label_from: 'Von', label_to: 'Nach', label_result: 'Ergebnis' },
  pl: { label_from: 'Z', label_to: 'Do', label_result: 'Wynik' },
  tr: { label_from: 'Kaynak', label_to: 'Hedef', label_result: 'Sonuç' },
  it: { label_from: 'Da', label_to: 'A', label_result: 'Risultato' },
  nl: { label_from: 'Van', label_to: 'Naar', label_result: 'Resultaat' },
}
for (const [lang, keys] of Object.entries(converterLabels)) {
  patch(INST(`length-converter/translations/${lang}.json`), keys)
  patch(INST(`weight-converter/translations/${lang}.json`), keys)
}

// ── 4. temperature-converter — labels + unit names
const tempFix = {
  uk: { label_from: 'З', label_to: 'До', label_result: 'Результат', unit_celsius: 'Цельсій', unit_fahrenheit: 'Фаренгейт', unit_kelvin: 'Кельвін' },
  es: { label_from: 'De', label_to: 'A', label_result: 'Resultado', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  pt: { label_from: 'De', label_to: 'Para', label_result: 'Resultado', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  fr: { label_from: 'De', label_to: 'En', label_result: 'Résultat', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  de: { label_from: 'Von', label_to: 'Nach', label_result: 'Ergebnis', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  pl: { label_from: 'Z', label_to: 'Do', label_result: 'Wynik', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  tr: { label_from: 'Kaynak', label_to: 'Hedef', label_result: 'Sonuç', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  it: { label_from: 'Da', label_to: 'A', label_result: 'Risultato', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
  nl: { label_from: 'Van', label_to: 'Naar', label_result: 'Resultaat', unit_celsius: 'Celsius', unit_fahrenheit: 'Fahrenheit', unit_kelvin: 'Kelvin' },
}
for (const [lang, keys] of Object.entries(tempFix)) {
  patch(INST(`temperature-converter/translations/${lang}.json`), keys)
}

// ── 5. volume-calculator — shape labels and dimension labels
const volumeFix = {
  uk: {
    label_length: 'Довжина', label_width: 'Ширина', label_height: 'Висота', label_radius: 'Радіус',
    shape_cube: 'Куб', shape_rectangular_prism: 'Паралелепіпед', shape_sphere: 'Куля',
    shape_cylinder: 'Циліндр', shape_cone: 'Конус', shape_pyramid: 'Піраміда',
  },
  es: {
    label_length: 'Longitud', label_width: 'Ancho', label_height: 'Altura', label_radius: 'Radio',
    shape_cube: 'Cubo', shape_rectangular_prism: 'Prisma rectangular', shape_sphere: 'Esfera',
    shape_cylinder: 'Cilindro', shape_cone: 'Cono', shape_pyramid: 'Pirámide',
  },
  pt: {
    label_length: 'Comprimento', label_width: 'Largura', label_height: 'Altura', label_radius: 'Raio',
    shape_cube: 'Cubo', shape_rectangular_prism: 'Prisma retangular', shape_sphere: 'Esfera',
    shape_cylinder: 'Cilindro', shape_cone: 'Cone', shape_pyramid: 'Pirâmide',
  },
  fr: {
    label_length: 'Longueur', label_width: 'Largeur', label_height: 'Hauteur', label_radius: 'Rayon',
    shape_cube: 'Cube', shape_rectangular_prism: 'Prisme rectangulaire', shape_sphere: 'Sphère',
    shape_cylinder: 'Cylindre', shape_cone: 'Cône', shape_pyramid: 'Pyramide',
  },
  de: {
    label_length: 'Länge', label_width: 'Breite', label_height: 'Höhe', label_radius: 'Radius',
    shape_cube: 'Würfel', shape_rectangular_prism: 'Quader', shape_sphere: 'Kugel',
    shape_cylinder: 'Zylinder', shape_cone: 'Kegel', shape_pyramid: 'Pyramide',
  },
  pl: {
    label_length: 'Długość', label_width: 'Szerokość', label_height: 'Wysokość', label_radius: 'Promień',
    shape_cube: 'Sześcian', shape_rectangular_prism: 'Graniastosłup prostokątny', shape_sphere: 'Sfera',
    shape_cylinder: 'Walec', shape_cone: 'Stożek', shape_pyramid: 'Piramida',
  },
  tr: {
    label_length: 'Uzunluk', label_width: 'Genişlik', label_height: 'Yükseklik', label_radius: 'Yarıçap',
    shape_cube: 'Küp', shape_rectangular_prism: 'Dikdörtgenler prizması', shape_sphere: 'Küre',
    shape_cylinder: 'Silindir', shape_cone: 'Koni', shape_pyramid: 'Piramit',
  },
  it: {
    label_length: 'Lunghezza', label_width: 'Larghezza', label_height: 'Altezza', label_radius: 'Raggio',
    shape_cube: 'Cubo', shape_rectangular_prism: 'Prisma rettangolare', shape_sphere: 'Sfera',
    shape_cylinder: 'Cilindro', shape_cone: 'Cono', shape_pyramid: 'Piramide',
  },
  nl: {
    label_length: 'Lengte', label_width: 'Breedte', label_height: 'Hoogte', label_radius: 'Straal',
    shape_cube: 'Kubus', shape_rectangular_prism: 'Rechthoekige prisma', shape_sphere: 'Bol',
    shape_cylinder: 'Cilinder', shape_cone: 'Kegel', shape_pyramid: 'Piramide',
  },
}
for (const [lang, keys] of Object.entries(volumeFix)) {
  patch(INST(`volume-calculator/translations/${lang}.json`), keys)
}

console.log('\nDone.')
