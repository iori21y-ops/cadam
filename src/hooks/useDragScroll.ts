import { useRef, useCallback, useEffect } from 'react';

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 브라우저에 스크롤 최적화 힌트 + passive touchstart로 터치 시작점 기록
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.willChange = 'scroll-position';

    const onTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].pageX - el.offsetLeft;
      scrollLeft.current = el.scrollLeft;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.style.willChange = '';
    };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDown.current = true;
    startX.current = e.pageX - (ref.current?.offsetLeft ?? 0);
    scrollLeft.current = ref.current?.scrollLeft ?? 0;
    if (ref.current) ref.current.style.cursor = 'grabbing';
  }, []);

  const onMouseLeave = useCallback(() => {
    isDown.current = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  }, []);

  const onMouseUp = useCallback(() => {
    isDown.current = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - (ref.current?.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.5;
    if (ref.current) ref.current.scrollLeft = scrollLeft.current - walk;
  }, []);

  return { ref, onMouseDown, onMouseLeave, onMouseUp, onMouseMove };
}
