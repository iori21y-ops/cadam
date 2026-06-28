'use client';

// 차주 커뮤니티 — 리뉴얼 미리보기 (타깃 /community)
// 원본: _design_ref/community-app.jsx (+ rt-community.css)
// 이식 규칙: window 전역 → 모듈(import), CadamDS.Button → @/components/ui/Button,
//   디바이스 토글/TweaksPanel 제외. 목업 CM_POSTS/localStorage 'rt-cm-authed' →
//   실 fetch + getMember() 회원 판정.
// API 대비 프로토타입 잉여 필드 제외/대체(advisor): 목록엔 answers/hue/author/hot 미제공 →
//   PostCard 의 베스트답변 미리보기·아바타스택 제거, 태그색은 cmHue(car), hot 은 like_count 파생.
//   답변엔 표시이름 없음 → 공식=매니저 / 차주=익명 라벨 + author_member_id 시드 아바타.
//   상세 라우팅은 useSearchParams(Suspense) 회피 위해 페이지 내 상태(openId)로 처리.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { getMember, type MemberInfo } from '@/lib/member-auth';
import './community.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// ── 카테고리 ───────────────────────────────────────────────
const CM_CATS = [
  { key: 'all', label: '모든 고민' },
  { key: 'quote', label: '견적·계약' },
  { key: 'cost', label: '비용·보험' },
  { key: 'fix', label: '사고·정비' },
  { key: 'end', label: '만기·인수' },
  { key: 'ev', label: '전기차' },
];
const CM_TOPIC: Record<string, string> = { quote: '견적·계약', cost: '비용·보험', fix: '사고·정비', end: '만기·인수', ev: '전기차' };

// ── 타입 (API 응답) ─────────────────────────────────────────
interface PostListItem {
  id: string;
  car: string | null;
  topic: string | null;
  title: string;
  body: string | null;
  like_count: number;
  view_count: number;
  created_at: string;
  answer_count: number;
}
interface PostsResponse {
  posts: PostListItem[];
}
interface PostDetail {
  id: string;
  car: string | null;
  topic: string | null;
  title: string;
  body: string | null;
  like_count: number;
  view_count: number;
  created_at: string;
}
interface Answer {
  id: string;
  author_member_id: string | null;
  manager_id: string | null;
  is_official: boolean;
  badge: string | null;
  body: string;
  helpful_count: number;
  created_at: string;
}
interface CommunityComment {
  id: string;
  answer_id: string;
  member_id: string | null;
  body: string;
  created_at: string;
}
interface PostDetailResponse {
  post: PostDetail | null;
  answers: Answer[];
  comments: CommunityComment[];
}
interface ReactionResponse {
  ok: boolean;
  active?: boolean;
  error?: string;
}

// ── 유틸 ────────────────────────────────────────────────────
function cmHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}
function tagStyle(hue: number): React.CSSProperties {
  return { background: 'hsl(' + hue + ' 58% 95%)', color: 'hsl(' + hue + ' 48% 38%)' };
}
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const y = String(d.getFullYear()).slice(2);
  return y + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
}
const HOT_THRESHOLD = 15;

// reactions 토글 — 'unauth' | boolean(active)
async function toggleReaction(targetType: 'post' | 'answer', targetId: string, kind: 'like' | 'helpful' | 'curious'): Promise<'unauth' | boolean> {
  try {
    const res = await fetch('/api/community/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, kind }),
    });
    if (res.status === 401) return 'unauth';
    const data = (await res.json()) as ReactionResponse;
    return Boolean(data.active);
  } catch {
    return false;
  }
}

