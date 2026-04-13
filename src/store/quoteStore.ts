import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Brand } from '@/constants/vehicles';
import { loadProgress } from '@/lib/mission-progress';
import { VEHICLES } from '@/data/diagnosis-vehicles';

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
  /** 진단 결과를 quoteStore에 자동 세팅 */
  prefillFromDiagnosis: () => boolean;
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

      prefillFromDiagnosis: () => {
        const progress = loadProgress();
        const updates: Partial<QuoteState> = {};
        let prefilled = false;

        // 차종 진단 결과 → carBrand, carModel
        if (progress.vehicle.done && progress.vehicle.summary) {
          const parts = progress.vehicle.summary.split(' ');
          if (parts.length >= 2) {
            const brand = parts[0];
            const name = parts.slice(1).join(' ');
            const found = VEHICLES.find((v) => v.brand === brand && v.name === name);
            if (found) {
              updates.carBrand = found.brand as Brand;
              updates.carModel = found.name;
              updates.selectionPath = 'car';
              prefilled = true;
            }
          }
        }

        // 이용방법 진단 결과 → annualKm
        const mileageVal = progress.finance.answers?.mileage?.value;
        if (mileageVal) {
          const km = Number(mileageVal);
          if ([10000, 20000, 30000, 40000].includes(km)) {
            updates.annualKm = km as AnnualKm;
          }
        }

        // 초기 단계로 설정
        if (prefilled) {
          updates.currentStep = 1;
        }

        if (Object.keys(updates).length > 0) {
          set(updates);
        }
        return prefilled;
      },
    }),
    {
      name: 'rentailor-quote-store',
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
