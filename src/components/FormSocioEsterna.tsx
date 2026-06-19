"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function FormSocioEsterna({ salaId }: { salaId: string }) {
  // Stati per la form classica del socio
  const [socioData, setSocioData] = useState({ nome_cognome: "", telefono: "", email: "" });
  const [isSocioRegistrato, setIsSocioRegistrato] = useState(false);
  
  // Stati per l'integrazione tornei
  const [torneiAttivi, setTorneiAttivi] = useState<any[][]>([]);
  const [torneoSelezionato, setTorneoSelezionato] = useState("");
  const [nomePerTorneo, setNomePerTorneo] = useState("");
  const [loading, setLoading] = useState(false);

  // Carica i tornei che hanno le iscrizioni aperte nella sala
  useEffect(() => {
    async function caricaTorneiAperti() {
      if (!salaId) return;
      const { data, error } = await supabase
        .from("tornei")
        .select("*")
        .eq("sala_id", salaId)
        .eq("stato", "iscrizioni_aperte");
      
      if (!error && data) {
        setTorneiAttivi(data);
      }
    }
    caricaTorneiAperti();
  }, [salaId]);

  // Invio registrazione socio standard
  const salvaSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socioData.nome_cognome.trim() || !socioData.telefono.trim()) {
      alert("⚠️ ATTENZIONE: Nome, Cognome e Telefono sono obbligatori.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("soci").insert([{
      sala_id: salaId,
      nome_cognome: socioData.nome_cognome.trim(),
      telefono: socioData.telefono.trim(),
      email: socioData.email.trim(),
      is_active: true
    }]);

    setLoading(false);
    if (error) {
      alert("Errore durante la registrazione: " + error.message);
    } else {
      setIsSocioRegistrato(true);
      setNomePerTorneo(socioData.nome_cognome.trim());
      alert("✅ Registrazione Socio completata con successo!");
    }
  };

  // Invio richiesta iscrizione torneo dal link socio
  const inviaRichiestaTorneo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!torneoSelezionato) {
      alert("⚠️ ATTENZIONE: Seleziona un torneo dall'elenco.");
      return;
    }
    if (!nomePerTorneo.trim()) {
      alert("⚠️ ATTENZIONE: Inserisci il tuo Nome e Cognome per il torneo.");
      return;
    }

    setLoading(true);

    // Controlla prima se il torneo ha ancora posti liberi
    const { data: torneo } = await supabase.from("tornei").select("max_partecipanti").eq("id", torneoSelezionato).single();
    const { count } = await supabase.from("tornei_iscritti").select("*", { count: 'exact', head: true }).eq("torneo_id", torneoSelezionato);

    if (torneo && count !== null && count >= torneo.max_partecipanti) {
      alert("🛑 Torneo al completo! Impossibile registrarsi.");
      setLoading(false);
      return;
    }

    // Inserisce la richiesta di iscrizione (quota pagata di base a FALSE)
    const { error } = await supabase.from("tornei_iscritti").insert([{
      torneo_id: torneoSelezionato,
      nome_giocatore: nomePerTorneo.trim(),
      quota_pagata: false
    }]);

    setLoading(false);
    if (error) {
      alert("Errore iscrizione torneo: " + error.message);
    } else {
      alert("🎯 Richiesta inviata! La tua iscrizione al torneo è stata registrata. Presentati in sala per saldare la quota.");
      setTorneoSelezionato("");
      if (!isSocioRegistrato) setNomePerTorneo("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md space-y-8 bg-[#11131a] p-8 rounded-[2rem] border border-gray-800 shadow-2xl">
        
        <div className="text-center">
          <span className="text-4xl mb-2 block">🎱</span>
          <h2 className="text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            Modulo Servizi Socio
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Registrazione e Iscrizione Eventi</p>
        </div>

        {/* SEZIONE A: REGISTRAZIONE ANAGRAFICA SOCIO */}
        {!isSocioRegistrato && (
          <form onSubmit={salvaSocio} className="space-y-4 border-b border-gray-800/50 pb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-300">1. Registrazione Tessera Club</h3>
            <input 
              type="text" 
              placeholder="Nome e Cognome" 
              value={socioData.nome_cognome}
              onChange={e => setSocioData({...socioData, nome_cognome: e.target.value})}
              className="w-full bg-black border border-gray-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-purple-500 transition-all font-bold"
            />
            <input 
              type="tel" 
              placeholder="Numero di Telefono" 
              value={socioData.telefono}
              onChange={e => setSocioData({...socioData, telefono: e.target.value})}
              className="w-full bg-black border border-gray-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-purple-500 transition-all font-bold"
            />
            <input 
              type="email" 
              placeholder="Email (Opzionale)" 
              value={socioData.email}
              onChange={e => setSocioData({...socioData, email: e.target.value})}
              className="w-full bg-black border border-gray-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-purple-500 transition-all font-bold"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-purple-700 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-600 text-white transition-all"
            >
              Invia Dati Tessera
            </button>
          </form>
        )}

        {/* SEZIONE B: ISCRIZIONE DIRETTA AI TORNEI DELLA SALA */}
        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-pink-500">
            {isSocioRegistrato ? "2. Iscriviti a un Torneo Attivo" : "Oppure Iscriviti a un Torneo Aperto"}
          </h3>
          
          {torneiAttivi.length > 0 ? (
            <form onSubmit={inviaRichiestaTorneo} className="space-y-4">
              <div>
                <select 
                  value={torneoSelezionato}
                  onChange={e => setTorneoSelezionato(e.target.value)}
                  className="w-full bg-black border border-gray-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-pink-500 font-bold"
                >
                  <option value="">Seleziona il torneo della sala...</option>
                  {torneiAttivi.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      🏆 {t.nome} ({t.specialita}) — Quota: €{Number(t.quota_iscrizione).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {!isSocioRegistrato && (
                <div>
                  <input 
                    type="text" 
                    placeholder="Il tuo Nome e Cognome" 
                    value={nomePerTorneo}
                    onChange={e => setNomePerTorneo(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded-xl p-3.5 text-sm text-white outline-none focus:border-pink-500 transition-all font-bold"
                  />
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-pink-600 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-pink-500 text-white transition-all shadow-[0_0_20px_rgba(219,39,119,0.2)]"
              >
                Invia Richiesta Iscrizione
              </button>
            </form>
          ) : (
            <p className="text-center py-4 bg-black/40 rounded-xl text-xs font-bold text-gray-500 uppercase tracking-wider border border-gray-900">
              Nessun torneo con iscrizioni aperte
            </p>
          )}
        </div>

      </div>
    </div>
  );
}