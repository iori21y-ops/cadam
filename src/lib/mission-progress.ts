import { createBrowserSupabaseClient } from '@/lib/supabase';

const STORAGE_KEY = 'cadam-mission-progress';
const VISITOR_KEY = 'cadam-visitor-id';

export interface MissionStep {
  done: boolean;
  summary?: string;
  answers?: Record<string, { value: string; label: string }>;
  mode?: 'basic' | 'detail';
}

export interface MissionProgress {
  vehicle: MissionStep;
  finance: MissionStep;
}

export const DEFAULT_PROGRESS: MissionProgress = {
  vehicle: { done: false },
  finance: { done: false },
};

// ─── Visitor ID (브라우저 fingerprint) ───

async function getVisitorId(): Promise<string> {
  // 이미 저장된 ID가 있으면 재사용
  const existing = localStorage.getItem(VISITOR_KEY);
  if (existing) return existing;

  // 새 fingerprint 생성
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency ?? ''),
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const arr = Array.from(new Uint8Array(hash));
  const id = arr.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);

  localStorage.setItem(VISITOR_KEY, id);
  return id;
}

// ─── localStorage (즉시 반영) ───

export function loadProgress(): MissionProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

function saveLocal(progress: MissionProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event('mission-update'));
}

// ─── Supabase 서버 동기화 (비동기, 실패해도 무시) ───

async function syncToServer(step: 'vehicle' | 'finance', data: MissionStep) {
  try {
    const visitorId = await getVisitorId();
    const supabase = createBrowserSupabaseClient();

    // UPSERT: visitor_id + step 유니크 키 기반
    await supabase.from('mission_progress').upsert(
      {
        visitor_id: visitorId,
        step,
        summary: data.summary ?? null,
        answers: data.answers ?? null,
        mode: data.mode ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'visitor_id,step' }
    );
  } catch {
    // 서버 저장 실패해도 localStorage에는 이미 저장됨
  }
}

// ─── Supabase에서 복원 ───

export async function loadFromServer(): Promise<MissionProgress | null> {
  try {
    const visitorId = await getVisitorId();
    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase
      .from('mission_progress')
      .select('step, summary, answers, mode')
      .eq('visitor_id', visitorId);

    if (error || !data || data.length === 0) return null;

    const progress: MissionProgress = { ...DEFAULT_PROGRESS };
    for (const row of data) {
      const s = row.step as 'vehicle' | 'finance';
      if (s === 'vehicle' || s === 'finance') {
        progress[s] = {
          done: true,
          summary: row.summary ?? undefined,
          answers: row.answers ?? undefined,
          mode: row.mode ?? undefined,
        };
      }
    }
    return progress;
  } catch {
    return null;
  }
}

// ─── 공개 API ───

export function saveMissionStep(
  step: 'vehicle' | 'finance',
  summary?: string,
  answers?: Record<string, { value: string; label: string }>,
  mode?: 'basic' | 'detail'
) {
  const prev = loadProgress();
  const stepData: MissionStep = {
    done: true,
    ...(summary ? { summary } : {}),
    ...(answers ? { answers } : {}),
    ...(mode ? { mode } : {}),
  };
  prev[step] = stepData;

  // 1) localStorage 즉시 저장
  saveLocal(prev);

  // 2) 서버 비동기 동기화
  syncToServer(step, stepData);
}

/**
 * 서버에서 복원 시도 → localStorage에 병합
 * 앱 초기 로드 시 1회 호출
 */
export async function restoreFromServer(): Promise<MissionProgress> {
  const local = loadProgress();
  const server = await loadFromServer();

  if (!server) return local;

  // 서버에 있지만 로컬에 없는 데이터 병합
  let merged = false;
  for (const key of ['vehicle', 'finance'] as const) {
    if (server[key].done && !local[key].done) {
      local[key] = server[key];
      merged = true;
    }
  }

  if (merged) {
    saveLocal(local);
  }

  return local;
}
