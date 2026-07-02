// components/TorneiSocio.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import TabelloneRender from "./TabelloneRender";

export default function TorneiSocio({ salaId }: { salaId: string }) {
  const [torneo, setTorneo] = useState<any>(null);
  const [partite, setPartite] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTorneoData() {
      const { data: torneoData } = await supabase
        .from('tornei')
        .select('*')
        .eq('sala_id', salaId)
        .in('stato', ['in_corso', 'concluso'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (torneoData) {
        setTorneo(torneoData);
        const { data: partiteData } = await supabase
          .from('partite_torneo')
          .select('*')
          .eq('torneo_id', torneoData.id)
          .order('partita_num', { ascending: true });
        
        if (partiteData) setPartite(partiteData);
      }
      setLoading(false);
    }
    fetchTorneoData();
  }, [salaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#00E5FF] font-black uppercase text-xs tracking-widest animate-pulse">
        Sincronizzazione Tabellone...
      </div>
    );
  }

  if (!torneo) {
    return (
      <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-2xl p-10 flex flex-col items-center justify-center opacity-70 text-center mt-6 shadow-lg">
        <span className="text-4xl mb-3">🏆</span>
        <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Nessun torneo attivo al momento.</p>
      </div>
    );
  }

  return (
    <div className="text-white space-y-6 animate-in fade-in duration-300">
      
      {/* INTESTAZIONE TORNEO */}
      <div className="bg-[#1A1D24] p-6 rounded-lg border border-[#2A2E39] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-wider text-white mb-1">
            {torneo.nome}
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase">
              {torneo.disciplina}
            </span>
            <span className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-md ${torneo.stato === 'in_corso' ? 'bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/30' : 'bg-gray-700/50 text-gray-400 border border-gray-600'}`}>
              {torneo.stato.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* TABELLONE RENDER CON SCORRIMENTO 2D */}
      <div className="bg-[#1A1D24] rounded-lg border border-[#2A2E39] shadow-lg flex flex-col overflow-hidden">
        
        {/* Header della finestra del tabellone */}
        <div className="p-4 border-b border-[#2A2E39] flex justify-between items-center bg-[#11141A]">
          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">
            Tabellone Gare
          </h3>
          <span className="text-[10px] text-[#FFCC00] font-bold uppercase animate-pulse flex items-center gap-2">
            <span className="text-sm">🖐️</span> Scorri per esplorare
          </span>
        </div>
        
        {/* Viewport di scorrimento: overflow-auto abilita XY, altezza fissa crea la finestra */}
        <div className="w-full h-[55vh] min-h-[400px] overflow-auto custom-scrollbar p-6 bg-[#050505]">
          {/* Forziamo una larghezza e altezza minima generosa per permettere al componente TabelloneRender di espandersi totalmente senza comprimersi, attivando così le barre di scorrimento */}
          <div className="min-w-[1200px] min-h-[800px]">
            <TabelloneRender partite={partite} vistaCompatta={true} />
          </div>
        </div>

      </div>
      
    </div>
  );
}