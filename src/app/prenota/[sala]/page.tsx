// File: src/app/prenota/[sala]/page.tsx
"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase"; 
import { useParams } from "next/navigation";

export default function PrenotaSalaPage() {
  const params = useParams();
  // Il valore tra parentesi quadre della cartella [sala]
  const salaSlug = params?.sala as string; 
  
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [successo, setSuccesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // INVIO DATI A SUPABASE
    const { error } = await supabase
      .from("iscrizioni")
      .insert([{ 
        nome_giocatore: nome, 
        sala_slug: salaSlug, // <-- QUESTO È IL RIFERIMENTO SALA
        data_iscrizione: new Date().toISOString() 
      }]);

    if (error) {
      console.error("Errore:", error);
      alert("Errore tecnico. Riprova.");
    } else {
      setSuccesso(true);
      setNome("");
    }
    setLoading(false);
  };

  return (
    // ... (restante codice UI)
    <div className="p-8 text-white">
      <h1>Iscrizione per: {salaSlug}</h1>
      <form onSubmit={handleSubmit}>
        <input value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="Nome..." className="text-black p-2"/>
        <button type="submit" className="bg-blue-500 p-2">{loading ? "Invio..." : "Conferma"}</button>
      </form>
      {successo && <p className="text-green-500">Iscrizione riuscita!</p>}
    </div>
  );
}