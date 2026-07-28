// ─────────────────────────────────────────────────────────────────────────────
// ResearchLLM — lightweight LLM client for Market Intelligence scripts.
//
// Calls DeepSeek directly (not through the browser API route).
// Used in CLI scripts only. Never imported in browser/Next.js code.
//
// Costs: ~$0.001–0.01 per research call (deepseek-chat model).
// ─────────────────────────────────────────────────────────────────────────────

const DEEPSEEK_API = 'https://api.deepseek.com/v1/chat/completions'
const MODEL        = 'deepseek-v4-flash'

export interface LLMMessage {
  role:    'system' | 'user' | 'assistant'
  content: string
}

export class ResearchLLM {
  constructor(private readonly apiKey: string) {}

  async call(messages: LLMMessage[], opts: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}): Promise<string> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 90_000)

    let res: Response
    try {
      res = await fetch(DEEPSEEK_API, {
        method:  'POST',
        signal:  controller.signal,
        headers: {
          Authorization:  `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model:       MODEL,
          messages,
          temperature: opts.temperature ?? 0.3,
          max_tokens:  opts.maxTokens   ?? 2000,
        }),
      })
    } finally {
      clearTimeout(timer)
    }

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 200)}`)
    }

    const data = await res.json() as { choices: Array<{ message: { content: string } }> }
    return data.choices?.[0]?.message?.content ?? ''
  }

  // Parses JSON from LLM response — handles markdown code blocks
  parseJSON<T>(text: string): T {
    const cleaned = text
      .replace(/^```(?:json)?\n?/m, '')
      .replace(/\n?```$/m, '')
      .trim()
    return JSON.parse(cleaned) as T
  }

  async callJSON<T>(
    messages: LLMMessage[],
    opts?: { temperature?: number; maxTokens?: number; maxRetries?: number },
  ): Promise<T> {
    const maxRetries = opts?.maxRetries ?? 1
    let lastError: Error | null = null
    let currentMessages = messages

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const text = await this.call(currentMessages, opts)
      try {
        return this.parseJSON<T>(text)
      } catch (err) {
        lastError = err as Error
        if (attempt < maxRetries) {
          currentMessages = [
            ...currentMessages,
            { role: 'assistant' as const, content: text },
            { role: 'user'      as const, content: 'Your JSON was incomplete or invalid. Return ONLY the complete valid JSON, nothing else. No truncation.' },
          ]
        }
      }
    }
    throw lastError
  }
}
