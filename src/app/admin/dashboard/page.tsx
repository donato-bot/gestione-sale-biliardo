"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardAdmin() {
  const [sala, setSala] = useState<any>(null);
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAdmin() {
      // Recupera la sala del gestore loggato
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: salaData } = await supabase
        .from('sale')
        .select('*')
        .eq('manager_email', user.email)
        .single();

      if (salaData) {
        setSala(salaData);
        // Recupera le prenotazioni per quella specifica sala
        const { data: prenotazioniData } = await supabase
          .from('prenotazioni')
          .select('*')
          .eq('sala_id', salaData.id)
          .order('data_ora', { ascending: true });
        
        if (prenotazioniData) setPrenotazioni(prenotazioniData);
      }
      setLoading(false);
    }
    initAdmin();
  }, []);

  const eliminaPrenotazione = async (id: string) => {
    const { error } = await supabase.from('prenotazioni').delete().eq('id', id);
    if (!error) {
      setPrenotazioni(prenotazioni.filter(p => p.id !== id));
    }
  };

  if (loading) return <div className="p-10 text-center text-white">Caricamento Torre di Controllo...</div>;

  return (
    <div className="min-h-screen bg-[#0B0D14] p-6 text-white font-sans">
      <header className="mb-10 border-b border-[#2A2E39] pb-6">
        <h1 className="text-4xl font-black uppercase italic">Torre di Controllo</h1>
        <p className="text-[#00ADC6] font-bold uppercase tracking-widest text-sm">{sala?.name || "Sala non trovata"}</p>
      </header>

      <main className="max-w-4xl mx-auto">
        <div className="bg-[#1A1D24] p-8 rounded-3xl border border-[#2A2E39] shadow-2xl">
          <h2 className="text-2xl font-black uppercase mb-8">Prenotazioni in Arrivo</h2>
          
          <div className="space-y-4">
            {prenotazioni.length > 0 ? (
              prenotazioni.map((p) => (
                <div key={p.id} className="bg-[#0B0D14] p-5 rounded-2xl flex justify-between items-center border border-[#2A2E39] hover:border-[#FFCC00] transition-colors">
                  <div>
                    <p className="text-lg font-black text-white">{p.nome_cliente}</p>
                    <p className="text-[#00E5FF] font-bold text-sm">
                      {new Date(p.data_ora).toLocaleString('it-IT', { 
                        weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                    {p.note && <p className="text-gray-500 text-xs mt-2 italic">"{p.note}"</p>}
                  </div>
                  <button 
                    onClick={() => eliminaPrenotazione(p.id)}
                    className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg font-black text-xs transition-all"
                  >
                    ELIMINA
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-[#2A2E39] rounded-2xl">
                <p className="text-gray-500 font-bold">Nessuna prenotazione attiva al momento.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}