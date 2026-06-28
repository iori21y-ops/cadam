'use client';

// points/page.tsx — 회원 포인트 (적립 원장 + 계약비용 지원 사용)
// 원본: _design_ref/points.jsx (+ rt-mypage.css 의 rt-pt-* 블록)
// 적립(earn): 활동별 자동 지급. 사용(redeem): 계약 비용(면책금·중도해지·초과운행·인수가)을 포인트로 지원 → 카카오페이 캐시백.
// 데이터: 전부 시드+localStorage("rt_points") 흉내 (★갭: point_transactions/point_rules/point_redeem_policy 테이블 미생성, 카카오페이 지급 API 미연동).
// 회원 게이트 없음 — 시드 원장으로 UI 시연.
import React, { useEffect, useState } from 'react';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import {
  PT_REDEEM_POLICY,
  PT_PAYOUT,
  type PtCostKey,
  type PtTxnType,
  ptLoad,
  ptBalance,
  ptComma,
  ptGetCtx,
  ptClearCtx,
  ptAddRedeem,
  ptExpiring,
  ptExpireNext,
} from '@/lib/rentailor/points';
import './points.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// ── 아이콘 ──
function PtIcon({ name }: { name: 'chev' | 'info' | 'clock' | 'coin' }) {
  const p: Record<string, React.ReactNode> = {
    chev: <path d="M9 6l6 6-6 6" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v.01M11 12h1v4h1" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    coin: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5v9M9.6 9.8h3.2a1.8 1.8 0 0 1 0 3.6H9.8M9.6 13.4h3.4a1.8 1.8 0 0 1 0 3.6H9.6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
}

// ── 소멸 예정 배너 ──
function PtExpiryBanner({ days, version }: { days: number; version: number }) {
  void version;
  const soon = ptExpiring(days);
  if (soon <= 0) return null;
  const nx = ptExpireNext();
  return (
    <div className="rt-pt-expire">
      <PtIcon name="clock" />
      <span>
        <b>{ptComma(soon)}P</b>가 {nx ? nx.date : ''} 소멸 예정이에요. 만료 전 계약 비용 지원에 사용해 보세요.
      </span>
    </div>
  );
}

// ── 원장 리스트 ──
type LedgerFilter = 'all' | PtTxnType;
function PtLedgerList({ filter, version }: { filter: LedgerFilter; version: number }) {
  void version;
  const txns = ptLoad().txns.filter((t) => filter === 'all' || t.type === filter);
  if (!txns.length) return <div className="rt-pt-empty">내역이 없어요.</div>;
  const sign = (n: number): string => (n >= 0 ? '+' : '') + ptComma(n) + 'P';
  const color = (t: PtTxnType): string => (t === 'earn' ? '#1F8A5B' : t === 'expire' ? '#9CA3AF' : '#E0544B');
  return (
    <div className="rt-dl">
      {txns.map((t, i) => (
        <div className="rt-dl-row" key={i}>
          <span className="rt-dl-k">
            {t.label}
            <br />
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>
              {t.date}
              {t.method ? ' · ' + t.method : ''}
              {t.status ? ' · ' + t.status : ''}
            </span>
          </span>
          <span className="rt-dl-v" style={{ color: color(t.type), fontWeight: 800 }}>
            {sign(t.amt)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── 포인트로 비용 지원 신청 화면 ──
const PT_COST_CHIPS: PtCostKey[] = ['deductible', 'earlyterm', 'excess', 'buyout'];
function PointRedeemScreen({ onBack, onDone }: { onBack: () => void; onDone: (msg: string) => void }) {
  const ctx = ptGetCtx();
  const [cost, setCost] = useState<PtCostKey>(ctx && ctx.type ? ctx.type : 'deductible');
  const [amount, setAmount] = useState<number>(ctx && ctx.amount ? ctx.amount : 300000);
  const pol = PT_REDEEM_POLICY[cost];
  const balance = ptBalance();
  const cap = Math.floor((amount || 0) * pol.maxPct / 100);
  const usable = Math.max(0, Math.min(balance, cap));
  const [use, setUse] = useState<number>(usable);
  useEffect(() => {
    setUse(Math.max(0, Math.min(balance, Math.floor((amount || 0) * pol.maxPct / 100))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cost, amount]);
  const net = Math.max(0, (amount || 0) - use);

  const apply = () => {
    ptAddRedeem(cost, use, pol.label);
    ptClearCtx();
    onDone('지원 신청 완료 · 승인 후 ' + use.toLocaleString() + '원을 카카오페이로 보내드려요');
  };

  return (
    <>
      <RtTopNav title="포인트로 비용 지원" onBack={onBack} />
      <div className="rt-sub-intro">
        <h1 className="rt-sub-intro-t">포인트로 비용 지원</h1>
        <p className="rt-sub-intro-d">계약 중 발생한 비용을 포인트로 지원받고, 카카오페이로 캐시백 받으세요</p>
      </div>

      <div className="rt-pt-bal">
        <span>보유 포인트</span>
        <b>
          {ptComma(balance)}
          <i>P</i>
        </b>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">지원받을 비용</div>
        <div className="rt-cc-chips" style={{ margin: '0 var(--rt-pad)' }}>
          {PT_COST_CHIPS.map((k) => (
            <button key={k} className={'rt-cc-chip' + (cost === k ? ' is-on' : '')} onClick={() => setCost(k)}>
              {PT_REDEEM_POLICY[k].label}
            </button>
          ))}
        </div>
        <div className="rt-cc-field" style={{ marginTop: 12 }}>
          <div className="rt-cc-field-top">
            <span>비용 금액</span>
            <span className="rt-cc-field-v">{ptComma(amount)}원</span>
          </div>
          <div className="rt-cc-num-row">
            <input
              className="rt-cc-input"
              type="number"
              step={10000}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, +e.target.value || 0))}
            />
            <span className="rt-cc-input-unit">원</span>
          </div>
          <div className="rt-cc-field-ends">
            <span>{pol.sub}</span>
            <span>최대 {pol.maxPct}%까지 포인트</span>
          </div>
        </div>
      </div>

      <div className="rt-dt-sect">
        <div className="rt-dt-sect-t">사용할 포인트</div>
        <div className="rt-cc-field">
          <div className="rt-cc-field-top">
            <span>지원 포인트</span>
            <span className="rt-cc-field-v">{ptComma(use)}P</span>
          </div>
          <input
            className="rt-cc-range"
            type="range"
            min={0}
            max={Math.max(1, usable)}
            step={100}
            value={use}
            onChange={(e) => setUse(+e.target.value)}
          />
          <div className="rt-cc-field-ends">
            <span>0P</span>
            <span>최대 {ptComma(usable)}P</span>
          </div>
        </div>
      </div>

      <div className="rt-pt-sum">
        <div className="rt-pt-sum-row">
          <span>비용 금액</span>
          <b>{ptComma(amount)}원</b>
        </div>
        <div className="rt-pt-sum-row">
          <span>
            포인트 지원<i>카카오페이 캐시백</i>
          </span>
          <b style={{ color: 'var(--rt-accent,#B07A2E)' }}>−{ptComma(use)}원</b>
        </div>
        <div className="rt-pt-sum-row is-total">
          <span>실 본인부담</span>
          <b>{ptComma(net)}원</b>
        </div>
      </div>

      <p className="rt-cc-note">
        <PtIcon name="info" />
        <span>
          {PT_PAYOUT.note} 사고 면책금·정산 영수증 확인 후 지급돼요. 포인트는 현금 환급되지 않아요.
        </span>
      </p>

      <div className="rt-dt-cta">
        <button className="rt-prim-btn" type="button" disabled={use <= 0} onClick={apply}>
          {ptComma(use)}P 지원 신청 · 카카오페이 받기
        </button>
      </div>
    </>
  );
}

type View = 'ledger' | 'redeem';
const PT_TABS: Array<[LedgerFilter, string]> = [
  ['all', '전체'],
  ['earn', '적립'],
  ['redeem', '사용'],
  ['expire', '소멸'],
];

export default function PointsPage() {
  const [view, setView] = useState<View>('ledger');
  const [tab, setTab] = useState<LedgerFilter>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // 원장 변경 후 리렌더 트리거
  const [balance, setBalance] = useState(0);

  // 계약 케어에서 ptSetCtx 후 넘어온 경우 자동으로 지원 신청 화면 오픈
  useEffect(() => {
    if (ptGetCtx()) setView('redeem');
    setBalance(ptBalance());
  }, []);
  useEffect(() => {
    setBalance(ptBalance());
  }, [version, view]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div data-rt="points" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="points">
        <div className="rt-scroll">
          {view === 'redeem' ? (
            <PointRedeemScreen
              onBack={() => setView('ledger')}
              onDone={(m) => {
                setView('ledger');
                setVersion((v) => v + 1);
                setToast(m);
              }}
            />
          ) : (
            <>
              <RtTopNav title="포인트" backHref="/mypage" />
              <div className="rt-sub-intro">
                <h1 className="rt-sub-intro-t">내 포인트</h1>
                <p className="rt-sub-intro-d">이용할수록 쌓이고, 계약 비용 지원에 쓸 수 있어요</p>
              </div>

              {/* 보유 포인트 */}
              <div className="rt-pt-bal">
                <span>보유 포인트</span>
                <b>
                  {ptComma(balance)}
                  <i>P</i>
                </b>
              </div>

              <div className="rt-dt-sect">
                <p className="rt-pt-lead">
                  적립 포인트로 <b>면책금·중도해지수수료·초과운행금</b> 등 계약 비용을 지원받고, 카카오페이로 캐시백 받을 수 있어요.
                </p>
                <button className="rt-pt-cta" type="button" onClick={() => setView('redeem')}>
                  <span>포인트로 비용 지원받기</span>
                  <PtIcon name="chev" />
                </button>
              </div>

              {/* 적립·사용 내역 */}
              <div className="rt-dt-sect">
                <div className="rt-dt-sect-t rt-pt-sect-row">
                  포인트 내역
                  <span className="rt-pt-sect-sp" />
                  <div className="rt-pt-tabs">
                    {PT_TABS.map(([k, l]) => (
                      <button key={k} className={'rt-pt-tab' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <PtExpiryBanner days={90} version={version} />
                <PtLedgerList filter={tab} version={version} />
              </div>

              <p className="rt-cc-note">
                <PtIcon name="info" />
                <span>
                  포인트는 적립일로부터 1년 후 소멸돼요. 현금 환급은 되지 않으며, 계약 비용 지원분은 승인 후 카카오페이로 캐시백돼요.
                </span>
              </p>
            </>
          )}

          <div style={{ height: 18 }} />
          <RtTabBar active="mypage" />
        </div>
      </div>

      {toast && <div className="rt-pt-toast">{toast}</div>}
    </div>
  );
}
