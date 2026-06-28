'use client';
// /consult-intake — 상담 준비(인테이크): 견적 희망정보 빠른 스텝 + 심사서류 OCR·자동 마스킹
// 원본: _design_ref/consult-intake.jsx (+ mypage-app.jsx 의 SubScreen/RtCheck 공용 셸)
// 적응 메모:
//  - window.SubScreen/RtCheck → 모듈 내부 구현, window.rtSalesRanked → RT_CATALOG(best) 슬라이스,
//    window.rtShortModel → 모듈 내 shortModel, window.RT_CTYPE → 인라인 시드.
//  - 단독 라우트용 진입 허브(견적 희망정보 / 심사서류) 추가 — 원본은 컴포넌트만 노출했음.
//  - 디바이스 토글·tweaks-panel·전역리셋은 제외(프로토타입 전용).
//  ⚠️ 제출은 원본과 동일하게 localStorage["rt_consult_intake"] 저장(목업). 실 API 연동 갭은 작업 보고 참조.
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { Button } from '@/components/ui/Button';
import { RT_CATALOG, type Car } from '@/lib/rentailor/catalog';
import './consult-intake.css';

const ACCENT = '#C9A84C';
const shortModel = (m: string) => m.replace(/\s*\(.*\)/, '');

/* ════════ 공용 셸 (원본: mypage-app.jsx) ════════ */
function RtCheck() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4 4 10-10" />
    </svg>
  );
}

interface SubScreenProps {
  title: string;
  intro?: string;
  desc?: string;
  onBack: () => void;
  children: React.ReactNode;
  extra?: React.ReactNode;
}
function SubScreen({ title, intro, desc, onBack, children, extra }: SubScreenProps) {
  return (
    <div className="rt-page" data-page="consult" id="top">
      <div className="rt-scroll">
        <RtTopNav title={title} onBack={onBack} />
        {(intro || desc) && (
          <div className="rt-sub-intro">
            {intro && <h1 className="rt-sub-intro-t">{intro}</h1>}
            {desc && <p className="rt-sub-intro-d">{desc}</p>}
          </div>
        )}
        {children}
        <div style={{ height: 18 }}></div>
        <RtTabBar active="mypage" />
      </div>
      {extra}
    </div>
  );
}

/* ════════ 개인정보 자동 마스킹 ════════ */
function ciMaskName(v: string): string {
  const s = String(v || '').trim();
  if (s.length <= 1) return s;
  if (s.length === 2) return s[0] + '*';
  return s[0] + '*'.repeat(s.length - 2) + s[s.length - 1];
}
function ciMaskField(type: string, v: string | number | null): string {
  const s = String(v == null ? '' : v);
  if (type === 'name') return ciMaskName(s);
  if (type === 'rrn') return s.replace(/(\d{6})[- ]?(\d)\d{6}/, '$1-$2******');
  if (type === 'phone') return s.replace(/(01[0-9])[- ]?\d{3,4}[- ]?(\d{4})/, '$1-****-$2');
  if (type === 'bizno') return s.replace(/(\d{3})[- ]?\d{2}[- ]?\d{5}/, '$1-**-*****');
  if (type === 'account') return s.replace(/\d(?=\d{4})/g, '*');
  if (type === 'addr') {
    const m = s.match(/^(\S+\s+\S+(?:\s+\S+로|\s+\S+길)?)/);
    return (m ? m[1] : s.slice(0, 8)) + ' ***(상세주소 가림)';
  }
  if (type === 'money') return s;
  return s;
}
const CI_SENSITIVE: Record<string, number> = { name: 1, rrn: 1, phone: 1, bizno: 1, account: 1, addr: 1 };

/* ════════ ① 견적 희망정보 빠른 스텝 ════════ */
const CI_PRODUCTS = [
  { k: 'lease', label: '운용리스', sub: '장기렌트·리스 (월 정액)' },
  { k: 'finlease', label: '금융리스', sub: '소유권 이전형 리스' },
  { k: 'installment', label: '오토할부', sub: '할부 구매' },
];
const CI_MONTHS = [24, 36, 48, 60];
const CI_KM = [10000, 15000, 20000, 30000];
const CI_DEPOSIT = [0, 10, 20, 30];
const CI_BUDGET: Array<[string, string]> = [
  ['~50', '월 50만원 이하'],
  ['50-70', '월 50~70만원'],
  ['70-100', '월 70~100만원'],
  ['100+', '월 100만원 이상'],
];
const CI_REGION = ['서울', '경기·인천', '대전·충청', '부산·경상', '광주·전라', '강원·제주'];
const CI_TIME: Array<[string, string]> = [
  ['morning', '오전 (9–12시)'],
  ['afternoon', '오후 (12–18시)'],
  ['evening', '저녁 (18–21시)'],
  ['any', '아무때나 괜찮아요'],
];
const RT_CTYPE: Array<[string, string]> = [
  ['individual', '개인'],
  ['sole', '개인사업자'],
  ['corp', '법인사업자'],
];

