"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import PlanciaCassaManager from "@/components/PlanciaCassaManager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AreaRiservataSalaPage({ params }: PageProps) {
  // Scompattiamo i parametri dinamici della rotta (l'ID della sala)
  const resolvedParams = use(params);
  const salaId = resolvedParams.id;

  const [nomeSala, setNomeSala] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function inizializzaPlancia() {
      // 1. Controlliamo se il manager è loggato
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // 2. Recuperiamo il nome della sala corrente per l'intestazione
      const { data: salaData, error } = await supabase
        .from("sale")
        .select("name")
        .eq("id", salaId)
        .single();

      if (!error && salaData) {
        setNomeSala(salaData.name);
      }
      setLoading(false);
    }

    inizializzaPlancia();
  }, [salaId, router]);

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
          
          {/* Richiamiamo il nostro componente passandogli l'id della sala */}
          <PlanciaCassaManager salaId={salaId} />
        </div>

      </div>
    </div>
  );
}