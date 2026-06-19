"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useParams } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DirettaTorneo() {
  const params = useParams();
  const torneoId = params.torneo_id as string;
  const [torneo, setTorneo] = useState<any>(null);
  const [partite, setPartite] = useState<any[]>([]);

  useEffect(() => {
    async function caricaDati() {
      if (!torneoId) return;
      const { data: t } = await supabase.from("tornei").select("*").eq("id", torneoId).single();
      const { data: p } = await supabase.from("tornei_partite").select("*").eq("torneo_id", torneoId).order('id', { ascending: true });
      setTorneo(t);
      setPartite(p || []);
    }
    caricaDati();
    
    const channel = supabase.channel('realtime-diretta')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tornei_partite', filter: `torneo_id=eq.${torneoId}` }, caricaDati)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [torneoId]);

  if (!torneo) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Caricamento in corso...</div>;

  const turni = [...new Set(partite.map(p => p.fase))].sort();

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-black text-pink-500 uppercase italic">{torneo.nome}</h1>
          {torneo.stato === 'in_corso' && (
            <div className="flex items-center gap-2 bg-red-900/20 px-3 py-1 rounded-full border border-red-900">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {turni.map((fase) => (
            <div key={fase} className="bg-[#11131a] p-5 rounded-2xl border border-gray-800">
              <h2 className="text-sm font-black text-gray-400 mb-4 uppercase tracking-widest">{fase}</h2>
              <div className="space-y-3">
                {partite.filter(p => p.fase === fase).map(match => (
                  <div key={match.id} className="bg-black p-3 rounded-lg border border-gray-800 flex justify-between items-center text-sm">
                    <span className={`font-bold ${match.vincitore_nome === match.giocatore1_nome ? 'text-green-500' : 'text-gray-300'}`}>
                      {match.giocatore1_nome}
                    </span>
                    <span className="text-[9px] text-gray-700 font-black">VS</span>
                    <span className={`font-bold ${match.vincitore_nome === match.giocatore2_nome ? 'text-green-500' : 'text-gray-300'}`}>
                      {match.giocatore2_nome}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}