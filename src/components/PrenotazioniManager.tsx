// ==========================================
// FILE: src/components/PrenotazioniManager.tsx
// OBIETTIVO: Gestione Calendario Prenotazioni Tavoli e Accettazione VIP (Design Premium)
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface Tavolo {
  id: string;
  nome: string;
}

interface Prenotazione {
  id: string;
  tavolo_id: string | null;
  nome_cliente: string;
  telefono_cliente: string;
  data_prenotazione: string;
  ora_inizio: string;
  ora_fine: string;
  stato: string;
  note: string;
  tavoli?: { nome: string }; 
}

export default function PrenotazioniManager(props: any) {
  const [salaId, setSalaId] = useState<string | null>(props.salaId || props.id || null);
  const [managerEmail, setManagerEmail] = useState<string>(props.managerEmail || ""); 
  
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data selezionata per il calendario (di default oggi)
  const [dataSelezionata, setDataSelezionata] = useState<string>(new Date().toISOString().split('T')[0]);

  // Stati del Form per nuova prenotazione (Lato Gestore)
  const [tavoloSelezionato, setTavoloSelezionato] = useState("");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [oraInizio, setOraInizio] = useState("");
  const [oraFine, setOraFine] = useState("");
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  useEffect(() => {
    if (!salaId && typeof window !== "undefined") {
      const pathArray = window.location.pathname.split("/");
      const urlId = pathArray[pathArray.length - 1];
      if (urlId && urlId.length > 10) setSalaId(urlId);
    }
  }, [salaId]);

  const caricaDati = useCallback(async () => {
    if (!salaId) return;
    setLoading(true);
    try {
      const { data: tavoliData, error: tavoliError } = await supabase
        .from("tavoli")
        .select("id, nome")
        .eq("sala_id", salaId)
        .order("nome", { ascending: true });
        
      if (tavoliError) throw tavoliError;
      if (tavoliData) {
        setTavoli(tavoliData);
        if (tavoliData.length > 0) setTavoloSelezionato(tavoliData[0].id);
      }

      await ricaricaPrenotazioniGiorno(salaId, dataSelezionata);
      
    } catch (err: any) {
      console.error("Errore caricamento prenotazioni:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId, dataSelezionata]);

  useEffect(() => {
    caricaDati();
  }, [caricaDati]);

  const ricaricaPrenotazioniGiorno = async (idSala: string, data: string) => {
    // Ora carica SIA quelle 'attive' che quelle 'in_attesa' arrivate dai clienti VIP
    const { data: prenoData, error: prenoError } = await supabase
      .from("prenotazioni")
      .select("*, tavoli(nome)")
      .eq("sala_id", idSala)
      .eq("data_prenotazione", data)
      .in("stato", ["attiva", "in_attesa"]) 
      .order("ora_inizio", { ascending: true });
      
    if (prenoError) {
      console.error(prenoError);
    } else if (prenoData) {
      setPrenotazioni(prenoData);
    }
  };

  const handleSalvaPrenotazione = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvataggioInCorso(true);

    if (!tavoloSelezionato || !nomeCliente || !oraInizio || !oraFine) {
      alert("Compila tutti i campi obbligatori.");
      setSalvataggioInCorso(false);
      return;
    }

    let currentEmail = managerEmail;
    if (!currentEmail) {
      const { data } = await supabase.auth.getSession();
      currentEmail = data.session?.user?.email || "";
    }

    try {
      const { error } = await supabase.from("prenotazioni").insert([{
        sala_id: salaId,
        tavolo_id: tavoloSelezionato,
        manager_email: currentEmail,
        nome_cliente: nomeCliente.toUpperCase(),
        telefono_cliente: telefonoCliente,
        data_prenotazione: dataSelezionata,
        ora_inizio: oraInizio,
        ora_fine: oraFine,
        stato: 'attiva' // Le prenotazioni inserite dal gestore sono già confermate
      }]);

      if (error) throw error;
      
      setNomeCliente("");
      setTelefonoCliente("");
      setOraInizio("");
      setOraFine("");
      
      alert("✅ Prenotazione registrata con successo!");
      await ricaricaPrenotazioniGiorno(salaId!, dataSelezionata);
      
    } catch (error: any) {
      alert("Errore salvataggio: " + error.message);
    } finally {
      setSalvataggioInCorso(false);
    }
  };

  // Funzione per confermare una richiesta in arrivo dall'App VIP
  const handleConfermaRichiesta = async (id: string, tavoloDaAssegnare: string) => {
    if(!tavoloDaAssegnare) {
      alert("Devi selezionare un tavolo per confermare la prenotazione.");
      return;
    }

    try {
      const { error } = await supabase
        .from("prenotazioni")
        .update({ stato: 'attiva', tavolo_id: tavoloDaAssegnare })
        .eq("id", id);
      
      if (error) throw error;
      await ricaricaPrenotazioniGiorno(salaId!, dataSelezionata);
    } catch (error: any) {
      alert("Errore durante la conferma: " + error.message);
    }
  };

  const handleEliminaPrenotazione = async (id: string, nome: string) => {
    if (!window.confirm(`Sei sicuro di voler annullare/rifiutare la prenotazione di ${nome}?`)) return;
    try {
      const { error } = await supabase.from("prenotazioni").delete().eq("id", id);
      if (error) throw error;
      setPrenotazioni(prenotazioni.filter(p => p.id !== id));
    } catch (error: any) {
      alert("Errore eliminazione: " + error.message);
    }
  };

  const formattaDataLeggibile = (dataIso: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dataIso).toLocaleDateString('it-IT', options).toUpperCase();
  };

  if (loading) return <div className="text-center p-10 text-cyan-500 font-black uppercase tracking-widest animate-pulse">Caricamento Agenda...</div>;

  return (
    <div className="space-y-8">
      
      <div className="bg-[#111827] border border-gray-700/70 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Agenda del Giorno</h2>
          <p className="text-xl font-black text-white mt-1">{formattaDataLeggibile(dataSelezionata)}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cambia Data:</label>
          <input 
            type="date" 
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className="bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-cyan-400 font-bold text-sm focus:outline-none focus:border-cyan-500 transition-colors" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* MODULO INSERIMENTO MANUALE */}
        <div className="lg:col-span-1">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 rounded-2xl shadow-2xl shadow-black/60 p-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 mb-6">Nuovo Appuntamento</h2>
            
            <form onSubmit={handleSalvaPrenotazione} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Tavolo *</label>
                <select 
                  required
                  value={tavoloSelezionato} 
                  onChange={(e) => setTavoloSelezionato(e.target.value)} 
                  className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  {tavoli.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Nome Cliente *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Es. Mario Rossi"
                  value={nomeCliente} 
                  onChange={(e) => setNomeCliente(e.target.value)} 
                  className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 transition-colors" 
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Telefono (Opzionale)</label>
                <input 
                  type="tel" 
                  placeholder="Es. 333 1234567"
                  value={telefonoCliente} 
                  onChange={(e) => setTelefonoCliente(e.target.value)} 
                  className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Ora Inizio *</label>
                  <input 
                    type="time" 
                    required
                    value={oraInizio} 
                    onChange={(e) => setOraInizio(e.target.value)} 
                    className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-cyan-400 font-black text-sm focus:outline-none focus:border-cyan-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Ora Fine *</label>
                  <input 
                    type="time" 
                    required
                    value={oraFine} 
                    onChange={(e) => setOraFine(e.target.value)} 
                    className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-red-400 font-black text-sm focus:outline-none focus:border-cyan-500 transition-colors" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={salvataggioInCorso}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all shadow-lg mt-6"
              >
                {salvataggioInCorso ? "REGISTRAZIONE..." : "+ BLOCCA TAVOLO"}
              </button>
            </form>
          </div>
        </div>

        {/* LISTA APPUNTAMENTI (ATTIVI E IN ATTESA) */}
        <div className="lg:col-span-2">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-700/50 bg-[#0b0e14]/50 flex justify-between items-center">
              <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400">Tavoli Impegnati</h2>
              <div className="flex gap-2">
                {prenotazioni.filter(p => p.stato === 'in_attesa').length > 0 && (
                   <span className="bg-amber-900/40 text-amber-400 border border-amber-800/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest animate-pulse">
                     {prenotazioni.filter(p => p.stato === 'in_attesa').length} Da Confermare
                   </span>
                )}
                <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                  {prenotazioni.length} Totali
                </span>
              </div>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
              {prenotazioni.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-50 h-full">
                  <span className="text-4xl mb-3">📅</span>
                  <p className="text-center text-gray-400 uppercase tracking-widest text-xs font-bold">Nessuna prenotazione per questa data.</p>
                </div>
              ) : (
                prenotazioni.map((preno) => {
                  const isInAttesa = preno.stato === 'in_attesa';
                  
                  return (
                  <div key={preno.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] border-l-4 border p-4 rounded-xl gap-4 shadow-md transition-all ${isInAttesa ? 'border-l-amber-500 border-amber-900/50 hover:bg-[#2a2a1f]' : 'border-l-cyan-500 border-gray-700/50 hover:bg-[#253349]'}`}>
                    
                    <div className="flex flex-col flex-1 w-full">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-base font-black uppercase tracking-wider ${isInAttesa ? 'text-amber-400' : 'text-white'}`}>
                          {isInAttesa ? 'Richiesta da App VIP' : (preno.tavoli?.nome || 'Tavolo Sconosciuto')}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${isInAttesa ? 'bg-[#0b0e14] text-amber-500 border-amber-900/50' : 'bg-[#0b0e14] text-cyan-400 border-cyan-900/50'}`}>
                          {preno.ora_inizio.slice(0, 5)} - {preno.ora_fine.slice(0, 5)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 font-bold uppercase tracking-widest">{preno.nome_cliente}</p>
                      {preno.telefono_cliente && (
                        <p className="text-[10px] text-gray-500 uppercase font-mono mt-1">📞 {preno.telefono_cliente}</p>
                      )}
                      {preno.note && (
                        <p className="text-[10px] text-amber-200/70 bg-amber-900/20 p-2 rounded mt-2 font-mono italic">📝 Nota: {preno.note}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      {/* TASTO APPROVA (Solo se in attesa) */}
                      {isInAttesa && (
                        <div className="flex flex-col gap-1 w-full">
                           <select 
                              id={`select-tavolo-${preno.id}`}
                              className="bg-black border border-gray-700 text-white text-[10px] uppercase font-bold p-2 rounded focus:border-amber-500 outline-none w-full"
                              defaultValue={tavoli.length > 0 ? tavoli[0].id : ""}
                           >
                              <option value="" disabled>Assegna Tavolo...</option>
                              {tavoli.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                           </select>
                           <button 
                             onClick={() => {
                               const selectEl = document.getElementById(`select-tavolo-${preno.id}`) as HTMLSelectElement;
                               handleConfermaRichiesta(preno.id, selectEl.value);
                             }}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 transition-colors text-[10px] font-black uppercase tracking-widest rounded-lg flex-1 whitespace-nowrap text-center"
                           >
                             ✓ Conferma
                           </button>
                        </div>
                      )}

                      <button 
                        onClick={() => handleEliminaPrenotazione(preno.id, preno.nome_cliente)}
                        className={`text-gray-500 hover:text-red-400 px-3 py-2 transition-colors text-[10px] font-black uppercase tracking-widest border border-gray-700 hover:border-red-500/30 rounded-lg bg-[#0b0e14] whitespace-nowrap ${isInAttesa ? 'self-end h-[68px]' : ''}`}
                      >
                        {isInAttesa ? '✖ Rifiuta' : 'Annulla'}
                      </button>
                    </div>
                    
                  </div>
                )})
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}