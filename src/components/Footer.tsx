'use client';

import Link from 'next/link';

const PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '02-0000-0000';
const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';

export function Footer() {
  const telHref = `tel:${PHONE.replace(/-/g, '')}`;

  return (
    <footer className="border-t border-border py-8 px-5 text-center">
      <p className="text-[13px] text-text-muted mb-2">
        운영시간: 평일 09:00 ~ 18:00 (주말/공휴일 휴무)
      </p>
      <p className="text-[13px] text-text-muted mb-2">
        연락처:{' '}
        <a
          href={telHref}
          className="text-primary font-semibold hover:underline"
        >
          {PHONE}
        </a>
      </p>
      <p className="text-[13px] text-text-muted mb-2">
        카카오톡:{' '}
        <a
          href={KAKAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-semibold hover:underline"
        >
          채널 링크
        </a>
      </p>
      <p className="text-[13px] text-text-muted mb-2">
        <Link href="/privacy" className="text-primary hover:underline">
          개인정보 처리방침
        </Link>
      </p>
      <p className="text-[13px] text-text-muted">© 카담(CADAM)</p>
    </footer>
  );
}
