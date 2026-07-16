"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BachecaSocio({ salaId, socioId }: { salaId: string, socioId: string }) {
  const [torneiAperti, setTorneiAperti] = useState<any[]>([]);
  const [avvisi, setAvvisi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function caricaDatiBacheca() {
      setLoading(true);

      // 1. Peschiamo i tornei aperti
      const torneiPromise = supabase
        .from('tornei')
        .select('*')
        .eq('sala_id', salaId)
        .in('stato', ['iscrizioni', 'Iscrizioni Aperte'])
        .order('created_at', { ascending: false });

      // 2. Peschiamo le comunicazioni della bacheca
      const avvisiPromise = supabase
        .from('bacheca')
        .select('*')
        .eq('sala_id', salaId)
        .order('created_at', { ascending: false })
        .limit(10); // Mostriamo gli ultimi 10 avvisi

      // Eseguiamo entrambe le ricerche in contemporanea per massima velocità
      const [torneiRes, avvisiRes] = await Promise.all([torneiPromise, avvisiPromise]);

      if (torneiRes.error) console.error("Errore caricamento tornei:", torneiRes.error.message);
      else if (torneiRes.data) setTorneiAperti(torneiRes.data);

      if (avvisiRes.error) console.error("Errore caricamento avvisi:", avvisiRes.error.message);
      else if (avvisiRes.data) setAvvisi(avvisiRes.data);

      setLoading(false);
    }

    if (salaId) caricaDatiBacheca();
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

      {torneiAperti.length === 0 && avvisi.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Nessun aggiornamento in bacheca</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* SEZIONE 1: COMUNICAZIONI (INFO, AVVISI, URGENTI) */}
          {avvisi.map(avviso => {
            // Logica dei colori in base al tipo di avviso
            let bgColor = "bg-blue-500/20";
            let textColor = "text-blue-500";
            let borderColor = "bg-blue-500";
            
            const tipo = (avviso.tipo || "INFO").toUpperCase();
            
            if (tipo === 'AVVISO') {
              bgColor = "bg-yellow-500/20";
              textColor = "text-yellow-500";
              borderColor = "bg-yellow-500";
            } else if (tipo === 'URGENTE') {
              bgColor = "bg-red-500/20";
              textColor = "text-red-500";
              borderColor = "bg-red-500";
            }

            const dataPubblicazione = new Date(avviso.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });

            return (
              <div key={avviso.id} className="bg-black border border-gray-800 p-4 rounded-2xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`}></div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] ${bgColor} ${textColor} px-2 py-1 rounded font-black uppercase tracking-widest`}>
                    {tipo}
                  </span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase">{dataPubblicazione}</span>
                </div>
                
                <h4 className="text-white font-black uppercase text-xs mb-1">{avviso.titolo}</h4>
                <p className="text-gray-400 text-[10px] font-bold leading-relaxed">
                  {/* Gestisco sia il nome colonna 'testo' che 'messaggio' in base a come l'hai salvata nel DB */}
                  {avviso.testo || avviso.messaggio} 
                </p>
              </div>
            );
          })}

          {/* SEZIONE 2: BANDI DEI TORNEI */}
          {torneiAperti.map(torneo => (
            <div key={torneo.id} className="bg-black border border-gray-800 p-4 rounded-2xl relative overflow-hidden mt-4">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#E91E63]"></div>
              <span className="text-[9px] bg-[#E91E63]/20 text-[#E91E63] px-2 py-1 rounded font-black uppercase tracking-widest mb-2 inline-block">
                Nuovo Bando Torneo
              </span>
              <h4 className="text-white font-black uppercase text-sm mb-1">{torneo.titolo}</h4>
              <p className="text-gray-400 text-[10px] font-bold uppercase mb-3">
                {torneo.specialita} • Quota: €{torneo.quota_iscrizione}
              </p>
              
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