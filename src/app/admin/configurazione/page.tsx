"use client";
import { useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ConfigurazioneAdmin() {
  const [salaConfig, setSalaConfig] = useState({ nome: "", numTavoli: 0, tariffa: 10 });
  const [loading, setLoading] = useState(false);

  const varaNuovaSala = async () => {
    setLoading(true);
    // 1. Creiamo la riga nella tabella sale
    const { data: nuovaSala, error } = await supabase.from('sale')
      .insert([{ name: salaConfig.nome, tariffa_standard: salaConfig.tariffa, is_active: true }])
      .select().single();

    if (!error && nuovaSala) {
      // 2. Generiamo i tavoli in automatico
      const tavoli = Array.from({ length: salaConfig.numTavoli }, (_, i) => ({
        sala_id: nuovaSala.id, numero: i + 1, stato: 'libero'
      }));
      await supabase.from('tavoli').insert(tavoli);
      alert(`🚀 Sala ${salaConfig.nome} creata con ${salaConfig.numTavoli} biliardi!`);
    }
    setLoading(false);
  };

  return (
    <div className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-4xl font-black text-pink-500 uppercase italic mb-10">Area Admin: Configurazione Sala</h1>
      <div className="max-w-md bg-gray-900 p-8 rounded-3xl border border-pink-900">
        <input placeholder="Nome Sala" className="w-full bg-black p-4 mb-4 rounded-xl" onChange={(e) => setSalaConfig({...salaConfig, nome: e.target.value})} />
        <input type="number" placeholder="Numero Biliardi" className="w-full bg-black p-4 mb-4 rounded-xl" onChange={(e) => setSalaConfig({...salaConfig, numTavoli: parseInt(e.target.value)})} />
        <input type="number" placeholder="Tariffa Oraria" className="w-full bg-black p-4 mb-8 rounded-xl" onChange={(e) => setSalaConfig({...salaConfig, tariffa: parseFloat(e.target.value)})} />
        <button onClick={varaNuovaSala} disabled={loading} className="w-full py-4 bg-pink-600 font-black uppercase rounded-2xl">
          {loading ? "Configurazione in corso..." : "VARA LA SALA"}
        </button>
      </div>
    </div>
  );
}