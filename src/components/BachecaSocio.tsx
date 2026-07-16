"use client";

// ==========================================
// FILE: src/components/BachecaSocio.tsx
// OBIETTIVO: Componente che mostra i Tornei e gli Avvisi ai soci nell'AppWeb
// ==========================================

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BachecaSocio({ salaId, socioId }: { salaId: string, socioId: string }) {
  const [torneiAperti, setTorneiAperti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function caricaBacheca() {
      setLoading(true);
      // Peschiamo solo i tornei della sala che hanno le iscrizioni aperte
      const { data, error } = await supabase
        .from('tornei')
        .select('*')
        .eq('sala_id', salaId)
        .in('stato', ['iscrizioni', 'Iscrizioni Aperte'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Errore caricamento bacheca:", error.message);
      } else if (data) {
        setTorneiAperti(data);
      }
      setLoading(false);
    }

    if (salaId) caricaBacheca();
  }, [salaId]);

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 mb-8 text-center animate-pulse">
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Aggiornamento Bacheca...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-[2rem] p-6 mb-8 shadow-inner">
      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Bacheca Club
      </h3>

      {torneiAperti.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Nessun evento in programma</p>
        </div>
      ) : (
        <div className="space-y-4">
          {torneiAperti.map(torneo => (
            <div key={torneo.id} className="bg-black border border-gray-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#E91E63]"></div>
              <span className="text-[9px] bg-[#E91E63]/20 text-[#E91E63] px-2 py-1 rounded font-black uppercase tracking-widest mb-2 inline-block">
                Nuovo Bando
              </span>
              <h4 className="text-white font-black uppercase text-sm mb-1">{torneo.titolo}</h4>
              <p className="text-gray-400 text-[10px] font-bold uppercase mb-3">
                {torneo.specialita} • Quota: €{torneo.quota_iscrizione}
              </p>
              
              {/* Il bottone per ora è visivo, in futuro lo collegheremo all'iscrizione automatica */}
              <button disabled className="w-full bg-gray-800 text-gray-500 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                Rivolgiti al Banco per l'iscrizione
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}