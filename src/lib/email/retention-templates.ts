export type RetentionDay = 3 | 7 | 30

interface EmailTemplate {
  subject: string
  html: string
}

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center; }
    .hero img { width: 72px; height: 72px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.3); }
    .hero h1 { margin: 16px 0 0; color: #ffffff; font-size: 22px; font-weight: 700; }
    .body { padding: 32px; }
    .body p { margin: 0 0 16px; color: #475569; font-size: 16px; line-height: 1.6; }
    .cta { display: block; margin: 28px auto 0; width: fit-content; background: #6366f1; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; }
    .footer { padding: 24px 32px; border-top: 1px solid #f1f5f9; text-align: center; }
    .footer p { margin: 0; color: #94a3b8; font-size: 13px; }
    .footer a { color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrap">
    ${content}
    <div class="footer">
      <p>SolviqLab · <a href="https://solviqlab.com/unsubscribe">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`
}

export function getRetentionEmail(day: RetentionDay, name: string | null): EmailTemplate {
  const firstName = name?.split(' ')[0] ?? 'there'

  if (day === 3) {
    return {
      subject: `Mia has something for you, ${firstName}`,
      html: layout(`
        <div class="hero">
          <img src="https://solviqlab.com/coaches/mia.jpg" alt="Mia" />
          <h1>Mia misses you</h1>
        </div>
        <div class="body">
          <p>Hi ${firstName},</p>
          <p>It's been 3 days since you started your journey on SolviqLab. Mia noticed you haven't been back — and she saved your progress.</p>
          <p>Your assessment results are waiting. Pick up right where you left off — it takes less than 2 minutes.</p>
          <a class="cta" href="https://solviqlab.com/en/dashboard">Continue with Mia →</a>
        </div>
      `),
    }
  }

  if (day === 7) {
    return {
      subject: `One week check-in — how are you doing?`,
      html: layout(`
        <div class="hero">
          <img src="https://solviqlab.com/coaches/mia.jpg" alt="Mia" />
          <h1>Week one check-in</h1>
        </div>
        <div class="body">
          <p>Hi ${firstName},</p>
          <p>A week ago you set a goal. Small steps add up — but only when you take them.</p>
          <p>Mia has a quick 3-question check-in ready for you. See how far you've come.</p>
          <a class="cta" href="https://solviqlab.com/en/dashboard">Take the check-in →</a>
        </div>
      `),
    }
  }

  return {
    subject: `Time to refresh your plan, ${firstName}`,
    html: layout(`
      <div class="hero">
        <img src="https://solviqlab.com/coaches/mia.jpg" alt="Mia" />
        <h1>Your 30-day update</h1>
      </div>
      <div class="body">
        <p>Hi ${firstName},</p>
        <p>30 days in — a lot can change. Your goals, your body, your situation.</p>
        <p>Take 2 minutes to update your assessment. Mia will recalibrate your plan based on where you are now, not where you were a month ago.</p>
        <a class="cta" href="https://solviqlab.com/en/assessment">Update my assessment →</a>
      </div>
    `),
  }
}
