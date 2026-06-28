// components/BachecaSocio.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BachecaSocio({ salaId }: { salaId: string }) {
  const [messaggi, setMessaggi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBacheca() {
      // Query isolata: il socio vede solo i messaggi della propria sala
      const { data, error } = await supabase
        .from('bacheca') 
        .select('*')
        .eq('sala_id', salaId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Errore nel recupero della bacheca:", error);
      } else if (data) {
        setMessaggi(data);
      }
      setLoading(false);
    }
    
    fetchBacheca();
  }, [salaId]);

  if (loading) return <div className="text-gray-500 p-4 text-xs font-bold">Caricamento Bacheca...</div>;

  return (
    <div className="text-white bg-[#1A1D24] p-6 rounded-lg border border-[#2A2E39] shadow-lg animate-in fade-in duration-300">
      <h2 className="text-2xl font-black uppercase tracking-wider mb-4 text-[#FFCC00]">Comunicazioni</h2>
      
      {messaggi.length === 0 ? (
        <div className="mt-6 text-gray-500 text-sm">
          Nessuna nuova comunicazione dal gestore per questa sala.
        </div>
      ) : (
        <ul className="space-y-4 mt-6">
          {messaggi.map((msg, index) => (
            <li key={index} className="bg-[#0B0D14] p-4 rounded border border-[#2A2E39] hover:border-[#FFCC00] transition-colors duration-300">
              <p className="text-[10px] text-[#00E5FF] mb-2 font-black uppercase tracking-widest">
                {new Date(msg.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{msg.messaggio}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}