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
  // STATI PER LA NAVIGAZIONE (TABS)
  const [activeTab, setActiveTab] = useState<'parametri' | 'sistema'>('parametri');

  // STATI PER IL SETUP BASE
  const [nomeSala, setNomeSala] = useState("");
  const [numeroTavoli, setNumeroTavoli] = useState("4");
  const [costoOrario, setCostoOrario] = useState("8");
  
  // STATI PER IL SISTEMA DI AMMINISTRAZIONE (Scatola Nera)
  const [logs, setLogs] = useState<any[]>([]);
  const [salaInfo, setSalaInfo] = useState<any>(null);

  // STATI DI CARICAMENTO E MESSAGGI
  const [loadingIniziale, setLoadingIniziale] = useState(true);
  const [loadingOperazione, setLoadingOperazione] = useState(false);
  const [faseAttuale, setFaseAttuale] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function caricaDatiBase() {
      try {
        // 1. Recupero dati generali della sala (incluso Kill Switch)
        const { data: salaData, error: salaError } = await supabase
          .from('sale')
          .select('*')
          .eq('id', salaId)
          .single();
        
        if (salaError) throw salaError;
        
        if (salaData) {
          setSalaInfo(salaData);
          if (salaData.name) setNomeSala(salaData.name);
        }

        // 2. Recupero logs amministrativi (Scatola Nera)
        const { data: logsData } = await supabase
          .from('admin_logs')
          .select('*')
          .eq('sala_id', salaId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (logsData) setLogs(logsData);

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

      setFaseAttuale("Setup completato! Salvataggio in corso...");
      setTimeout(() => { onComplete(); }, 1500);

    } catch (err: any) {
      setError(err.message || "Errore sconosciuto durante il setup.");
      setLoadingOperazione(false);
    }
  };

  if (loadingIniziale) return <div className="text-center p-10 text-orange-500 animate-pulse font-bold">Inizializzazione modulo...</div>;

  return (
    <div className="flex flex-col items-center pt-10 px-4 min-h-screen">
      <div className="w-full max-w-3xl bg-[#11131a] p-8 md:p-10 rounded-[2.5rem] border-2 border-orange-900/50 shadow-2xl relative">
        
        {/* BOTTONE CHIUSURA / RITORNO */}
        <button 
          onClick={onComplete}
          className="absolute top-8 right-8 text-gray-500 hover:text-white font-black uppercase text-xs tracking-widest transition-colors"
        >
          ✕ Chiudi Setup
        </button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-orange-500 uppercase italic tracking-tighter">
            Centro di Controllo
          </h2>
          <p className="text-gray-400 mt-2 text-sm">Gestione parametri e monitoraggio impianto.</p>
        </div>

        {/* MENU A SCHEDE (TABS) */}
        <div className="flex gap-2 mb-8 bg-black p-1 rounded-xl border border-gray-800">
          <button 
            onClick={() => setActiveTab('parametri')}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'parametri' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            ⚙️ Parametri Sala
          </button>
          <button 
            onClick={() => setActiveTab('sistema')}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'sistema' ? 'bg-gray-800 text-white shadow-lg border border-gray-600' : 'text-gray-500 hover:text-gray-300'}`}
          >
            🛡️ Sistema & Sicurezza
          </button>
        </div>

        {error && !loadingOperazione && (
          <div className="mb-6 bg-red-900/30 text-red-400 p-4 rounded-xl text-sm border border-red-800">
            {error}
          </div>
        )}

        {/* TAB 1: PARAMETRI SALA (Vecchio Form) */}
        {activeTab === 'parametri' && (
          !loadingOperazione ? (
            <form onSubmit={eseguiSetup} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
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

              <button type="submit" className="w-full bg-orange-600 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-all text-white mt-6 shadow-[0_0_20px_rgba(234,88,12,0.3)]">
                SALVA CONFIGURAZIONE
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
          )
        )}

        {/* TAB 2: SISTEMA E SICUREZZA (La vecchia Torre di Controllo) */}
        {activeTab === 'sistema' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* BOX KILL SWITCH E ID */}
            <div className="bg-black border border-gray-800 rounded-xl p-6">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-800 pb-2">Stato Operativo Tenant</h3>
              {salaInfo ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">ID Sicurezza (UUID)</span>
                    <span className="text-gray-600 font-mono text-[10px]">{salaInfo.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Kill Switch</span>
                    <span className={`px-3 py-1 rounded-sm font-black text-[10px] uppercase tracking-widest border ${salaInfo.is_active !== false ? 'bg-emerald-900/30 text-emerald-500 border-emerald-900' : 'bg-red-900/30 text-red-500 border-red-900'}`}>
                      {salaInfo.is_active !== false ? 'ONLINE - ATTIVO' : 'SISTEMA SOSPESO'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-xs italic">Recupero dati in corso...</p>
              )}
            </div>

            {/* BOX SCATOLA NERA */}
            <div className="bg-black border border-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Scatola Nera (Logs)</h3>
                <span className="text-[10px] text-red-500 font-black tracking-widest animate-pulse">● REC</span>
              </div>
              
              <div className="space-y-3 overflow-y-auto max-h-[250px] pr-2">
                {logs.length > 0 ? logs.map((log, index) => (
                  <div key={index} className="bg-[#11131a] p-3 rounded-lg border border-gray-800 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-orange-500 font-black text-[10px] uppercase tracking-widest">{log.azione || 'Sistema'}</span>
                      <span className="text-gray-600 text-[10px] font-mono">{new Date(log.created_at).toLocaleString('it-IT')}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{log.dettagli || 'Registrazione eventi.'}</span>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-6 opacity-40">
                    <span className="text-2xl mb-2">🗄️</span>
                    <p className="text-gray-500 italic text-xs text-center">Nessun log di sistema rilevato.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}