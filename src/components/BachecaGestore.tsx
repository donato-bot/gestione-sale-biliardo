"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function BachecaGestore({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  // STATI DATI
  const [messaggi, setMessaggi] = useState<any[]>([]);
  
  // STATI FORM INSERIMENTO
  const [tipoAvviso, setTipoAvviso] = useState<'info' | 'avviso' | 'urgente'>('info');
  const [titolo, setTitolo] = useState("");
  const [contenuto, setContenuto] = useState("");

  // Dati Demo per il collaudo visivo
  useEffect(() => {
    const datiDemo = [
      {
        id: "1",
        titolo: "Manutenzione Biliardo 3",
        contenuto: "Il panno del biliardo 3 verrà sostituito domani mattina. Non accettare prenotazioni fino alle 12:00.",
        tipo: "info",
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        titolo: "Cambio Turno Weekend",
        contenuto: "Si ricorda a tutto lo staff che questo venerdì la chiusura è posticipata alle 03:00.",
        tipo: "avviso",
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "3",
        titolo: "Terminale POS Guasto",
        contenuto: "Il POS principale è fuori uso. Utilizzare il terminale di backup fino all'arrivo del tecnico.",
        tipo: "urgente",
        created_at: new Date(Date.now() - 172800000).toISOString(),
      }
    ];
    setMessaggi(datiDemo);
  }, []);

  const eseguiRegistrazione = (e: any) => {
    e.preventDefault();
    if (!titolo || !contenuto) return alert("Inserisci titolo e contenuto del messaggio.");
    
    const nuovoMessaggio = {
      id: Math.random().toString(),
      titolo,
      contenuto,
      tipo: tipoAvviso,
      created_at: new Date().toISOString(),
    };
    
    setMessaggi([nuovoMessaggio, ...messaggi]);
    setTitolo("");
    setContenuto("");
    setTipoAvviso("info");
  };

  const handleElimina = (id: string) => {
    setMessaggi(messaggi.filter(m => m.id !== id));
  };

  // GESTIONE RITORNO ALLA TORRE
  const handleReturn = () => {
    if (typeof setActiveView === 'function') {
      setActiveView("hub");
    } else {
      window.location.href = window.location.pathname;
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center">
      
      {/* CONTENITORE PRINCIPALE (Stile Plancia) */}
      <div className="w-full max-w-7xl bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Comunicazioni Interne</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Bacheca Club</h2>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleReturn} className="bg-[#00ADC6] hover:bg-[#008A9E] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,173,198,0.2)]">
              ← Torre di Controllo
            </button>
            <button onClick={() => window.print()} className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-gray-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors">
              ⚙ Stampa Avvisi
            </button>
          </div>
        </div>

        {/* LAYOUT A DUE COLONNE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* SINISTRA: FEED MESSAGGI (8 Colonne) */}
          <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
            
            <div className="bg-transparent border border-gray-700 rounded-2xl p-6 flex-1 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ADC6] animate-pulse"></span>
                  Avvisi Attivi
                </h3>
                <span className="bg-[#00ADC6]/20 text-[#00ADC6] border border-[#00ADC6]/30 px-3 py-1 rounded-md text-[10px] font-black tracking-widest">
                  {messaggi.length} COMUNICAZIONI
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {messaggi.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <div className="text-4xl mb-3">📢</div>
                    <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Nessun avviso in bacheca</p>
                  </div>
                ) : (
                  messaggi.map((msg) => (
                    <div key={msg.id} className="bg-[#1A1D24] border border-[#2A2E39] p-5 rounded-xl relative group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {msg.tipo === 'urgente' ? '🚨' : msg.tipo === 'avviso' ? '⚠️' : 'ℹ️'}
                          </span>
                          <div>
                            <h4 className="text-white font-bold text-lg">{msg.titolo}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(msg.created_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${msg.tipo === 'urgente' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : msg.tipo === 'avviso' ? 'bg-[#FFCC00]/10 text-[#FFCC00]' : 'bg-[#00E5FF]/10 text-[#00E5FF]'}`}>
                                {msg.tipo}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleElimina(msg.id)}
                          className="text-gray-600 hover:text-[#FF3B30] opacity-0 group-hover:opacity-100 transition-opacity text-xl"
                          title="Elimina Avviso"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed mt-4 ml-9 border-l-2 border-gray-700 pl-4">
                        {msg.contenuto}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* DESTRA: PUBBLICAZIONE AVVISO (4 Colonne) */}
          <div className="col-span-1 md:col-span-4 bg-transparent border border-gray-700 rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-white border-b border-gray-800 pb-4">Pubblica Avviso</h3>
            
            <form onSubmit={eseguiRegistrazione} className="space-y-6">
              
              {/* Toggle Priorità */}
              <div className="flex gap-2 bg-[#1A1D24] p-1 rounded-xl border border-gray-800">
                <button 
                  type="button"
                  onClick={() => setTipoAvviso('info')} 
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoAvviso === 'info' ? 'bg-[#00E5FF] text-black shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  Info
                </button>
                <button 
                  type="button"
                  onClick={() => setTipoAvviso('avviso')} 
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoAvviso === 'avviso' ? 'bg-[#FFCC00] text-black shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  Avviso
                </button>
                <button 
                  type="button"
                  onClick={() => setTipoAvviso('urgente')} 
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoAvviso === 'urgente' ? 'bg-[#FF3B30] text-white shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  Urgente
                </button>
              </div>

              {/* Form Inputs (Sfondo Bianco) */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Titolo Avviso</label>
                  <input 
                    className="w-full bg-white text-black font-bold p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors" 
                    placeholder="Es. Chiusura anticipata..." 
                    value={titolo} 
                    onChange={(e) => setTitolo(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Testo del Comunicato</label>
                  <textarea 
                    className="w-full bg-white text-black font-medium p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors h-32 resize-none" 
                    placeholder="Scrivi i dettagli qui..." 
                    value={contenuto} 
                    onChange={(e) => setContenuto(e.target.value)} 
                  />
                </div>
              </div>

              {/* Bottone Registrazione */}
              <button 
                type="submit"
                className="w-full bg-[#00ADC6] hover:bg-[#008A9E] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_5px_20px_rgba(0,173,198,0.3)] mt-2 flex items-center justify-center gap-2"
              >
                <span>Pubblica in Bacheca</span>
                <span className="text-lg">📢</span>
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
