"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import PlanciaCassaManager from "@/components/PlanciaCassaManager";

export default function AreaRiservataSalaPage() {
  const router = useRouter();
  const urlParams = useParams();
  
  // Cattura l'ID dall'URL in modo dinamico e flessibile
  // Cerca 'id', se non lo trova cerca il primo parametro disponibile nell'oggetto
  const salaId = (urlParams?.id || Object.values(urlParams)[0]) as string | undefined;

  const [nomeSala, setNomeSala] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function inizializzaPlancia() {
      if (!salaId) {
        return;
      }

      try {
        // Controllo sessione manager
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        // Recupero informazioni della sala dal Database
        const { data: salaData, error } = await supabase
          .from("sale")
          .select("name")
          .eq("id", salaId)
          .single();

        if (!error && salaData) {
          setNomeSala(salaData.name);
        }
      } catch (err) {
        console.error("Errore durante l'inizializzazione:", err);
      } finally {
        setLoading(false);
      }
    }

    inizializzaPlancia();
  }, [salaId, router]);

  if (!salaId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-xs tracking-widest">
        🛑 ID Sala non rilevato dall'indirizzo URL
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase text-xs">
          Caricamento Plancia...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 md:p-12 font-sans">
      <div className="w-full max-w-[1400px] mx-auto space-y-10">
        
        {/* INTESTAZIONE DELLA SALA */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              Area Gestore
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

        {/* IL LIBRO MASTRO E LA CHIUSURA DI CASSA */}
        <div className="border-t border-gray-900 pt-4">
          <h2 className="text-lg font-black uppercase tracking-widest mb-6 text-gray-400">
            📊 GESTIONE FLUSSI DI CASSA
          </h2>
          
          <PlanciaCassaManager salaId={salaId} />
        </div>

      </div>
    </div>
  );
}