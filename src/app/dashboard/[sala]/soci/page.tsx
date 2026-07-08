"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/soci/page.tsx
// OBIETTIVO: Rotta per l'Anagrafica Soci (Intercetta l'URL e chiama il Componente)
// ==========================================

import { useParams } from 'next/navigation';
import Soci from '@/components/Soci';

export default function SociPage() {
  const params = useParams();
  const salaId = params.sala as string;

  // Passiamo il parametro salaId al componente riutilizzabile
  return <Soci salaId={salaId} />;
}