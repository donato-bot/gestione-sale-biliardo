// components/PrenotazioniSocio.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function PrenotazioniSocio({ salaId }: { salaId: string }) {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovoOrario, setNuovoOrario] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPrenotazioni = async () => {
    // Usa la data di oggi a mezzanotte come filtro per mostrare solo i turni futuri/odierni
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('prenotazioni')
      .select('*')
      .eq('sala_id', salaId)
      .gte('data_ora', oggi.toISOString())
      .order('data_ora', { ascending: true });

    if (data) setPrenotazioni(data);
  };

  useEffect(() => {
    fetchPrenotazioni();
  }, [salaId]);

  const handlePrenota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuovoNome || !nuovoOrario) return;
    
    setIsSubmitting(true);

    try {
      // Prende la data di oggi e la combina con l'orario scelto dal socio per creare il formato corretto per il DB
      const dataOggi = new Date().toISOString().split('T')[0];
      const dataOraCompleta = new Date(`${dataOggi}T${nuovoOrario}:00`).toISOString();

      const { error } = await supabase
        .from('prenotazioni')
        .insert([
          { 
            sala_id: salaId, 
            nome_cliente: nuovoNome, 
            data_ora: dataOraCompleta, 
            note: '[APP SOCI]' // Tag automatico letto dal tabellone del gestore
          }
        ]);

      if (!error) {
        setNuovoNome(""); 
        setNuovoOrario(""); 
        fetchPrenotazioni(); 
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
      
      <div className="bg-[#1A1D24] p-6 rounded-lg border border-[#2A2E39] shadow-lg">
        <h2 className="text-2xl font-black uppercase tracking-wider mb-6 text-[#FFCC00]">Nuova Prenotazione</h2>
        <form onSubmit={handlePrenota} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Il tuo nome (es. Mario Rossi)"
            value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
            className="flex-1 bg-[#0B0D14] border border-[#2A2E39] rounded p-3 text-white focus:outline-none focus:border-[#FFCC00] transition-colors"
            required
          />
          <input
            type="time"
            value={nuovoOrario}
            onChange={(e) => setNuovoOrario(e.target.value)}
            className="bg-[#0B0D14] border border-[#2A2E39] rounded p-3 text-white focus:outline-none focus:border-[#FFCC00] transition-colors [color-scheme:dark]"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#FFCC00] text-black font-black uppercase tracking-widest px-8 py-3 rounded hover:bg-[#E6B800] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Invio..." : "Prenota"}
          </button>
        </form>
      </div>

      <div className="bg-[#1A1D24] p-6 rounded-lg border border-[#2A2E39] shadow-lg">
        <h2 className="text-xl font-bold mb-4">Prenotazioni in coda (Da Oggi)</h2>
        {prenotazioni.length === 0 ? (
          <p className="text-gray-500">Nessuna prenotazione trovata. Sii il primo a prenotare!</p>
        ) : (
          <ul className="space-y-3">
            {prenotazioni.map((p) => {
              // Estrapola l'orario e la data dal formato data_ora
              const dataObj = new Date(p.data_ora);
              const orario = dataObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
              const dataGiorno = dataObj.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });

              return (
                <li key={p.id} className="bg-[#0B0D14] p-4 rounded border border-[#2A2E39] flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <span className="text-[#00E5FF] font-black text-lg">{orario}</span>
                    <span className="text-gray-400 text-xs">{dataGiorno}</span>
                  </div>
                  <span className="text-gray-300 font-medium uppercase tracking-wider">{p.nome_cliente || "Socio"}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
    </div>
  );
}