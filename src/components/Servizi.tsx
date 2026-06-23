"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Servizi({ salaId, onBack }: { salaId: string, onBack?: () => void }) {
  const [vendite, setVendite] = useState<any[]>([]);
  const [debiti, setDebiti] = useState<any[]>([]);
  
  // Stato per la colonna ENTRATE
  const [descrizioneEntrata, setDescrizioneEntrata] = useState("");
  const [nominativoEntrata, setNominativoEntrata] = useState("");
  const [importoEntrata, setImportoEntrata] = useState("");

  // Stato per la colonna USCITE
  const [descrizioneUscita, setDescrizioneUscita] = useState("");
  const [importoUscita, setImportoUscita] = useState("");

  async function fetchData() {
    if (!salaId) return;
    
    const { data: vData } = await supabase
      .from('vendite_servizi')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });
      
    const { data: dData } = await supabase
      .from('debiti_clienti')
      .select('*')
      .eq('sala_id', salaId)
      .eq('stato', 'aperto')
      .order('created_at', { ascending: false });
    
    if (vData) setVendite(vData);
    if (dData) setDebiti(dData);
  }

  async function registraIncasso() {
    if (!importoEntrata || !descrizioneEntrata) return alert("Inserisci descrizione e importo per l'entrata");
    
    const { error } = await supabase.from('vendite_servizi').insert([{ 
      sala_id: salaId, 
      descrizione: descrizioneEntrata, 
      importo: parseFloat(importoEntrata),
      tipo: 'bar'
    }]);
    
    if (error) {
      console.error("Errore vendite:", error);
      alert("Errore salvataggio registrazione.");
    } else { 
      setDescrizioneEntrata(""); 
      setImportoEntrata(""); 
      fetchData(); 
    }
  }

  async function registraUscita() {
    if (!importoUscita || !descrizioneUscita) return alert("Inserisci descrizione e importo per l'uscita");
    
    const importoNegativo = -Math.abs(parseFloat(importoUscita));

    const { error } = await supabase.from('vendite_servizi').insert([{ 
      sala_id: salaId, 
      descrizione: descrizioneUscita, 
      importo: importoNegativo,
      tipo: 'uscita'
    }]);
    
    if (error) {
      console.error("Errore uscite:", error);
      alert("Errore salvataggio uscita.");
    } else { 
      setDescrizioneUscita(""); 
      setImportoUscita(""); 
      fetchData(); 
    }
  }

  async function registraSospeso() {
    if (!importoEntrata || !nominativoEntrata) return alert("Inserisci nominativo e importo per il sospeso");
    
    const { error } = await supabase.from('debiti_clienti').insert([{ 
      sala_id: salaId, 
      nominativo: nominativoEntrata, 
      importo: parseFloat(importoEntrata),
      stato: 'aperto' 
    }]);
    
    if (error) {
      console.error("Errore debiti:", error);
      alert("Errore salvataggio sospeso.");
    } else { 
      setNominativoEntrata(""); 
      setImportoEntrata(""); 
      fetchData(); 
    }
  }

  useEffect(() => { 
    if (salaId) fetchData(); 
  }, [salaId]);

  const handleReturn = () => {
    if (typeof onBack === 'function') {
      onBack(); 
    } else {
      window.location.href = window.location.pathname; 
    }
  };

  const totaleCassa = vendite.reduce((acc, curr) => acc + Number(curr.importo), 0);

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center">
      
      <div className="w-full max-w-[1400px] bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Pannello Multi-Tenant</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Servizi al Banco</h2>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleReturn} 
              className="bg-[#00ADC6] hover:bg-[#008A9E] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,173,198,0.2)]"
            >
              ← Torre di Controllo
            </button>
            
            <button 
              onClick={() => window.print()} 
              className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-gray-700 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors"
            >
              ⚙ Stampa Report
            </button>
          </div>
        </div>

        {/* LAYOUT A 3 COLONNE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNA 1: STORICO MOVIMENTI E SOSPESI */}
          <div className="col-span-1 lg:col-span-6 space-y-6">
            
            <div className="bg-[#0F1115] border border-[#1E222B] rounded-2xl p-6 min-h-[380px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white">Storico Movimenti</h3>
                <div className="bg-[#1A1D24] px-4 py-2 rounded-lg border border-[#1E222B] flex items-center gap-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Saldo Netto</span>
                  <span className={`font-black text-lg tracking-tight ${totaleCassa >= 0 ? 'text-white' : 'text-[#FF3B30]'}`}>
                    € {totaleCassa.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                {vendite.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-[#4A5568] uppercase font-black text-sm italic tracking-widest">
                    Nessun Movimento
                  </div>
                ) : (
                  vendite.map((v) => (
                    <div key={v.id} className="flex justify-between items-center bg-[#1A1D24] p-4 rounded-xl border border-[#1E222B] hover:border-[#2A2E39] transition-colors">
                      <div>
                        <p className="text-white font-bold text-sm">{v.descrizione}</p>
                        <p className="text-[10px] text-[#00E5FF] font-bold uppercase mt-1 tracking-wider">{v.tipo}</p>
                      </div>
                      <p className={`font-black text-lg ${v.importo < 0 ? 'text-[#FF3B30]' : 'text-white'}`}>
                        {v.importo > 0 ? '+' : ''}{Number(v.importo).toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-[#0F1115] border border-[#1E222B] rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#FF3B30] mb-6">Sospesi Attivi</h3>
              <div className="space-y-3">
                {debiti.length === 0 ? (
                  <p className="text-[#4A5568] uppercase font-black text-xs italic tracking-widest">Nessun sospeso</p>
                ) : (
                  debiti.map((d) => (
                    <div key={d.id} className="flex justify-between items-center bg-[#1A1D24] p-4 rounded-xl border border-[#FF3B30]/20">
                      <span className="text-white font-bold text-sm uppercase">{d.nominativo}</span>
                      <span className="font-black text-[#FF3B30]">€ {Number(d.importo).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* COLONNA 2: FORM ENTRATE */}
          <div className="col-span-1 lg:col-span-3 bg-[#0F1115] border border-[#1E222B] rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-white text-center">Entrate</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Comparto / Articolo</label>
                <input 
                  className="w-full bg-[#1A1D24] border border-[#1E222B] text-white p-3.5 rounded-xl text-sm focus:outline-none focus:border-[#00E5FF] transition-colors" 
                  placeholder="Es. Caffè, Partita..." 
                  value={descrizioneEntrata} 
                  onChange={(e) => setDescrizioneEntrata(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Nominativo <span className="text-gray-600">(Solo Sospeso)</span></label>
                <input 
                  className="w-full bg-[#1A1D24] border border-[#1E222B] text-white p-3.5 rounded-xl text-sm focus:outline-none focus:border-[#FF3B30] transition-colors" 
                  placeholder="Es. Fernando" 
                  value={nominativoEntrata} 
                  onChange={(e) => setNominativoEntrata(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Importo (€)</label>
                <input 
                  type="number"
                  className="w-full bg-[#1A1D24] border border-[#1E222B] text-white font-black text-xl p-3.5 rounded-xl focus:outline-none focus:border-[#00E5FF] transition-colors" 
                  placeholder="0.00" 
                  value={importoEntrata} 
                  onChange={(e) => setImportoEntrata(e.target.value)} 
                />
              </div>

              <div className="pt-6 space-y-3">
                <button 
                  onClick={registraIncasso}
                  className="w-full bg-white hover:bg-gray-200 text-[#0F1115] py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Registra Incasso
                </button>
                
                <button 
                  onClick={registraSospeso}
                  className="w-full bg-transparent hover:bg-[#FF3B30]/10 border border-[#FF3B30] text-[#FF3B30] py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95"
                >
                  Segna Sospeso
                </button>
              </div>
            </div>
          </div>

          {/* COLONNA 3: FORM USCITE */}
          <div className="col-span-1 lg:col-span-3 bg-[#0F1115] border border-[#1E222B] rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-[#FF3B30] text-center">Uscite</h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Comparto / Articolo</label>
                <input 
                  className="w-full bg-[#1A1D24] border border-[#1E222B] text-white p-3.5 rounded-xl text-sm focus:outline-none focus:border-[#FF3B30] transition-colors" 
                  placeholder="Es. Fornitura stecche..." 
                  value={descrizioneUscita} 
                  onChange={(e) => setDescrizioneUscita(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2 block">Importo (€)</label>
                <input 
                  type="number"
                  className="w-full bg-[#1A1D24] border border-[#1E222B] text-white font-black text-xl p-3.5 rounded-xl focus:outline-none focus:border-[#FF3B30] transition-colors" 
                  placeholder="0.00" 
                  value={importoUscita} 
                  onChange={(e) => setImportoUscita(e.target.value)} 
                />
              </div>

              <div className="pt-6">
                <button 
                  onClick={registraUscita}
                  className="w-full bg-[#FF3B30] hover:bg-[#D32F2F] text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(255,59,48,0.3)]"
                >
                  Registra Uscita
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}