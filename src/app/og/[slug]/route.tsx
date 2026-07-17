import { ImageResponse } from 'next/og'

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  health:     { icon: '❤️', color: '#ef4444', bg: '#fef2f2' },
  finance:    { icon: '💰', color: '#10b981', bg: '#f0fdf4' },
  math:       { icon: '🧮', color: '#3b82f6', bg: '#eff6ff' },
  conversion: { icon: '🔄', color: '#8b5cf6', bg: '#f5f3ff' },
}

const SLUG_META: Record<string, { title: string; category: string }> = {
  'bmi-calculator': { title: 'BMI Calculator — Body Mass Index, Category & Health Tips', category: 'health' },
  'bmr-calculator': { title: 'BMR Calculator — Basal Metabolic Rate & Daily Calories', category: 'health' },
  'body-fat-calculator': { title: 'Body Fat Calculator — Body Fat % via Navy & BMI Methods', category: 'health' },
  'ideal-weight-calculator': { title: 'Ideal Weight Calculator — Find Your Healthy Weight Range', category: 'health' },
  'tdee-calculator': { title: 'TDEE Calculator — Total Daily Energy & Calories by Activity', category: 'health' },
  'calorie-deficit-calculator': { title: 'Calorie Deficit Calculator — Daily Calories to Lose Weight', category: 'health' },
  'ovulation-calculator': { title: 'Ovulation Calculator — Fertile Window & Ovulation Date', category: 'health' },
  'sleep-calculator': { title: 'Sleep Calculator — Best Bedtime & Wake-Up Time Finder', category: 'health' },
  'mortgage-calculator': { title: 'Mortgage Calculator — Monthly Payment & Amortization', category: 'finance' },
  'loan-calculator': { title: 'Loan Calculator — Monthly Payment & Total Interest', category: 'finance' },
  'compound-interest-calculator': { title: 'Compound Interest Calculator — Investment Growth & Returns', category: 'finance' },
  'investment-calculator': { title: 'Investment Calculator — ROI, Growth & Future Value', category: 'finance' },
  'retirement-calculator': { title: 'Retirement Calculator — Savings Projection & Monthly Income', category: 'finance' },
  'inflation-calculator': { title: 'Inflation Calculator — Purchasing Power & CPI Adjustment', category: 'finance' },
  'tax-calculator': { title: 'Tax Calculator — US Federal & Effective Income Tax Rate', category: 'finance' },
  'salary-calculator': { title: 'Salary Calculator — Hourly to Annual Salary Converter', category: 'finance' },
  'vat-calculator': { title: 'VAT Calculator — Add or Remove VAT from Any Price Fast', category: 'finance' },
  'discount-calculator': { title: 'Discount Calculator — Sale Price, Savings & % Off Amount', category: 'finance' },
  'percentage-calculator': { title: 'Percentage Calculator — % Of, Change, Increase & Decrease', category: 'math' },
  'fraction-calculator': { title: 'Fraction Calculator — Add, Subtract, Multiply, Divide', category: 'math' },
  'ratio-calculator': { title: 'Ratio Calculator — Simplify, Scale & Solve Proportions', category: 'math' },
  'average-calculator': { title: 'Average Calculator — Mean, Median, Mode, Range & More', category: 'math' },
  'scientific-notation-calculator': { title: 'Scientific Notation Calculator — Convert & Calculate', category: 'math' },
  'length-converter': { title: 'Length Converter — Meters, Feet, Inches, Miles & More', category: 'conversion' },
  'weight-converter': { title: 'Weight Converter — kg, lbs, oz, Stones, Grams & More', category: 'conversion' },
  'temperature-converter': { title: 'Temperature Converter — Celsius, Fahrenheit, Kelvin', category: 'conversion' },
  'area-calculator': { title: 'Area Calculator — Rectangle, Circle, Triangle & More', category: 'conversion' },
  'area-converter': { title: 'Area Converter — Convert m², ft², acres, hectares & more', category: 'conversion' },
  'volume-calculator': { title: 'Volume Calculator — Cube, Sphere, Cylinder & Cone Fast', category: 'conversion' },
  'volume-converter': { title: 'Volume Converter — Liters, Gallons, ml, Cups & more', category: 'conversion' },
  // Wave 2 — Priority A
  'calorie-calculator': { title: 'Calorie Calculator — Daily Calorie Needs for Weight Loss & Gain', category: 'health' },
  'savings-calculator': { title: 'Savings Calculator — How Much Will I Save? Growth & Interest', category: 'finance' },
  'tip-calculator': { title: 'Tip Calculator — How Much to Tip? Split Bill & Tip Per Person', category: 'finance' },
  'pregnancy-calculator': { title: 'Pregnancy Calculator — Due Date, Weeks Pregnant & Trimester', category: 'health' },
  'due-date-calculator': { title: 'Due Date Calculator — Calculate Your Baby\'s Due Date', category: 'health' },
  'currency-converter': { title: 'Currency Converter — Convert USD, EUR, GBP & 50+ Currencies', category: 'conversion' },
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const meta = SLUG_META[params.slug]
  const title = meta?.title ?? params.slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const category = meta?.category ?? 'math'
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG['math']!

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* subtle overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(255,255,255,0.02)',
        }} />

        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)',
        }} />

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: '48px', left: '64px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: cfg.bg, borderRadius: '100px',
          padding: '8px 20px', border: `1.5px solid ${cfg.color}22`,
        }}>
          <span style={{ fontSize: '20px' }}>{cfg.icon}</span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {category}
          </span>
        </div>

        {/* Main title */}
        <div style={{
          position: 'absolute', top: '140px', left: '64px', right: '64px',
          display: 'flex', flexDirection: 'column', gap: '0px',
        }}>
          {/* Split title at em dash */}
          {title.includes(' — ') ? (
            <>
              <div style={{ fontSize: '62px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {title.split(' — ')[0]}
              </div>
              <div style={{ fontSize: '36px', fontWeight: 500, color: '#60a5fa', lineHeight: 1.3, marginTop: '8px' }}>
                {title.split(' — ')[1]}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '58px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {title}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: '0', left: '0', right: '0', height: '100px',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 64px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: 900, color: 'white',
            }}>S</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>
                <span style={{ color: '#60a5fa' }}>Solviq</span>Lab
              </span>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Free Professional Calculators</span>
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {['WHO', 'CFPB', 'NIST'].map(badge => (
              <div key={badge} style={{
                padding: '6px 14px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '13px', fontWeight: 700, color: '#cbd5e1',
              }}>{badge}</div>
            ))}
            <div style={{
              padding: '6px 14px', borderRadius: '8px',
              background: '#2563eb22', border: '1px solid #2563eb44',
              fontSize: '13px', fontWeight: 700, color: '#60a5fa',
            }}>FREE</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
