'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConsultationTable } from '@/components/admin/ConsultationTable';
import { ConsultationDetail } from '@/components/admin/ConsultationDetail';

export default function AdminConsultationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectRow = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleUpdate = useCallback(() => {
    setRefreshTrigger((t) => t + 1);
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <h1 className="text-xl font-bold text-primary mb-6">상담 관리</h1>
      <ConsultationTable
        selectedId={selectedId}
        onSelectRow={handleSelectRow}
        refreshTrigger={refreshTrigger}
      />
      <AnimatePresence>
        {selectedId && (
          <ConsultationDetail
            key={selectedId}
            consultationId={selectedId}
            onClose={handleClose}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
