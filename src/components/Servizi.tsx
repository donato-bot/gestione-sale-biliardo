"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Servizi({ salaId, onBack }: { salaId: string; onBack: () => void }) {
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [carrello, setCarrello] = useState<any[]>([]);
  const [nominativoSospeso, setNominativoSospeso] = useState("");
  const [voceDesc, setVoceDesc] = useState("");
  const [vocePrezzo, setVocePrezzo] = useState("");

  useEffect(() => {
    caricaProdotti();
  }, [salaId]);

  const caricaProdotti = async () => {
    const { data } = await supabase.from("magazzino").select("*").eq("sala_id", salaId);
    if (data) setProdotti(data);
  };

  const aggiungiAlCarrello = (prodotto: any) => {
    setCarrello(prev => [...prev, { ...prodotto, quantita: 1 }]);
  };

  const aggiungiVoceLibera = () => {
    if (!voceDesc || !vocePrezzo) return;
    const voceManuale = {
      id: `manual-${Date.now()}`,
      nome_prodotto: voceDesc,
      prezzo_vendita: parseFloat(vocePrezzo),
      isManuale: true
    };
    setCarrello(prev => [...prev, { ...voceManuale, quantita: 1 }]);
    setVoceDesc("");
    setVocePrezzo("");
  };

  const calcolaTotale = () => carrello.reduce((acc, v) => acc + (v.prezzo_vendita * v.quantita), 0);

  const gestisciCheckout = async (modalita: 'INCASSO' | 'SOSPESO') => {
    if (carrello.length === 0) return;
    if (modalita === 'SOSPESO' && !nominativoSospeso) { alert("Nome obbligatorio"); return; }
    const totale = calcolaTotale();
    const descrizione = `[BAR] ${carrello.map(v => v.nome_prodotto).join(", ")} ${modalita === 'SOSPESO' ? `(A: ${nominativoSospeso})` : ''}`;
    await supabase.from("movimenti_contabili").insert({
      sala_id: salaId,
      importo: totale,
      descrizione,
      tipo_movimento: 'ENTRATA',
      causale_origine: modalita === 'INCASSO' ? 'Bar' : 'Incasso Sospeso'
    });
    setCarrello([]);
    setNominativoSospeso("");
    alert("Operazione completata!");
  };

  return (
    <div className="min-h-screen bg-[#E6F0EB] p-8">
      <div className="max-w-6xl mx-auto bg-[#0B0D14] rounded-3xl p-8 text-white">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h2 className="text-3xl font-black uppercase italic">SERVIZI AL BANCO</h2>
          <button onClick={onBack} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer">
            ← TORRE DI CONTROLLO
          </button>
        </div>
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {prodotti.map(p => (
                <button key={p.id} onClick={() => aggiungiAlCarrello(p)} className="bg-[#1A1D24] p-4 rounded-xl border border-gray-700 hover:border-cyan-500 text-left">
                  <p className="font-black text-sm">{p.nome_prodotto}</p>
                  <p className="text-cyan-400 font-bold">€ {p.prezzo_vendita.toFixed(2)}</p>
                </button>
              ))}
            </div>
            <div className="bg-gray-900 p-6 rounded-2xl border border-dashed border-gray-600">
              <h4 className="text-xs font-black uppercase text-gray-400 mb-4">Aggiungi voce libera</h4>
              <div className="flex gap-4">
                <input placeholder="Descrizione" value={voceDesc} onChange={e => setVoceDesc(e.target.value)} className="flex-1 bg-white text-black p-2 rounded-lg font-bold" />
                <input type="number" placeholder="€" value={vocePrezzo} onChange={e => setVocePrezzo(e.target.value)} className="w-24 bg-white text-black p-2 rounded-lg font-bold" />
                <button onClick={aggiungiVoceLibera} className="bg-cyan-600 px-6 rounded-lg font-black text-white">+</button>
              </div>
            </div>
          </div>
          <div className="col-span-4 bg-gray-100 text-black p-6 rounded-2xl">
            <h3 className="font-black text-xl mb-4 border-b border-gray-300 pb-2">Scontrino</h3>
            <div className="h-64 overflow-y-auto space-y-2">
              {carrello.map((v, i) => (
                <div key={i} className="flex justify-between text-sm font-bold border-b border-gray-200 pb-1">
                  <span>{v.nome_prodotto}</span>
                  <span>€ {v.prezzo_vendita.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="text-2xl font-black mt-4 border-t border-gray-300 pt-2">TOT: € {calcolaTotale().toFixed(2)}</div>
            <input className="w-full mt-4 p-2 border rounded" placeholder="Assegna a (Sospeso)" value={nominativoSospeso} onChange={e => setNominativoSospeso(e.target.value)} />
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => gestisciCheckout('INCASSO')} className="bg-emerald-600 text-white py-3 rounded-lg font-black">INCASSA</button>
              <button onClick={() => gestisciCheckout('SOSPESO')} className="bg-amber-600 text-white py-3 rounded-lg font-black">SOSPESO</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}