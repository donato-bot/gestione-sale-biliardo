"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function RicezioneManuale({ salaId }: { salaId: string }) {
  const [sorgente, setSorgente] = useState("TELEFONO");
  const [nome, setNome] = useState("");
  const [tavolo, setTavolo] = useState("");
  const [dataOra, setDataOra] = useState("");
  const [note, setNote] = useState(""); // <-- Abbiamo rimesso lo stato per le note
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !dataOra) return;

    setIsSubmitting(true);

    const { error } = await supabase
      .from('prenotazioni')
      .insert([
        { 
          sala_id: salaId,
          nome_cliente: nome,
          tavolo_numero: tavolo,
          data_ora: dataOra,
          canale: sorgente,
          nota: note // <-- Usiamo il minuscolo per evitare l'errore di schema
        }
      ]);

    if (!error) {
      setNome(""); setTavolo(""); setDataOra(""); setNote("");
      alert("Prenotazione salvata con successo!");
    } else {
      console.error("Errore salvataggio:", error);
      alert("Errore salvataggio: " + error.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-xl p-6 shadow-2xl w-full max-w-md">
      <h2 className="text-white font-black uppercase tracking-widest text-lg mb-6">Ricezione Manuale</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={sorgente} onChange={(e) => setSorgente(e.target.value)} className="w-full bg-white text-black p-3 rounded">
          <option value="TELEFONO">📞 Chiamata Telefonica</option>
          <option value="IN SALA">🧍 In Sala</option>
        </select>
        <input type="text" placeholder="Nominativo" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-white text-black p-3 rounded" required />
        <input type="text" placeholder="Tavolo o Specialità" value={tavolo} onChange={(e) => setTavolo(e.target.value)} className="w-full bg-white text-black p-3 rounded" />
        <input type="datetime-local" value={dataOra} onChange={(e) => setDataOra(e.target.value)} className="w-full bg-white text-black p-3 rounded" required />
        <textarea placeholder="Note aggiuntive..." value={note} onChange={(e) => setNote(e.target.value)} className="w-full bg-white text-black p-3 rounded" />
        <button type="submit" disabled={isSubmitting} className="w-full bg-[#00BFA5] text-white font-black p-4 rounded transition-colors hover:bg-[#008f7a]">
          SALVA PRENOTAZIONE
        </button>
      </form>
    </div>
  );
}