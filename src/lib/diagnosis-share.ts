import type { DiagnosisAnswer } from '@/types/diagnosis';

/**
 * 진단 결과를 URL-safe 문자열로 인코딩
 * 형식: mode|qId:value,qId:value,...
 */
export function encodeResult(
  mode: 'basic' | 'detail',
  answers: Record<string, DiagnosisAnswer>
): string {
  const pairs = Object.entries(answers).map(([qId, ans]) => `${qId}:${ans.value}`);
  const raw = `${mode}|${pairs.join(',')}`;
  // base64url 인코딩
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * URL에서 인코딩된 결과 디코딩
 */
export function decodeResult(encoded: string): {
  mode: 'basic' | 'detail';
  answerValues: Record<string, string>;
} | null {
  try {
    // base64url → base64
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const [mode, pairs] = raw.split('|');
    if (mode !== 'basic' && mode !== 'detail') return null;
    if (!pairs) return null;

    const answerValues: Record<string, string> = {};
    for (const pair of pairs.split(',')) {
      const [qId, value] = pair.split(':');
      if (qId && value) answerValues[qId] = value;
    }
    return { mode: mode as 'basic' | 'detail', answerValues };
  } catch {
    return null;
  }
}

/**
 * 현재 URL에 결과 파라미터 추가
 */
export function buildShareUrl(
  basePath: string,
  mode: 'basic' | 'detail',
  answers: Record<string, DiagnosisAnswer>
): string {
  const encoded = encodeResult(mode, answers);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${basePath}?r=${encoded}`;
}

/**
 * 카카오톡 공유
 */
export function shareToKakao(params: {
  title: string;
  description: string;
  imageUrl?: string;
  url: string;
}) {
  const { Kakao } = window as unknown as { Kakao?: KakaoSDK };
  if (!Kakao?.isInitialized?.()) {
    // 카카오 SDK가 없으면 링크 복사 폴백
    navigator.clipboard.writeText(params.url).then(() => {
      alert('카카오톡 SDK가 로드되지 않아 링크를 복사했습니다.');
    });
    return;
  }

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl || '',
      link: { mobileWebUrl: params.url, webUrl: params.url },
    },
    buttons: [
      { title: '결과 보기', link: { mobileWebUrl: params.url, webUrl: params.url } },
      { title: '나도 진단하기', link: { mobileWebUrl: params.url.split('?')[0], webUrl: params.url.split('?')[0] } },
    ],
  });
}

// 카카오 SDK 타입
interface KakaoSDK {
  isInitialized: () => boolean;
  Share: {
    sendDefault: (config: {
      objectType: string;
      content: {
        title: string;
        description: string;
        imageUrl: string;
        link: { mobileWebUrl: string; webUrl: string };
      };
      buttons: {
        title: string;
        link: { mobileWebUrl: string; webUrl: string };
      }[];
    }) => void;
  };
}

/**
 * 클립보드 복사 + 토스트 메시지
 */
export async function copyShareUrl(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 네이티브 공유 API (모바일)
 */
export async function nativeShare(params: {
  title: string;
  text: string;
  url: string;
}): Promise<boolean> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(params);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