// ── 아바타 ─────────────────────────────────────────────────
function Avatar({ name, size = 36, official }: { name: string; size?: number; official?: boolean }) {
  const hue = cmHue(name);
  const ch = name.replace(/[*·\s]/g, '').slice(-2) || '차주';
  return (
    <span
      className="rt-av"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: official ? 'var(--rt-navy)' : 'hsl(' + hue + ' 52% 92%)',
        color: official ? '#fff' : 'hsl(' + hue + ' 46% 40%)',
      }}
    >
      {official ? (
        <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none" stroke="#C9A84C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        ch
      )}
      {official && (
        <span className="rt-av-ck">
          <svg viewBox="0 0 24 24" width="8" height="8" fill="none" stroke="#0D1B2A" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      )}
    </span>
  );
}

// ── 아이콘 ─────────────────────────────────────────────────
function CmIc({ name, size = 16 }: { name: string; size?: number }) {
  const P: Record<string, React.ReactNode> = {
    chat: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />,
    like: <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3z M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />,
    flame: <path d="M8.5 14.5c0 1.9 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5c0-1.4-.9-2.3-.9-2.3.3 1-.6 1.6-.6 1.6.2-2.4-2-4-2-5.8 0 0-2 1-2 3.2 0 0-.7-.5-.7-1.5-1 .8-1.8 2.2-1.8 4.6z" />,
    lock: (
      <>
        <rect x="4.5" y="11" width="15" height="9.5" rx="2.2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
    pen: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </>
    ),
    send: <path d="M22 2L11 13 M22 2l-7 20-4-9-9-4z" />,
    x: <path d="M6 6l12 12M18 6L6 18" />,
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={name === 'flame' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </svg>
  );
}

// ── 목록 카드 ──────────────────────────────────────────────
function PostCard({ post, onOpen }: { post: PostListItem; onOpen: (id: string) => void }) {
  const hot = post.like_count >= HOT_THRESHOLD;
  return (
    <button className="rt-cm-card" onClick={() => onOpen(post.id)}>
      <div className="rt-cm-tagrow">
        {post.car && (
          <span className="rt-cm-tag" style={tagStyle(cmHue(post.car))}>
            {post.car}
          </span>
        )}
        {post.topic && <span className="rt-cm-topic">{CM_TOPIC[post.topic] ?? post.topic}</span>}
        {hot && (
          <span className="rt-cm-hot">
            <CmIc name="flame" size={13} />
            인기
          </span>
        )}
      </div>
      <h3 className="rt-cm-q">{post.title}</h3>
      {post.body && <p className="rt-cm-body">{post.body}</p>}
      <div className="rt-cm-foot">
        <div className="rt-cm-ans">
          <span className="rt-cm-ans-n">
            <em>{post.answer_count}</em>개의 답변
          </span>
        </div>
        <div className="rt-cm-foot-meta">
          <span className="rt-cm-meta-i">
            <CmIc name="like" size={14} />
            {post.like_count}
          </span>
        </div>
      </div>
    </button>
  );
}

// ── 답변 카드 ──────────────────────────────────────────────
function AnswerCard({ a, isBest, commentCount, onUnauth }: { a: Answer; isBest: boolean; commentCount: number; onUnauth: () => void }) {
  const seed = a.author_member_id || a.id;
  const displayName = a.is_official ? '렌테일러 매니저' : '차주';
  const sub = a.is_official ? '공식 답변 · ' + fmtDate(a.created_at) : (a.badge ? a.badge + ' · ' : '') + fmtDate(a.created_at);
  const [helped, setHelped] = useState(false);
  const onHelp = async () => {
    const r = await toggleReaction('answer', a.id, 'helpful');
    if (r === 'unauth') {
      onUnauth();
      return;
    }
    setHelped(r);
  };
  return (
    <div className={'rt-cm-answer' + (a.is_official ? ' is-official' : '')}>
      <div className="rt-cm-a-top">
        <Avatar name={seed} size={38} official={a.is_official} />
        <div className="rt-cm-a-meta">
          <span className="rt-cm-a-name">
            {displayName}
            {a.is_official ? <span className="rt-cm-a-badge official">공식</span> : a.badge ? <span className="rt-cm-a-badge">{a.badge}</span> : null}
          </span>
          <span className="rt-cm-a-sub">{sub}</span>
        </div>
        {isBest && !a.is_official && (
          <span className="rt-cm-a-best">
            <CmIc name="flame" size={11} />
            베스트
          </span>
        )}
      </div>
      <p className="rt-cm-a-body">{a.body}</p>
      <div className="rt-cm-a-foot">
        <button className={'rt-cm-a-help' + (helped ? ' is-on' : '')} onClick={onHelp}>
          <CmIc name="like" size={14} />
          도움됐어요 {a.helpful_count + (helped ? 1 : 0)}
        </button>
        <span className="rt-cm-a-cmt">
          <CmIc name="chat" size={14} />
          댓글 {commentCount}
        </span>
      </div>
    </div>
  );
}

// ── 상세 ───────────────────────────────────────────────────
function DetailView({
  postId,
  authed,
  onBack,
  onLogin,
  toast,
}: {
  postId: string;
  authed: boolean;
  onBack: () => void;
  onLogin: () => void;
  toast: (m: string) => void;
}) {
  const [data, setData] = useState<PostDetailResponse | null>(null);
  const [sort, setSort] = useState<'best' | 'new'>('best');
  const [curious, setCurious] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    fetch('/api/community/posts/' + postId)
      .then((res) => (res.ok ? (res.json() as Promise<PostDetailResponse>) : { post: null, answers: [], comments: [] }))
      .then((d) => setData(d))
      .catch(() => setData({ post: null, answers: [], comments: [] }));
  }, [postId]);

  useEffect(() => {
    load();
    document.querySelector('.rt-scroll')?.scrollTo({ top: 0 });
  }, [load]);

  const commentCounts = useMemo(() => {
    const m: Record<string, number> = {};
    (data?.comments ?? []).forEach((c) => {
      m[c.answer_id] = (m[c.answer_id] ?? 0) + 1;
    });
    return m;
  }, [data]);

  const answers = useMemo(() => {
    const arr = (data?.answers ?? []).slice();
    if (sort === 'best') {
      arr.sort((x, y) => (y.is_official ? 1 : 0) - (x.is_official ? 1 : 0) || y.helpful_count - x.helpful_count);
    } else {
      arr.sort((x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime());
    }
    return arr;
  }, [data, sort]);
  const bestAnswer = answers.find((a) => !a.is_official) ?? null;

  const onCurious = async () => {
    const r = await toggleReaction('post', postId, 'curious');
    if (r === 'unauth') {
      onLogin();
      return;
    }
    setCurious(r);
  };

  const sendAnswer = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/community/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, body: draft.trim() }),
      });
      if (res.status === 401) {
        onLogin();
        return;
      }
      const d = (await res.json()) as { ok: boolean };
      if (d.ok) {
        setDraft('');
        toast('답변이 등록됐어요');
        load();
      } else {
        toast('답변 등록에 실패했어요');
      }
    } catch {
      toast('네트워크 오류가 발생했어요');
    } finally {
      setSending(false);
    }
  };

  if (!data) {
    return (
      <div className="rt-page" data-page="community-detail">
        <div className="rt-scroll">
          <RtTopNav title="차주 커뮤니티" onBack={onBack} showSearch={false} />
          <div className="rt-cm-state">불러오는 중…</div>
        </div>
      </div>
    );
  }
  const post = data.post;
  if (!post) {
    return (
      <div className="rt-page" data-page="community-detail">
        <div className="rt-scroll">
          <RtTopNav title="차주 커뮤니티" onBack={onBack} showSearch={false} />
          <div className="rt-cm-state">글을 찾을 수 없어요.</div>
        </div>
      </div>
    );
  }
  const allAnswers = data.answers;

  return (
    <div className="rt-page" data-page="community-detail">
      <div className="rt-scroll">
        <RtTopNav title="차주 커뮤니티" onBack={onBack} showSearch={false} />

        <div className="rt-cm-d-head">
          <div className="rt-cm-d-author">
            <Avatar name={post.id} size={40} />
            <div className="rt-cm-d-author-meta">
              <span className="rt-cm-d-author-n">차주</span>
              <span className="rt-cm-d-author-s">
                {fmtDate(post.created_at)} · 조회 {post.view_count}
              </span>
            </div>
          </div>
          <h1 className="rt-cm-d-q">{post.title}</h1>
          {post.body && <p className="rt-cm-d-body">{post.body}</p>}
          {post.car && (
            <div>
              <span className="rt-cm-d-tag" style={tagStyle(cmHue(post.car))}># {post.car}</span>
            </div>
          )}
          <div className="rt-cm-d-actions">
            <button className={'rt-cm-curi' + (curious ? ' is-on' : '')} onClick={onCurious}>
              <CmIc name="like" size={15} />
              궁금해요 {post.like_count + (curious ? 1 : 0)}
            </button>
            <span className="rt-cm-d-date">답변 {allAnswers.length}</span>
          </div>
        </div>

        <div className="rt-cm-ans-head">
          <span className="rt-cm-ans-head-t">
            답변<em>{allAnswers.length}</em>
          </span>
          {authed && allAnswers.length > 0 && (
            <div className="rt-cm-sort">
              <button className={sort === 'best' ? 'is-on' : ''} onClick={() => setSort('best')}>
                추천순
              </button>
              <button className={sort === 'new' ? 'is-on' : ''} onClick={() => setSort('new')}>
                최신순
              </button>
            </div>
          )}
        </div>

        {authed ? (
          <div className="rt-cm-answers">
            {answers.length === 0 ? (
              <div className="rt-cm-state" style={{ padding: '24px 0' }}>
                아직 답변이 없어요. 첫 답변을 남겨보세요.
              </div>
            ) : (
              answers.map((a) => <AnswerCard key={a.id} a={a} isBest={a === bestAnswer} commentCount={commentCounts[a.id] ?? 0} onUnauth={onLogin} />)
            )}
          </div>
        ) : (
          <>
            {allAnswers[0] && (
              <div className="rt-cm-answers" style={{ paddingBottom: 0 }}>
                <AnswerCard a={allAnswers[0]} isBest={!allAnswers[0].is_official} commentCount={commentCounts[allAnswers[0].id] ?? 0} onUnauth={onLogin} />
              </div>
            )}
            <div className="rt-cm-d-gate">
              <div className="rt-cm-gate-ic">
                <CmIc name="lock" size={20} />
              </div>
              <p className="rt-cm-gate-t">
                로그인하면 차주들의 답변을
                <br />
                모두 볼 수 있어요
              </p>
              <p className="rt-cm-gate-d">남은 답변 {Math.max(0, allAnswers.length - 1)}개와 공식 답변이 기다리고 있어요.</p>
              <button className="rt-cm-gate-btn" onClick={onLogin}>
                로그인하고 전체 보기
              </button>
              <p className="rt-cm-gate-sub">
                아직 회원이 아니신가요?{' '}
                <a onClick={onLogin}>간편 가입</a>
              </p>
            </div>
          </>
        )}

        {authed && (
          <div className="rt-cm-compose">
            <input type="text" placeholder="답변을 남겨 차주들과 경험을 나눠보세요" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button className="rt-cm-send" disabled={!draft.trim() || sending} onClick={sendAnswer}>
              <CmIc name="send" size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 글쓰기 시트 ────────────────────────────────────────────
function WriteSheet({ open, onClose, onDone, onUnauth }: { open: boolean; onClose: () => void; onDone: () => void; onUnauth: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [car, setCar] = useState('');
  const [sending, setSending] = useState(false);
  useEffect(() => {
    if (open) {
      setTitle('');
      setBody('');
      setCar('');
    }
  }, [open]);
  const valid = Boolean(title.trim() && body.trim()) && !sending;
  const submit = async () => {
    if (!valid) return;
    setSending(true);
    try {
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ car: car.trim() || undefined, title: title.trim(), body: body.trim() }),
      });
      if (res.status === 401) {
        onUnauth();
        return;
      }
      const d = (await res.json()) as { ok: boolean };
      if (d.ok) onDone();
    } catch {
      // 무시 — 토스트는 onDone 경로에서만
    } finally {
      setSending(false);
    }
  };
  return (
    <>
      <div className={'rt-sheet-scrim' + (open ? ' is-open' : '')} onClick={onClose}></div>
      <div className={'rt-sheet' + (open ? ' is-open' : '')} role="dialog" aria-modal="true">
        <div className="rt-sheet-grab"></div>
        <button className="rt-sheet-close" onClick={onClose} aria-label="닫기">
          <CmIc name="x" size={18} />
        </button>
        <p className="rt-sheet-eyebrow">차주 커뮤니티</p>
        <h3 className="rt-sheet-title">고민을 남겨보세요</h3>
        <p className="rt-sheet-sub">먼저 경험한 차주들과 전담 매니저가 답변해 드려요.</p>
        <div className="rt-form">
          <label className="rt-field">
            <span className="rt-field-label">
              차종 <em style={{ color: 'var(--rt-muted)', fontWeight: 600 }}>(선택)</em>
            </span>
            <input className="rt-input" type="text" placeholder="예: 모델 Y, 쏘렌토" value={car} onChange={(e) => setCar(e.target.value)} />
          </label>
          <label className="rt-field">
            <span className="rt-field-label">제목</span>
            <input className="rt-input" type="text" placeholder="어떤 점이 궁금하신가요?" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="rt-field">
            <span className="rt-field-label">내용</span>
            <textarea
              className="rt-input"
              style={{ height: 120, padding: '13px 16px', resize: 'none', lineHeight: 1.55 }}
              placeholder="상황을 자세히 적을수록 더 정확한 답변을 받을 수 있어요."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </label>
          <div style={{ marginTop: 4 }}>
            <Button variant="primary" size="lg" fullWidth className="rt-gold" disabled={!valid} onClick={submit}>
              {sending ? '올리는 중…' : '고민 올리기'}
            </Button>
          </div>
        </div>
        <p className="rt-form-note">작성 후에도 마이페이지에서 수정·삭제할 수 있어요.</p>
      </div>
    </>
  );
}

