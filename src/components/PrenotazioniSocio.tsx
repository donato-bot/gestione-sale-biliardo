// components/PrenotazioniSocio.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function PrenotazioniSocio({ salaId }: { salaId: string }) {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [soci, setSoci] = useState<any[]>([]);
  const [nuovoNome, setNuovoNome] = useState("");
  const [dataPrenotazione, setDataPrenotazione] = useState("");
  const [nuovoOrario, setNuovoOrario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcola la data di oggi in formato testuale per i limiti dell'input
  const oggiString = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    if (!salaId) return;

    // 1. Recupero Prenotazioni (Da oggi in poi)
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const { data: dataPren } = await supabase
      .from('prenotazioni')
      .select('*')
      .eq('sala_id', salaId)
      .gte('data_ora', oggi.toISOString())
      .order('data_ora', { ascending: true });

    if (dataPren) setPrenotazioni(dataPren);

    // 2. Recupero Registro Soci per Autocompletamento
    const { data: dataSoci } = await supabase
      .from('soci')
      .select('*')
      .eq('sala_id', salaId);
    
    if (dataSoci) setSoci(dataSoci);
  };

  useEffect(() => {
    fetchData();
    
    // Auto-compilazione: Imposta la data e l'ora al momento attuale
    const now = new Date();
    setDataPrenotazione(now.toISOString().split('T')[0]);
    
    // Estrae l'orario nel formato HH:MM
    const timeString = now.toTimeString().slice(0, 5);
    setNuovoOrario(timeString);

    // MEMORIA AUTOMATICA: Recupera il nome del socio salvato sul suo dispositivo
    if (salaId) {
      const nomeSalvato = localStorage.getItem(`nomeSocio_${salaId}`);
      if (nomeSalvato) {
        setNuovoNome(nomeSalvato);
      }
    }
  }, [salaId]);

  const handlePrenota = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // BLOCCO DI SICUREZZA ASSOLUTO: Se manca la sala, blocca tutto.
    if (!salaId) {
      alert("Errore di connessione alla Sala. Per favore ricarica la pagina.");
      return;
    }

    if (!nuovoNome || !nuovoOrario || !dataPrenotazione) return;
    
    setIsSubmitting(true);

    // Costruisce l'oggetto Date completo unendo il giorno e l'orario scelti
    const dataOraCompleta = new Date(`${dataPrenotazione}T${nuovoOrario}:00`);
    
    // CONTROLLO SICUREZZA: Impedisce prenotazioni nel passato
    if (dataOraCompleta < new Date()) {
      alert("Attenzione: Non è possibile effettuare una prenotazione per un orario già trascorso.");
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('prenotazioni')
        .insert([
          { 
            sala_id: salaId, 
            nome_cliente: nuovoNome.trim(), 
            data_ora: dataOraCompleta.toISOString(), 
            note: '[APP SOCI]' // Tag automatico letto dal tabellone del gestore
          }
        ]);

      if (!error) {
        // SALVATAGGIO IN MEMORIA: Salva il nome nel browser del telefono/PC per la prossima volta
        localStorage.setItem(`nomeSocio_${salaId}`, nuovoNome.trim());

        // Ripristina l'orario corrente dopo l'invio, ma LASCIA IL NOME COMPILATO
        setNuovoOrario(new Date().toTimeString().slice(0, 5)); 
        fetchData(); 
      } else {
        console.error("Errore durante la prenotazione:", error);
        alert("Errore durante la prenotazione: " + error.message);
      }
    } catch (err) {
      console.error("Errore di formattazione data", err);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="text-white space-y-8 animate-in fade-in duration-300">
      
      {/* BOX NUOVA PRENOTAZIONE */}
      <div className="bg-[#1A1D24] p-6 rounded-lg border border-[#2A2E39] shadow-lg">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-6 text-[#FFCC00]">Nuova Prenotazione</h2>
        <form onSubmit={handlePrenota} className="flex flex-col md:flex-row gap-4 items-end">
          
          {/* Input Autocompletante da Tabella Soci con Memoria */}
          <div className="flex-1 w-full relative">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block">Nome Socio</label>
            <input
              type="text"
              list="lista-soci"
              placeholder="Inizia a digitare il tuo nome..."
              value={nuovoNome}
              onChange={(e) => setNuovoNome(e.target.value)}
              className="w-full bg-[#0B0D14] border border-[#2A2E39] rounded p-3 text-white font-bold focus:outline-none focus:border-[#FFCC00] transition-colors shadow-inner"
              required
            />
            <datalist id="lista-soci">
              {soci.map((socio, index) => (
                <option key={index} value={`${socio.nome} ${socio.cognome || ''}`.trim()} />
              ))}
            </datalist>
          </div>

          <div className="w-full md:w-auto">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block">Data</label>
            <input
              type="date"
              min={oggiString}
              value={dataPrenotazione}
              onChange={(e) => setDataPrenotazione(e.target.value)}
              className="w-full bg-[#0B0D14] border border-[#2A2E39] rounded p-3 text-white focus:outline-none focus:border-[#FFCC00] transition-colors [color-scheme:dark] shadow-inner"
              required
            />
          </div>

          <div className="w-full md:w-auto">
            <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 block">Ora</label>
            <input
              type="time"
              value={nuovoOrario}
              onChange={(e) => setNuovoOrario(e.target.value)}
              className="w-full bg-[#0B0D14] border border-[#2A2E39] rounded p-3 text-[#00E5FF] font-black focus:outline-none focus:border-[#FFCC00] transition-colors [color-scheme:dark] shadow-inner"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto bg-[#FFCC00] text-black font-black uppercase tracking-widest px-8 py-3.5 rounded hover:bg-[#E6B800] transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(255,204,0,0.3)]"
          >
            {isSubmitting ? "..." : "Prenota"}
          </button>
        </form>
      </div>

      {/* BOX LISTA PRENOTAZIONI */}
      <div className="bg-[#1A1D24] p-6 rounded-lg border border-[#2A2E39] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Prenotazioni in coda (Da Oggi)</h2>
        {prenotazioni.length === 0 ? (
          <p className="text-gray-500">Nessuna prenotazione trovata. Sii il primo a prenotare!</p>
        ) : (
          <ul className="space-y-3">
            {prenotazioni.map((p) => {
              const dataObj = new Date(p.data_ora);
              const orario = dataObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              const dataGiorno = dataObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });

              return (
                <li key={p.id} className="bg-[#0B0D14] p-4 rounded border border-[#2A2E39] flex justify-between items-center shadow-md">
                  <div className="flex gap-4 items-center">
                    <span className="text-[#00E5FF] font-black text-lg">{orario}</span>
                    <span className="text-gray-400 text-xs font-bold">{dataGiorno}</span>
                  </div>
                  <span className="text-gray-300 font-black uppercase tracking-wider">{p.nome_cliente || "Socio"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
    </div>
  );
}