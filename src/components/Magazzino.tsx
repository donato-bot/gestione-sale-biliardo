"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

interface Articolo {
  id: string;
  sala_id: string;
  nome_prodotto: string;
  quantita: number;
  scorta_minima: number;
}

export default function Magazzino({ salaId, setActiveView }: { salaId: string; setActiveView: any }) {
  const [articoli, setArticoli] = useState<Articolo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stato per il nuovo articolo
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovaQuantita, setNuovaQuantita] = useState<number | "">("");
  const [nuovaScorta, setNuovaScorta] = useState<number | "">("");

  useEffect(() => {
    fetchMagazzino();
  }, [salaId]);

  const fetchMagazzino = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('magazzino')
      .select('*')
      .eq('sala_id', salaId)
      .order('nome_prodotto', { ascending: true });

    if (error) {
      console.error("Errore recupero magazzino:", error);
    } else {
      setArticoli(data || []);
    }
    setLoading(false);
  };

  const aggiungiArticolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoNome || nuovaQuantita === "" || nuovaScorta === "") return;

    const { error } = await supabase.from('magazzino').insert([
      {
        sala_id: salaId,
        nome_prodotto: nuovoNome,
        quantita: Number(nuovaQuantita),
        scorta_minima: Number(nuovaScorta)
      }
    ]);

    if (error) {
      alert("Errore nell'aggiunta: " + error.message);
    } else {
      setNuovoNome("");
      setNuovaQuantita("");
      setNuovaScorta("");
      fetchMagazzino(); // Ricarica la lista
    }
  };

  const aggiornaQuantita = async (id: string, delta: number, quantitaAttuale: number) => {
    const nuovaQta = quantitaAttuale + delta;
    if (nuovaQta < 0) return; // Evita quantità negative

    const { error } = await supabase
      .from('magazzino')
      .update({ quantita: nuovaQta })
      .eq('id', id);

    if (!error) {
      setArticoli(articoli.map(art => art.id === id ? { ...art, quantita: nuovaQta } : art));
    }
  };

  const eliminaArticolo = async (id: string) => {
    const conferma = window.confirm("Sei sicuro di voler eliminare questo prodotto dal magazzino?");
    if (!conferma) return;

    const { error } = await supabase.from('magazzino').delete().eq('id', id);
    if (!error) {
      setArticoli(articoli.filter(art => art.id !== id));
    } else {
      alert("Errore nell'eliminazione: " + error.message);
    }
  };

  return (
    <div className="text-white">
      {/* Intestazione e Pulsante Indietro */}
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-wider text-[#00E5FF]">Magazzino e Scorte</h2>
          <p className="text-gray-400 text-sm mt-1">Gestisci l'inventario del tuo club</p>
        </div>
        <button 
          onClick={() => setActiveView("hub")} 
          className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-xl font-bold transition-colors text-sm uppercase"
        >
          ← Torna all'Hub
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Colonna Sinistra: Aggiungi Prodotto */}
        <div className="lg:col-span-1">
          <div className="bg-[#1A1D24] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-6 uppercase text-[#FFCC00]">Nuovo Prodotto</h3>
            <form onSubmit={aggiungiArticolo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Nome Prodotto</label>
                <input 
                  type="text" 
                  value={nuovoNome} 
                  onChange={(e) => setNuovoNome(e.target.value)} 
                  placeholder="Es. Gesso Master, Birra..."
                  className="w-full p-3 bg-[#0B0D14] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Q.tà Iniziale</label>
                  <input 
                    type="number" 
                    value={nuovaQuantita} 
                    onChange={(e) => setNuovaQuantita(e.target.value === "" ? "" : Number(e.target.value))} 
                    className="w-full p-3 bg-[#0B0D14] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                    required
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">Scorta Minima</label>
                  <input 
                    type="number" 
                    value={nuovaScorta} 
                    onChange={(e) => setNuovaScorta(e.target.value === "" ? "" : Number(e.target.value))} 
                    className="w-full p-3 bg-[#0B0D14] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#00E5FF]"
                    required
                    min="0"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#00E5FF] hover:bg-[#00ADC6] text-black font-black uppercase py-3 rounded-xl transition-colors mt-4"
              >
                Aggiungi al Magazzino
              </button>
            </form>
          </div>
        </div>

        {/* Colonna Destra: Lista Inventario */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A1D24] p-6 rounded-2xl border border-gray-800 min-h-[400px]">
            <h3 className="text-xl font-bold mb-6 uppercase text-white">Inventario Attuale</h3>
            
            {loading ? (
              <p className="text-center text-gray-500 py-10">Caricamento inventario...</p>
            ) : articoli.length === 0 ? (
              <div className="text-center py-10 bg-[#0B0D14] rounded-xl border border-gray-800">
                <p className="text-gray-500 font-bold">Magazzino vuoto.</p>
                <p className="text-sm text-gray-600 mt-2">Usa il modulo a sinistra per inserire i tuoi prodotti.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {articoli.map((art) => {
                  const sottoScorta = art.quantita <= art.scorta_minima;
                  
                  return (
                    <div key={art.id} className={`flex items-center justify-between p-4 rounded-xl border ${sottoScorta ? 'bg-red-900/20 border-red-500/50' : 'bg-[#0B0D14] border-gray-800'}`}>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{art.nome_prodotto}</h4>
                        {sottoScorta && <span className="text-xs font-black text-red-500 uppercase tracking-wider">⚠️ In Esaurimento</span>}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-[#1A1D24] rounded-lg border border-gray-700 p-1">
                          <button 
                            onClick={() => aggiornaQuantita(art.id, -1, art.quantita)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-white font-bold"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-black text-xl">{art.quantita}</span>
                          <button 
                            onClick={() => aggiornaQuantita(art.id, 1, art.quantita)}
                            className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded text-white font-bold"
                          >
                            +
                          </button>
                        </div>
                        
                        <button 
                          onClick={() => eliminaArticolo(art.id)}
                          className="p-2 bg-red-900/40 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors ml-2"
                          title="Elimina prodotto"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}