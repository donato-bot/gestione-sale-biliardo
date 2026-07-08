"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/page.tsx
// OBIETTIVO: Plancia Operativa Sala (Protetta da Kill Switch Amministrativo)
// ==========================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Plancia from "@/components/Plancia"; // Assicurati che il percorso del tuo componente sia corretto

export default function DashboardSalaPage() {
  const params = useParams();
  const salaId = params.sala as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [salaAttiva, setSalaAttiva] = useState<boolean>(true);
  const [nomeSala, setNomeSala] = useState("");

  useEffect(() => {
    if (salaId) {
      verificaStatoAbbonamento();
    }
  }, [salaId]);

  async function verificaStatoAbbonamento() {
    try {
      const { data, error } = await supabase
        .from("sale")
        .select("name, is_active")
        .eq("id", salaId)
        .single();

      if (error || !data) {
        console.error("Impossibile recuperare lo stato della sala");
        setLoading(false);
        return;
      }

      setNomeSala(data.name || "CLUB");
      
      // Se is_active è esplicitamente impostato a false, scatta il Kill Switch
      if (data.is_active === false) {
        setSalaAttiva(false);
      } else {
        setSalaAttiva(true);
      }
    } catch (err) {
      console.error("Errore di rete durante la verifica:", err);
    } finally {
      setLoading(false);
    }
  }

  // 1. Schermata di caricamento iniziale
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-sm font-black text-cyan-500 animate-pulse uppercase tracking-widest">
          Sincronizzazione Terminale di Sala...
        </p>
      </div>
    );
  }

  // 2. IL KILL SWITCH IN AZIONE (Schermata di blocco se la sala è sospesa)
  if (!salaAttiva) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-black border-2 border-red-900 rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-[0_0_60px_rgba(220,38,38,0.25)] animate-in fade-in duration-300">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">SISTEMA DISATTIVATO</h2>
          <p className="text-red-400 font-bold text-sm uppercase tracking-wider mb-6">{nomeSala}</p>
          
          <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl text-gray-400 text-sm font-medium space-y-3 mb-8">
            <p>L'accesso alla plancia operativa di questo club è stato sospeso dalla direzione centrale.</p>
            <p className="text-xs text-zinc-500 font-bold uppercase">Motivazione: Contributo di rinnovo scaduto o sospensione amministrativa.</p>
          </div>

          <p className="text-xs text-zinc-600 font-bold uppercase mb-2">Per sbloccare il terminale, contatta l'amministratore:</p>
          <p className="text-cyan-400 font-mono text-xs mb-8">donatorzz1946@gmail.com</p>

          <button 
            type="button"
            onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs border border-zinc-700 transition-colors"
          >
            ← Disconnetti Account
          </button>
        </div>
      </div>
    );
  }

  // 3. SE TUTTO È OK, PARTE LA PLANCIA REGOLARE
  return <Plancia salaId={salaId} />;
}