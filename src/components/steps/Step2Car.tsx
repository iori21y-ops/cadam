'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getVehiclesByBrand,
  type Brand,
  type Vehicle,
} from '@/constants/vehicles';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';

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

  const handleVehicleSelect = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  const handleTrimSelect = useCallback(
    (vehicle: Vehicle, trim: string) => {
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
  }, []);

  return (
    <>
      {/* Step heading */}
      <div className="pt-7 px-5 pb-2 text-center">
        <h2 className="text-[22px] font-bold text-gray-900 leading-snug">
          차종을 선택해 주세요
        </h2>
      </div>

      {/* Brand tabs - sticky */}
      <div className="sticky top-0 z-10 bg-white border-b-2 border-gray-200 mx-5">
        <div className="flex">
          {BRANDS.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => {
                setActiveBrand(brand);
                setSelectedVehicle(null);
              }}
              className={`
                flex-1 py-2.5 border-none bg-transparent text-sm font-semibold
                border-b-2 border-transparent -mb-0.5 transition-all duration-150
                ${
                  activeBrand === brand
                    ? 'text-accent border-b-accent'
                    : 'text-gray-400'
                }
              `}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Category sub-filter - horizontal scroll */}
      <div className="flex gap-2 px-5 py-2.5 overflow-x-auto shrink-0">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setActiveCategory(cat);
              setSelectedVehicle(null);
            }}
            className={`
              shrink-0 py-1.5 px-3.5 rounded-2xl border text-xs font-semibold
              transition-all duration-150
              ${
                activeCategory === cat
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white border-gray-300 text-gray-500'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Vehicle grid - scroll area */}
      <div className="px-5 py-3 overflow-y-auto max-h-[340px]">
        {filteredVehicles.length === 0 ? (
          <p className="py-8 text-center text-gray-500 text-sm">
            해당 차종이 없습니다
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.id} className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleVehicleSelect(vehicle)}
                  className={`
                    p-3.5 py-3.5 border-2 rounded-xl bg-white cursor-pointer
                    text-center transition-all duration-150
                    ${
                      selectedVehicle?.id === vehicle.id
                        ? 'border-accent bg-[#EBF5FB]'
                        : 'border-gray-200 hover:border-accent hover:bg-[#EBF5FB]'
                    }
                  `}
                >
                  <div className="text-sm font-semibold text-gray-900">
                    {vehicle.model}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    {vehicle.segment}
                  </div>
                </button>

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
                        <div className="mt-2 p-3 border-2 border-accent rounded-xl bg-[#EBF5FB]">
                          <div className="text-xs font-semibold text-gray-700 mb-2">
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
                                className="px-3 py-1.5 rounded-lg bg-white border border-accent text-accent text-xs font-semibold hover:bg-accent hover:text-white transition-colors"
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
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {selectedVehicle.model}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
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
                      className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white text-left font-semibold text-gray-900 hover:border-accent hover:bg-[#EBF5FB] transition-all"
                    >
                      {trim}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={closeTrimSheet}
                  className="w-full mt-4 py-3 text-sm text-gray-500 font-medium"
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
