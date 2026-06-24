"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function VetrinaClub({ params }: { params: { salaId: string } }) {
  const [nomeSala, setNomeSala] = useState<string>("Caricamento Club...");
  const [activeView, setActiveView] = useState<string>("hub"); // hub, tornei, bacheca, info, prenotazioni
  
  // Dati Torneo
  const [torneoAttivo, setTorneoAttivo] = useState<any>(null);
  const [partite, setPartite] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Stato form prenotazione
  const [formPrenotazione, setFormPrenotazione] = useState({ 
    nome: '', email: '', telefono: '', data: '', ora: '', note: '' 
  });
  const [prenotazioneInviata, setPrenotazioneInviata] = useState(false);
  const [invioInCorso, setInvioInCorso] = useState(false);

  // Carica i dati salvati dal telefono dell'utente all'apertura
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
    async function fetchDatiPubblici() {
      // 1. Recupera nome sala
      const { data: salaData } = await supabase.from('sale').select('name').eq('id', params.salaId).single();
      if (salaData) setNomeSala(salaData.name);

      // 2. Recupera torneo attivo
      const { data: torneiData } = await supabase
        .from('tornei')
        .select('*')
        .eq('sala_id', params.salaId)
        .in('stato', ['in_corso', 'concluso'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (torneiData && torneiData.length > 0) {
        setTorneoAttivo(torneiData[0]);
        const { data: partiteData } = await supabase
          .from('partite_torneo')
          .select('*')
          .eq('torneo_id', torneiData[0].id)
          .order('partita_num', { ascending: true });
        if (partiteData) setPartite(partiteData);
      }
      setLoading(false);
    }
    if (params.salaId) fetchDatiPubblici();
  }, [params.salaId]);

  const handleInviaPrenotazione = async (e: any) => {
    e.preventDefault();
    setInvioInCorso(true);

    // Salva dati nel telefono dell'utente
    if (typeof window !== 'undefined') {
      localStorage.setItem('club_socio_nome', formPrenotazione.nome);
      localStorage.setItem('club_socio_email', formPrenotazione.email);
      localStorage.setItem('club_socio_telefono', formPrenotazione.telefono);
    }

    // Invia al database
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
      alert("Errore nell'invio della prenotazione.");
    }
    setInvioInCorso(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0B0D14] flex items-center justify-center text-[#00ADC6] font-black uppercase tracking-widest">Caricamento...</div>;

  return (
    <div className="min-h-screen bg-[#E6F0EB] font-sans p-6">
      {/* MENU HUB */}
      {activeView === "hub" && (
        <div className="flex flex-col gap-4 max-w-lg mx-auto">
          <h1 className="text-3xl font-black text-center mb-6 uppercase italic">{nomeSala}</h1>
          <button onClick={() => setActiveView("tornei")} className="bg-[#0B0D14] text-white p-5 rounded-3xl font-black uppercase">Area Tornei</button>
          <button onClick={() => setActiveView("prenotazioni")} className="bg-[#0B0D14] text-white p-5 rounded-3xl font-black uppercase">Prenotazioni</button>
        </div>
      )}

      {/* VISTA PRENOTAZIONI */}
      {activeView === "prenotazioni" && (
        <div className="max-w-md mx-auto">
          <button onClick={() => setActiveView("hub")} className="mb-4 text-xs font-bold uppercase">← Indietro</button>
          <div className="bg-[#0B0D14] p-8 rounded-3xl text-white shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase">Riserva un Tavolo</h2>
            {prenotazioneInviata ? (
              <p className="text-[#00E676] font-black text-center p-4">Richiesta inviata con successo!</p>
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
                  {invioInCorso ? "Invio..." : "Invia Richiesta"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* VISTA TORNEI (Placeholder semplificato) */}
      {activeView === "tornei" && (
        <div className="text-center">
          <button onClick={() => setActiveView("hub")} className="mb-4 text-xs font-bold uppercase">← Indietro</button>
          <p className="font-bold text-gray-600">Visualizzazione tabelloni attiva...</p>
        </div>
      )}
    </div>
  );
}