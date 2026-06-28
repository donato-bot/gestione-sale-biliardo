"use client";

import { useState } from "react";
import BachecaSocio from "@/components/BachecaSocio"; 
import TorneiSocio from "@/components/TorneiSocio";
import PrenotazioniSocio from "@/components/PrenotazioniSocio";

export default function AppSoci({ params }: { params: { salaId?: string } }) {
  // Estrazione sicura: previene il crash se la pagina è ancora in caricamento
  const salaId = params?.salaId;
  const [view, setView] = useState("bacheca");

  // Guardia: Mostra un caricamento se i parametri non sono ancora pronti
  if (!salaId) {
    return (
      <div className="min-h-screen bg-[#0B0D14] text-[#FFCC00] flex items-center justify-center font-black uppercase tracking-widest text-sm animate-pulse">
        Caricamento Sala...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D14] text-white">
      {/* MENU DI NAVIGAZIONE */}
      <nav className="flex justify-around p-4 border-b border-[#2A2E39] bg-[#1A1D24] sticky top-0 z-50 shadow-lg">
        <button 
          onClick={() => setView("bacheca")} 
          className={`font-black uppercase text-xs transition-all duration-200 ${view === 'bacheca' ? 'text-[#FFCC00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Bacheca
        </button>
        <button 
          onClick={() => setView("prenotazioni")} 
          className={`font-black uppercase text-xs transition-all duration-200 ${view === 'prenotazioni' ? 'text-[#FFCC00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Prenotazioni
        </button>
        <button 
          onClick={() => setView("tornei")} 
          className={`font-black uppercase text-xs transition-all duration-200 ${view === 'tornei' ? 'text-[#FFCC00] scale-110' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Tornei
        </button>
      </nav>

      {/* CONTENUTO DINAMICO */}
      <main className="p-4 animate-in fade-in duration-300">
        {view === "bacheca" && <BachecaSocio salaId={salaId} />}
        {view === "prenotazioni" && <PrenotazioniSocio salaId={salaId} />}
        {view === "tornei" && <TorneiSocio salaId={salaId} />}
      </main>

      {/* FOOTER */}
      <footer className="text-center py-10 text-gray-700 text-[9px] font-black uppercase tracking-widest border-t border-[#2A2E39] mt-10">
        Il Campione AppWeb • {new Date().getFullYear()}
      </footer>
    </div>
  );
}