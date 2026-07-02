"use client";

import { useState } from "react";
import BachecaSocio from "@/components/BachecaSocio"; 
import TorneiSocio from "@/components/TorneiSocio";
import PrenotazioniSocio from "@/components/PrenotazioniSocio";

export default function AppSoci({ params }: { params: { salaId?: string } }) {
  const salaId = params?.salaId;
  const [view, setView] = useState("bacheca");

  if (!salaId) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#00E5FF] flex items-center justify-center font-black uppercase tracking-widest text-sm animate-pulse">
        Caricamento Sala...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center py-8 px-4 font-sans text-white relative">
      
      {/* Sfondo decorativo opzionale */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-[#050505] to-[#050505] z-0 pointer-events-none"></div>

      {/* CONTENITORE PRINCIPALE (Stile App Mobile anche su Desktop) */}
      <div className="w-full max-w-2xl bg-[#0B0D14] border-2 border-[#1E222B] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.7)] flex flex-col min-h-[85vh] z-10 overflow-hidden relative">
        
        {/* HEADER ESTETICO */}
        <div className="p-8 text-center border-b-2 border-[#1E222B] bg-gradient-to-b from-[#11141A] to-[#0B0D14]">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] mb-2">
            Hub del Socio
          </h1>
          <p className="text-[#00E5FF] font-black uppercase tracking-[0.2em] text-[10px]">
            Servizi & Comunicazioni
          </p>
        </div>

        {/* TAB NAVIGATION MIGLIORATA (Segmented Control) */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex bg-[#11141A] border-2 border-[#1E222B] rounded-2xl p-1.5 shadow-inner">
            <button 
              onClick={() => setView("bacheca")} 
              className={`flex-1 py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center gap-1 ${view === 'bacheca' ? 'bg-[#00ADC6] text-black shadow-[0_5px_15px_rgba(0,173,198,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#1A1D24]'}`}
            >
              <span className="text-lg">📢</span>
              <span>Bacheca</span>
            </button>
            <button 
              onClick={() => setView("prenotazioni")} 
              className={`flex-1 py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center gap-1 ${view === 'prenotazioni' ? 'bg-[#10b981] text-black shadow-[0_5px_15px_rgba(16,185,129,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#1A1D24]'}`}
            >
              <span className="text-lg">📅</span>
              <span>Prenota</span>
            </button>
            <button 
              onClick={() => setView("tornei")} 
              className={`flex-1 py-4 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex flex-col items-center gap-1 ${view === 'tornei' ? 'bg-[#FFCC00] text-black shadow-[0_5px_15px_rgba(255,204,0,0.4)]' : 'text-gray-500 hover:text-white hover:bg-[#1A1D24]'}`}
            >
              <span className="text-lg">🏆</span>
              <span>Tornei</span>
            </button>
          </div>
        </div>

        {/* CONTENUTO DINAMICO DEI 3 COMPONENTI */}
        <main className="flex-1 p-6 sm:px-8 pb-10 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
          {view === "bacheca" && <BachecaSocio salaId={salaId} />}
          {view === "prenotazioni" && <PrenotazioniSocio salaId={salaId} />}
          {view === "tornei" && <TorneiSocio salaId={salaId} />}
        </main>

        {/* FOOTER */}
        <footer className="text-center py-6 text-gray-700 text-[9px] font-black uppercase tracking-widest border-t border-[#1E222B] bg-[#0B0D14] mt-auto">
          Il Campione AppWeb • {new Date().getFullYear()}
        </footer>

      </div>
    </div>
  );
}