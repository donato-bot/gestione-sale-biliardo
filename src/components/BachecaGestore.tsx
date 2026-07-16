"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";

export default function BachecaGestore({ salaId }: { salaId: string }) {
  // STATI DATI REALI DA SUPABASE
  const [avvisi, setAvvisi] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // STATI FORM INSERIMENTO
  const [tipoAvviso, setTipoAvviso] = useState<'INFO' | 'AVVISO' | 'URGENTE'>('INFO');
  const [titolo, setTitolo] = useState("");
  const [messaggio, setMessaggio] = useState("");

  // Al caricamento, peschiamo i dati veri dal database
  useEffect(() => {
    if (salaId) caricaBacheca();
  }, [salaId]);

  const caricaBacheca = async () => {
    const { data, error } = await supabase
      .from('bacheca')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Errore caricamento bacheca:", error.message);
    } else if (data) {
      setAvvisi(data);
    }
  };

  // Funzione per pubblicare un nuovo avviso
  const pubblicaAvviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim() || !messaggio.trim()) {
      alert("Compila sia il titolo che il testo del messaggio!");
      return;
    }
    
    setLoading(true);

    const { error } = await supabase
      .from('bacheca')
      .insert([{
        sala_id: salaId,
        titolo: titolo.trim(),
        messaggio: messaggio.trim(),
        tipo: tipoAvviso
      }]);

    setLoading(false);

    if (error) {
      alert("ERRORE DURANTE LA PUBBLICAZIONE: " + error.message);
    } else {
      // Reset form e ricarica lista
      setTitolo("");
      setMessaggio("");
      setTipoAvviso('INFO');
      caricaBacheca();
    }
  };

  // Funzione per eliminare un avviso vecchio
  const eliminaAvviso = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questa comunicazione dalla bacheca?")) return;
    
    const { error } = await supabase
      .from('bacheca')
      .delete()
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE L'ELIMINAZIONE: " + error.message);
    } else {
      caricaBacheca(); // Aggiorna la lista
    }
  };

  return (
    <div className="max-w-7xl mx-auto bg-[#0B0D14] rounded-[2rem] border border-[#1E222B] p-8 shadow-2xl">
      
      <div className="mb-10 border-b border-[#1E222B] pb-6">
        <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
          <span className="text-blue-500">📢</span> BACHECA CLUB
        </h1>
        <p className="text-gray-400 text-sm font-bold mt-2 uppercase tracking-widest">Gestione Comunicazioni Interne</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNA SINISTRA: ELENCO AVVISI ATTIVI */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center mb-6 border-b border-[#2A2E39] pb-2">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Avvisi Attivi
            </h3>
            <span className="bg-[#1A1D24] text-blue-500 text-[10px] font-black px-3 py-1 rounded-full border border-[#2A2E39]">
              {avvisi.length} COMUNICAZIONI
            </span>
          </div>

          {avvisi.length === 0 ? (
             <div className="bg-[#1A1D24] border border-[#2A2E39] p-8 rounded-2xl text-center">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Nessun avviso presente in bacheca.</p>
             </div>
          ) : (
            avvisi.map((avviso) => {
              // Colori dinamici in base al tipo
              let badgeColor = "bg-blue-500/20 text-blue-500";
              let borderColor = "bg-blue-500";
              let icona = "ℹ️";
              
              if (avviso.tipo === 'AVVISO') {
                badgeColor = "bg-yellow-500/20 text-yellow-500";
                borderColor = "bg-yellow-500";
                icona = "⚠️";
              } else if (avviso.tipo === 'URGENTE') {
                badgeColor = "bg-red-500/20 text-red-500";
                borderColor = "bg-red-500";
                icona = "🚨";
              }

              const dataPubblicazione = new Date(avviso.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

              return (
                <div key={avviso.id} className="bg-[#1A1D24] border border-[#2A2E39] p-5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row gap-4 items-start md:items-center justify-between group">
                  <div className={`absolute top-0 left-0 w-1 h-full ${borderColor}`}></div>
                  
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-2xl mt-1">{icona}</div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-white font-black uppercase text-sm">{avviso.titolo}</h4>
                        <span className={`text-[9px] ${badgeColor} px-2 py-0.5 rounded font-black uppercase tracking-widest`}>
                          {avviso.tipo}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs font-bold mb-2 pr-4">{avviso.messaggio}</p>
                      <p className="text-gray-600 text-[9px] font-black uppercase tracking-widest">{dataPubblicazione}</p>
                    </div>
                  </div>

                  {/* Tasto Elimina (visibile al passaggio del mouse su PC) */}
                  <button 
                    onClick={() => eliminaAvviso(avviso.id)} 
                    className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Elimina Avviso"
                  >
                    🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* COLONNA DESTRA: FORM PUBBLICAZIONE */}
        <div className="lg:col-span-4">
          <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-6 sticky top-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 border-b border-[#2A2E39] pb-4">
              Pubblica Avviso
            </h3>
            
            <form onSubmit={pubblicaAvviso} className="space-y-5">
              
              {/* Selettore Tipo */}
              <div className="flex gap-2 p-1 bg-black rounded-xl border border-[#2A2E39]">
                <button type="button" onClick={() => setTipoAvviso('INFO')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoAvviso === 'INFO' ? 'bg-[#00E5FF] text-black' : 'text-gray-500 hover:text-white'}`}>INFO</button>
                <button type="button" onClick={() => setTipoAvviso('AVVISO')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoAvviso === 'AVVISO' ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}>AVVISO</button>
                <button type="button" onClick={() => setTipoAvviso('URGENTE')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoAvviso === 'URGENTE' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-white'}`}>URGENTE</button>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2 block">Titolo Avviso</label>
                <input 
                  type="text" 
                  value={titolo} 
                  onChange={(e) => setTitolo(e.target.value)} 
                  placeholder="Es. Chiusura anticipata..." 
                  className="w-full bg-black text-white font-bold p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-blue-500" 
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2 block">Testo del Comunicato</label>
                <textarea 
                  value={messaggio} 
                  onChange={(e) => setMessaggio(e.target.value)} 
                  placeholder="Scrivi i dettagli qui..." 
                  className="w-full bg-black text-white font-bold p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-blue-500 min-h-[120px] resize-none"
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                {loading ? "Pubblicazione..." : "PUBBLICA IN BACHECA 📢"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}