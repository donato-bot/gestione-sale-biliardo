"use client";

// ==========================================
// FILE: app/dashboard/page.tsx
// OBIETTIVO: Interfaccia Snellita per il Gestore (Gestione Tavoli)
// ==========================================

import { useState } from 'react';

// Struttura dati per lo stato dei tavoli
interface Tavolo {
  id: number;
  numero: number;
  stato: 'libero' | 'occupato';
  oraInizio: Date | null;
}

export default function DashboardGestore() {
  // Generiamo 6 tavoli da biliardo per il collaudo visivo
  const [tavoli, setTavoli] = useState<Tavolo[]>([
    { id: 1, numero: 1, stato: 'libero', oraInizio: null },
    { id: 2, numero: 2, stato: 'libero', oraInizio: null },
    { id: 3, numero: 3, stato: 'libero', oraInizio: null },
    { id: 4, numero: 4, stato: 'libero', oraInizio: null },
    { id: 5, numero: 5, stato: 'libero', oraInizio: null },
    { id: 6, numero: 6, stato: 'libero', oraInizio: null },
  ]);

  // Tariffa oraria di test (es. 10€ all'ora)
  const TARIFFA_ORARIA = 10;

  // AZIONE 1: Assegnazione rapida del tavolo
  const apriTavolo = (idTavolo: number) => {
    setTavoli(tavoli.map(tavolo => 
      tavolo.id === idTavolo 
        ? { ...tavolo, stato: 'occupato', oraInizio: new Date() } 
        : tavolo
    ));
  };

  // AZIONE 2 & 3: Calcolo tariffa e chiusura sessione
  const chiudiTavolo = (idTavolo: number, oraInizio: Date) => {
    const oraFine = new Date();
    // Calcolo dei minuti trascorsi
    const minutiTrascorsi = Math.floor((oraFine.getTime() - oraInizio.getTime()) / 60000);
    // Calcolo costo: (tariffa oraria / 60) * minuti
    const costo = ((TARIFFA_ORARIA / 60) * minutiTrascorsi).toFixed(2);

    // In un ambiente reale qui salveremmo l'incasso nel database.
    alert(`Sessione Chiusa!\nTempo: ${minutiTrascorsi} minuti\nTotale da incassare: €${costo}`);

    // Ripristino il tavolo allo stato libero
    setTavoli(tavoli.map(tavolo => 
      tavolo.id === idTavolo 
        ? { ...tavolo, stato: 'libero', oraInizio: null } 
        : tavolo
    ));
  };

  // Funzione di utilità per formattare l'orario a schermo (es. 14:30)
  const formattaOra = (data: Date) => {
    return data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Sala Operativa</h1>
        <p className="text-slate-500">Gestione flussi e tariffe</p>
      </header>

      {/* Griglia Tavoli: Design ad alto contrasto per la massima visibilità */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tavoli.map((tavolo) => (
          <div 
            key={tavolo.id} 
            className={`p-6 rounded-xl shadow-md border-t-4 flex flex-col justify-between h-48 transition-all ${
              tavolo.stato === 'libero' 
                ? 'bg-white border-green-500' 
                : 'bg-slate-800 border-red-500'
            }`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-2xl font-black ${tavolo.stato === 'libero' ? 'text-slate-700' : 'text-white'}`}>
                Tavolo {tavolo.numero}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                tavolo.stato === 'libero' ? 'bg-green-100 text-green-700' : 'bg-red-500 text-white'
              }`}>
                {tavolo.stato}
              </span>
            </div>

            <div className="mt-4">
              {tavolo.stato === 'libero' ? (
                <button 
                  onClick={() => apriTavolo(tavolo.id)}
                  className="w-full bg-slate-200 hover:bg-green-500 hover:text-white text-slate-700 font-bold py-3 px-4 rounded transition-colors"
                >
                  ▶ APRI TAVOLO
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <span className="text-slate-300 text-sm">
                    Inizio: {tavolo.oraInizio ? formattaOra(tavolo.oraInizio) : ''}
                  </span>
                  <button 
                    onClick={() => chiudiTavolo(tavolo.id, tavolo.oraInizio!)}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded transition-colors shadow-lg"
                  >
                    ⏹ CHIUDI E CALCOLA
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}