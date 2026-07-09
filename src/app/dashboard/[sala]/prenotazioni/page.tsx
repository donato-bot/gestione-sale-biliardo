"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface Prenotazione {
  id: string;
  cliente: string;
  tavolo: string;
  canale: string;
  data_prevista: string;
  note: string;
}

export default function PrenotazioniPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

  const [prenotazioni, setPrenotazioni] = useState<Prenotazione[]>([]);
  const [loading, setLoading] = useState(true);

  // Stati per il Modal (Popup Form)
  const [mostraForm, setMostraForm] = useState(false);
  const [salvataggio, setSalvataggio] = useState(false);
  const [prenotazioneInModificaId, setPrenotazioneInModificaId] = useState<string | null>(null);
  
  // Campi Form
  const [cliente, setCliente] = useState("");
  const [tavolo, setTavolo] = useState("");
  const [canale, setCanale] = useState("Chiamata Telefonica");
  const [dataPrevista, setDataPrevista] = useState("");
  const [note, setNote] = useState("");

  const caricaPrenotazioni = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prenotazioni")
        .select("*")
        .eq("sala_id", salaId)
        .order("data_prevista", { ascending: true });

      if (error) throw error;
      setPrenotazioni(data || []);
    } catch (err: any) {
      console.error("Errore caricamento prenotazioni:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaPrenotazioni();
  }, [caricaPrenotazioni]);

  // Apre Modal per Nuova Prenotazione
  const apriNuovaPrenotazione = () => {
    setPrenotazioneInModificaId(null);
    setCliente(""); setTavolo(""); setCanale("Chiamata Telefonica"); setDataPrevista(""); setNote("");
    setMostraForm(true);
  };

  // Apre Modal precompilato per Modifica
  const apriModificaPrenotazione = (prenotazione: Prenotazione) => {
    setPrenotazioneInModificaId(prenotazione.id);
    setCliente(prenotazione.cliente);
    setTavolo(prenotazione.tavolo || "");
    setCanale(prenotazione.canale || "Chiamata Telefonica");
    
    // Format data per input datetime-local
    if (prenotazione.data_prevista) {
      const dateObj = new Date(prenotazione.data_prevista);
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj.getTime() - tzOffset)).toISOString().slice(0, 16);
      setDataPrevista(localISOTime);
    } else {
      setDataPrevista("");
    }
    
    setNote(prenotazione.note || "");
    setMostraForm(true);
  };

  // Elimina Prenotazione
  const eliminaPrenotazione = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa prenotazione?")) return;
    try {
      const { error } = await supabase.from("prenotazioni").delete().eq("id", id);
      if (error) throw error;
      await caricaPrenotazioni();
    } catch (err: any) {
      alert("Errore durante l'eliminazione: " + err.message);
    }
  };

  // Salvataggio (Insert o Update)
  const salvaPrenotazione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente.trim() || !dataPrevista) {
      alert("Nominativo e Data/Ora sono obbligatori.");
      return;
    }

    setSalvataggio(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user?.email;

      const datiPrenotazione = {
        sala_id: salaId,
        manager_email: userEmail,
        cliente: cliente.toUpperCase(),
        tavolo: tavolo,
        canale: canale,
        data_prevista: new Date(dataPrevista).toISOString(),
        note: note
      };

      if (prenotazioneInModificaId) {
        // MODIFICA (Update)
        const { error } = await supabase.from("prenotazioni").update(datiPrenotazione).eq("id", prenotazioneInModificaId);
        if (error) throw error;
      } else {
        // NUOVO (Insert)
        const { error } = await supabase.from("prenotazioni").insert([datiPrenotazione]);
        if (error) throw error;
      }

      setMostraForm(false);
      await caricaPrenotazioni();
    } catch (err: any) {
      alert("Errore salvataggio prenotazione: " + err.message);
    } finally {
      setSalvataggio(false);
    }
  };

  // Helper per i colori del badge Canale
  const getBadgeCanale = (tipoCanale: string) => {
    switch (tipoCanale) {
      case "WhatsApp": return "bg-emerald-950/50 text-emerald-400 border-emerald-500/30";
      case "Chiamata Telefonica": return "bg-blue-950/50 text-blue-400 border-blue-500/30";
      case "App Soci": return "bg-gray-800 text-gray-300 border-gray-600";
      case "In Sala": return "bg-amber-950/50 text-amber-400 border-amber-500/30";
      default: return "bg-gray-800 text-gray-300 border-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-2 flex items-center gap-2"
            >
              ← Torna alla Plancia
            </button>
            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mb-1 mt-2">Gestione Agenda</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white italic">
              PRENOTAZIONI SALA
            </h1>
          </div>
          <div className="flex flex-wrap gap-4">
            <button className="bg-[#11131a] border border-gray-800 hover:border-gray-600 text-gray-300 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
              📄 Stampa Foglio
            </button>
            <button 
              onClick={apriNuovaPrenotazione}
              className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              + Registra Prenotazione
            </button>
          </div>
        </header>

        {/* TABELLONE UNICO (SINGOLA COLONNA A TUTTA LARGHEZZA) */}
        <div className="bg-[#0a0b0f] border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#11131a]">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Tabellone Appuntamenti</h2>
            <div className="bg-gray-900 border border-gray-700 text-[10px] font-black text-cyan-400 px-4 py-1.5 rounded-lg flex gap-2">
              <span className="text-gray-500">ATTIVE</span>
              <span>{prenotazioni.length}</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-black/40 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                  <th className="p-5 w-[15%]">Orario / Data</th>
                  <th className="p-5 w-[35%]">Anagrafica Cliente</th>
                  <th className="p-5 w-[15%]">Biliardo</th>
                  <th className="p-5 w-[15%] text-center">Canale</th>
                  <th className="p-5 w-[20%] text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-white divide-y divide-gray-800/40">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-cyan-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Caricamento in corso...</td></tr>
                ) : prenotazioni.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-600 font-black uppercase tracking-widest text-[10px]">Nessun appuntamento in agenda.</td></tr>
                ) : (
                  prenotazioni.map((prenotazione) => {
                    const dataObj = new Date(prenotazione.data_prevista);
                    return (
                      <tr key={prenotazione.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="p-5">
                          <p className="text-base font-black text-cyan-400">{dataObj.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{dataObj.toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-black uppercase text-gray-200">{prenotazione.cliente}</p>
                          {prenotazione.note && (
                            <p className="text-[10px] text-gray-500 italic mt-1 line-clamp-1">{prenotazione.note}</p>
                          )}
                        </td>
                        <td className="p-5">
                          <span className="text-[11px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                            📌 {prenotazione.tavolo || "—"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`text-[9px] px-3 py-1.5 rounded border font-black uppercase tracking-widest ${getBadgeCanale(prenotazione.canale)}`}>
                            {prenotazione.canale}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => apriModificaPrenotazione(prenotazione)} 
                              className="text-gray-500 hover:text-cyan-400 px-2 py-1 transition-colors text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-cyan-500/30 rounded"
                            >
                              ✏️ Modifica
                            </button>
                            <button 
                              onClick={() => eliminaPrenotazione(prenotazione.id)} 
                              className="text-gray-600 hover:text-red-500 px-2 py-1 transition-colors text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-500/30 rounded"
                            >
                              🗑️ Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: FORM PRENOTAZIONE (Sovrimpressione) */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0a0b0f] border border-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl relative">
            <button onClick={() => setMostraForm(false)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 font-black text-xl z-10 transition-colors">✖</button>
            <div className="p-8">
              <h2 className="text-xl font-black italic text-cyan-400 uppercase mb-6">
                {prenotazioneInModificaId ? "✏️ Modifica Prenotazione" : "📝 Registrazione Manuale"}
              </h2>
              
              <form onSubmit={salvaPrenotazione} className="space-y-5">
                
                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Sorgente Contatto</label>
                  <select value={canale} onChange={(e) => setCanale(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors">
                    <option value="Chiamata Telefonica">📞 Chiamata Telefonica</option>
                    <option value="WhatsApp">💬 WhatsApp</option>
                    <option value="App Soci">📱 App Soci</option>
                    <option value="In Sala">🚶 In Sala</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Nominativo Cliente *</label>
                  <input type="text" placeholder="Es. Mario Rossi" required value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Tavolo o Specialità</label>
                  <input type="text" placeholder="Es. Tavolo 3 o Biliardo" value={tavolo} onChange={(e) => setTavolo(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Data e Ora Prevista *</label>
                  <input type="datetime-local" required value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 custom-calendar-icon transition-colors" />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Note Aggiuntive</label>
                  <textarea placeholder="Es. Richiede stecca personale..." rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors resize-none"></textarea>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={salvataggio} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${prenotazioneInModificaId ? "bg-amber-600 hover:bg-amber-500 text-black" : "bg-cyan-600 hover:bg-cyan-500 text-black"}`}>
                    {salvataggio ? "SALVATAGGIO..." : (prenotazioneInModificaId ? "AGGIORNA PRENOTAZIONE" : "SALVA PRENOTAZIONE")}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}