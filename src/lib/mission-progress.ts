const STORAGE_KEY = 'cadam-mission-progress';

export interface MissionStep {
  done: boolean;
  summary?: string;
  /** 진단 답변 저장 — 결과 복원용 { [questionId]: { value, label } } */
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

export function saveMissionStep(
  step: 'vehicle' | 'finance',
  summary?: string,
  answers?: Record<string, { value: string; label: string }>,
  mode?: 'basic' | 'detail'
) {
  const prev = loadProgress();
  prev[step] = {
    done: true,
    ...(summary ? { summary } : {}),
    ...(answers ? { answers } : {}),
    ...(mode ? { mode } : {}),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
  window.dispatchEvent(new Event('mission-update'));
}
