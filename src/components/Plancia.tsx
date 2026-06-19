"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Plancia({ salaId, userRole }: { salaId: string, userRole?: string }) {
  const [tables, setTables] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState<'operativa' | 'configurazione'>('operativa');
  
  // STATI PER IL POP-UP DI CHIUSURA E FEEDBACK
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
      const totaleCalcolato = (durataOre * 8.00).toFixed(2); // Tariffa fittizia 8€ per collaudo

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

    // 1. Inserimento in cassa
    const { error: cassaError } = await supabase.from('cassa').insert({ 
      sala_id: salaId, 
      importo: parseFloat(dettagliChiusura.totale),
      descrizione: `Incasso ${tavoloDaChiudere.nome_tavolo} (Durata: ${dettagliChiusura.durata})`,
      tipo: 'entrata'
    });

    if (cassaError) {
      alert(`ERRORE CASSA: ${cassaError.message}`);
      return; 
    }

    // 2. Libera il tavolo
    const { error: tavoloError } = await supabase.from('tavoli').update({ stato: 'libero', ora_inizio: null }).eq('id', tavoloDaChiudere.id);
    
    if (tavoloError) {
      alert(`ERRORE TAVOLO: ${tavoloError.message}`);
      return;
    }

    // 3. Trigger del messaggio di successo
    setSuccesso(`Incasso di € ${dettagliChiusura.totale} registrato correttamente!`);
    setTimeout(() => {
      setSuccesso(null);
    }, 3500); // Scompare dopo 3.5 secondi

    // Reset stati
    setTavoloDaChiudere(null);
    setDettagliChiusura(null);
    fetchData();
  };

  const salvaModifica = async (id: string, nuovoNome: string) => {
    const { error } = await supabase.from('tavoli').update({ nome_tavolo: nuovoNome }).eq('id', id);
    if (!error) {
      alert("Nome aggiornato!");
      fetchData();
    }
  };

  const getTempoTrascorso = (inizio: string) => {
    const diff = now.getTime() - new Date(inizio).getTime();
    const ore = Math.floor(diff / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 relative">
      
      {/* AVVISO DI SUCCESSO A COMPARSA */}
      {successo && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-green-600 border-2 border-green-400 text-white px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.5)] z-[100] flex items-center gap-3 animate-bounce">
          <span className="text-3xl">✅</span>
          <span className="font-black uppercase tracking-widest text-sm">{successo}</span>
        </div>
      )}

      {/* POP-UP DI CONFERMA CHIUSURA */}
      {tavoloDaChiudere && dettagliChiusura && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-[#11131a] border border-cyan-500 p-8 rounded-3xl w-full max-w-md shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <h2 className="text-3xl font-black text-white mb-6 uppercase italic">Riepilogo Chiusura</h2>
            
            <div className="space-y-4 mb-8 bg-black/50 p-6 rounded-xl border border-gray-800">
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Tavolo</span>
                <span className="text-white font-black">{tavoloDaChiudere.nome_tavolo}</span>
              </div>
              <div className="flex justify-between border-b border-gray-800 pb-2">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Durata</span>
                <span className="text-red-400 font-mono font-bold">{dettagliChiusura.durata}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-cyan-500 text-sm font-black uppercase tracking-widest">Da Incassare</span>
                <span className="text-4xl text-cyan-400 font-black tabular-nums">€ {dettagliChiusura.totale}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setTavoloDaChiudere(null)} 
                className="w-1/3 bg-gray-800 hover:bg-gray-700 py-3 rounded-xl font-black text-xs uppercase transition-all"
              >
                Annulla
              </button>
              <button 
                onClick={confermaIncasso} 
                className="w-2/3 bg-cyan-700 hover:bg-cyan-600 py-3 rounded-xl font-black text-sm uppercase transition-all shadow-lg"
              >
                Conferma e Incassa
              </button>
            </div>
          </div>
        </div>
      )}

      {userRole === 'gestore' && (
        <div className="mb-8 flex justify-end">
            <button 
              onClick={() => setMode(mode === 'operativa' ? 'configurazione' : 'operativa')}
              className="bg-cyan-900/50 border border-cyan-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-cyan-400 hover:bg-cyan-800 transition-all"
            >
                {mode === 'operativa' ? '⚙️ Entra in Configurazione' : '← Torna a Operativa'}
            </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tables.map((t) => (
          <div key={t.id} className={`p-6 rounded-3xl border-4 ${t.stato === 'occupato' ? 'border-red-600 bg-red-950/20' : 'border-green-600 bg-green-950/20'}`}>
            
            {mode === 'operativa' ? (
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white">{t.nome_tavolo}</h3>
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Stato: {t.stato}</p>
                
                {t.stato === 'occupato' && t.ora_inizio && (
                  <div className="text-4xl font-mono font-bold text-red-400 py-2 tabular-nums">
                    {getTempoTrascorso(t.ora_inizio)}
                  </div>
                )}

                <button 
                  onClick={() => gestisciTavolo(t)} 
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-tighter transition-transform active:scale-95 ${t.stato === 'occupato' ? 'bg-red-700 hover:bg-red-600' : 'bg-green-700 hover:bg-green-600'}`}
                >
                  {t.stato === 'occupato' ? 'Chiudi Gioco' : 'Avvia Tavolo'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-cyan-500 tracking-widest">Modifica Nome</p>
                <input 
                  id={`input-${t.id}`}
                  defaultValue={t.nome_tavolo} 
                  className="w-full bg-black/50 p-4 rounded-xl border border-gray-700 text-white font-bold outline-none focus:border-cyan-500"
                />
                <button 
                  onClick={() => {
                    const val = (document.getElementById(`input-${t.id}`) as HTMLInputElement).value;
                    salvaModifica(t.id, val);
                  }}
                  className="w-full bg-cyan-800 hover:bg-cyan-600 py-3 rounded-xl text-xs font-black uppercase transition-colors"
                >
                  Salva Modifica
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}