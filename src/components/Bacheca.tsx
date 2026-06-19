"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Bacheca({ salaId }: { salaId: string }) {
  const [messaggi, setMessaggi] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ titolo: '', contenuto: '' });

  useEffect(() => { 
    caricaMessaggi(); 
  }, [salaId]);

  async function caricaMessaggi() {
    const { data } = await supabase
      .from('bacheca')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });
      
    if (data) setMessaggi(data);
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    await supabase.from('bacheca').insert([{ sala_id: salaId, ...formData }]);
    setIsModalOpen(false);
    setFormData({ titolo: '', contenuto: '' });
    caricaMessaggi();
  }

  async function eliminaMessaggio(id: string) {
    if (confirm("Sei sicuro di voler eliminare questo avviso?")) {
      await supabase.from('bacheca').delete().eq('id', id);
      caricaMessaggi();
    }
  }

  return (
    <div className="p-6 bg-black min-h-screen text-white">
      <h2 className="text-3xl font-black text-orange-500 italic uppercase text-center mb-10">Bacheca Avvisi</h2>
      
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="w-full max-w-4xl mx-auto block bg-orange-600 hover:bg-orange-500 py-4 rounded-xl font-black uppercase tracking-widest mb-8 transition-colors"
      >
        Pubblica Nuovo Avviso
      </button>

      <div className="max-w-4xl mx-auto space-y-4">
        {messaggi.length === 0 ? (
          <p className="text-center text-gray-500 italic mt-10">Nessun avviso presente in bacheca.</p>
        ) : (
          messaggi.map((m) => (
            <div key={m.id} className="bg-[#11131a] p-5 rounded-lg flex flex-col gap-3 border border-gray-800">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-lg text-orange-400 uppercase">{m.titolo}</h3>
                <button 
                  onClick={() => eliminaMessaggio(m.id)} 
                  className="bg-red-600 px-3 py-1 rounded text-[10px] font-bold"
                >
                  ELIMINA
                </button>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{m.contenuto}</p>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-2xl w-full max-w-md border border-orange-500">
            <h3 className="text-xl font-black mb-6 uppercase text-orange-400">Nuovo Avviso</h3>
            
            <input 
              placeholder="Titolo avviso..." 
              value={formData.titolo}
              className="w-full bg-gray-900 p-3 mb-4 rounded font-bold" 
              onChange={e => setFormData({...formData, titolo: e.target.value})} 
              required 
            />
            
            <textarea 
              placeholder="Testo della comunicazione..." 
              value={formData.contenuto}
              className="w-full bg-gray-900 p-3 mb-6 rounded h-32 resize-none" 
              onChange={e => setFormData({...formData, contenuto: e.target.value})} 
              required 
            />
            
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 py-3 rounded font-bold">ANNULLA</button>
              <button type="submit" className="flex-1 bg-orange-600 py-3 rounded font-bold">PUBBLICA</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}