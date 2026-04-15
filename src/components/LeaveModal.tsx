'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gtag } from '@/lib/gtag';
import { Button } from '@/components/ui/Button';
import { IconWarning } from '@/components/icons/RentailorIcons';

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
            <div className="mb-2 flex justify-center"><IconWarning size={32} className="text-amber-500" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              잠깐, 아직 견적이 완성되지 않았어요!
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              지금까지 선택한 내용이 사라질 수 있습니다.
              <br />
              견적을 완성하고 최저가를 확인해 보세요.
            </p>
            <Button type="button" variant="primary" size="lg" fullWidth onClick={handleStay}>
              이어서 견적 받기
            </Button>
            <Button type="button" variant="ghost" onClick={handleExit} className="mt-2">
              나중에 할게요
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
