"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardAdmin() {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: sala } = await supabase.from('sale').select('id').eq('manager_email', user.email).single();
      if (sala) {
        const { data } = await supabase.from('prenotazioni').select('*').eq('sala_id', sala.id);
        if (data) setPrenotazioni(data);
      }
    }
    load();
  }, []);

  async function eseguiEliminazione(id: string) {
    // Disabilitiamo il blocco dell'interfaccia eliminando le transizioni
    const { error } = await supabase.from('prenotazioni').delete().eq('id', id);
    if (!error) {
      setPrenotazioni(prev => prev.filter(p => p.id !== id));
    } else {
      alert("Errore DB: " + error.message);
    }
  }

  return (
    <div className="p-10 bg-[#0B0D14] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Torre di Controllo</h1>
      <div className="space-y-4">
        {prenotazioni.map((p) => (
          <div key={p.id} className="flex justify-between items-center p-4 bg-[#1A1D24] rounded-lg">
            <span>{p.nome_cliente}</span>
            {/* Elemento cliccabile senza classi di transizione CSS */}
            <div 
              onClick={() => eseguiEliminazione(p.id)}
              style={{ cursor: 'pointer', padding: '10px', backgroundColor: '#dc2626', borderRadius: '4px' }}
            >
              ELIMINA
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}