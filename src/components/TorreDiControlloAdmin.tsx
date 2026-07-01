"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function CreaSalaForm({ onSalaCreata }: { onSalaCreata: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const avviaOnboarding = async () => {
    setLoading(true);
    
    // 1. Chiamata alla funzione RPC (Remote Procedure Call) su Supabase
    // Questa funzione crea utente, sala e log in una sola mossa
    const { data, error } = await supabase.rpc('crea_nuova_sala', {
      p_nome_sala: nome,
      p_manager_email: email,
      p_manager_password: "PasswordTemporanea123!" // Password default
    });

    if (error) {
      alert("Errore sistema: " + error.message);
    } else {
      alert("Sala creata correttamente e credenziali inviate!");
      onSalaCreata();
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#11131a] p-6 rounded-2xl border border-gray-800 space-y-4">
      <h3 className="text-white font-black uppercase">Varo Nuova Sala</h3>
      <input placeholder="Nome Sala" className="w-full bg-black p-3 rounded-lg text-white" onChange={e => setNome(e.target.value)} />
      <input placeholder="Email Manager" className="w-full bg-black p-3 rounded-lg text-white" onChange={e => setEmail(e.target.value)} />
      <button 
        onClick={avviaOnboarding} 
        disabled={loading}
        className="w-full bg-cyan-600 p-3 rounded-lg font-black text-white uppercase"
      >
        {loading ? "Generazione in corso..." : "Inizia Onboarding"}
      </button>
    </div>
  );
}