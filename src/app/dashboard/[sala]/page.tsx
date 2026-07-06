"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/page.tsx
// OBIETTIVO: Plancia Operativa del Manager con Timer Live, Colori e Cassa Sospesi
// ==========================================

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useParams } from 'next/navigation';

interface Tavolo {
  id: number;
  numero: number;
  stato: 'libero' | 'occupato';
  ora_inizio: string | null;
  sala_id: string;
}

export default function SalaGestore() {
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  
  // Stato per far scorrere il tempo visivamente ogni secondo
  const [orologioLive, setOrologioLive] = useState(new Date());
  
  // Stati per la gestione del Modale di Cassa e Sospesi
  const [tavoloInChiusura, setTavoloInChiusura] = useState<Tavolo | null>(null);
  const [nomeSocio, setNomeSocio] = useState("");

  const params = useParams();
  const salaId = params.sala as string;

  const TARIFFA_ORARIA = 10; // €/ora

  // Effetto per il caricamento iniziale dei dati
  useEffect(() => {
    caricaTavoli();
  }, [salaId]); 

  // Effetto per il "motore" dell'orologio live
  useEffect(() => {
    const timer = setInterval(() => {
      setOrologioLive(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const caricaTavoli = async () => {
    try {
      const { data, error } = await supabase
        .from('tavoli')
        .select('*')
        .eq('sala_id', salaId) 
        .order('numero', { ascending: true });

      if (error) throw error;
      if (data) setTavoli(data);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
    } finally {
      setInCaricamento(false);
    }
  };

  const apriTavolo = async (idTavolo: number) => {
    const oraAttuale = new Date().toISOString();
    
    setTavoli(tavoli.map(t => 
      t.id === idTavolo ? { ...t, stato: 'occupato', ora_inizio: oraAttuale } : t
    ));

    await supabase.from('tavoli')
      .update({ stato: 'occupato', ora_inizio: oraAttuale })
      .eq('id', idTavolo)
      .eq('sala_id', salaId);
  };

  // Funzione che apre la finestra di cassa invece di chiudere brutalmente
  const avviaChiusura = (tavolo: Tavolo) => {
    setTavoloInChiusura(tavolo);
    setNomeSocio(""); // Reset campo socio
  };

  // Funzione definitiva che esegue la registrazione (Incasso o Sospeso)
  const confermaRegistrazione = async (metodo: 'pagato' | 'sospeso') => {
    if (!tavoloInChiusura || !tavoloInChiusura.ora_inizio) return;

    const oraInizio = new Date(tavoloInChiusura.ora_inizio);
    const oraFine = new Date();
    
    // Assicuriamoci che venga calcolato almeno 1 minuto se chiudono subito
    let minutiTrascorsi = Math.floor((oraFine.getTime() - oraInizio.getTime()) / 60000);
    if (minutiTrascorsi === 0) minutiTrascorsi = 1; 

    const costo = ((TARIFFA_ORARIA / 60) * minutiTrascorsi).toFixed(2);

    if (metodo === 'sospeso' && nomeSocio.trim() === '') {
      alert("ATTENZIONE: Inserisci il nome del socio a cui assegnare il debito.");
      return;
    }

    // Qui in futuro si aggancerà il codice per scrivere nella tabella 'debiti_clienti' o 'movimenti_contabili'
    if (metodo === 'sospeso') {
      alert(`[REGISTRAZIONE AVVENUTA]\nCosto: €${costo}\nAssegnato al conto sospeso di: ${nomeSocio.toUpperCase()}`);
    } else {
      alert(`[INCASSO REGISTRATO]\nCosto: €${costo}\nPagamento immediato ricevuto alla cassa.`);
    }

    // Resettiamo il tavolo a 'libero' sull'interfaccia
    setTavoli(tavoli.map(t => 
      t.id === tavoloInChiusura.id ? { ...t, stato: 'libero', ora_inizio: null } : t
    ));

    // Scriviamo l'aggiornamento sul Database
    await supabase.from('tavoli')
      .update({ stato: 'libero', ora_inizio: null })
      .eq('id', tavoloInChiusura.id)
      .eq('sala_id', salaId);

    // Chiudiamo il modale
    setTavoloInChiusura(null);
  };

  // Motore di calcolo per il cronometro visivo (HH:MM:SS)
  const calcolaTimerLive = (oraInizioIso: string) => {
    const diff = orologioLive.getTime() - new Date(oraInizioIso).getTime();
    if (diff < 0) return "00:00:00";
    
    const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
    const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
    const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const calcolaCostoLive = (oraInizioIso: string) => {
    const minuti = Math.floor((orologioLive.getTime() - new Date(oraInizioIso).getTime()) / 60000);
    const m = minuti > 0 ? minuti : 0;
    return ((TARIFFA_ORARIA / 60) * m).toFixed(2);
  };

  if (inCaricamento) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-xl font-bold text-cyan-500 animate-pulse">Avviamento Sistema...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 relative">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">Plancia Operativa</h1>
          <p className="text-gray-400 font-bold mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Sala Attiva
          </p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-sm font-bold uppercase">Tariffa Impostata</p>
          <p className="text-xl font-black text-cyan-500">€{TARIFFA_ORARIA.toFixed(2)} / h</p>
        </div>
      </header>

      {/* GRIGLIA BILIARDI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-5xl">
        {tavoli.map((tavolo) => (
          <div 
            key={tavolo.id} 
            className={`p-6 rounded-3xl border flex flex-col justify-between h-56 transition-all duration-300 ${
              tavolo.stato === 'libero' 
                ? 'bg-[#0f4d22] border-green-400/50 hover:border-green-300 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' // Panno verde chiaro
                : 'bg-[#0a3317] border-red-600 shadow-[0_0_25px_rgba(220,38,38,0.3)]' // Panno verde scuro
            }`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-3xl font-black tracking-tight ${tavolo.stato === 'libero' ? 'text-white' : 'text-red-500'}`}>
                Biliardo {tavolo.numero}
              </span>
              <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                tavolo.stato === 'libero' ? 'bg-green-800 text-white' : 'bg-red-900/80 text-red-400'
              }`}>
                {tavolo.stato}
              </span>
            </div>

            <div className="mt-4">
              {tavolo.stato === 'libero' ? (
                <div className="flex flex-col items-center justify-center h-full pt-4">
                  <button 
                    onClick={() => apriTavolo(tavolo.id)}
                    className="w-full bg-white text-[#0f4d22] hover:bg-green-100 font-black py-4 px-4 rounded-xl transition-all uppercase tracking-wider shadow-lg"
                  >
                    ▶ Accendi Luce e Avvia
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-red-500/20">
                    <span className="text-red-400 font-mono text-2xl font-black tracking-widest">
                      {calcolaTimerLive(tavolo.ora_inizio!)}
                    </span>
                    <span className="text-red-400 font-black text-xl">
                      € {calcolaCostoLive(tavolo.ora_inizio!)}
                    </span>
                  </div>
                  <button 
                    onClick={() => avviaChiusura(tavolo)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 px-4 rounded-xl transition-all uppercase tracking-wider shadow-lg"
                  >
                    ⏹ Vai in Cassa
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODALE DI CASSA (Appare in sovraimpressione) */}
      {tavoloInChiusura && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-[#11131a] border-2 border-cyan-500 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black text-white uppercase mb-6 border-b border-gray-800 pb-4">
              Cassa - Biliardo {tavoloInChiusura.numero}
            </h2>
            
            <div className="bg-black p-6 rounded-xl mb-6 border border-gray-800 text-center">
              <p className="text-gray-400 text-sm font-bold uppercase mb-1">Tempo Giocato</p>
              <p className="text-3xl font-mono text-white mb-4">{calcolaTimerLive(tavoloInChiusura.ora_inizio!)}</p>
              
              <p className="text-gray-400 text-sm font-bold uppercase mb-1">Totale da Riscuotere</p>
              <p className="text-5xl font-black text-cyan-500">€ {calcolaCostoLive(tavoloInChiusura.ora_inizio!)}</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => confermaRegistrazione('pagato')}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-xl uppercase tracking-wider transition-all"
              >
                💶 Incassa Subito
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-800"></div>
                <span className="flex-shrink-0 mx-4 text-gray-500 text-xs font-bold uppercase">Oppure</span>
                <div className="flex-grow border-t border-gray-800"></div>
              </div>

              <div className="bg-gray-900 p-4 rounded-xl border border-gray-800">
                <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Assegna conto in sospeso a:</label>
                <input 
                  type="text" 
                  placeholder="Es. Mario Rossi / Socio 124" 
                  value={nomeSocio}
                  onChange={(e) => setNomeSocio(e.target.value)}
                  className="w-full bg-black text-yellow-500 font-bold p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none mb-3"
                />
                <button 
                  onClick={() => confermaRegistrazione('sospeso')}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-black py-3 rounded-lg uppercase tracking-wider transition-all"
                >
                  📝 Registra Sospeso
                </button>
              </div>

              <button 
                onClick={() => setTavoloInChiusura(null)}
                className="w-full mt-4 text-gray-500 hover:text-white font-bold uppercase text-sm py-2"
              >
                Annulla e torna al tavolo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}