import { create } from 'zustand';

interface PageTransitionState {
  pending: boolean;
}

interface PageTransitionActions {
  trigger: () => void;
  consume: () => void;
}

export const usePageTransitionStore = create<PageTransitionState & PageTransitionActions>(
  (set) => ({
    pending: false,
    trigger: () => set({ pending: true }),
    consume: () => set({ pending: false }),
  })
);

