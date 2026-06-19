"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface SetupSalaProps {
  salaId: string;
  onComplete: () => void;
}

export default function SetupSala({ salaId, onComplete }: SetupSalaProps) {
  const [nomeSala, setNomeSala] = useState("");
  const [numeroTavoli, setNumeroTavoli] = useState("4");
  const [costoOrario, setCostoOrario] = useState("8");
  
  const [loadingIniziale, setLoadingIniziale] = useState(true);
  const [loadingOperazione, setLoadingOperazione] = useState(false);
  const [faseAttuale, setFaseAttuale] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function caricaDatiBase() {
      try {
        const { data, error } = await supabase.from('sale').select('name').eq('id', salaId).single();
        if (error) throw error;
        if (data && data.name) setNomeSala(data.name);
      } catch (err) {
        console.error("Errore caricamento dati iniziali:", err);
      } finally {
        setLoadingIniziale(false);
      }
    }
    caricaDatiBase();
  }, [salaId]);

  const eseguiSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingOperazione(true);
    setError(null);

    try {
      // 1. REGISTRAZIONE NOME E FLAG SETUP
      setFaseAttuale("1/3 - Registrazione marchio Club...");
      const { error: updateSalaError } = await supabase
        .from('sale')
        .update({ name: nomeSala, configurazione_completata: true })
        .eq('id', salaId);

      if (updateSalaError) throw new Error(`Errore Sala: ${updateSalaError.message}`);

      // 2. CREAZIONE COSTO ORARIO (nome_tariffa e tariffa_oraria)
      setFaseAttuale("2/3 - Impostazione costo orario...");
      const { data: nuovaTariffa, error: tariffaError } = await supabase
        .from('tariffe')
        .insert([{ 
          sala_id: salaId, 
          nome_tariffa: 'Costo Orario Base', 
          tariffa_oraria: parseFloat(costoOrario) 
        }])
        .select()
        .single();

      if (tariffaError) throw new Error(`Errore DB Tariffe: ${tariffaError.message}`);

      // 3. GENERAZIONE TAVOLI
      setFaseAttuale(`3/3 - Generazione di ${numeroTavoli} biliardi operativi...`);
      const recordTavoli = Array.from({ length: parseInt(numeroTavoli) }).map((_, index) => ({
        sala_id: salaId,
        nome_tavolo: `Biliardo ${index + 1}`,
        numero: index + 1,
        stato: 'libero',
        tariffa_id: nuovaTariffa.id,
        ora_inizio: null
      }));

      const { error: tavoliError } = await supabase.from('tavoli').insert(recordTavoli);

      if (tavoliError) throw new Error(`Errore DB Tavoli: ${tavoliError.message}`);

      setFaseAttuale("Setup completato! Avvio Plancia...");
      setTimeout(() => { onComplete(); }, 1500);

    } catch (err: any) {
      setError(err.message || "Errore sconosciuto durante il setup.");
      setLoadingOperazione(false);
    }
  };

  if (loadingIniziale) return <div className="text-center p-10 text-orange-500 animate-pulse font-bold">Inizializzazione modulo...</div>;

  return (
    <div className="flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-xl bg-[#11131a] p-8 md:p-10 rounded-[2.5rem] border-2 border-orange-900/50 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-orange-500 uppercase italic tracking-tighter">
            Personalizzazione Impianto
          </h2>
          <p className="text-gray-400 mt-2 text-sm">Compila i dati reali del tuo Club per avviare il gestionale.</p>
        </div>

        {error && !loadingOperazione && (
          <div className="mb-6 bg-red-900/30 text-red-400 p-4 rounded-xl text-sm border border-red-800">
            {error}
          </div>
        )}

        {!loadingOperazione ? (
          <form onSubmit={eseguiSetup} className="space-y-6">
            <div className="bg-black p-4 rounded-xl border border-gray-800 focus-within:border-orange-500 transition-colors">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Nome del Club</label>
              <input type="text" value={nomeSala} onChange={(e) => setNomeSala(e.target.value)} required className="w-full bg-transparent text-white font-bold text-lg outline-none" />
            </div>

            <div className="bg-black p-4 rounded-xl border border-gray-800 focus-within:border-orange-500 transition-colors">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Numero di Biliardi in Sala</label>
              <input type="number" min="1" value={numeroTavoli} onChange={(e) => setNumeroTavoli(e.target.value)} required className="w-full bg-transparent text-white font-bold text-lg outline-none" />
            </div>

            <div className="bg-black p-4 rounded-xl border border-gray-800 focus-within:border-orange-500 transition-colors">
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Costo Orario di Base (€/h)</label>
              <input type="number" min="0" step="0.50" value={costoOrario} onChange={(e) => setCostoOrario(e.target.value)} required className="w-full bg-transparent text-white font-bold text-lg outline-none" />
            </div>

            <button type="submit" className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all text-white mt-6">
              SALVA E AVVIA GESTIONALE
            </button>
          </form>
        ) : (
          <div className="py-12 text-center space-y-6">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="space-y-2">
              <p className="text-white font-black uppercase tracking-wider text-xs">Allineamento Database in corso</p>
              <p className="text-orange-400 font-bold text-sm">{faseAttuale}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}