"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Staff({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [ricerca, setRicerca] = useState("");
  
  // Form State
  const [nominativo, setNominativo] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");

  async function fetchStaff() {
    if (!salaId) return;
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setStaffList(data);
    }
  }

  useEffect(() => {
    fetchStaff();
  }, [salaId]);

  const creaOperatore = async (e: any) => {
    e.preventDefault();
    if (!nominativo || !pin) return alert("Nominativo e PIN sono obbligatori.");

    const { error } = await supabase.from('staff').insert([{
      sala_id: salaId,
      nominativo,
      email,
      pin
    }]);

    if (error) {
      console.error("Errore creazione staff:", error);
      alert("Errore durante la creazione dell'operatore.");
    } else {
      setNominativo("");
      setEmail("");
      setPin("");
      fetchStaff();
    }
  };

  const eliminaOperatore = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler rimuovere questo operatore?")) return;
    
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (!error) {
      fetchStaff();
    }
  };

  const handleReturn = () => {
    if (typeof setActiveView === 'function') {
      setActiveView("hub");
    } else {
      window.location.href = window.location.pathname;
    }
  };

  const staffFiltrato = staffList.filter(s => 
    s.nominativo.toLowerCase().includes(ricerca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center">
      
      <div className="w-full max-w-7xl bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Risorse Umane</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Organizzazione Staff</h2>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleReturn} className="bg-[#00ADC6] hover:bg-[#008A9E] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,173,198,0.2)]">
              ← Torre di Controllo
            </button>
          </div>
        </div>

        {/* LAYOUT A DUE COLONNE */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* SINISTRA: ELENCO AUTORIZZATI (8 Colonne) */}
          <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
            
            <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Elenco Autorizzati</h3>
            
            {/* Barra Ricerca e Totale */}
            <div className="flex gap-4">
              <div className="flex-1 bg-[#1A1D24] border border-[#2A2E39] rounded-xl flex items-center px-4">
                <span className="text-xl mr-3">🔍</span>
                <input 
                  type="text" 
                  placeholder="Ricerca operatore..." 
                  value={ricerca}
                  onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-transparent text-white font-bold p-3 focus:outline-none placeholder-gray-500"
                />
              </div>
              <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-xl px-8 flex flex-col items-center justify-center">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Totale Staff</span>
                <span className="text-2xl font-black text-white">{staffList.length}</span>
              </div>
            </div>

            {/* Tabella Staff */}
            <div className="bg-transparent border border-gray-700 rounded-2xl p-6 flex-1 min-h-[400px]">
              
              {/* Intestazione Tabella */}
              <div className="grid grid-cols-4 gap-4 border-b border-[#2A2E39] pb-3 mb-4 text-[10px] text-[#00E5FF] font-black uppercase tracking-widest">
                <div className="col-span-1">Nominativo</div>
                <div className="col-span-1">Email</div>
                <div className="col-span-1 text-center">PIN</div>
                <div className="col-span-1 text-right">Azioni</div>
              </div>

              {/* Lista */}
              <div className="space-y-2">
                {staffFiltrato.length === 0 ? (
                  <div className="py-10 flex flex-col items-center justify-center opacity-50">
                    <span className="text-gray-500 font-black text-sm uppercase tracking-widest">Nessun operatore trovato</span>
                  </div>
                ) : (
                  staffFiltrato.map((staff) => (
                    <div key={staff.id} className="grid grid-cols-4 gap-4 items-center bg-[#1A1D24] border border-[#2A2E39] p-4 rounded-xl hover:border-gray-600 transition-colors">
                      <div className="col-span-1 text-white font-bold text-sm truncate">{staff.nominativo}</div>
                      <div className="col-span-1 text-gray-400 text-xs truncate">{staff.email || "-"}</div>
                      <div className="col-span-1 text-center">
                        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-md text-xs font-black tracking-widest border border-gray-700">
                          {staff.pin}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button 
                          onClick={() => eliminaOperatore(staff.id)}
                          className="text-gray-500 hover:text-[#FF3B30] transition-colors text-sm font-black uppercase tracking-wider"
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* DESTRA: CREAZIONE (4 Colonne) */}
          <div className="col-span-1 md:col-span-4 bg-transparent border border-gray-700 rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-white border-b border-gray-800 pb-4">Nuovo Accesso</h3>
            
            <form onSubmit={creaOperatore} className="space-y-5">
              
              <div>
                <label className="text-[10px] text-[#00E5FF] font-black uppercase tracking-wider mb-1.5 block">Nominativo</label>
                <input 
                  className="w-full bg-white text-black font-bold p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors" 
                  placeholder="Es. Mario Rossi" 
                  value={nominativo} 
                  onChange={(e) => setNominativo(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Email (Login)</label>
                <input 
                  type="email"
                  className="w-full bg-[#1A1D24] text-white font-medium p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#00ADC6] transition-colors" 
                  placeholder="mario@sala.it" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Codice PIN Cassa</label>
                <input 
                  type="text"
                  maxLength={4}
                  className="w-full bg-white text-black font-black text-2xl tracking-[0.5em] text-center p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors" 
                  placeholder="1234" 
                  value={pin} 
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} 
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#00E676] hover:bg-[#00C853] text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_5px_20px_rgba(0,230,118,0.3)] mt-4"
              >
                Crea Operatore
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}