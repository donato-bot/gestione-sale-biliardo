"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function VetrinaClub({ params }: { params: { salaId: string } }) {
  const [nomeSala, setNomeSala] = useState<string>("Caricamento...");
  const [activeView, setActiveView] = useState<string>("hub");
  const [loading, setLoading] = useState(true);
  
  const [formPrenotazione, setFormPrenotazione] = useState({ 
    nome: '', email: '', telefono: '', data: '', ora: '', note: '' 
  });
  const [prenotazioneInviata, setPrenotazioneInviata] = useState(false);
  const [invioInCorso, setInvioInCorso] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFormPrenotazione(prev => ({
        ...prev,
        nome: localStorage.getItem('club_socio_nome') || '',
        email: localStorage.getItem('club_socio_email') || '',
        telefono: localStorage.getItem('club_socio_telefono') || ''
      }));
    }
  }, []);

  useEffect(() => {
    async function fetchDati() {
      if (!params.salaId) return;
      const { data } = await supabase.from('sale').select('name').eq('id', params.salaId).single();
      if (data) setNomeSala(data.name);
      setLoading(false);
    }
    fetchDati();
  }, [params.salaId]);

  const handleInviaPrenotazione = async (e: any) => {
    e.preventDefault();
    setInvioInCorso(true);

    if (typeof window !== 'undefined') {
      localStorage.setItem('club_socio_nome', formPrenotazione.nome);
      localStorage.setItem('club_socio_email', formPrenotazione.email);
      localStorage.setItem('club_socio_telefono', formPrenotazione.telefono);
    }

    const { error } = await supabase.from('prenotazioni').insert([
      {
        sala_id: params.salaId,
        nome: formPrenotazione.nome,
        telefono: formPrenotazione.telefono,
        email: formPrenotazione.email || null,
        data: formPrenotazione.data,
        ora: formPrenotazione.ora,
        note: formPrenotazione.note || null
      }
    ]);

    if (!error) {
      setPrenotazioneInviata(true);
      setTimeout(() => {
        setPrenotazioneInviata(false);
        setFormPrenotazione(prev => ({ ...prev, data: '', ora: '', note: '' }));
        setActiveView("hub");
      }, 3000);
    } else {
      console.error("Errore Supabase:", error);
      alert("Errore: " + error.message);
    }
    setInvioInCorso(false);
  };

  if (loading) return <div className="p-10 text-center text-white">Caricamento...</div>;

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
            {prenotazioneInviata ? (
              <p className="text-[#00E676] font-black text-center">Richiesta inviata!</p>
            ) : (
              <form onSubmit={handleInviaPrenotazione} className="space-y-4">
                <input type="text" placeholder="Nome" required value={formPrenotazione.nome} onChange={(e) => setFormPrenotazione({...formPrenotazione, nome: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                <input type="tel" placeholder="Telefono" required value={formPrenotazione.telefono} onChange={(e) => setFormPrenotazione({...formPrenotazione, telefono: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                <input type="email" placeholder="Email" value={formPrenotazione.email} onChange={(e) => setFormPrenotazione({...formPrenotazione, email: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="date" required value={formPrenotazione.data} onChange={(e) => setFormPrenotazione({...formPrenotazione, data: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                  <input type="time" required value={formPrenotazione.ora} onChange={(e) => setFormPrenotazione({...formPrenotazione, ora: e.target.value})} className="w-full p-3 rounded-xl bg-[#1A1D24]" />
                </div>
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