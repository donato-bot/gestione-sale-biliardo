"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ConfigurazioneSala() {
  const router = useRouter();
  
  // Stati del modulo
  const [salaId, setSalaId] = useState<string | null>(null);
  const [nomeSala, setNomeSala] = useState("");
  const [numeroTavoli, setNumeroTavoli] = useState("4");
  const [tariffa, setTariffa] = useState("8");
  
  // Stati per il tracciamento visivo e diagnostica
  const [loadingIniziale, setLoadingIniziale] = useState(true);
  const [loadingOperazione, setLoadingOperazione] = useState(false);
  const [faseAttuale, setFaseAttuale] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Recupera la sala pre-assegnata all'utente loggato
  useEffect(() => {
    async function caricaSalaManager() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) throw new Error("Utente non autenticato o sessione scaduta. Effettua il login.");

        const { data: salaCorrente, error: salaError } = await supabase
          .from('sale')
          .select('*')
          .eq('manager_email', user.email)
          .maybeSingle();

        if (salaError) throw new Error(`Errore caricamento tabella sale: ${salaError.message}`);
        if (!salaCorrente) {
          throw new Error(`Nessuna riga trovata nella tabella 'sale' per l'email manager: ${user.email}`);
        }

        setSalaId(salaCorrente.id);
        setNomeSala(salaCorrente.name || "SALA DEMO");
      } catch (err: any) {
        setError(err.message);
      } finaly {
        setLoadingIniziale(false);
      }
    }
    caricaSalaManager();
  }, []);

  const eseguiConfigurazione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaId) {
      setError("Impossibile procedere: ID della sala non identificato.");
      return;
    }
    
    setLoadingOperazione(true);
    setError(null);

    try {
      // 1. AGGIORNAMENTO TABELLA 'SALE'
      setFaseAttuale("1/3 - Scrittura tabella 'sale' (Impostazione flag)...");
      const { error: updateSalaError } = await supabase
        .from('sale')
        .update({ 
          name: nomeSala,
          configurazione_completata: true 
        })
        .eq('id', salaId);

      if (updateSalaError) {
        throw new Error(`[FALLIMENTO TABELLA SALE]\nMessaggio: ${updateSalaError.message}\nDettaglio: ${updateSalaError.details || 'Nessuno'}\nSuggerimento: ${updateSalaError.hint || 'Verifica se la colonna configurazione_completata esiste ed è di tipo BOOLEAN'}`);
      }

      // 2. INSERIMENTO TABELLA 'TARIFFE'
      setFaseAttuale("2/3 - Scrittura tabella 'tariffe' (Registrazione quota)...");
      const { data: nuovaTariffa, error: tariffaError } = await supabase
        .from('tariffe')
        .insert([{ 
          sala_id: salaId, 
          nome: 'Tariffa Standard Base', 
          prezzo: parseFloat(tariffa) 
        }])
        .select()
        .maybeSingle();

      if (tariffaError) {
        throw new Error(`[FALLIMENTO TABELLA TARIFFE]\nMessaggio: ${tariffaError.message}\nDettaglio: ${tariffaError.details || 'Nessuno'}\nNota: Controlla le politiche RLS o vincoli di chiave esterna su 'tariffe'.`);
      }

      const tariffaId = nuovaTariffa ? nuovaTariffa.id : null;

      // 3. INSERIMENTO TABELLA 'TAVOLI'
      setFaseAttuale(`3/3 - Scrittura tabella 'tavoli' (Generazione di ${numeroTavoli} unità)...`);
      const recordTavoli = Array.from({ length: parseInt(numeroTavoli) }).map((_, index) => ({
        sala_id: salaId,
        nome_tavolo: `Tavolo ${index + 1}`,
        numero: index + 1,
        stato: 'libero',
        tariffa_id: tariffaId,
        ora_inizio: null
      }));

      const { error: tavoliError } = await supabase
        .from('tavoli')
        .insert(recordTavoli);

      if (tavoliError) {
        throw new Error(`[FALLIMENTO TABELLA TAVOLI]\nMessaggio: ${tavoliError.message}\nDettaglio: ${tavoliError.details || 'Nessuno'}\nNota: Controlla se le policy RLS permettono l'operazione di INSERT per questo utente autenticato.`);
      }

      setFaseAttuale("Allineamento tabelle riuscito. Reindirizzamento in Plancia...");
      
      setTimeout(() => {
        router.push(`/dashboard/${salaId}`);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Errore sconosciuto durante la transazione.");
      setLoadingOperazione(false);
      setFaseAttuale("");
    }
  };

  if (loadingIniziale) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-pink-500 font-black uppercase tracking-widest text-xs animate-pulse">
        Sincronizzazione credenziali di sala...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center pt-16 px-4 font-sans text-white pb-10">
      <div className="w-full max-w-xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-pink-600 uppercase italic tracking-tighter">
            Setup Iniziale Sala
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Configurazione guidata delle tabelle relazionali di sistema.</p>
        </div>

        <div className="bg-[#0a0a0a] p-8 md:p-10 rounded-[2.5rem] border border-gray-900 shadow-2xl">
          {error && !loadingOperazione && (
            <div className="mb-6 text-red-500 text-xs font-mono bg-red-500/10 p-5 rounded-2xl border border-red-500/30 text-left whitespace-pre-wrap break-all leading-relaxed">
              <span className="font-black block text-sm uppercase mb-2 text-red-400">🚨 DIAGNOSTICA SUPABASE:</span>
              {error}
            </div>
          )}

          {!loadingOperazione && salaId ? (
            <form onSubmit={eseguiConfigurazione} className="space-y-8">
              
              <div className="bg-black p-5 rounded-2xl border border-gray-800 focus-within:border-pink-600/50 transition-colors">
                <label className="text-sm font-black text-white uppercase tracking-wider block mb-1">
                  Nome del Club
                </label>
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                  Aggiorna il nome fittizio con il marchio del tuo club (Tabella: sale, Campo: name).
                </p>
                <input 
                  type="text" 
                  value={nomeSala} 
                  onChange={(e) => setNomeSala(e.target.value)} 
                  required 
                  className="w-full bg-transparent border-b-2 border-gray-700 py-2 outline-none focus:border-pink-600 transition-all text-white font-bold text-lg" 
                />
              </div>

              <div className="bg-black p-5 rounded-2xl border border-gray-800 focus-within:border-pink-600/50 transition-colors">
                <label className="text-sm font-black text-white uppercase tracking-wider block mb-1">
                  Numero di Tavoli
                </label>
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                  Numero di record da generare sequenzialmente (Tabella: tavoli).
                </p>
                <input 
                  type="number" 
                  min="1"
                  value={numeroTavoli} 
                  onChange={(e) => setNumeroTavoli(e.target.value)} 
                  required 
                  className="w-full bg-transparent border-b-2 border-gray-700 py-2 outline-none focus:border-pink-600 transition-all text-white font-bold text-lg" 
                />
              </div>

              <div className="bg-black p-5 rounded-2xl border border-gray-800 focus-within:border-pink-600/50 transition-colors">
                <label className="text-sm font-black text-white uppercase tracking-wider block mb-1">
                  Tariffa Oraria (€/h)
                </label>
                <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
                  Quota monetaria per il calcolo automatico della cassa (Tabella: tariffe).
                </p>
                <input 
                  type="number" 
                  min="0"
                  step="0.5"
                  value={tariffa} 
                  onChange={(e) => setTariffa(e.target.value)} 
                  required 
                  className="w-full bg-transparent border-b-2 border-gray-700 py-2 outline-none focus:border-pink-600 transition-all text-white font-bold text-lg" 
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-pink-600 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-pink-500 shadow-lg shadow-pink-600/20 transition-all mt-4 text-sm"
              >
                SALVA E SCRIVI TABELLE
              </button>
            </form>
          ) : loadingOperazione ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-wider text-xs">Transazione Database in corso</p>
                <p className="text-pink-500 font-bold text-sm bg-pink-500/5 py-3 px-4 rounded-xl border border-pink-500/10 inline-block animate-pulse">
                  {faseAttuale}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}