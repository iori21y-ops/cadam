'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gtag } from '@/lib/gtag';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStep: number;
}

export function LeaveModal({ isOpen, onClose, currentStep }: LeaveModalProps) {
  useEffect(() => {
    if (isOpen) gtag.leaveIntent(currentStep);
  }, [isOpen, currentStep]);

  const handleStay = () => {
    gtag.leaveIntentStay(currentStep);
    onClose();
  };

  const handleExit = () => {
    gtag.leaveIntentExit(currentStep);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-[320px] rounded-2xl bg-white p-6 text-center shadow-xl"
          >
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              잠깐, 아직 견적이 완성되지 않았어요!
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              지금까지 선택한 내용이 사라질 수 있습니다.
              <br />
              견적을 완성하고 최저가를 확인해 보세요.
            </p>
            <button
              type="button"
              onClick={handleStay}
              className="w-full py-4 rounded-lg font-bold text-base bg-accent text-white hover:opacity-90 transition-opacity"
            >
              이어서 견적 받기
            </button>
            <button
              type="button"
              onClick={handleExit}
              className="mt-2 bg-transparent border-none text-gray-400 text-[13px] cursor-pointer underline hover:text-gray-500 transition-colors"
            >
              나중에 할게요
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
