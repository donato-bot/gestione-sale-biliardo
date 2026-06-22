"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Plancia({ salaId, userRole, setActiveView }: { salaId: string, userRole?: string, setActiveView?: (view: string) => void }) {
  const [tables, setTables] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState<'operativa' | 'configurazione'>('operativa');
  
  const [tavoloDaChiudere, setTavoloDaChiudere] = useState<any | null>(null);
  const [dettagliChiusura, setDettagliChiusura] = useState<{ durata: string, totale: string } | null>(null);
  const [successo, setSuccesso] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    fetchData();
    return () => clearInterval(timer);
  }, [salaId]);

  const fetchData = async () => {
    const { data } = await supabase.from("tavoli").select("*").eq("sala_id", salaId).order("numero");
    if (data) setTables(data);
  };

  const gestisciTavolo = async (tavolo: any) => {
    if (tavolo.stato === 'libero') {
      await supabase.from('tavoli').update({ stato: 'occupato', ora_inizio: new Date().toISOString() }).eq('id', tavolo.id);
      fetchData();
    } else {
      const inizio = new Date(tavolo.ora_inizio).getTime();
      const diff = new Date().getTime() - inizio;
      const durataOre = diff / (1000 * 60 * 60);
      const totaleCalcolato = (durataOre * 8.00).toFixed(2);

      const ore = Math.floor(diff / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      const durataFormattata = `${ore.toString().padStart(2, '0')}h ${min.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;

      setDettagliChiusura({ durata: durataFormattata, totale: totaleCalcolato });
      setTavoloDaChiudere(tavolo);
    }
  };

  const confermaIncasso = async () => {
    if (!tavoloDaChiudere || !dettagliChiusura) return;

    const { error: cassaError } = await supabase.from('cassa').insert({ 
      sala_id: salaId, 
      importo: parseFloat(dettagliChiusura.totale),
      descrizione: `Incasso ${tavoloDaChiudere.nome_tavolo} (Durata: ${dettagliChiusura.durata})`,
      tipo: 'entrata'
    });

    if (cassaError) { alert(`ERRORE CASSA: ${cassaError.message}`); return; }

    const { error: tavoloError } = await supabase.from('tavoli').update({ stato: 'libero', ora_inizio: null }).eq('id', tavoloDaChiudere.id);
    if (tavoloError) { alert(`ERRORE TAVOLO: ${tavoloError.message}`); return; }

    setSuccesso(`INCASSO DI € ${dettagliChiusura.totale} REGISTRATO!`);
    setTimeout(() => setSuccesso(null), 3500);

    setTavoloDaChiudere(null);
    setDettagliChiusura(null);
    fetchData();
  };

  const salvaModifica = async (id: string, nuovoNome: string) => {
    const { error } = await supabase.from('tavoli').update({ nome_tavolo: nuovoNome }).eq('id', id);
    if (!error) { alert("Nome aggiornato!"); fetchData(); }
  };

  const getTempoTrascorso = (inizio: string) => {
    const diff = now.getTime() - new Date(inizio).getTime();
    const ore = Math.floor(diff / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-4 sm:p-8 md:p-12 lg:p-16 flex flex-col items-center transition-colors duration-500">
      
      {successo && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-emerald-600 text-emerald-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] animate-bounce font-black uppercase tracking-widest text-xl">
          ✓ {successo}
        </div>
      )}

      {tavoloDaChiudere && dettagliChiusura && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-4 border-white p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <h2 className="text-3xl font-black mb-8 uppercase text-center text-white border-b-2 border-gray-600 pb-4">Chiusura Tavolo</h2>
            <div className="space-y-6 mb-10 text-white">
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Tavolo</span>
                <span className="font-black text-xl">{tavoloDaChiudere.nome_tavolo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 font-bold uppercase tracking-widest">Durata</span>
                <span className="font-black text-xl text-red-500">{dettagliChiusura.durata}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-100 p-6 rounded-xl border-2 border-gray-300">
                <span className="text-gray-800 font-black uppercase text-xl tracking-widest">Totale</span>
                <span className="text-4xl text-black font-black">€ {dettagliChiusura.totale}</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setTavoloDaChiudere(null)} className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-black uppercase border-2 border-gray-600">Annulla</button>
              <button onClick={confermaIncasso} className="w-2/3 bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-black uppercase shadow-lg">Incassa e Libera</button>
            </div>
          </div>
        </div>
      )}

      {/* SCHERMO NERO PRINCIPALE */}
      <div className="w-full max-w-[1600px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-8 border-emerald-100/60 relative overflow-hidden">
        
        {/* HEADER CON PULSANTI APPARISCENTI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-800 pb-8 mb-10 gap-4">
          <div>
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Pannello di Controllo</p>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">PLANCIA OPERATIVA</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {/* TASTO TORRE DI CONTROLLO - VIVIDO E IMPATTANTE */}
            <button 
              onClick={() => setActiveView && setActiveView('hub')} 
              className="bg-cyan-600 text-white hover:bg-cyan-500 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 border-cyan-400 w-full sm:w-auto shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 text-center"
            >
              ← Torre di Controllo
            </button>

            {/* TASTO CONFIGURA NOMI - ANTRACITE AD ALTO CONTRASTO */}
            {userRole === 'gestore' && (
              <button 
                onClick={() => setMode(mode === 'operativa' ? 'configurazione' : 'operativa')}
                className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 w-full sm:w-auto text-center active:scale-95 ${
                  mode === 'operativa' 
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600 shadow-[0_0_15px_rgba(0,0,0,0.5)]' 
                    : 'bg-amber-600 hover:bg-amber-500 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                }`}
              >
                {mode === 'operativa' ? '⚙️ Configura Nomi' : 'Torna alla Plancia'}
              </button>
            )}
          </div>
        </div>

        {/* GRIGLIA BILIARDI SCHEMATICA CON EFFETTO HOVER */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {tables.map((t) => {
            const isOccupied = t.stato === 'occupato';
            return (
              <div 
                key={t.id} 
                className={`p-8 rounded-[2rem] bg-black border-[3px] flex flex-col gap-6 shadow-[0_0_30px_rgba(0,0,0,0.6)] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(255,255,255,0.08)] ${
                  isOccupied ? 'border-gray-400 hover:border-red-400' : 'border-gray-400 hover:border-emerald-400'
                }`}
              >
                {mode === 'operativa' ? (
                  <>
                    <div className="flex justify-between items-center px-2">
                      <h3 className="text-3xl font-black text-white uppercase tracking-tight">{t.nome_tavolo}</h3>
                      
                      <div className={`px-6 py-2.5 rounded-full font-black uppercase text-sm tracking-widest border-2 shadow-md ${
                        isOccupied ? 'bg-white text-red-600 border-red-600' : 'bg-white text-emerald-600 border-emerald-600'
                      }`}>
                        {isOccupied ? 'IN USO' : 'DISPONIBILE'}
                      </div>
                    </div>

                    {/* BOX CRONOMETRO BIANCO ABBAGLIANTE */}
                    <div className="py-10 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-gray-400 shadow-inner">
                      {isOccupied && t.ora_inizio ? (
                        <div className="text-7xl font-mono font-black text-black tracking-widest tabular-nums drop-shadow-sm">
                          {getTempoTrascorso(t.ora_inizio)}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-4xl font-black uppercase italic tracking-widest">Pronto</div>
                      )}
                    </div>

                    {/* BOTTONE AZIONE */}
                    <button 
                      onClick={() => gestisciTavolo(t)} 
                      className={`w-full py-6 rounded-2xl font-black text-xl uppercase tracking-widest transition-all ${
                        isOccupied 
                          ? 'bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800' 
                          : 'bg-[#0f172a] hover:bg-slate-800 text-white border-2 border-slate-600'
                      }`}
                    >
                      {isOccupied ? 'ARRESTA CONTEGGIO' : 'APRI SESSIONE'}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-6 px-2 py-4">
                    <label className="text-gray-400 font-black uppercase text-xs tracking-widest">Ridenomina Tavolo</label>
                    <input id={`input-${t.id}`} defaultValue={t.nome_tavolo} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-2xl uppercase outline-none focus:border-emerald-500" />
                    <button onClick={() => { const v = (document.getElementById(`input-${t.id}`) as HTMLInputElement).value; salvaModifica(t.id, v); }} className="w-full bg-white hover:bg-gray-200 py-4 rounded-xl font-black uppercase text-black border-2 border-gray-400 text-sm">Salva Configurazione</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}