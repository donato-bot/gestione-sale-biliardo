"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardAdmin() {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);

  useEffect(() => {
    async function fetchPrenotazioni() {
      const { data } = await supabase.from('prenotazioni').select('*');
      if (data) setPrenotazioni(data);
    }
    fetchPrenotazioni();
  }, []);

  async function elimina(id: string) {
    console.log("Eliminazione in corso per:", id);
    const { error } = await supabase.from('prenotazioni').delete().eq('id', id);
    
    if (error) {
      alert("Errore database: " + error.message);
    } else {
      // Aggiornamento stato
      setPrenotazioni(prenotazioni.filter(p => p.id !== id));
      alert("Prenotazione eliminata!");
    }
  }

  return (
    <div style={{ padding: '20px', background: '#000', color: '#fff' }}>
      <h1>Torre di Controllo</h1>
      {prenotazioni.map((p) => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', margin: '10px 0', padding: '10px', border: '1px solid #444' }}>
          <span>{p.nome_cliente}</span>
          <button 
            onClick={() => elimina(p.id)}
            style={{ padding: '10px', background: 'red', color: 'white', cursor: 'pointer' }}
          >
            ELIMINA ORA
          </button>
        </div>
      ))}
    </div>
  );
}