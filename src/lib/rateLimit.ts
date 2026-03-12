import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 동일 IP에서 60초 내 3회까지 허용
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 s'),
  analytics: true,
});

// API Route에서 사용 예시:
// const { success } = await rateLimiter.limit(ip);
// if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
