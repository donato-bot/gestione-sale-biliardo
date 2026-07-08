"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import PlanciaCassaManager from "../../../components/PlanciaCassaManager";
import TabelloneTavoliManager from "../../../components/TabelloneTavoliManager";

export default function AreaRiservataSalaPage() {
  const router = useRouter();
  const urlParams = useParams();
  
  // Estrazione dinamica del parametro a prescindere dal nome assegnato alla cartella ([sala])
  const salaId = (urlParams?.sala || urlParams?.id || Object.values(urlParams)[0]) as string | undefined;

  const [nomeSala, setNomeSala] = useState("");
  const [loading, setLoading] = useState(true);
  const [chiaveRinfrescoCassa, setChiaveRinfrescoCassa] = useState(0);

  // Forza il rinfresco automatico della cassa quando un tavolo viene spento
  const forzaRinfrescoCassa = () => {
    setChiaveRinfrescoCassa(prev => prev + 1);
  };

  useEffect(() => {
    async function inizializzaPlancia() {
      if (!salaId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: salaData, error } = await supabase
          .from("sale")
          .select("name")
          .eq("id", salaId)
          .single();

        if (!error && salaData) {
          setNomeSala(salaData.name);
        }
      } catch (err) {
        console.error("Errore inizializzazione plancia:", err);
      } finally {
        setLoading(false);
      }
    }

    inizializzaPlancia();
  }, [salaId, router]);

  if (!salaId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-xs tracking-widest">
        🛑 ID Sala non intercettato dall'indirizzo URL
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase text-xs">
          Sincronizzazione Plancia...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 md:p-12 font-sans">
      <div className="w-full max-w-[1400px] mx-auto space-y-12">
        
        {/* INTESTAZIONE */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              Plancia Automatismi
            </span>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white italic mt-2">
              {nomeSala || "PLANCIA DI COMANDO"}
            </h1>
          </div>
          <button 
            type="button" 
            onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} 
            className="bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-white font-black px-6 py-2.5 rounded-xl uppercase tracking-widest text-xs transition-all"
          >
            Esci
          </button>
        </div>

        {/* SEZIONE PRIMARIA: TABELLONE AUTOMATICO DEI TAVOLI */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
            🎱 CONTROLLO UTENZE E TAVOLI DA GIOCO
          </h2>
          <TabelloneTavoliManager salaId={salaId} onMovimentoRegistrato={forzaRinfrescoCassa} />
        </div>

        {/* SEZIONE SECONDARIA: LIBRO MASTRO E BILANCIO DI CASSA */}
        <div className="border-t border-gray-900 pt-8 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
            📊 RENDICONTAZIONE E LIBRO MASTRO
          </h2>
          <PlanciaCassaManager key={chiaveRinfrescoCassa} salaId={salaId} />
        </div>

      </div>
    </div>
  );
}