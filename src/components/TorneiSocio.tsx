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

  if (loading) return <div className="text-gray-500 p-4 text-xs font-bold">Caricamento Torneo...</div>;
  if (!torneo) return <div className="text-gray-500 p-4 text-xs font-bold">Nessun torneo attivo al momento.</div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-white font-black uppercase text-lg">{torneo.nome}</h2>
        <p className="text-[#00E5FF] font-bold text-xs uppercase tracking-widest">{torneo.disciplina}</p>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <TabelloneRender partite={partite} vistaCompatta={true} />
      </div>
    </div>
  );
}