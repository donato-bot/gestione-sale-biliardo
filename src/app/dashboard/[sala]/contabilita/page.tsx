"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/contabilita/page.tsx
// OBIETTIVO: Rotta per il Libro Mastro (Gestisce l'URL e chiama il Componente)
// ==========================================

import { useParams } from 'next/navigation';
import LibroMastro from '@/components/LibroMastro';

export default function ContabilitaPage() {
  const params = useParams();
  const salaId = params.sala as string;

  // Passiamo il salaId come prop al componente motore
  return <LibroMastro salaId={salaId} />;
}