interface QuoteState {
  product: string;
  carId: string;
  months: number | '';
  annualKm: number | '';
  deposit: number | '';
  budget: string;
  region: string;
  contactTime: string;
  ctype: string;
  carLabel?: string;
  done?: boolean;
  updatedAt?: string;
}
interface DocItem {
  type: string;
  key: string;
  fields: Array<{ label: string; value: string; masked: boolean }>;
  at: string;
}
interface IntakeStore {
  quote?: Partial<QuoteState>;
  docs?: { items: DocItem[]; updatedAt: string };
}

function ciIntakeLoad(): IntakeStore {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem('rt_consult_intake') || '{}');
  } catch {
    return {};
  }
}
function ciIntakeSave(patch: Partial<IntakeStore>): IntakeStore {
  const cur = ciIntakeLoad();
  const next = { ...cur, ...patch };
  try {
    localStorage.setItem('rt_consult_intake', JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}

function CiProgress({ step, total }: { step: number; total: number }) {
  return (
    <div className="rt-ci-prog">
      <div className="rt-ci-prog-track">
        <div className="rt-ci-prog-fill" style={{ width: Math.round((step / total) * 100) + '%' }}></div>
      </div>
      <span className="rt-ci-prog-step">
        {step}/{total}
      </span>
    </div>
  );
}

function CiPick({ active, onClick, label, sub }: { active: boolean; onClick: () => void; label: string; sub?: string }) {
  return (
    <button className={'rt-ci-pick' + (active ? ' is-on' : '')} type="button" onClick={onClick}>
      <span className="rt-ci-pick-main">
        <span className="rt-ci-pick-l">{label}</span>
        {sub && <span className="rt-ci-pick-s">{sub}</span>}
      </span>
      <span className="rt-ci-pick-ck">{active ? <RtCheck /> : null}</span>
    </button>
  );
}

function ConsultQuickSteps({ onBack, onDone }: { onBack: () => void; onDone: (msg: string) => void }) {
  const cars: Car[] = RT_CATALOG.filter((c) => c.best).slice(0, 6);
  const init = ciIntakeLoad().quote || {};
  const [step, setStep] = useState(1);
  const [v, setV] = useState<QuoteState>({
    product: init.product || '',
    carId: init.carId || '',
    months: init.months ?? '',
    annualKm: init.annualKm ?? '',
    deposit: init.deposit == null ? '' : init.deposit,
    budget: init.budget || '',
    region: init.region || '',
    contactTime: init.contactTime || '',
    ctype: init.ctype || 'individual',
  });
  const TOTAL = 9;
  const set = <K extends keyof QuoteState>(k: K, val: QuoteState[K]) => setV((s) => ({ ...s, [k]: val }));
  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const prev = () => (step > 1 ? setStep((s) => s - 1) : onBack());

  const finish = (skipRest: boolean) => {
    const isFull = !skipRest;
    const carObj = cars.find((c) => c.id === v.carId);
    const carLabel = v.carId === 'etc' ? '추천 요청' : carObj ? carObj.brand + ' ' + shortModel(carObj.model) : '';
    ciIntakeSave({ quote: { ...v, carLabel, done: isFull, updatedAt: '방금 전' } });
    onDone(isFull ? '견적 희망정보가 상담 매니저에게 전달됐어요' : '입력한 내용까지 매니저에게 전달됐어요');
  };

  let body: React.ReactNode;
  let title: string;
  if (step === 1) {
    title = '어떤 상품을 원하세요?';
    body = (
      <div className="rt-ci-list">
        {CI_PRODUCTS.map((p) => (
          <CiPick
            key={p.k}
            active={v.product === p.k}
            label={p.label}
            sub={p.sub}
            onClick={() => {
              set('product', p.k);
              next();
            }}
          />
        ))}
      </div>
    );
  } else if (step === 2) {
    title = '관심 차종이 있나요?';
    body = (
      <div className="rt-ci-cars">
        {cars.map((c) => (
          <button
            key={c.id}
            className={'rt-ci-car' + (v.carId === c.id ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('carId', c.id);
              next();
            }}
            style={{ '--hue': c.hue } as React.CSSProperties}
          >
            <span className="rt-ci-car-b">{c.brand}</span>
            <span className="rt-ci-car-n">{shortModel(c.model)}</span>
            <span className="rt-ci-car-p">월 {c.from}만원~</span>
          </button>
        ))}
        <button
          className={'rt-ci-car rt-ci-car-etc' + (v.carId === 'etc' ? ' is-on' : '')}
          type="button"
          onClick={() => {
            set('carId', 'etc');
            next();
          }}
        >
          아직 못 정했어요 / 추천받기
        </button>
      </div>
    );
  } else if (step === 3) {
    title = '계약 기간은 얼마나 생각하세요?';
    body = (
      <div className="rt-ci-grid">
        {CI_MONTHS.map((m) => (
          <button
            key={m}
            className={'rt-ci-opt' + (v.months === m ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('months', m);
              next();
            }}
          >
            {m}개월
          </button>
        ))}
      </div>
    );
  } else if (step === 4) {
    title = '연간 주행거리는?';
    body = (
      <div className="rt-ci-grid">
        {CI_KM.map((k) => (
          <button
            key={k}
            className={'rt-ci-opt' + (v.annualKm === k ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('annualKm', k);
              next();
            }}
          >
            {(k / 10000).toLocaleString()}만 km
          </button>
        ))}
      </div>
    );
  } else if (step === 5) {
    title = '보증금(선납)은 어느 정도?';
    body = (
      <div className="rt-ci-grid">
        {CI_DEPOSIT.map((d) => (
          <button
            key={d}
            className={'rt-ci-opt' + (v.deposit === d ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('deposit', d);
              next();
            }}
          >
            {d === 0 ? '0원(무보증)' : d + '%'}
          </button>
        ))}
      </div>
    );
  } else if (step === 6) {
    title = '월 예산은 어느 정도 생각하세요?';
    body = (
      <div className="rt-ci-grid">
        {CI_BUDGET.map(([k, l]) => (
          <button
            key={k}
            className={'rt-ci-opt' + (v.budget === k ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('budget', k);
              next();
            }}
          >
            {l}
          </button>
        ))}
      </div>
    );
  } else if (step === 7) {
    title = '주로 어느 지역에서 이용하세요?';
    body = (
      <div className="rt-ci-grid">
        {CI_REGION.map((r) => (
          <button
            key={r}
            className={'rt-ci-opt' + (v.region === r ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('region', r);
              next();
            }}
          >
            {r}
          </button>
        ))}
      </div>
    );
  } else if (step === 8) {
    title = '상담 연락은 언제가 편하세요?';
    body = (
      <div className="rt-ci-grid">
        {CI_TIME.map(([k, l]) => (
          <button
            key={k}
            className={'rt-ci-opt' + (v.contactTime === k ? ' is-on' : '')}
            type="button"
            onClick={() => {
              set('contactTime', k);
              next();
            }}
          >
            {l}
          </button>
        ))}
      </div>
    );
  } else {
    title = '사업 형태가 어떻게 되세요?';
    body = (
      <div className="rt-ci-list">
        {RT_CTYPE.map(([k, l]) => (
          <CiPick key={k} active={v.ctype === k} label={l} sub={k === 'individual' ? '일반 개인 고객' : '비용처리·부채증명 등 사업자 맞춤 안내'} onClick={() => set('ctype', k)} />
        ))}
      </div>
    );
  }

  return (
    <SubScreen title="견적 희망정보" onBack={prev}>
      <CiProgress step={step} total={TOTAL} />
      <div className="rt-ci-q">{title}</div>
      <div className="rt-ci-body">{body}</div>
      <div className="rt-ci-foot">
        {step === TOTAL ? (
          <Button variant="primary" size="lg" fullWidth onClick={() => finish(false)}>
            입력 완료 · 매니저에게 전달
          </Button>
        ) : (
          <p className="rt-ci-hint">선택하면 다음으로 넘어가요</p>
        )}
        <button className="rt-ci-skip" type="button" onClick={() => finish(true)}>
          입력 없이 바로 상담받기
        </button>
      </div>
    </SubScreen>
  );
}

/* ════════ ② 심사서류 OCR + 자동 마스킹 ════════ */
interface DocField {
  label: string;
  v: string;
  type: string;
}
const CI_DOC_TYPES: Array<{ key: string; label: string; fields: DocField[] }> = [
  {
    key: 'id',
    label: '신분증 (주민등록증·운전면허)',
    fields: [
      { label: '이름', v: '김도윤', type: 'name' },
      { label: '주민등록번호', v: '901212-1234567', type: 'rrn' },
      { label: '주소', v: '서울특별시 강남구 테헤란로 123, 4층 401호', type: 'addr' },
    ],
  },
  {
    key: 'income',
    label: '소득금액증명원',
    fields: [
      { label: '성명', v: '김도윤', type: 'name' },
      { label: '연간 소득금액', v: '58,400,000원', type: 'money' },
      { label: '발급 기관', v: '국세청', type: 'plain' },
    ],
  },
  {
    key: 'employ',
    label: '재직증명서',
    fields: [
      { label: '성명', v: '김도윤', type: 'name' },
      { label: '회사명', v: '(주)렌테일러', type: 'plain' },
      { label: '직위', v: '책임매니저', type: 'plain' },
      { label: '입사일', v: '2021.03.02', type: 'plain' },
    ],
  },
  {
    key: 'biz',
    label: '사업자등록증 (개인·법인사업자)',
    fields: [
      { label: '상호', v: '(주)렌테일러', type: 'plain' },
      { label: '사업자등록번호', v: '123-45-67890', type: 'bizno' },
      { label: '대표자', v: '김도윤', type: 'name' },
    ],
  },
];

interface OcrRow {
  label: string;
  type: string;
  raw: string;
  value: string;
}

function ConsultDocsScreen({ onBack, onDone }: { onBack: () => void; onDone: (msg: string) => void }) {
  const [docType, setDocType] = useState('id');
  const [state, setState] = useState<'idle' | 'reading' | 'done'>('idle');
  const [rows, setRows] = useState<OcrRow[]>([]);

  const runOcr = () => {
    setState('reading');
    setTimeout(() => {
      const dt = CI_DOC_TYPES.find((d) => d.key === docType)!;
      const r: OcrRow[] = dt.fields.map((f) => ({ label: f.label, type: f.type, raw: f.v, value: ciMaskField(f.type, f.v) }));
      setRows(r);
      setState('done');
    }, 1300);
  };
  const setRow = (i: number, val: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, value: val } : r)));

  const submit = () => {
    const cur = ciIntakeLoad();
    const docs: DocItem[] = cur.docs && cur.docs.items ? cur.docs.items.slice() : [];
    const dt = CI_DOC_TYPES.find((d) => d.key === docType)!;
    docs.push({ type: dt.label, key: docType, fields: rows.map((r) => ({ label: r.label, value: r.value, masked: !!CI_SENSITIVE[r.type] })), at: '방금 전' });
    ciIntakeSave({ docs: { items: docs, updatedAt: '방금 전' } });
    onDone('심사서류가 마스킹되어 상담 매니저에게 안전하게 전달됐어요');
  };

  return (
    <SubScreen title="심사서류 제출" intro="심사서류 제출" desc="카톡 채널로 보내거나 사진을 불러오면 자동으로 읽고, 개인정보는 가려서 저장해요" onBack={onBack}>
      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">서류 종류</div>
        <div className="rt-ci-doctypes">
          {CI_DOC_TYPES.map((d) => (
            <button
              key={d.key}
              className={'rt-ci-dt' + (docType === d.key ? ' is-on' : '')}
              type="button"
              onClick={() => {
                setDocType(d.key);
                setState('idle');
                setRows([]);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rt-dt-sect">
        <div className={'rt-cc-ocr' + (state === 'done' ? ' is-done' : '')}>
          <div className="rt-cc-ocr-head">
            <span className="rt-cc-ocr-ic">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="9" cy="11" r="2.2" />
                <path d="M3 17l5-4 4 3 3-2 6 5" />
              </svg>
            </span>
            <div className="rt-cc-ocr-main">
              <div className="rt-cc-ocr-t">카카오톡 채널로 제출</div>
              <div className="rt-cc-ocr-d">
                채널로 서류 사진을 보내면 자동 인식 → <b>주민번호·주소 등 민감정보는 자동으로 가려서</b> 저장해요
              </div>
            </div>
          </div>
          {state === 'idle' && (
            <button className="rt-cc-ocr-btn" onClick={runOcr}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 4h-5L8 6H4v14h16V6h-4z" />
                <circle cx="12" cy="13" r="3.5" />
              </svg>
              서류 사진 불러오기
            </button>
          )}
          {state === 'reading' && (
            <div className="rt-cc-ocr-reading">
              <span className="rt-cc-spin"></span>서류를 읽고 개인정보를 가리는 중…
            </div>
          )}
          {state === 'done' && (
            <div className="rt-cc-ocr-done">
              <RtCheck /> 인식·마스킹 완료 · <b>확인하고 수정</b>한 뒤 제출하세요
            </div>
          )}
        </div>
      </div>

      {state === 'done' && (
        <>
          <div className="rt-dt-sect">
            <div className="rt-dt-sect-t">
              인식 결과 <span style={{ fontWeight: 600, color: '#9CA3AF' }}>· 🔒 표시는 자동 마스킹됨</span>
            </div>
            <div className="rt-cc-form">
              {rows.map((r, i) => (
                <div className="rt-cc-frow" key={i}>
                  <label className="rt-cc-flabel">
                    {r.label}
                    {CI_SENSITIVE[r.type] && <span className="rt-ci-lock">🔒 마스킹</span>}
                  </label>
                  <input className="rt-cc-finput" value={r.value} onChange={(e) => setRow(i, e.target.value)} />
                </div>
              ))}
            </div>
          </div>
          <p className="rt-cc-note">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            <span>
              민감정보(주민번호·주소 등)는 <b>자동 마스킹된 상태로만</b> 상담관리에 저장돼요. 원본 이미지는 심사 목적 외 보관하지 않습니다(개인정보보호법).
            </span>
          </p>
          <div className="rt-dt-cta">
            <Button variant="primary" size="lg" fullWidth onClick={submit}>
              마스킹 확인 · 안전하게 제출
            </Button>
          </div>
        </>
      )}
    </SubScreen>
  );
}

/* ════════ 진입 허브 ════════ */
type View = 'hub' | 'quick' | 'docs';

function ChevIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function ConsultIntakePage() {
  const router = useRouter();
  const [view, setView] = useState<View>('hub');
  const [toast, setToast] = useState('');

  const onDone = (msg: string) => {
    setToast(msg);
    setView('hub');
    const sc = document.querySelector('.rt-scroll');
    if (sc) sc.scrollTop = 0;
  };

  let screen: React.ReactNode;
  if (view === 'quick') {
    screen = <ConsultQuickSteps onBack={() => setView('hub')} onDone={onDone} />;
  } else if (view === 'docs') {
    screen = <ConsultDocsScreen onBack={() => setView('hub')} onDone={onDone} />;
  } else {
    screen = (
      <SubScreen title="상담 준비" intro="상담 준비" desc="상담 전에 견적 희망정보와 심사서류를 미리 준비해 두면 더 빠르게 안내받을 수 있어요" onBack={() => router.back()}>
        {toast && (
          <div className="rt-ci-toast">
            <RtCheck />
            <span>{toast}</span>
          </div>
        )}
        <div className="rt-dt-sect">
          <div className="rt-dt-sect-t">준비 항목</div>
          <button className="rt-cc-edit-entry" type="button" onClick={() => setView('quick')}>
            <span className="rt-cc-edit-ic">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="rt-cc-edit-main">
              <b>견적 희망정보 입력</b>
              <span>상품·차종·기간 등 9가지를 빠르게 선택</span>
            </span>
            <span className="rt-cc-edit-chev">
              <ChevIcon />
            </span>
          </button>
          <div style={{ height: 10 }}></div>
          <button className="rt-cc-edit-entry" type="button" onClick={() => setView('docs')}>
            <span className="rt-cc-edit-ic">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <path d="M14 3v6h6" />
              </svg>
            </span>
            <span className="rt-cc-edit-main">
              <b>심사서류 제출</b>
              <span>사진을 올리면 개인정보를 자동으로 가려서 저장</span>
            </span>
            <span className="rt-cc-edit-chev">
              <ChevIcon />
            </span>
          </button>
        </div>
      </SubScreen>
    );
  }

  return (
    <div className="rt-root" data-rt="consult-intake" style={{ '--rt-accent': ACCENT } as React.CSSProperties}>
      {screen}
    </div>
  );
}
