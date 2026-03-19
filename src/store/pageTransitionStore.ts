import { create } from 'zustand';

interface PageTransitionState {
  pending: boolean;
  transitionId: number;
}

interface PageTransitionActions {
  trigger: () => void;
  consume: () => void;
}

export const usePageTransitionStore = create<PageTransitionState & PageTransitionActions>(
  (set) => ({
    pending: false,
    transitionId: 0,
    trigger: () => set((prev) => ({ pending: true, transitionId: prev.transitionId + 1 })),
    consume: () => set({ pending: false }),
  })
);

