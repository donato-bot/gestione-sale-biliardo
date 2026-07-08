"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/prenotazioni/page.tsx
// OBIETTIVO: Rotta per l'Agenda Prenotazioni
// ==========================================

import { useParams } from 'next/navigation';
import Prenotazioni from '@/components/Prenotazioni';

export default function PrenotazioniPage() {
  const params = useParams();
  const salaId = params.sala as string;

  return <Prenotazioni salaId={salaId} />;
}