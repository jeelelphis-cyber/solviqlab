import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, #2563eb, #60a5fa, #2563eb)',
          display: 'flex',
        }} />

        {/* Category icons row */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px' }}>
          {[
            { icon: '🩺', label: 'Health', color: '#ef4444' },
            { icon: '$', label: 'Finance', color: '#10b981' },
            { icon: '%', label: 'Math', color: '#3b82f6' },
            { icon: '~', label: 'Convert', color: '#8b5cf6' },
          ].map(cat => (
            <div key={cat.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.06)', borderRadius: '16px',
              padding: '16px 24px', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: cat.color }}>{cat.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: cat.color }}>{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Main headline */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '72px', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
            <span style={{ color: '#60a5fa' }}>Solviq</span>
            <span style={{ color: '#ffffff' }}>Lab</span>
          </div>
          <div style={{ display: 'flex', fontSize: '28px', fontWeight: 500, color: '#94a3b8', marginTop: '12px' }}>
            30+ Free Professional Calculators
          </div>
        </div>

        {/* Tagline */}
        <div style={{
          display: 'flex',
          fontSize: '18px', color: '#64748b', textAlign: 'center',
          maxWidth: '700px', lineHeight: 1.5,
        }}>
          Health · Finance · Math · Conversions — trusted by WHO, CFPB & NIST standards
        </div>

        {/* Bottom bar */}
        <div style={{
          position: 'absolute', bottom: '0', left: '0', right: '0', height: '72px',
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          gap: '40px',
        }}>
          {['No Sign-Up Required', 'Free Forever', '7 Languages'].map(badge => (
            <div key={badge} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '15px', fontWeight: 600, color: '#94a3b8',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', display: 'flex' }} />
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
