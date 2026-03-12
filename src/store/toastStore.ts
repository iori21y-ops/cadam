import { create } from 'zustand';

export type ToastVariant = 'error' | 'success' | 'warning';

export interface ToastState {
  message: string | null;
  variant: ToastVariant;
  isVisible: boolean;
}

interface ToastActions {
  showToast: (message: string, variant?: ToastVariant) => void;
  hideToast: () => void;
}

const initialState: ToastState = {
  message: null,
  variant: 'error',
  isVisible: false,
};

export const useToastStore = create<ToastState & ToastActions>((set) => ({
  ...initialState,

  showToast: (message: string, variant: ToastVariant = 'error') =>
    set({ message, variant, isVisible: true }),

  hideToast: () => set({ isVisible: false }),
}));
