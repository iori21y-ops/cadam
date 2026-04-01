import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rateLimit';
import type { AIConfig } from '@/types/diagnosis';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const REPORT_SYSTEM_PROMPT = `당신은 '박대표'라는 자동차 금융 전문가입니다.
고객의 진단 결과를 바탕으로 맞춤형 분석 리포트를 작성합니다.

반드시 아래 형식을 따르세요:
━━━━━━━━━━━━━━━━━━━━
📋 고객님 맞춤 분석 리포트
━━━━━━━━━━━━━━━━━━━━
✅ **1순위 추천: [상품명]** (적합도 [N]%)
→ [추천 이유 1~2줄, 고객 답변 기반 구체적 근거]
→ [예상 월 비용이나 혜택 등 구체적 수치가 있으면 언급]

⚡ **2순위 대안: [상품명]** (적합도 [N]%)
→ [이 상품이 대안인 이유]
→ [1순위와의 핵심 차이점]

💡 **박대표 tip**
"[실질적이고 구체적인 조언 1~2문장. 반말 사장님 호칭]"

규칙:
- 반말로 친근하게, "사장님" 호칭 사용
- 구체적 수치와 근거를 포함 (ex: 월 XX만원, 연 XX만원 절세)
- 이모지 적절히 사용
- 500자 이내
- 마크다운 **볼드** 사용 가능`;

export async function POST(req: NextRequest) {
  // 1) Rate limiting (Upstash Redis)
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const { success } = await rateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // 2) Parse request
  const { context, config, mode } = (await req.json()) as {
    context: string;
    config: AIConfig;
    mode?: 'short' | 'report';
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
  const isReport = mode === 'report';
  const prompt = isReport
    ? `고객 진단 결과:\n${context}\n\n위 결과를 바탕으로 맞춤 분석 리포트를 작성해주세요.`
    : config.promptTemplate
        .replace('{charName}', config.charName)
        .replace('{context}', context);

  // 4) Call Claude API
  try {
    const messages: { role: string; content: string }[] = [
      { role: 'user', content: prompt },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-sonnet-4-20250514',
        max_tokens: isReport ? 800 : 300,
        system: isReport ? REPORT_SYSTEM_PROMPT : undefined,
        messages,
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
