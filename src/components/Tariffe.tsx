// ==========================================
// FILE: src/components/Tariffe.tsx
// OBIETTIVO: Gestione Tariffa Generale e Eccezioni Tavoli (Design Premium)
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface TavoloEccezione {
  id: string;
  numero_tavolo: number;
  tariffa_personalizzata: number | null;
}

export default function Tariffe(props: any) {
  const [salaId, setSalaId] = useState<string | null>(props.salaId || null);
  const [tariffaGenerale, setTariffaGenerale] = useState<string>("8.00");
  const [tavoli, setTavoli] = useState<TavoloEccezione[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvataggioGen, setSalvataggioGen] = useState(false);

  useEffect(() => {
    if (!salaId && typeof window !== "undefined") {
      const pathArray = window.location.pathname.split("/");
      const urlId = pathArray[pathArray.length - 1];
      if (urlId && urlId.length > 10) setSalaId(urlId);
    }
  }, [salaId]);

  const caricaTariffe = useCallback(async () => {
    if (!salaId) return;
    setLoading(true);
    try {
      const { data: salaData, error: salaErr } = await supabase
        .from("sale")
        .select("tariffa_oraria")
        .eq("id", salaId)
        .single();

      if (!salaErr && salaData && salaData.tariffa_oraria) {
        setTariffaGenerale(salaData.tariffa_oraria.toString());
      }

      const { data: tavoliData, error: tavoliErr } = await supabase
        .from("tavoli_eccezioni")
        .select("*")
        .eq("sala_id", salaId)
        .order("numero_tavolo", { ascending: true });

      if (tavoliErr || !tavoliData || tavoliData.length === 0) {
        const defaultTavoli = Array.from({ length: 7 }, (_, i) => ({
          id: `default_${i + 1}`,
          numero_tavolo: i + 1,
          tariffa_personalizzata: null
        }));
        setTavoli(defaultTavoli);
      } else {
        setTavoli(tavoliData);
      }
    } catch (err: any) {
      console.error("Errore caricamento tariffe:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaTariffe();
  }, [caricaTariffe]);

  const aggiornaTariffaGenerale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaId) return;
    setSalvataggioGen(true);

    try {
      const valoreNum = parseFloat(tariffaGenerale.replace(",", ".")) || 0;
      const { error } = await supabase
        .from("sale")
        .update({ tariffa_oraria: valoreNum })
        .eq("id", salaId);

      if (error) throw error;
      alert("✅ Tariffa generale aggiornata con successo!");
    } catch (err: any) {
      alert("Errore aggiornamento tariffa: " + err.message);
    } finally {
      setSalvataggioGen(false);
    }
  };

  const aggiornaEccezioneTavolo = async (numeroTavolo: number, nuovoPrezzo: string) => {
    if (!salaId) return;
    const prezzoNum = nuovoPrezzo.trim() === "" ? null : parseFloat(nuovoPrezzo.replace(",", "."));

    try {
      const { error } = await supabase
        .from("tavoli_eccezioni")
        .upsert({
          sala_id: salaId,
          numero_tavolo: numeroTavolo,
          tariffa_personalizzata: prezzoNum
        }, { onConflict: 'sala_id,numero_tavolo' });

      if (error) throw error;

      setTavoli(prev =>
        prev.map(t => t.numero_tavolo === numeroTavolo ? { ...t, tariffa_personalizzata: prezzoNum } : t)
      );
    } catch (err: any) {
      alert("Errore salvataggio eccezione tavolo: " + err.message);
    }
  };

  const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

  if (loading) {
    return <div className="text-center p-10 text-cyan-500 font-black uppercase tracking-widest animate-pulse">Caricamento Modulo Tariffe...</div>;
  }

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TARIFFA GENERALE */}
        <div className="lg:col-span-1">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 rounded-2xl shadow-2xl shadow-black/60 p-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 mb-2">Tariffa Generale</h2>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-6 leading-relaxed">
              Questo è il prezzo base orario applicato a tutti i tavoli che non hanno un'eccezione configurata.
            </p>
            
            <form onSubmit={aggiornaTariffaGenerale} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Prezzo all'ora (€) *</label>
                <input 
                  type="text" 
                  required
                  value={tariffaGenerale} 
                  onChange={(e) => setTariffaGenerale(e.target.value)} 
                  className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-cyan-400 font-black text-sm focus:outline-none focus:border-cyan-500 transition-colors" 
                />
              </div>

              <button 
                type="submit" 
                disabled={salvataggioGen}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all shadow-lg mt-4"
              >
                {salvataggioGen ? "AGGIORNAMENTO..." : "AGGIORNA TARIFFA"}
              </button>
            </form>
          </div>
        </div>

        {/* ECCEZIONI TAVOLI */}
        <div className="lg:col-span-2">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
            <div className="p-6 border-b border-gray-700/50 bg-[#0b0e14]/50">
              <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400">Eccezioni Tavoli</h2>
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                Imposta una tariffa fissa per scavalcare il prezzo generale. Lascia vuoto per usare la tariffa generale.
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {tavoli.map(tavolo => {
                const haEccezione = tavolo.tariffa_personalizzata !== null && tavolo.tariffa_personalizzata !== undefined;
                
                return (
                  <div key={tavolo.numero_tavolo} className="bg-[#1e293b] border border-gray-700/50 p-4 rounded-xl flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-white font-black uppercase tracking-wider text-sm">Biliardo {tavolo.numero_tavolo}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                        {haEccezione 
                          ? `Tariffa personalizzata attiva: ${euro.format(tavolo.tariffa_personalizzata!)}/h` 
                          : `Applica generale: ${euro.format(parseFloat(tariffaGenerale) || 0)}/h`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="text"
                        placeholder="Default"
                        value={tavolo.tariffa_personalizzata !== null ? tavolo.tariffa_personalizzata : ""}
                        onChange={(e) => aggiornaEccezioneTavolo(tavolo.numero_tavolo, e.target.value)}
                        className="w-28 bg-[#0b0e14] border border-gray-600 focus:border-cyan-500 text-cyan-400 font-mono font-bold text-xs p-2 rounded-lg text-center"
                      />
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        {haEccezione ? "Personalizzato" : "€ Default"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}