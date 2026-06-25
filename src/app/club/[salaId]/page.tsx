"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function VetrinaClub({ params }: { params: { salaId: string } }) {
  const [nomeSala, setNomeSala] = useState<string>("Caricamento...");
  const [activeView, setActiveView] = useState<string>("hub");
  const [form, setForm] = useState({ nome: '', email: '', data: '', ora: '', note: '' });
  const [inviato, setInviato] = useState(false);
  const [invioInCorso, setInvioInCorso] = useState(false);

  useEffect(() => {
    async function fetchSala() {
      const { data } = await supabase.from('sale').select('name').eq('id', params.salaId).single();
      if (data) setNomeSala(data.name);
    }
    if (params.salaId) fetchSala();
  }, [params.salaId]);

  const handleInvia = async (e: any) => {
    e.preventDefault();
    setInvioInCorso(true);
    const dataOraFormattata = `${form.data}T${form.ora}:00.000Z`;

    const { error } = await supabase.from('prenotazioni').insert([{
      sala_id: params.salaId,
      nome_cliente: form.nome,
      email: form.email,
      data_ora: dataOraFormattata,
      note: form.note || null
    }]);

    if (!error) {
      setInviato(true);
      setTimeout(() => { setInviato(false); setForm({ nome: '', email: '', data: '', ora: '', note: '' }); setActiveView("hub"); }, 2000);
    } else {
      alert("Errore: " + error.message);
    }
    setInvioInCorso(false);
  };

  return (
    <div className="min-h-screen bg-[#E6F0EB] p-6 font-sans">
      {activeView === "hub" && (
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          <h1 className="text-3xl font-black text-center mb-6 uppercase italic">{nomeSala}</h1>
          <button onClick={() => setActiveView("prenotazioni")} className="bg-[#0B0D14] text-white p-5 rounded-3xl font-black uppercase">Prenota Tavolo</button>
        </div>
      )}

      {activeView === "prenotazioni" && (
        <div className="max-w-md mx-auto">
          <button onClick={() => setActiveView("hub")} className="mb-4 text-xs font-bold underline">← INDIETRO</button>
          <div className="bg-[#0B0D14] p-8 rounded-3xl text-white shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase">Riserva un Tavolo</h2>
            {inviato ? <p className="text-[#00E676] font-black text-center">Richiesta inviata!</p> : (
              <form onSubmit={handleInvia} className="space-y-4">
                <input type="text" placeholder="Nome Cliente" required value={form.nome} onChange={(e) => setForm({...form, nome: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                <input type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" required value={form.data} onChange={(e) => setForm({...form, data: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                  <input type="time" required value={form.ora} onChange={(e) => setForm({...form, ora: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                </div>
                <textarea placeholder="Note" value={form.note} onChange={(e) => setForm({...form, note: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                <button type="submit" disabled={invioInCorso} className="w-full bg-[#FFCC00] text-black py-4 rounded-xl font-black uppercase">
                  {invioInCorso ? "INVIO..." : "INVIA RICHIESTA"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}