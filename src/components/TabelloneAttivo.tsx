"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TabelloneAttivo({ salaId }: { salaId: string }) {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);

  const fetchPrenotazioni = async () => {
    const { data, error } = await supabase
      .from('prenotazioni')
      .select('*')
      .eq('sala_id', salaId) // Assicurati che sala_id sia la colonna che identifica la sala
      .order('data_ora', { ascending: true });

    if (data) setPrenotazioni(data);
  };

  useEffect(() => {
    fetchPrenotazioni();
    const interval = setInterval(fetchPrenotazioni, 10000);
    return () => clearInterval(interval);
  }, [salaId]);

  return (
    <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-xl p-6 shadow-2xl w-full flex-1">
      <h2 className="text-white font-black uppercase mb-6 text-lg">Tabellone Attivo</h2>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[#2A2E39]">
            <th className="py-2 text-[#00BFA5] text-[10px] uppercase">Data/Ora</th>
            <th className="py-2 text-[#00BFA5] text-[10px] uppercase">Cliente</th>
            <th className="py-2 text-[#00BFA5] text-[10px] uppercase">Tavolo</th>
          </tr>
        </thead>
        <tbody>
          {prenotazioni.map((p) => (
            <tr key={p.id} className="border-b border-[#2A2E39]">
              <td className="py-3 text-white text-sm">{new Date(p.data_ora).toLocaleString()}</td>
              <td className="py-3 text-white text-sm">{p.nome_cliente}</td>
              <td className="py-3 text-white text-sm">{p.tavolo_numero}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}