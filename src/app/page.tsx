"use client";

import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function DashboardTrampolino() {
  const router = useRouter();

  useEffect(() => {
    async function smistaUtente() {
      const { data: { session } } = await supabase.auth.getSession();

      // Se non c'è sessione, si torna alla porta d'ingresso
      if (!session || !session.user?.email) {
        router.push("/login");
        return;
      }

      const userEmail = session.user.email.toLowerCase();

      // REGOLA DI SMISTAMENTO (Doppio Controllo)
      if (userEmail === "donatorzz1946@gmail.com") {
        // Se è il Super Admin, vai alla Torre di Controllo
        router.push("/admin");
      } else {
        // Se è un Manager, trova il codice della sua sala
        try {
          const { data: salaData } = await supabase
            .from("sale")
            .select("id")
            .eq("manager_email", userEmail)
            .single();

          if (salaData) {
            // E lo catapulta dentro la plancia con tutti i menù
            router.push(`/dashboard/${salaData.id}`);
          } else {
            // Se non ha una sala, torna al login
            router.push("/login");
          }
        } catch (err) {
          console.error("Errore smistamento manager:", err);
          router.push("/login");
        }
      }
    }

    smistaUtente();
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans">
      <div className="p-4 text-center space-y-4">
        <p className="text-cyan-500 text-xs font-black uppercase tracking-widest animate-pulse">
          ALLINEAMENTO ALLA PLANCIA OPERATIVA...
        </p>
      </div>
    </div>
  );
}