"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/magazzino/page.tsx
// OBIETTIVO: Rotta per il Magazzino (Intercetta l'URL e chiama il Componente)
// ==========================================

import { useParams } from 'next/navigation';
import Magazzino from '@/components/Magazzino';

export default function MagazzinoPage() {
  const params = useParams();
  const salaId = params.sala as string;

  // Passiamo il salaId come prop al componente motore
  return <Magazzino salaId={salaId} />;
}