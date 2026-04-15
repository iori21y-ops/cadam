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

// 메모리 전용 저장소 — localStorage/Supabase 없음
let currentProgress: MissionProgress = {
  vehicle: { done: false },
  finance: { done: false },
};

export function loadProgress(): MissionProgress {
  return currentProgress;
}

export function saveMissionStep(
  step: 'vehicle' | 'finance',
  summary?: string,
  answers?: Record<string, { value: string; label: string }>,
  mode?: 'basic' | 'detail'
) {
  const stepData: MissionStep = {
    done: true,
    ...(summary ? { summary } : {}),
    ...(answers ? { answers } : {}),
    ...(mode ? { mode } : {}),
  };
  currentProgress = { ...currentProgress, [step]: stepData };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('mission-update'));
  }
}

export async function restoreFromServer(): Promise<MissionProgress> {
  return loadProgress();
}
