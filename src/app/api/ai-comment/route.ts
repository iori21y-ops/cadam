import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimiter } from '@/lib/rateLimit';
import type { AIConfig } from '@/types/diagnosis';

const REPORT_SYSTEM_PROMPT = `당신은 AI 자동차 전문가입니다.
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

💡 **전문가 tip**
"[실질적이고 구체적인 조언 1~2문장]"

규칙:
- 존댓말로 정중하게, "고객님" 호칭 사용
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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (!process.env.ANTHROPIC_API_KEY) {
    const fallback = config.fallbacks?.[0] || '고객님, 진단 결과가 나왔습니다! 😊';
    return NextResponse.json({ comment: fallback, cached: false });
  }

  // 3) Build prompt
  const isReport = mode === 'report';
  const prompt = isReport
    ? `고객 진단 결과:\n${context}\n\n위 결과를 바탕으로 맞춤 분석 리포트를 작성해주세요.`
    : config.promptTemplate
        .replace('{charName}', config.charName)
        .replace('{context}', context);

  // 4) Call Claude API via SDK
  try {
    const message = await anthropic.messages.create({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: isReport ? 800 : 300,
      system: isReport ? REPORT_SYSTEM_PROMPT : undefined,
      messages: [{ role: 'user', content: prompt }],
    });

    const comment = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('') || '';

    return NextResponse.json({ comment, cached: false });
  } catch (error) {
    console.error('AI comment error:', error);
    const fallback =
      config.fallbacks?.[Math.floor(Math.random() * config.fallbacks.length)] ||
      '고객님, 진단 결과가 나왔습니다! 😊';
    return NextResponse.json({ comment: fallback, cached: false });
  }
}
