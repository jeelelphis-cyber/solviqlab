# BMI Calculator

**Slug:** `bmi-calculator`
**Type:** calculator
**Category:** health
**YMYL:** Yes
**Status:** 🟡 In Development

---

## Formula

**Metric:** `BMI = weight_kg / height_m²`
**Imperial:** `BMI = 703 × weight_lb / height_in²`

> Source: WHO Technical Report Series No. 854, 1995.
> Imperial factor 703: NIH Publication 98-4083.

**Extended outputs:**
- **BMI Prime** = BMI / 25 (ratio to upper normal limit)
- **Ponderal Index** = weight_kg / height_m³
- **Body Fat % (Deurenberg)** = 1.20 × BMI + 0.23 × age − 10.8 × sex_factor − 5.4
  - sex_factor: 1 = male, 0 = female
  - Source: Deurenberg et al., British Journal of Nutrition, 1991.

---

## Categories (WHO)

| Category | BMI Range |
|----------|-----------|
| Severely Underweight | < 16.0 |
| Underweight | 16.0–18.4 |
| Normal Weight | 18.5–24.9 |
| Overweight | 25.0–29.9 |
| Obese Class I | 30.0–34.9 |
| Obese Class II | 35.0–39.9 |
| Obese Class III | ≥ 40.0 |

---

## Inputs

| Field | Type | Required | Range | Unit |
|-------|------|----------|-------|------|
| height_cm | number | Yes | 50–250 | cm |
| weight_kg | number | Yes | 20–300 | kg |
| age | number | No | 18–120 | years |
| sex | enum | No | male/female/other | — |
| unitSystem | enum | No | metric/imperial | — |

## Outputs

| Field | Type | Unit | Notes |
|-------|------|------|-------|
| bmi | number | kg/m² | 1 decimal place |
| category | enum | — | WHO category |
| bmiPrime | number | — | BMI/25 |
| ponderalIndex | number | kg/m³ | 2 decimal places |
| healthyWeightMin_kg | number | kg | BMI = 18.5 |
| healthyWeightMax_kg | number | kg | BMI = 24.9 |
| bodyFatEstimate | number? | % | Deurenberg (requires age + sex) |

---

## How to implement

```bash
# Tests run from repository root
npm run test -- instruments/bmi-calculator

# Certification check
node_modules/.bin/tsx packages/cli/bin/aif.ts certify bmi-calculator
```

---

## Known Limitations

- Does not apply to children or adolescents (use CDC/WHO growth charts)
- Athletes with high muscle mass may be misclassified
- Asian populations may have higher cardiometabolic risk at lower BMI (WHO 2004 expert consultation)
- Deurenberg body fat formula validated for adults 18–65; less accurate at extremes

## Sources

- [WHO Technical Report Series No. 854, 1995](https://www.who.int/publications/i/item/WHO-TRS-854) — BMI formula and categories
- [NIH Publication 98-4083](https://www.nhlbi.nih.gov/files/docs/guidelines/ob_gdlns.pdf) — Imperial BMI factor (703)
- [Deurenberg et al., Br J Nutr, 1991](https://doi.org/10.1017/S0007114500000914) — Body fat estimation from BMI
