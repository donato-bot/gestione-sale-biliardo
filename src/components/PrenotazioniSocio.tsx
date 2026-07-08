"use client";

// ==========================================
// FILE: src/components/PrenotazioniSocio.tsx
// OBIETTIVO: Modulo di Prenotazione Tavoli Lato Socio (Smartphone)
// ==========================================

import React, { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";

export default function PrenotazioniSocio({ salaId }: { salaId: string }) {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [tavoloNumero, setTavoloNumero] = useState('');
  const [dataOra, setDataOra] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [successo, setSuccesso] = useState<string | null>(null);

  useEffect(() => {
    if (salaId) {
      caricaPrenotazioniPubbliche();
      const nomeSalvato = localStorage.getItem(`nomeSocio_${salaId}`);
      if (nomeSalvato) setNomeCliente(nomeSalvato);
    }
  }, [salaId]);

  async function caricaPrenotazioniPubbliche() {
    try {
      const { data, error } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('sala_id', salaId)
        .gte('data_ora', new Date().toISOString()) // Mostra solo le prenotazioni future
        .order('data_ora', { ascending: true });
        
      if (!error && data) setPrenotazioni(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function gestisciPrenotazioneSocio(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCliente.trim() || !dataOra) {
      alert("Compila tutti i campi obbligatori.");
      return;
    }
    
    setLoading(true);
    const notaFormattata = `[APP SOCI] ${note}`.trim();

    try {
      const { error } = await supabase.from('prenotazioni').insert([{
        sala_id: salaId,
        nome_cliente: nomeCliente.trim().toUpperCase(),
        tavolo_numero: tavoloNumero ? tavoloNumero.trim() : null,
        data_ora: new Date(dataOra).toISOString(), 
        note: notaFormattata
      }]);

      if (error) {
        alert("Errore: " + error.message);
      } else {
        setSuccesso("🎉 PRENOTAZIONE INVIATA CON SUCCESSO!");
        localStorage.setItem(`nomeSocio_${salaId}`, nomeCliente.trim());
        
        setTavoloNumero(''); 
        setDataOra(''); 
        setNote('');
        
        setTimeout(() => setSuccesso(null), 4000);
        caricaPrenotazioniPubbliche();
      }
    } catch (err: any) {
      alert("Errore di rete: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#11131a] border border-gray-800 p-6 rounded-3xl shadow-xl max-w-md mx-auto">
      <h3 className="text-sm font-black uppercase tracking-widest text-[#00E5FF] mb-4 pb-2 border-b border-gray-800/60">
        Reserve un Tavolo
      </h3>

      {successo && (
        <div className="bg-green-950/40 border border-green-500/30 text-green-400 p-4 rounded-xl text-xs font-bold uppercase tracking-wider text-center mb-4">
          {successo}
        </div>
      )}

      <form onSubmit={gestisciPrenotazioneSocio} className="space-y-4">
        <div>
          <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Tuo Nome e Cognome *</label>
          <input 
            type="text" required placeholder="Es. Mario Rossi" value={nomeCliente}
            onChange={(e) => setNomeCliente(e.target.value)}
            className="w-full bg-black border border-gray-800 p-3.5 rounded-xl text-white font-bold uppercase focus:outline-none focus:border-[#00E5FF]"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Biliardo Pref.</label>
            <input 
              type="text" placeholder="Es. Tavolo 2" value={tavoloNumero}
              onChange={(e) => setTavoloNumero(e.target.value)}
              className="w-full bg-black border border-gray-800 p-3.5 rounded-xl text-white font-bold focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Data e Ora *</label>
            <input 
              type="datetime-local" required value={dataOra}
              onChange={(e) => setDataOra(e.target.value)}
              className="w-full bg-black border border-gray-800 p-3.5 rounded-xl text-cyan-400 font-bold focus:outline-none focus:border-[#00E5FF]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Note per la Sala</label>
          <textarea 
            placeholder="Es. Stecca particolare, stecche da pool..." value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-black border border-gray-800 p-3.5 rounded-xl text-gray-300 resize-none h-20 focus:outline-none focus:border-[#00E5FF]"
          />
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-[#00E5FF] hover:bg-cyan-500 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg text-xs"
        >
          {loading ? "Invio in corso..." : "🗓️ CONFERMA PRENOTAZIONE"}
        </button>
      </form>
    </div>
  );
}