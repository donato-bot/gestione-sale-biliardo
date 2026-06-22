"use client";

import React, { useState, useEffect } from 'react';
// Importazione centralizzata dal cuore del progetto
import { supabase } from "../app/lib/supabase";

export default function BachecaSocio({ salaId, socioId }: { salaId: string, socioId: string }) {
  const [notizie, setNotizie] = useState<any[]>([]);

  useEffect(() => { caricaNotizie(); }, [salaId]);

  async function caricaNotizie() {
    const { data, error } = await supabase
      .from('bacheca')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });
    
    if (data) setNotizie(data);
    if (error) console.error("Errore caricamento bacheca:", error);
  }

  async function iscriviti(bachecaId: string) {
    const { error } = await supabase
      .from('iscrizioni_torneo')
      .insert([{ bacheca_id: bachecaId, socio_id: socioId }]);
      
    if (error) {
      if (error.code === '23505') alert("Ti sei già iscritto a questo torneo!");
      else alert("Errore durante l'iscrizione: " + error.message);
    } else {
      alert("✅ Iscrizione effettuata con successo!");
    }
  }

  return (
    <div className="w-full space-y-4">
      <h3 className="text-xl font-black text-amber-500 uppercase mb-6">📰 Bacheca</h3>
      {notizie.length === 0 && <p className="text-gray-500 italic">Nessun avviso in bacheca.</p>}
      
      {notizie.map((n) => (
        <div key={n.id} className="p-6 rounded-3xl border bg-[#11131a] border-gray-800">
          {/* Badge Categoria */}
          <span className="inline-block px-3 py-1 mb-2 text-[10px] font-bold uppercase rounded-full bg-gray-800 text-gray-400">
            {n.categoria}
          </span>
          
          <h4 className="font-black text-white text-lg">{n.titolo}</h4>
          <p className="text-sm text-gray-300 mt-2">{n.contenuto}</p>
          
          {/* Pulsante Partecipa */}
          {n.categoria === 'torneo' && n.accetta_iscrizioni && (
            <button 
              onClick={() => iscriviti(n.id)} 
              className="w-full mt-4 bg-[#ff9900] hover:bg-orange-500 py-3 rounded-xl text-black font-black uppercase text-sm transition-all"
            >
              Partecipa al Torneo
            </button>
          )}
        </div>
      ))}
    </div>
  );
}