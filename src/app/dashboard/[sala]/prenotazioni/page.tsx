"use client";
import { useState } from 'react';

export default function PrenotazioniManager({ params }: { params: { sala: string } }) {
  const salaId = params.sala;
  // Costruiamo il link che il socio dovrà usare
  const linkPrenotazione = `${window.location.origin}/prenota/${salaId}`;
  const [copiato, setCopiato] = useState(false);

  const copiaLink = () => {
    navigator.clipboard.writeText(linkPrenotazione);
    setCopiato(true);
    setTimeout(() => setCopiato(false), 2000);
  };

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Gestione Prenotazioni</h1>
      
      {/* Box per il link del socio */}
      <div className="bg-[#11131a] p-6 rounded-2xl border border-gray-800 mb-8">
        <h2 className="text-sm uppercase font-bold text-gray-500 mb-4">Link da inviare ai soci</h2>
        <div className="flex gap-4 items-center">
          <input 
            type="text" 
            readOnly 
            value={linkPrenotazione} 
            className="flex-1 bg-black p-3 rounded-lg border border-gray-700 text-cyan-400 font-mono text-sm"
          />
          <button 
            onClick={copiaLink}
            className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-lg font-bold text-sm transition-all"
          >
            {copiato ? 'Copiato!' : 'Copia Link'}
          </button>
        </div>
      </div>
      
      {/* Qui sotto continuerà la tua tabella delle prenotazioni esistenti */}
    </div>
  );
}