import { ImageResponse } from 'next/og'
import { getInstrument } from '../../../lib/instruments'

export const runtime = 'edge'

const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  health:     { icon: '❤️', color: '#ef4444', bg: '#fef2f2' },
  finance:    { icon: '💰', color: '#10b981', bg: '#f0fdf4' },
  math:       { icon: '🧮', color: '#3b82f6', bg: '#eff6ff' },
  conversion: { icon: '🔄', color: '#8b5cf6', bg: '#f5f3ff' },
}

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const instrument = getInstrument(params.slug)
  const title = instrument?.seoTitle ?? params.slug.replace(/-/g, ' ')
  const category = instrument?.category ?? 'math'
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
        {/* Background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px',
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
