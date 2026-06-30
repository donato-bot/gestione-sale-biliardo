"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Magazzino({ salaId, onBack }: { salaId: string; onBack: () => void }) {
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [nome, setNome] = useState("");
  const [quantita, setQuantita] = useState("");
  const [scorta, setScorta] = useState("");

  useEffect(() => { caricaProdotti(); }, [salaId]);

  const caricaProdotti = async () => {
    const { data } = await supabase.from("magazzino").select("*").eq("sala_id", salaId);
    if (data) setProdotti(data);
  };

  const aggiungiProdotto = async () => {
    if (!nome || !quantita) return alert("Inserisci nome e quantità");
    await supabase.from("magazzino").insert({ 
      sala_id: salaId, nome_prodotto: nome, giacenza: parseInt(quantita), scorta_minima: parseInt(scorta) 
    });
    setNome(""); setQuantita(""); setScorta("");
    caricaProdotti();
  };

  const aggiornaGiacenza = async (id: string, nuovaGiacenza: number) => {
    await supabase.from("magazzino").update({ giacenza: nuovaGiacenza }).eq("id", id);
    caricaProdotti();
  };

  const eliminaProdotto = async (id: string) => {
    await supabase.from("magazzino").delete().eq("id", id);
    caricaProdotti();
  };

  return (
    <div className="bg-[#0B0D14] p-8 rounded-3xl text-white">
      {/* HEADER: Tasto unico a SINISTRA rinominato */}
      <div className="flex justify-start items-center mb-8 border-b border-gray-800 pb-4 gap-6">
        <button 
          onClick={onBack} 
          className="bg-cyan-900/50 hover:bg-cyan-800 text-cyan-400 border border-cyan-700 px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer"
        >
          ← TORRE DI CONTROLLO
        </button>
        <h2 className="text-3xl font-black uppercase italic">MAGAZZINO E SCORTE</h2>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {/* FORM NUOVO PRODOTTO */}
        <div className="bg-[#1A1D24] p-6 rounded-2xl border border-gray-700">
          <h3 className="font-black mb-4">NUOVO PRODOTTO</h3>
          <input placeholder="Nome Prodotto" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-black p-3 rounded-lg mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="Q.tà Iniziale" value={quantita} onChange={e => setQuantita(e.target.value)} className="bg-black p-3 rounded-lg" />
            <input type="number" placeholder="Scorta Minima" value={scorta} onChange={e => setScorta(e.target.value)} className="bg-black p-3 rounded-lg" />
          </div>
          <button onClick={aggiungiProdotto} className="w-full mt-6 bg-cyan-600 py-3 rounded-lg font-black uppercase">Aggiungi al Magazzino</button>
        </div>

        {/* LISTA INVENTARIO */}
        <div className="space-y-4">
          {prodotti.map(p => (
            <div key={p.id} className="bg-[#1A1D24] p-4 rounded-xl flex justify-between items-center border border-gray-700">
              <span className="font-bold">{p.nome_prodotto} ({p.giacenza})</span>
              <div className="flex gap-2">
                <button onClick={() => aggiornaGiacenza(p.id, p.giacenza - 1)} className="bg-gray-800 px-3 py-1 rounded">-</button>
                <button onClick={() => aggiornaGiacenza(p.id, p.giacenza + 1)} className="bg-gray-800 px-3 py-1 rounded">+</button>
                <button onClick={() => eliminaProdotto(p.id)} className="bg-red-900 px-3 py-1 rounded text-red-400">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}