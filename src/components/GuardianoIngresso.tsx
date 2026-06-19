"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import Plancia from "./Plancia"; // Assicurati che il percorso sia corretto

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function GuardianoIngresso({ salaId }: { salaId: string }) {
  const [statoSala, setStatoSala] = useState<boolean | null>(null);
  const [configurazioneMancante, setConfigurazioneMancante] = useState<string[]>([]);

  useEffect(() => {
    async function verificaIntegrita() {
      const mancano = [];
      
      const { data: tariffe } = await supabase.from("tariffe").select("id").eq("sala_id", salaId);
      if (!tariffe || tariffe.length === 0) mancano.push("Configurazione Tariffe Orarie");

      const { data: tavoli } = await supabase.from("tavoli").select("id").eq("sala_id", salaId);
      if (!tavoli || tavoli.length === 0) mancano.push("Registrazione dei Tavoli in Sala");

      setConfigurazioneMancante(mancano);
      setStatoSala(mancano.length === 0);
    }
    verificaIntegrita();
  }, [salaId]);

  if (statoSala === null) return <div className="p-10 text-center text-white">Verifica integrità in corso...</div>;

  if (!statoSala) {
    return (
      <div className="p-10 max-w-2xl mx-auto bg-[#11131a] rounded-3xl border border-orange-900/50 mt-10">
        <h2 className="text-2xl font-black text-orange-500 uppercase italic mb-6">⚠️ Configurazione Incompleta</h2>
        <p className="text-gray-300 mb-6">Per poter avviare la gestione della sala, completa queste attività:</p>
        <ul className="space-y-4 mb-8">
          {configurazioneMancante.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3 text-white font-bold">
              <span className="bg-orange-600 w-6 h-6 rounded-full flex items-center justify-center text-[10px]">!</span>
              {item}
            </li>
          ))}
        </ul>
        <button 
          onClick={() => window.location.href = '/admin/configurazione'} 
          className="w-full bg-white text-black py-4 rounded-xl font-black uppercase hover:bg-gray-200 transition-all"
        >
          Vai alla Configurazione
        </button>
      </div>
    );
  }

  return <Plancia salaId={salaId} />;
}