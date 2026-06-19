"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useParams } from "next/navigation";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AppPrenotazioneSoci() {
  const params = useParams();
  const salaId = params.sala as string;

  const [nomeSala, setNomeSala] = useState<string>("Caricamento...");
  const [nomeCliente, setNomeCliente] = useState('');
  const [dataOra, setDataOra] = useState('');
  const [richiesta, setRichiesta] = useState('');
  const [note, setNote] = useState('');
  
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [prenotazioneCompletata, setPrenotazioneCompletata] = useState(false);

  useEffect(() => {
    async function fetchSala() {
      if (!salaId) return;
      const { data } = await supabase.from('sale').select('name').eq('id', salaId).single();
      if (data) setNomeSala(data.name);
      else setNomeSala("Sala non trovata");
    }
    fetchSala();
  }, [salaId]);

  async function inviaPrenotazione(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCliente || !dataOra) return;
    
    setLoadingSubmit(true);
    const notaFormattata = `[APP SOCI] Note: ${note}`.trim();

    const { error } = await supabase.from('prenotazioni').insert([{
      sala_id: salaId,
      nome_cliente: nomeCliente,
      tavolo_numero: richiesta,
      data_ora: new Date(dataOra).toISOString(), 
      note: notaFormattata
    }]);

    if (!error) setPrenotazioneCompletata(true);
    else alert("Errore invio. Riprova.");
    setLoadingSubmit(false);
  }

  if (prenotazioneCompletata) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
        <div className="bg-[#11131a] p-10 rounded-[40px] border border-emerald-500 shadow-2xl text-center w-full max-w-sm">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-widest mb-4">Ricevuta!</h2>
          <p className="text-gray-400 text-sm mb-8">La tua richiesta è stata trasmessa alla sala. Riceverai conferma a breve.</p>
          <button onClick={() => window.location.reload()} className="w-full bg-gray-800 py-4 rounded-2xl font-black text-xs uppercase">Torna alla home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans flex justify-center items-center">
      
      <div className="w-full max-w-md bg-[#11131a] rounded-[40px] border border-gray-800 shadow-2xl p-8">
        
        {/* AVVISO INSTALLAZIONE */}
        <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-2xl mb-8 text-[10px] text-emerald-400 font-bold text-center">
          💡 Suggerimento: premi "Condividi" e "Aggiungi a schermata Home" per avere l'app sempre a portata di mano.
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">{nomeSala}</h1>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Riserva il tuo biliardo</p>
        </div>

        <form onSubmit={inviaPrenotazione} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Nome / Cognome</label>
            <input type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Es. Mario Rossi" className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:border-emerald-500 outline-none" required />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Biliardo o Specialità</label>
            <input type="text" value={richiesta} onChange={e => setRichiesta(e.target.value)} placeholder="Es. Internazionale, Pool..." className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:border-emerald-500 outline-none" />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Giorno e ora d'arrivo</label>
            <input type="datetime-local" value={dataOra} onChange={e => setDataOra(e.target.value)} className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-sm text-emerald-400 focus:border-emerald-500 outline-none" required />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Note (Opzionale)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Es. Richiesta stecca..." className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white h-24 resize-none focus:border-emerald-500 outline-none" />
          </div>

          <button type="submit" disabled={loadingSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg">
            {loadingSubmit ? 'INVIO...' : 'Invia Richiesta Prenotazione'}
          </button>
        </form>
      </div>
    </div>
  );
}