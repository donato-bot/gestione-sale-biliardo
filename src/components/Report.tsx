"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";
import { useRouter } from "next/navigation";

export default function Report({ salaId, onBack }: { salaId: string, onBack?: () => void }) {
  const router = useRouter();

  // STATI DATI
  const [movimenti, setMovimenti] = useState<any[]>([]);
  const [filtroTempo, setFiltroTempo] = useState<'oggi' | 'mese' | 'tutto'>('oggi');
  
  // STATI FORM INSERIMENTO
  const [tipoOperazione, setTipoOperazione] = useState<'entrata' | 'uscita'>('entrata');
  const [comparto, setComparto] = useState("Gioco");
  const [importo, setImporto] = useState("");
  const [causale, setCausale] = useState("");

  // FETCH DATI CON FILTRO TEMPORALE
  async function fetchData() {
    if (!salaId) return;

    let query = supabase
      .from('vendite_servizi')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });

    // Applica filtro data lato client per semplicità (o potresti farlo in SQL)
    const { data, error } = await query;
    
    if (error) {
      console.error("Errore recupero movimenti:", error);
      return;
    }

    if (data) {
      const now = new Date();
      const filteredData = data.filter(mov => {
        const movDate = new Date(mov.created_at);
        if (filtroTempo === 'oggi') {
          return movDate.toDateString() === now.toDateString();
        } else if (filtroTempo === 'mese') {
          return movDate.getMonth() === now.getMonth() && movDate.getFullYear() === now.getFullYear();
        }
        return true; // 'tutto'
      });
      setMovimenti(filteredData);
    }
  }

  // REGISTRAZIONE MOVIMENTO
  async function eseguiRegistrazione() {
    if (!importo || !causale || !comparto) {
      return alert("Compila tutti i campi obbligatori (Comparto, Importo, Causale).");
    }

    let importoNumerico = parseFloat(importo);
    // Se è un'uscita, forziamo il valore negativo nel database
    if (tipoOperazione === 'uscita') {
      importoNumerico = -Math.abs(importoNumerico);
    } else {
      importoNumerico = Math.abs(importoNumerico);
    }

    const { error } = await supabase.from('vendite_servizi').insert([{
      sala_id: salaId,
      tipo: comparto,
      descrizione: causale,
      importo: importoNumerico
    }]);

    if (error) {
      console.error("Errore salvataggio:", error);
      alert("Errore durante la registrazione.");
    } else {
      setImporto("");
      setCausale("");
      fetchData(); // Ricarica la tabella
    }
  }

  useEffect(() => {
    fetchData();
  }, [salaId, filtroTempo]);

  // CALCOLI
  const saldoNetto = movimenti.reduce((acc, curr) => acc + Number(curr.importo), 0);
  const totalRecords = movimenti.length;

  // GESTIONE RITORNO ALLA TORRE
  const handleReturn = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      window.location.href = window.location.pathname;
    }
  };

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center">
      
      {/* CONTENITORE PRINCIPALE */}
      <div className="w-full max-w-7xl bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Gestione Finanziaria</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Movimenti Contabili</h2>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleReturn} className="bg-[#00ADC6] hover:bg-[#008A9E] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,173,198,0.2)]">
              ← Torre di Controllo
            </button>
            <button onClick={() => window.print()} className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-gray-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors">
              ⚙ Stampa Report
            </button>
          </div>
        </div>

        {/* LAYOUT A DUE COLONNE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* SINISTRA: PANNELLI STORICO (8 Colonne) */}
          <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
            
            {/* BOX 1: FILTRI E SALDO */}
            <div className="bg-transparent border border-gray-700 rounded-2xl p-6 flex justify-between items-center">
              {/* Pillola Filtri */}
              <div className="bg-white rounded-full p-1 flex items-center shadow-inner">
                <button onClick={() => setFiltroTempo('oggi')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filtroTempo === 'oggi' ? 'bg-[#00ADC6] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Oggi</button>
                <button onClick={() => setFiltroTempo('mese')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filtroTempo === 'mese' ? 'bg-[#00ADC6] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Mese</button>
                <button onClick={() => setFiltroTempo('tutto')} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filtroTempo === 'tutto' ? 'bg-[#00ADC6] text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Tutto</button>
              </div>

              {/* Box Saldo Netto */}
              <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-6 py-3 flex flex-col items-end">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Saldo Netto</span>
                <span className={`text-2xl font-black tracking-tighter ${saldoNetto >= 0 ? 'text-[#00E676]' : 'text-[#FF3B30]'}`}>
                  € {saldoNetto.toFixed(2)}
                </span>
              </div>
            </div>

            {/* BOX 2: STORICO LISTA */}
            <div className="bg-transparent border border-gray-700 rounded-2xl p-6 flex-1 flex flex-col min-h-[350px]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Storico Movimenti</h3>
                <span className="bg-[#00ADC6]/20 text-[#00ADC6] border border-[#00ADC6]/30 px-3 py-1 rounded-md text-[10px] font-black tracking-widest">
                  {totalRecords} RECORDS
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {movimenti.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50">
                    <div className="text-4xl mb-3">📉</div>
                    <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Silenzio Contabile</p>
                  </div>
                ) : (
                  movimenti.map((mov) => (
                    <div key={mov.id} className="bg-[#1A1D24] border border-[#2A2E39] p-4 rounded-xl flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{mov.descrizione}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{new Date(mov.created_at).toLocaleDateString()}</span>
                          <span className="text-[10px] text-[#00E5FF] font-black uppercase bg-[#00E5FF]/10 px-2 py-0.5 rounded-sm">{mov.tipo}</span>
                        </div>
                      </div>
                      <span className={`text-lg font-black ${mov.importo < 0 ? 'text-[#FF3B30]' : 'text-[#00E676]'}`}>
                        {mov.importo > 0 ? '+' : ''}{Number(mov.importo).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* DESTRA: INSERIMENTO DATI (4 Colonne) */}
          <div className="col-span-1 md:col-span-4 bg-transparent border border-gray-700 rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-white border-b border-gray-800 pb-4">Inserimento Dati</h3>
            
            <div className="space-y-6">
              
              {/* Toggle Entrata/Uscita */}
              <div className="flex gap-2 bg-[#1A1D24] p-1 rounded-xl border border-gray-800">
                <button 
                  onClick={() => setTipoOperazione('entrata')} 
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoOperazione === 'entrata' ? 'bg-[#00E676] text-black shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  Entrata
                </button>
                <button 
                  onClick={() => setTipoOperazione('uscita')} 
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoOperazione === 'uscita' ? 'bg-[#FF3B30] text-white shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  Uscita
                </button>
              </div>

              {/* Form Inputs (Sfondo Bianco) */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Comparto</label>
                  <input 
                    className="w-full bg-white text-black font-bold p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors" 
                    placeholder="Es. Gioco, Bar..." 
                    value={comparto} 
                    onChange={(e) => setComparto(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Importo Nominale (€)</label>
                  <input 
                    type="number"
                    className="w-full bg-white text-black font-black text-xl p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors" 
                    placeholder="0.00" 
                    value={importo} 
                    onChange={(e) => setImporto(e.target.value)} 
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Causale Tecnica</label>
                  <input 
                    className="w-full bg-white text-black font-bold p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors" 
                    placeholder="Dettaglio operazione..." 
                    value={causale} 
                    onChange={(e) => setCausale(e.target.value)} 
                  />
                </div>
              </div>

              {/* Bottone Registrazione */}
              <button 
                onClick={eseguiRegistrazione}
                className="w-full bg-[#00ADC6] hover:bg-[#008A9E] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_5px_20px_rgba(0,173,198,0.3)] mt-2"
              >
                Esegui Registrazione
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}