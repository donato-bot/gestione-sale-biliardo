"use client";

// ==========================================
// FILE: src/app/club/[sala]/page.tsx
// OBIETTIVO: Rotta Pubblica per l'App dei Soci (Bacheca e Tornei)
// ==========================================

import { useParams } from 'next/navigation';
import TorneiSocio from '@/components/TorneiSocio';

export default function ClubPublicPage() {
  const params = useParams();
  const salaId = params.sala as string;

  return (
    <div className="bg-[#050505] min-h-screen">
      <TorneiSocio salaId={salaId} />
    </div>
  );
}