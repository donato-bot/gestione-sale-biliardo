// ==========================================
// FILE: src/app/dashboard/[sala]/prenotazioni/page.tsx
// OBIETTIVO: Plancia Gestore - Gestione Prenotazioni e Assegnazione Tavoli
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface Prenotazione {
  id: string;
  nome_cliente: string;
  tavolo_numero: string;
  data_ora: string;
  note: string;
  stato: string; // es. 'in_attesa', 'confermata', 'conclusa', 'annullata'
}

interface Tavolo {
  id: string;
  numero_tavolo: string;
  nome_tavolo: string;
}

export default function GestionePrenotazioniPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroVista, setFiltroVista] = useState<"attive" | "storico">("attive");

  const caricaDati = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carica le prenotazioni
      const { data: dataPrenotazioni, error: errPrenotazioni } = await supabase
        .from("prenotazioni")
        .select("*")
        .eq("sala_id", salaId)
        .order("data_ora", { ascending: true });

      if (errPrenotazioni) throw errPrenotazioni;

      // 2. Carica i tavoli disponibili per la tendina di assegnazione
      const { data: dataTavoli, error: errTavoli } = await supabase
        .from("tavoli")
        .select("*")
        .eq("sala_id", salaId)
        .order("numero_tavolo", { ascending: true });

      if (errTavoli) throw errTavoli;

      setPrenotazioni(dataPrenotazioni || []);
      setTavoli(dataTavoli || []);
    } catch (err: any) {
      console.error("Errore caricamento dati:", err.message);
      alert("Errore nel caricamento delle prenotazioni.");
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaDati();
  }, [caricaDati]);

  // Aggiorna il tavolo assegnato
  const assegnaTavolo = async (id: string, nuovoTavoloNome: string) => {
    try {
      const { error } = await supabase
        .from("prenotazioni")
        .update({ tavolo_numero: nuovoTavoloNome })
        .eq("id", id);

      if (error) throw error;
      
      // Aggiorna UI locale
      setPrenotazioni(prenotazioni.map(p => p.id === id ? { ...p, tavolo_numero: nuovoTavoloNome } : p));
    } catch (err: any) {
      alert("Errore durante l'assegnazione del tavolo: " + err.message);
    }
  };

  // Aggiorna lo stato (es. per segnarla come conclusa)
  const cambiaStato = async (id: string, nuovoStato: string) => {
    try {
      const { error } = await supabase
        .from("prenotazioni")
        .update({ stato: nuovoStato })
        .eq("id", id);

      if (error) throw error;
      setPrenotazioni(prenotazioni.map(p => p.id === id ? { ...p, stato: nuovoStato } : p));
    } catch (err: any) {
      alert("Errore aggiornamento stato: " + err.message);
    }
  };

  const eliminaPrenotazione = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questa prenotazione?")) return;
    try {
      const { error } = await supabase.from("prenotazioni").delete().eq("id", id);
      if (error) throw error;
      setPrenotazioni(prenotazioni.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Errore eliminazione: " + err.message);
    }
  };

  // Filtriamo le prenotazioni in base alla vista scelta
  const oraAttuale = new Date();
  const prenotazioniFiltrate = prenotazioni.filter(p => {
    const dataPrenotazione = new Date(p.data_ora);
    const isPassata = dataPrenotazione < oraAttuale;
    const isConclusa = p.stato === 'conclusa' || p.stato === 'annullata';
    
    if (filtroVista === "attive") {
      return !isPassata && !isConclusa; // Mostra solo le future non concluse
    } else {
      return isPassata || isConclusa; // Mostra quelle passate o archiviate
    }
  });

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-gray-800 pb-4">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-green-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-2 flex items-center gap-2"
            >
              ← Torna alla Plancia
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white italic">
              PRENOTAZIONI SALA
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Gestione Arrivi e Assegnazione Tavoli
            </p>
          </div>

          {/* TOGGLE VISTA */}
          <div className="flex bg-[#111827] rounded-xl p-1 border border-gray-800">
            <button 
              onClick={() => setFiltroVista("attive")}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtroVista === "attive" ? "bg-green-600 text-black shadow-lg" : "text-gray-500 hover:text-white"}`}
            >
              Prossimi Arrivi
            </button>
            <button 
              onClick={() => setFiltroVista("storico")}
              className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filtroVista === "storico" ? "bg-gray-700 text-white shadow-lg" : "text-gray-500 hover:text-white"}`}
            >
              Storico
            </button>
          </div>
        </header>

        {/* TABELLA PRENOTAZIONI */}
        <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-green-500 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0b0e14]/50 border-b border-gray-700/50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
                  <th className="p-5 w-[20%]">Data e Ora</th>
                  <th className="p-5 w-[20%]">Socio</th>
                  <th className="p-5 w-[25%]">Assegnazione Tavolo</th>
                  <th className="p-5 w-[25%]">Note Cliente</th>
                  <th className="p-5 w-[10%] text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-white divide-y divide-gray-700/50">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-green-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Sincronizzazione in corso...</td></tr>
                ) : prenotazioniFiltrate.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-black uppercase tracking-widest text-[10px]">Nessuna prenotazione trovata.</td></tr>
                ) : (
                  prenotazioniFiltrate.map((prenotazione) => {
                    const dataObj = new Date(prenotazione.data_ora);
                    const giorno = dataObj.toLocaleDateString("it-IT", { weekday: 'short', day: '2-digit', month: 'short' });
                    const ora = dataObj.toLocaleTimeString("it-IT", { hour: '2-digit', minute: '2-digit' });
                    
                    const isNonAssegnato = prenotazione.tavolo_numero === "Qualsiasi Tavolo" || !prenotazione.tavolo_numero;

                    return (
                      <tr key={prenotazione.id} className="hover:bg-[#1e293b]/50 transition-colors group">
                        
                        {/* DATA E ORA */}
                        <td className="p-5">
                          <div className="flex flex-col">
                            <span className="text-lg font-black uppercase text-green-400">{ora}</span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest">{giorno}</span>
                          </div>
                        </td>

                        {/* CLIENTE */}
                        <td className="p-5">
                          <p className="text-base font-black uppercase text-gray-200">{prenotazione.nome_cliente}</p>
                        </td>

                        {/* ASSEGNAZIONE TAVOLO (TENDINA) */}
                        <td className="p-5">
                          <select 
                            value={prenotazione.tavolo_numero} 
                            onChange={(e) => assegnaTavolo(prenotazione.id, e.target.value)}
                            className={`p-2 rounded-lg text-xs font-black uppercase tracking-widest border outline-none transition-colors cursor-pointer ${isNonAssegnato ? 'bg-amber-900/30 border-amber-500/50 text-amber-400' : 'bg-gray-800 border-gray-600 text-white'}`}
                          >
                            <option value="Qualsiasi Tavolo">⚠️ DA ASSEGNARE</option>
                            {tavoli.map(t => (
                              <option key={t.id} value={`Tavolo ${t.numero_tavolo}`}>
                                Tavolo {t.numero_tavolo} {t.nome_tavolo ? `(${t.nome_tavolo})` : ''}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* NOTE */}
                        <td className="p-5">
                          <p className="text-[10px] text-gray-400 font-medium leading-relaxed max-w-xs">
                            {prenotazione.note || "—"}
                          </p>
                        </td>

                        {/* AZIONI */}
                        <td className="p-5 text-right flex flex-col items-end gap-2">
                          {filtroVista === "attive" ? (
                             <button 
                               onClick={() => cambiaStato(prenotazione.id, 'conclusa')} 
                               className="text-[9px] bg-gray-800 hover:bg-green-600 text-gray-300 hover:text-black px-3 py-1.5 rounded border border-gray-700 hover:border-green-500 font-black uppercase tracking-widest transition-all"
                             >
                               ✓ Concludi
                             </button>
                          ) : (
                             <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest border border-gray-700/50 px-2 py-1 rounded">Archiviata</span>
                          )}
                          
                          <button 
                            onClick={() => eliminaPrenotazione(prenotazione.id)} 
                            className="text-[9px] text-red-500/50 hover:text-red-500 uppercase font-black tracking-widest transition-colors mt-1"
                          >
                            Elimina
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-[#0b0e14] border-t border-gray-700/70 p-4 text-[10px] font-black uppercase tracking-widest text-gray-500 flex justify-between">
            <span>Totale Visualizzate: {prenotazioniFiltrate.length}</span>
            <span className="text-green-500">Aggiornamento in tempo reale</span>
          </div>
        </div>
      </div>
    </div>
  );
}