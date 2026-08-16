// ==========================================
// FILE: src/app/page.tsx
// OBIETTIVO: Smistamento automatico se l'utente ha già una sessione attiva
// ==========================================
"use client";

import { useEffect } from "react";
import { supabase } from "./lib/supabase"; // <-- Percorso relativo corretto
import { useRouter } from "next/navigation";


const SUPER_ADMIN = "donatorzz1946@gmail.com";
export const dynamic = 'force-dynamic';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    async function verificaSessioneAttiva() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session || !session.user?.email) {
        router.push("/login");
        return;
      }

      const userEmail = session.user.email.toLowerCase();

      // CONTROLLO 1: Super Admin -> Torre di Controllo
      if (userEmail === SUPER_ADMIN) {
        // 👈 ECCO LA CORREZIONE: rotta aggiornata alla cartella corretta
        router.push("/admin/dashboard"); 
        return;
      } 
      
      // CONTROLLO 2: Gestore Sala -> Dashboard
      try {
        const { data: salaData } = await supabase
          .from("sale")
          .select("id")
          .eq("manager_email", userEmail)
          .single();

        if (salaData) {
          router.push(`/dashboard/${salaData.id}`);
        } else {
          // Anomalia: loggato ma senza sala assegnata. Disconnette e rimanda al login.
          await supabase.auth.signOut();
          router.push("/login");
        }
      } catch (err) {
        await supabase.auth.signOut();
        router.push("/login");
      }
    }

    verificaSessioneAttiva();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="p-4 text-center">
        <span className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto block mb-4"></span>
        <p className="text-gray-600 text-xs font-black uppercase tracking-widest animate-pulse">
          Verifica Canale di Ingresso...
        </p>
      </div>
    </div>
  );
}