// ── 목록 ───────────────────────────────────────────────────
function ListView({
  posts,
  authed,
  onOpen,
  onLogin,
  onWrite,
}: {
  posts: PostListItem[];
  authed: boolean;
  onOpen: (id: string) => void;
  onLogin: () => void;
  onWrite: () => void;
}) {
  const [cat, setCat] = useState('all');
  const list = posts.filter((p) => cat === 'all' || p.topic === cat);
  const open = list.slice(0, 2);
  const locked = list.slice(2);
  const noop = () => {};

  return (
    <div className="rt-page" data-page="community">
      <div className="rt-scroll">
        <RtTopNav title="차주 커뮤니티" backHref="/mypage" />

        <div className="rt-cm-hero">
          <div className="rt-cm-hero-top">
            <span className="rt-cm-pill">
              <CmIc name="chat" size={13} />
              차주 커뮤니티
            </span>
          </div>
          <h1 className="rt-cm-hero-t">차주와 함께 해결해요</h1>
          <p className="rt-cm-hero-d">실제 차주들의 생생한 경험과 전담 매니저의 공식 답변을 한 곳에서.</p>
          <div className="rt-cm-stats">
            <span className="rt-cm-stat">
              <b>2,418</b>
              <span>차주</span>
            </span>
            <span className="rt-cm-stat">
              <b>9,062</b>
              <span>고민</span>
            </span>
            <span className="rt-cm-stat">
              <b>31,540</b>
              <span>답변</span>
            </span>
          </div>
        </div>

        <div className="rt-cm-cats">
          {CM_CATS.map((c) => (
            <button key={c.key} className={'rt-cm-cat' + (cat === c.key ? ' is-on' : '')} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className={'rt-cm-gatewrap' + (authed ? '' : ' is-locked')}>
          {list.length === 0 ? (
            <div className="rt-cm-state" style={{ padding: '40px 0' }}>
              아직 등록된 고민이 없어요.
            </div>
          ) : (
            <>
              <div className="rt-cm-list">
                {open.map((p) => (
                  <PostCard key={p.id} post={p} onOpen={onOpen} />
                ))}
              </div>
              {locked.length > 0 && (
                <>
                  <div className="rt-cm-list rt-cm-list-locked" aria-hidden={!authed}>
                    {locked.map((p) => (
                      <PostCard key={p.id} post={p} onOpen={authed ? onOpen : noop} />
                    ))}
                  </div>
                  {!authed && (
                    <div className="rt-cm-gate">
                      <div className="rt-cm-gate-ic">
                        <CmIc name="lock" size={20} />
                      </div>
                      <p className="rt-cm-gate-t">
                        로그인하면 실제 차주들의
                        <br />
                        답변을 모두 볼 수 있어요
                      </p>
                      <p className="rt-cm-gate-d">고민 {posts.length}건과 차주들의 진짜 후기가 기다리고 있어요.</p>
                      <button className="rt-cm-gate-btn" onClick={onLogin}>
                        로그인하기
                      </button>
                      <p className="rt-cm-gate-sub">
                        아직 회원이 아니신가요? <a onClick={onLogin}>간편 가입</a>
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <RtTabBar active="mypage" />
      </div>

      <button className="rt-cm-fab" onClick={onWrite}>
        <CmIc name="pen" size={17} />
        글쓰기
      </button>
    </div>
  );
}

// ── 앱 ─────────────────────────────────────────────────────
export default function CommunityPreview() {
  const router = useRouter();
  const [member, setMember] = useState<MemberInfo | null | undefined>(undefined);
  const [posts, setPosts] = useState<PostListItem[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authed = Boolean(member);

  const loadPosts = useCallback(() => {
    fetch('/api/community/posts')
      .then((res) => (res.ok ? (res.json() as Promise<PostsResponse>) : { posts: [] }))
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setPosts([]));
  }, []);

  useEffect(() => {
    let alive = true;
    getMember().then((m) => {
      if (alive) setMember(m);
    });
    loadPosts();
    return () => {
      alive = false;
    };
  }, [loadPosts]);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    if (toastT.current) clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  const goLogin = () => router.push('/login-preview');
  const onWrite = () => {
    if (!authed) {
      goLogin();
      return;
    }
    setWriteOpen(true);
  };

  const loading = member === undefined || posts === null;

  return (
    <div data-rt="community-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      {loading ? (
        <div className="rt-page" data-page="community">
          <div className="rt-scroll">
            <RtTopNav title="차주 커뮤니티" backHref="/mypage" />
            <div className="rt-cm-state">불러오는 중…</div>
          </div>
        </div>
      ) : openId ? (
        <DetailView postId={openId} authed={authed} onBack={() => setOpenId(null)} onLogin={goLogin} toast={toast} />
      ) : (
        <ListView posts={posts ?? []} authed={authed} onOpen={setOpenId} onLogin={goLogin} onWrite={onWrite} />
      )}

      <WriteSheet
        open={writeOpen}
        onClose={() => setWriteOpen(false)}
        onDone={() => {
          setWriteOpen(false);
          toast('고민이 등록됐어요');
          loadPosts();
        }}
        onUnauth={goLogin}
      />
      <div className={'rt-cm-toast' + (toastMsg ? ' is-on' : '')}>{toastMsg}</div>
    </div>
  );
}
