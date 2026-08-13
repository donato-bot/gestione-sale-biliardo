// ==========================================
// FILE: src/app/dashboard/[sala]/tariffe/page.tsx
// OBIETTIVO: Modulo Impostazioni Tariffe (Design Premium)
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface Tavolo {
  id: string;
  nome: string;
  tariffa_specifica: number | null;
}

export default function TariffePage() {
  const router = useRouter();
  const params = useParams();
  const salaId = (params?.sala || Object.values(params)[0]) as string;

  const [tariffaBase, setTariffaBase] = useState<string>("0");
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvataggioGenerale, setSalvataggioGenerale] = useState(false);
  const [tavoloInSalvataggio, setTavoloInSalvataggio] = useState<string | null>(null);

  const caricaDati = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carica Tariffa Base della Sala
      const { data: salaData, error: salaError } = await supabase
        .from("sale")
        .select("tariffa_base")
        .eq("id", salaId)
        .single();

      if (salaError) throw salaError;
      if (salaData) setTariffaBase(salaData.tariffa_base?.toString() || "0");

      // 2. Carica i Tavoli per le tariffe specifiche
      const { data: tavoliData, error: tavoliError } = await supabase
        .from("tavoli")
        .select("id, nome, tariffa_specifica")
        .eq("sala_id", salaId)
        .order("nome", { ascending: true });

      if (tavoliError) throw tavoliError;
      if (tavoliData) setTavoli(tavoliData);

    } catch (err: any) {
      console.error("Errore caricamento tariffe:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaDati();
  }, [caricaDati]);

  // Salva Tariffa Base Globale
  const salvaTariffaBase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvataggioGenerale(true);
    
    const nuovaTariffaNum = parseFloat(tariffaBase.replace(',', '.'));
    
    if (isNaN(nuovaTariffaNum) || nuovaTariffaNum < 0) {
      alert("Inserisci un importo valido.");
      setSalvataggioGenerale(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("sale")
        .update({ tariffa_base: nuovaTariffaNum })
        .eq("id", salaId);
        
      if (error) throw error;
      alert("✅ Tariffa generale aggiornata con successo!");
    } catch (error: any) {
      alert("Errore salvataggio tariffa: " + error.message);
    } finally {
      setSalvataggioGenerale(false);
    }
  };

  // Salva Tariffa Specifica per singolo tavolo
  const salvaTariffaSpecifica = async (tavoloId: string, valoreInput: string) => {
    setTavoloInSalvataggio(tavoloId);
    
    let nuovaTariffa: number | null = null;
    
    if (valoreInput.trim() !== "") {
      nuovaTariffa = parseFloat(valoreInput.replace(',', '.'));
      if (isNaN(nuovaTariffa) || nuovaTariffa < 0) {
        alert("Inserisci un importo valido.");
        setTavoloInSalvataggio(null);
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("tavoli")
        .update({ tariffa_specifica: nuovaTariffa })
        .eq("id", tavoloId);
        
      if (error) throw error;
      
      // Aggiorna lo stato localmente
      setTavoli(tavoli.map(t => t.id === tavoloId ? { ...t, tariffa_specifica: nuovaTariffa } : t));
    } catch (error: any) {
      alert("Errore aggiornamento tavolo: " + error.message);
    } finally {
      setTavoloInSalvataggio(null);
    }
  };

  const formattatoreEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1200px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-gray-800 pb-4">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-2 flex items-center gap-2"
            >
              ← Torna alla Plancia
            </button>
            <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-1 mt-2">Pannello Amministrativo</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white italic">
              IMPOSTAZIONI TARIFFE
            </h1>
          </div>
        </header>

        {loading ? (
          <div className="text-center p-10 text-emerald-500 font-black uppercase tracking-widest animate-pulse">Caricamento impostazioni...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* BOX 1: TARIFFA GLOBALE */}
            <div className="lg:col-span-1">
              <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 rounded-2xl shadow-2xl shadow-black/60 p-6 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400 mb-2">Tariffa Generale</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest mb-6 leading-relaxed">
                    Questo è il prezzo base orario applicato a tutti i tavoli che non hanno un'eccezione configurata.
                  </p>
                  
                  <form onSubmit={salvaTariffaBase} className="space-y-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Prezzo all'ora (€)</label>
                      <input 
                        type="number" 
                        step="0.10"
                        required
                        value={tariffaBase} 
                        onChange={(e) => setTariffaBase(e.target.value)} 
                        className="w-full bg-[#1e293b] border-2 border-gray-700 p-4 rounded-xl text-emerald-400 font-black text-2xl focus:outline-none focus:border-emerald-500 transition-colors" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={salvataggioGenerale}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 text-white font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all shadow-lg mt-4"
                    >
                      {salvataggioGenerale ? "SALVATAGGIO..." : "AGGIORNA TARIFFA"}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* BOX 2: TARIFFE SPECIFICHE TAVOLI */}
            <div className="lg:col-span-2">
              <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
                <div className="p-6 border-b border-gray-700/50 bg-[#0b0e14]/50">
                  <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 mb-1">Eccezioni Tavoli</h2>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    Imposta una tariffa fissa per scavalcare il prezzo generale. Lascia vuoto per usare la tariffa generale.
                  </p>
                </div>
                
                <div className="p-6 space-y-4">
                  {tavoli.length === 0 ? (
                    <p className="text-center text-gray-500 uppercase tracking-widest text-xs py-4">Nessun tavolo configurato.</p>
                  ) : (
                    tavoli.map((tavolo) => (
                      <div key={tavolo.id} className="flex flex-col sm:flex-row justify-between items-center bg-[#1e293b] border border-gray-700/50 p-4 rounded-xl gap-4 hover:border-cyan-500/30 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-black uppercase text-white tracking-wider">{tavolo.nome}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">
                            {tavolo.tariffa_specifica 
                              ? `Applica eccezione: ${formattatoreEuro.format(tavolo.tariffa_specifica)}/h` 
                              : `Applica generale: ${formattatoreEuro.format(parseFloat(tariffaBase) || 0)}/h`
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-black">€</span>
                            <input 
                              type="number" 
                              step="0.10"
                              placeholder="Default"
                              defaultValue={tavolo.tariffa_specifica || ""}
                              onBlur={(e) => salvaTariffaSpecifica(tavolo.id, e.target.value)}
                              className="w-32 bg-[#0b0e14] border-2 border-gray-700 p-2 pl-8 rounded-lg text-cyan-400 font-bold text-sm focus:outline-none focus:border-cyan-500 transition-colors" 
                            />
                          </div>
                          {tavoloInSalvataggio === tavolo.id && (
                            <span className="text-[10px] text-amber-500 font-black uppercase animate-pulse">Salvataggio...</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}