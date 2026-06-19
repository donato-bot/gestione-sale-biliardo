"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function GestioneSala({ sala, onUpdate }: { sala: any, onUpdate: () => void }) {
  const [nome, setNome] = useState(sala.name);
  const [saving, setSaving] = useState(false);

  const handleUpdate = async () => {
    setSaving(true);
    await supabase.from('sale').update({ name: nome }).eq('id', sala.id);
    setSaving(false);
    onUpdate();
  };

  const toggleTavoli = async (azione: 'aggiungi' | 'togli') => {
    setSaving(true);
    if (azione === 'aggiungi') {
      const { count } = await supabase.from('tavoli').select('*', { count: 'exact', head: true }).eq('sala_id', sala.id);
      await supabase.from('tavoli').insert([{ sala_id: sala.id, nome_tavolo: `Biliardo ${count! + 1}`, numero: count! + 1, stato: 'libero' }]);
    } else {
      const { data } = await supabase.from('tavoli').select('id').eq('sala_id', sala.id).order('numero', { ascending: false }).limit(1);
      if (data && data.length > 0) await supabase.from('tavoli').delete().eq('id', data[0].id);
    }
    setSaving(false);
    onUpdate();
  };

  return (
    <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 space-y-6">
      <h2 className="text-xl font-black text-white uppercase italic">Configurazione Club</h2>
      
      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-bold uppercase">Nome Sala</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-black p-3 rounded border border-gray-700 text-white" />
        <button onClick={handleUpdate} className="bg-cyan-700 px-4 py-2 rounded text-xs font-black uppercase">Salva Nome</button>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-800">
        <button onClick={() => toggleTavoli('togli')} className="flex-1 bg-red-900/50 py-4 rounded font-bold hover:bg-red-800">- Togli Biliardo</button>
        <button onClick={() => toggleTavoli('aggiungi')} className="flex-1 bg-green-900/50 py-4 rounded font-bold hover:bg-green-800">+ Aggiungi Biliardo</button>
      </div>
    </div>
  );
}