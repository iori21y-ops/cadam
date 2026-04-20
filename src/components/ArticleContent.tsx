import { parse, HTMLElement as NHtmlElement } from 'node-html-parser';
import { SafeHtml } from './SafeHtml';

// 인라인 style에서 레이아웃(margin/padding)만 남기고 나머지 제거
function sanitizeInlineStyle(style: string): string {
  const keep = style
    .split(';')
    .map((s) => s.trim())
    .filter((s) => /^(margin|padding)/i.test(s) && s.includes(':'))
    .join(';');
  return keep ? keep + ';' : '';
}

// h2에서 텍스트만 추출 (내부 태그 제거)
function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// WP HTML → 모바일 최적화 HTML 변환
export function transformWpHtml(rawHtml: string): {
  html: string;
  toc: { id: string; text: string }[];
} {
  const root = parse(rawHtml, { comment: false });

  // 1. h1 → h2 (페이지 헤더가 이미 h1)
  root.querySelectorAll('h1').forEach((el) => {
    el.tagName = 'H2';
  });

  // 2. h2에 앵커 id 부여 + TOC 수집
  const toc: { id: string; text: string }[] = [];
  root.querySelectorAll('h2').forEach((el, i) => {
    const id = `section-${i}`;
    el.setAttribute('id', id);
    toc.push({ id, text: plainText(el.innerHTML) });
  });

  // 3. 중복 이미지 제거 (연속으로 동일 src가 나오는 경우)
  const seenSrc = new Set<string>();
  root.querySelectorAll('figure').forEach((fig) => {
    const img = fig.querySelector('img');
    if (!img) return;
    const src = img.getAttribute('src') ?? '';
    if (seenSrc.has(src)) {
      fig.remove();
    } else {
      seenSrc.add(src);
    }
  });

  // 4. 표 → 가로 스크롤 래퍼 + 셀 인라인 스타일 정리
  root.querySelectorAll('table').forEach((table) => {
    // tr, th, td 인라인 스타일 제거 (CSS에서 처리)
    table.querySelectorAll('tr, th, td').forEach((cell) => {
      cell.setAttribute('style', '');
    });
    table.setAttribute('style', '');
    const wrapper = parse('<div class="table-scroll"></div>');
    const div = wrapper.querySelector('div')!;
    div.appendChild(table.clone());
    table.replaceWith(div);
  });

  // 5. 모든 블록 요소 인라인 스타일 정리
  //    - div, p, ul, ol, li: 브랜드 컬러/배경 하드코딩 제거, 레이아웃만 유지
  root.querySelectorAll('p, li, ul, ol').forEach((el) => {
    const style = el.getAttribute('style') ?? '';
    if (style) el.setAttribute('style', sanitizeInlineStyle(style));
  });

  // 6. CTA 블록 감지 및 클래스 교체
  //    패턴: div에 background:linear-gradient 또는 background:#f8fafc + border-left 없음
  root.querySelectorAll('div').forEach((el) => {
    const style = el.getAttribute('style') ?? '';
    const isGradientCta = /background\s*:\s*linear-gradient/i.test(style);
    const isPlainCta =
      /background\s*:\s*#f8fafc/i.test(style) &&
      /border-left\s*:/i.test(style);
    if (isGradientCta) {
      el.setAttribute('class', (el.getAttribute('class') ?? '') + ' rtl-cta-hero');
      el.setAttribute('style', '');
    } else if (isPlainCta) {
      el.setAttribute('class', (el.getAttribute('class') ?? '') + ' rtl-cta-inline');
      el.setAttribute('style', '');
    } else if (style) {
      el.setAttribute('style', sanitizeInlineStyle(style));
    }
  });

  // 7. a 태그: 인라인 버튼이면 rtl-btn 클래스로 교체, 나머지는 스타일 제거
  root.querySelectorAll('a').forEach((el) => {
    const style = el.getAttribute('style') ?? '';
    if (/background\s*:\s*#/i.test(style) && /display\s*:\s*inline-block/i.test(style)) {
      el.setAttribute('class', (el.getAttribute('class') ?? '') + ' rtl-btn');
    }
    el.setAttribute('style', '');
  });

  // 9. DOM 파싱을 통과한 잔여 인라인 color:#2563eb 제거 (문자열 레벨 최종 클리닝)
  let finalHtml = root.toString();
  finalHtml = finalHtml.replace(/color\s*:\s*#2563eb\s*;?/gi, '');
  finalHtml = finalHtml.replace(/background(-color)?\s*:\s*#2563eb\s*;?/gi, '');
  finalHtml = finalHtml.replace(/color\s*:\s*#1e40af\s*;?/gi, '');

  return { html: finalHtml, toc };
}

function TocNav({ toc }: { toc: { id: string; text: string }[] }) {
  if (toc.length < 3) return null;
  return (
    <nav className="wp-toc" aria-label="목차">
      <p className="wp-toc__label">목차</p>
      <ol className="wp-toc__list">
        {toc.map(({ id, text }) => (
          <li key={id}>
            <a href={`#${id}`}>{text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function ArticleContent({ html }: { html: string }) {
  const { html: transformed, toc } = transformWpHtml(html);
  return (
    <>
      <TocNav toc={toc} />
      <SafeHtml html={transformed} className="wp-content mt-8 text-text" />
    </>
  );
}
