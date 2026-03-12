import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Brand } from '@/constants/vehicles';

export type SelectionPath = 'car' | 'budget' | null;

export type ContractMonths = 36 | 48 | 60;
export type AnnualKm = 10000 | 20000 | 30000 | 40000;
export type Deposit = 0 | 1000000 | 2000000 | 3000000;
export type PrepaymentPct = 0 | 10 | 20 | 30;

export interface QuoteState {
  currentStep: number;
  selectionPath: SelectionPath;
  carBrand: Brand | null;
  carModel: string | null;
  trim: string | null;
  contractMonths: ContractMonths | null;
  annualKm: AnnualKm | null;
  deposit: Deposit | null;
  prepaymentPct: PrepaymentPct | null;
  monthlyBudget: number | null;
  estimatedMin: number | null;
  estimatedMax: number | null;
  name: string;
  phone: string;
  privacyAgreed: boolean;
}

interface QuoteActions {
  setCurrentStep: (step: number) => void;
  setSelectionPath: (path: SelectionPath) => void;
  setCarBrand: (brand: Brand | null) => void;
  setCarModel: (model: string | null) => void;
  setTrim: (trim: string | null) => void;
  setContractMonths: (months: ContractMonths | null) => void;
  setAnnualKm: (km: AnnualKm | null) => void;
  setDeposit: (amount: Deposit | null) => void;
  setPrepaymentPct: (pct: PrepaymentPct | null) => void;
  setMonthlyBudget: (budget: number | null) => void;
  setEstimatedMin: (min: number | null) => void;
  setEstimatedMax: (max: number | null) => void;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setPrivacyAgreed: (agreed: boolean) => void;
  resetAll: () => void;
}

const initialState: QuoteState = {
  currentStep: 1,
  selectionPath: null,
  carBrand: null,
  carModel: null,
  trim: null,
  contractMonths: null,
  annualKm: null,
  deposit: null,
  prepaymentPct: null,
  monthlyBudget: null,
  estimatedMin: null,
  estimatedMax: null,
  name: '',
  phone: '',
  privacyAgreed: true,
};

export const useQuoteStore = create<QuoteState & QuoteActions>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step: number) => set({ currentStep: step }),
      setSelectionPath: (path: SelectionPath) => set({ selectionPath: path }),
      setCarBrand: (brand: Brand | null) => set({ carBrand: brand }),
      setCarModel: (model: string | null) => set({ carModel: model }),
      setTrim: (trim: string | null) => set({ trim }),
      setContractMonths: (months: ContractMonths | null) =>
        set({ contractMonths: months }),
      setAnnualKm: (km: AnnualKm | null) => set({ annualKm: km }),
      setDeposit: (amount: Deposit | null) => set({ deposit: amount }),
      setPrepaymentPct: (pct: PrepaymentPct | null) =>
        set({ prepaymentPct: pct }),
      setMonthlyBudget: (budget: number | null) =>
        set({ monthlyBudget: budget }),
      setEstimatedMin: (min: number | null) => set({ estimatedMin: min }),
      setEstimatedMax: (max: number | null) => set({ estimatedMax: max }),
      setName: (name: string) => set({ name }),
      setPhone: (phone: string) => set({ phone }),
      setPrivacyAgreed: (agreed: boolean) => set({ privacyAgreed: agreed }),

      resetAll: () => set(initialState),
    }),
    {
      name: 'cadam-quote-store',
      partialize: (state) => ({
        currentStep: state.currentStep,
        selectionPath: state.selectionPath,
        carBrand: state.carBrand,
        carModel: state.carModel,
        trim: state.trim,
        contractMonths: state.contractMonths,
        annualKm: state.annualKm,
        deposit: state.deposit,
        prepaymentPct: state.prepaymentPct,
        monthlyBudget: state.monthlyBudget,
        estimatedMin: state.estimatedMin,
        estimatedMax: state.estimatedMax,
        name: state.name,
        phone: state.phone,
        privacyAgreed: state.privacyAgreed,
      }),
    }
  )
);
