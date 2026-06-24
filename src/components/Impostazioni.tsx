"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Impostazioni({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [tariffaStandard, setTariffaStandard] = useState<number>(8);
  const [tariffaSoci, setTariffaSoci] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [messaggio, setMessaggio] = useState("");

  // Recupero dati iniziali dal database
  useEffect(() => {
    async function fetchImpostazioni() {
      if (!salaId) return;
      const { data, error } = await supabase
        .from('sale')
        .select('tariffa_standard, tariffa_soci')
        .eq('id', salaId)
        .single();

      if (data) {
        if (data.tariffa_standard) setTariffaStandard(data.tariffa_standard);
        if (data.tariffa_soci) setTariffaSoci(data.tariffa_soci);
      }
    }
    fetchImpostazioni();
  }, [salaId]);

  const salvaTariffe = async () => {
    setLoading(true);
    setMessaggio("");
    
    // Aggiornamento sul DB
    const { error } = await supabase
      .from('sale')
      .update({ tariffa_standard: tariffaStandard, tariffa_soci: tariffaSoci })
      .eq('id', salaId);

    setLoading(false);
    if (error) {
      setMessaggio("Errore durante il salvataggio.");
      console.error(error);
    } else {
      setMessaggio("Tariffe aggiornate con successo!");
      setTimeout(() => setMessaggio(""), 3000);
    }
  };

  // Funzione di ritorno alla Torre di Controllo
  const handleReturn = () => {
    if (typeof setActiveView === 'function') {
      setActiveView("hub");
    } else {
      window.location.href = window.location.pathname;
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center">
      <div className="w-full max-w-7xl bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* HEADER CON PULSANTE DI RITORNO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Configurazione Sistema</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Impostazioni</h2>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleReturn} className="bg-[#00ADC6] hover:bg-[#008A9E] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,173,198,0.2)]">
              ← Torre di Controllo
            </button>
          </div>
        </div>

        {/* CONTENUTO PRINCIPALE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* MODULO: TARIFFE */}
          <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-2xl p-8">
            <h3 className="text-xl font-black text-white uppercase italic mb-6 border-b border-[#2A2E39] pb-4">Configurazione Tariffe</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 block">Standard (€/h)</label>
                <input 
                  type="number" 
                  value={tariffaStandard}
                  onChange={(e) => setTariffaStandard(Number(e.target.value))}
                  className="w-full bg-black text-white font-bold text-2xl p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#00ADC6] transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#FFB300] font-black uppercase tracking-widest mb-2 block">Soci (€/h)</label>
                <input 
                  type="number" 
                  value={tariffaSoci}
                  onChange={(e) => setTariffaSoci(Number(e.target.value))}
                  className="w-full bg-black text-white font-bold text-2xl p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#FFB300] transition-colors"
                />
              </div>

              <button 
                onClick={salvaTariffe}
                disabled={loading}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_5px_20px_rgba(16,185,129,0.3)] mt-2"
              >
                {loading ? "Salvataggio..." : "Salva Tariffe"}
              </button>

              {messaggio && (
                <p className="text-center text-sm font-bold text-[#00E5FF] mt-4">{messaggio}</p>
              )}
            </div>
          </div>

          {/* MODULO: SICUREZZA E PRIVACY */}
          <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-2xl p-8">
            <h3 className="text-xl font-black text-[#E91E63] uppercase italic mb-6 border-b border-[#2A2E39] pb-4">Sicurezza e Privacy</h3>
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <span className="text-4xl mb-4">🔒</span>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest text-center">
                Impostazioni di sicurezza<br/>attualmente in configurazione
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}