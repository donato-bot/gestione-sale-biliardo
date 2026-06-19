import { useState } from 'react';

export function useStaffAuth() {
  const [activeStaff, setActiveStaff] = useState<any>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [pinBuffer, setPinBuffer] = useState("");

  const richiedePin = (callback: (staffId: string) => void, descrizione: string) => {
    setPendingAction({ callback, descrizione });
    setIsPinModalOpen(true);
  };

  return { activeStaff, setActiveStaff, isPinModalOpen, setIsPinModalOpen, richiedePin, pendingAction, pinBuffer, setPinBuffer };
}