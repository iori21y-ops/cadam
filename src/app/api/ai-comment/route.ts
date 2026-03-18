import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rateLimit';
import type { AIConfig } from '@/types/diagnosis';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: NextRequest) {
  // 1) Rate limiting (Upstash Redis)
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2) Parse request
  const { context, config } = (await req.json()) as {
    context: string;
    config: AIConfig;
  };

  if (!context || !config) {
    return NextResponse.json({ error: 'Missing context or config' }, { status: 400 });
  }

  if (!ANTHROPIC_API_KEY) {
    // Fallback if API key not configured
    const fallback = config.fallbacks?.[0] || '사장님, 진단 결과가 나왔네요! 😊';
    return NextResponse.json({ comment: fallback, cached: false });
  }

  // 3) Build prompt
  const prompt = config.promptTemplate
    .replace('{charName}', config.charName)
    .replace('{context}', context);

  // 4) Call Claude API
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const comment = data.content
      ?.map((block: { type: string; text?: string }) =>
        block.type === 'text' ? block.text : ''
      )
      .filter(Boolean)
      .join('') || '';

    return NextResponse.json({ comment, cached: false });
  } catch (error) {
    console.error('AI comment error:', error);
    const fallback =
      config.fallbacks?.[Math.floor(Math.random() * config.fallbacks.length)] ||
      '사장님, 진단 결과가 나왔네요! 😊';
    return NextResponse.json({ comment: fallback, cached: false });
  }
}
