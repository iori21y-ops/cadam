// LegalContent.tsx — 이용약관 · 개인정보처리방침 공용 본문
// 원본: _design_ref/legal-app.jsx (LegalPage / LegalSection).
// privacy-preview / terms-preview 두 라우트가 which prop 으로 모드를 구분해 공유한다.
// 정적 콘텐츠(상호작용 없음)이므로 서버 컴포넌트. RtTopNav 만 클라이언트 크롬으로 사용.
// 제외(프로토타입 전용): useRtDevice/RtControlBar(디바이스 토글), tweaks/personalize.

import Link from 'next/link';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RT_LEGAL, type LegalWhich, type LegalSectionData } from './data';
import './legal.css';

// 헤딩 앞 번호(제N조 / N.)에 골드 강조 span 부여 — 프로토타입과 동일.
function headingHtml(h: string): string {
  return h.replace(/^(제\d+조|\d+\.)/, '<span class="n">$1</span>');
}

function LegalSection({ s }: { s: LegalSectionData }) {
  return (
    <section className="rt-legal-sec">
      <h2 className="rt-legal-sec-h" dangerouslySetInnerHTML={{ __html: headingHtml(s.h) }} />
      {s.ps?.map((p, i) => (
        <p className="rt-legal-p" key={`p${i}`}>
          {p}
        </p>
      ))}
      {s.table && (
        <div className="rt-legal-table">
          {s.table.map((row, i) => (
            <div className="rt-legal-trow" key={`t${i}`}>
              <div className="rt-legal-tk">{row[0]}</div>
              <div className="rt-legal-tv">{row[1]}</div>
            </div>
          ))}
        </div>
      )}
      {s.list && (
        <ul className="rt-legal-list">
          {s.list.map((li, i) => (
            <li key={`l${i}`} dangerouslySetInnerHTML={{ __html: li }} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function LegalContent({ which }: { which: LegalWhich }) {
  const doc = RT_LEGAL[which];
  return (
    <div data-rt="privacy-preview" className="rt-root">
      <div className="rt-page" id="top">
        <RtTopNav title={doc.title} backHref="/" showSearch={false} />

        {/* 약관 ↔ 개인정보처리방침 전환 (.html → 실 운영 라우트, 규칙 6) */}
        <div className="rt-legal-switch">
          <Link href="/terms" className={which === 'terms' ? 'is-on' : ''}>
            이용약관
          </Link>
          <Link href="/privacy" className={which === 'privacy' ? 'is-on' : ''}>
            개인정보처리방침
          </Link>
        </div>

        <div className="rt-legal-head">
          <p className="rt-legal-eyebrow">{doc.eyebrow}</p>
          <h1 className="rt-legal-title">{doc.title}</h1>
          <p className="rt-legal-meta">
            <span>
              시행일 <b>{doc.updated}</b>
            </span>
            <span>
              버전 <b>{doc.version}</b>
            </span>
          </p>
        </div>

        <div className="rt-legal-summary">
          <p className="rt-legal-summary-t">{doc.summary.t}</p>
          <ul className="rt-legal-summary-list">
            {doc.summary.list.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <div className="rt-legal-body">
          {doc.sections.map((s, i) => (
            <LegalSection s={s} key={i} />
          ))}
        </div>

        <div className="rt-legal-contact">
          <p className="rt-legal-contact-h">문의</p>
          <p className="rt-legal-contact-p">
            내용에 대한 문의는 <a href="tel:16667000">1666-7000</a> 또는{' '}
            <a href="mailto:help@rentailor.co.kr">help@rentailor.co.kr</a> 로 연락해 주세요.
            <br />
            {doc.footer.effective}
          </p>
        </div>
      </div>
    </div>
  );
}
