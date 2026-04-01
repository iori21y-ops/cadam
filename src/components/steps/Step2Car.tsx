'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FilterPill } from '@/components/ui/FilterPill';
import {
  getVehiclesByBrand,
  type Brand,
  type Vehicle,
} from '@/constants/vehicles';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import { SelectCard } from '@/components/ui/SelectCard';

type CategoryFilter = '전체' | '세단' | 'SUV' | 'EV';

const BRANDS: Brand[] = ['현대', '기아', '제네시스'];
const CATEGORY_FILTERS: CategoryFilter[] = ['전체', '세단', 'SUV', 'EV'];

const TRANSITION_DELAY_MS = 300;

function filterByCategory(vehicles: Vehicle[], category: CategoryFilter): Vehicle[] {
  if (category === '전체') return vehicles;
  return vehicles.filter((v) => v.category === category);
}

export function Step2Car() {
  const [activeBrand, setActiveBrand] = useState<Brand>('현대');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('전체');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedTrim, setSelectedTrim] = useState<string | null>(null);

  const setCarBrand = useQuoteStore((s) => s.setCarBrand);
  const setCarModel = useQuoteStore((s) => s.setCarModel);
  const setTrim = useQuoteStore((s) => s.setTrim);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const vehiclesByBrand = useMemo(
    () => getVehiclesByBrand(activeBrand),
    [activeBrand]
  );

  const filteredVehicles = useMemo(
    () => filterByCategory(vehiclesByBrand, activeCategory),
    [vehiclesByBrand, activeCategory]
  );

  const handleVehicleSelect = useCallback(
    (vehicle: Vehicle) => {
      const isSame = selectedVehicle?.id === vehicle.id;

      if (isSame) {
        // 선택 취소: 카드 재클릭 시 트림 UI 닫기
        setSelectedVehicle(null);
        setSelectedTrim(null);
        // 이전 선택값이 persist 될 수 있으니, 취소 시 스토어도 함께 초기화
        setCarBrand(null);
        setCarModel(null);
        setTrim(null);
        return;
      }

      // 다른 차량 선택
      setSelectedVehicle(vehicle);
      setSelectedTrim(null);
    },
    [selectedVehicle?.id, setCarBrand, setCarModel, setTrim]
  );

  const handleTrimSelect = useCallback(
    (vehicle: Vehicle, trim: string) => {
      setSelectedTrim(trim);
      setCarBrand(vehicle.brand);
      setCarModel(vehicle.model);
      setTrim(trim);
      gtag.stepComplete(2, `${vehicle.model} ${trim}`);
      setTimeout(() => {
        setCurrentStep(3);
      }, TRANSITION_DELAY_MS);
    },
    [setCarBrand, setCarModel, setTrim, setCurrentStep]
  );

  const closeTrimSheet = useCallback(() => {
    setSelectedVehicle(null);
    setSelectedTrim(null);
    setCarBrand(null);
    setCarModel(null);
    setTrim(null);
  }, [setCarBrand, setCarModel, setTrim]);

  return (
    <>
      {/* Step heading */}
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-text leading-snug">
          차종을 선택해 주세요
        </h2>
      </div>

      {/* Brand tabs - sticky */}
      <div className="sticky top-0 z-10 bg-surface-secondary px-5 pt-1 pb-2">
        <div className="bg-white border border-border-solid rounded-2xl overflow-hidden">
          <div className="flex">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => {
                setActiveBrand(brand);
                setSelectedVehicle(null);
                setSelectedTrim(null);
                setCarBrand(null);
                setCarModel(null);
                setTrim(null);
              }}
              className={`
                flex-1 py-2.5 border-none bg-transparent text-sm font-semibold
                border-b-2 border-transparent -mb-0.5 transition-all duration-150
                ${
                  activeBrand === brand
                    ? 'text-primary border-b-primary'
                    : 'text-text-muted'
                }
              `}
            >
              {brand}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Category sub-filter - horizontal scroll */}
      <div className="flex gap-2 px-5 py-2.5 overflow-x-auto shrink-0">
        {CATEGORY_FILTERS.map((cat) => (
          <FilterPill
            key={cat}
            active={activeCategory === cat}
            onClick={() => {
              setActiveCategory(cat);
              setSelectedVehicle(null);
              setSelectedTrim(null);
              setCarBrand(null);
              setCarModel(null);
              setTrim(null);
            }}
          >
            {cat}
          </FilterPill>
        ))}
      </div>

      {/* Vehicle grid - scroll area */}
      <div className="px-5 py-3 overflow-y-auto max-h-[340px] scrollbar-hide">
        {filteredVehicles.length === 0 ? (
          <p className="py-8 text-center text-text-sub text-sm">
            해당 차종이 없습니다
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex flex-col">
                {(() => {
                  const isVehicleSelected = selectedVehicle?.id === vehicle.id;
                  const disabled = selectedVehicle !== null && !isVehicleSelected;
                  const dimmed = disabled;

                  return (
                    <>
                <SelectCard
                  compact
                  selected={isVehicleSelected}
                  dimmed={dimmed}
                  disabled={disabled}
                  onClick={() => handleVehicleSelect(vehicle)}
                >
                  <div className="flex-1 text-center">
                    <div
                      className={`text-[13px] font-medium ${
                        isVehicleSelected ? 'text-white' : 'text-text'
                      }`}
                    >
                      {vehicle.model}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isVehicleSelected ? 'text-white/60' : 'text-text-muted'
                      }`}
                    >
                      {vehicle.segment}
                    </div>
                  </div>
                </SelectCard>

                {/* Desktop: inline trim expand (md+) */}
                <div className="hidden md:block">
                  <AnimatePresence>
                    {selectedVehicle?.id === vehicle.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 border border-primary rounded-2xl bg-primary/5">
                          <div className="text-xs font-semibold text-text mb-2">
                            트림 선택
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {vehicle.trims.map((trim) => (
                              <button
                                key={trim}
                                type="button"
                                onClick={() =>
                                  handleTrimSelect(vehicle, trim)
                                }
                                className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-colors border ${
                                  selectedTrim === trim
                                    ? 'bg-primary border-primary text-white shadow-[0_4px_24px_rgba(0,122,255,0.25)]'
                                    : 'bg-white border-border-solid text-text hover:border-primary'
                                }`}
                              >
                                {trim}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile: bottom sheet for trim selection */}
      <AnimatePresence>
        {selectedVehicle && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeTrimSheet}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            {/* Bottom sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white rounded-t-2xl shadow-lg max-h-[70vh] overflow-hidden"
            >
              <div className="p-5 pb-8">
                <div className="w-12 h-1 bg-[#D1D1D6] rounded-full mx-auto mb-4" />
                <h3 className="text-base font-bold text-text mb-1">
                  {selectedVehicle.model}
                </h3>
                <p className="text-sm text-text-sub mb-4">
                  트림을 선택해 주세요
                </p>
                <div className="flex flex-col gap-2">
                  {selectedVehicle.trims.map((trim) => (
                    <button
                      key={trim}
                      type="button"
                      onClick={() =>
                        handleTrimSelect(selectedVehicle, trim)
                      }
                      className={`w-full p-4 border rounded-2xl text-left font-semibold transition-all ${
                        selectedTrim === trim
                                ? 'bg-primary border-primary text-white shadow-[0_4px_24px_rgba(0,122,255,0.25)]'
                                : 'bg-white border-border-solid text-text hover:border-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span>{trim}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={closeTrimSheet}
                  className="w-full mt-4 py-3 text-sm text-text-sub font-medium"
                >
                  취소
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
