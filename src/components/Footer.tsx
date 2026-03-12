import Link from 'next/link';

const PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '02-0000-0000';
const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';

export function Footer() {
  const telHref = `tel:${PHONE.replace(/-/g, '')}`;

  return (
    <footer className="bg-gray-100 py-8 px-5 text-center">
      <p className="text-sm text-gray-600 mb-2">
        운영시간: 평일 09:00 ~ 18:00 (주말/공휴일 휴무)
      </p>
      <p className="text-sm text-gray-600 mb-2">
        연락처:{' '}
        <a
          href={telHref}
          className="text-accent font-semibold hover:underline"
        >
          {PHONE}
        </a>
      </p>
      <p className="text-sm text-gray-600 mb-2">
        카카오톡:{' '}
        <a
          href={KAKAO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent font-semibold hover:underline"
        >
          채널 링크
        </a>
      </p>
      <p className="text-sm text-gray-500 mb-2">
        <Link href="/privacy" className="text-accent hover:underline">
          개인정보 처리방침
        </Link>
      </p>
      <p className="text-xs text-gray-400 mb-2">
        (사업자 등록 후 기입)
      </p>
      <p className="text-xs text-gray-400">© 카담(CADAM)</p>
    </footer>
  );
}
