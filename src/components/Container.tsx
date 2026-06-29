import type { ReactNode } from 'react';

/**
 * 공통 콘텐츠 컨테이너
 * - 자식을 가운데 정렬 + 좌우 패딩 + 최대폭 896px(max-w-4xl) 고정
 * - 배경 div는 감싸지 않음 (배경 풀폭 유지 = A안). 콘텐츠 폭 래퍼로만 사용.
 */
export function Container({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section';
}) {
  const base = 'mx-auto w-full max-w-4xl px-4';
  return <Tag className={className ? `${base} ${className}` : base}>{children}</Tag>;
}
