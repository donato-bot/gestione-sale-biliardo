"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function VetrinaClub({ params }: { params: { salaId: string } }) {
  const [nomeSala, setNomeSala] = useState<string>("Caricamento Club...");
  const [activeView, setActiveView] = useState<string>("hub"); // Gestisce la navigazione: hub, tornei, bacheca
  
  // Dati Torneo
  const [torneoAttivo, setTorneoAttivo] = useState<any>(null);
  const [partite, setPartite] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDatiPubblici() {
      // 1. Recupera il nome della Sala
      const { data: salaData } = await supabase
        .from('sale')
        .select('name')
        .eq('id', params.salaId)
        .single();
      
      if (salaData) setNomeSala(salaData.name);

      // 2. Cerca se c'è un torneo in corso
      const { data: torneiData } = await supabase
        .from('tornei')
        .select('*')
        .eq('sala_id', params.salaId)
        .in('stato', ['in_corso', 'concluso'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (torneiData && torneiData.length > 0) {
        const torneo = torneiData[0];
        setTorneoAttivo(torneo);

        // 3. Recupera il tabellone
        const { data: partiteData } = await supabase
          .from('partite_torneo')
          .select('*')
          .eq('torneo_id', torneo.id)
          .order('partita_num', { ascending: true });
        
        if (partiteData) setPartite(partiteData);
      }
      setLoading(false);
    }

    if (params.salaId) fetchDatiPubblici();
  }, [params.salaId]);

  const getNomeTurno = (numPartite: number) => {
    if (numPartite === 1) return "Finale";
    if (numPartite === 2) return "Semifinali";
    if (numPartite === 4) return "Quarti di Finale";
    if (numPartite === 8) return "Ottavi di Finale";
    if (numPartite === 16) return "Sedicesimi";
    return `Turno Preliminare`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0D14] flex items-center justify-center">
        <div className="animate-pulse text-[#00ADC6] font-black tracking-widest uppercase">Caricamento App Soci...</div>
      </div>
    );
  }

  // ==========================================
  // VISTA 1: MENU PRINCIPALE (HUB)
  // ==========================================
  if (activeView === "hub") {
    return (
      <div className="min-h-screen bg-[#E6F0EB] font-sans flex flex-col">
        <header className="bg-[#0B0D14] border-b border-[#1E222B] p-6 shadow-md text-center rounded-b-3xl">
          <p className="text-[10px] text-[#E91E63] font-black uppercase tracking-widest mb-2 block">App Ufficiale Soci</p>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">{nomeSala}</h1>
        </header>

        <main className="flex-1 p-6 w-full max-w-lg mx-auto flex flex-col gap-5 mt-4">
          <p className="text-center text-gray-500 font-bold text-sm mb-2 uppercase tracking-widest">Scegli una sezione</p>

          {/* Tasto Tornei */}
          <button 
            onClick={() => setActiveView("tornei")}
            className="bg-[#0B0D14] border border-[#1E222B] hover:border-[#00E5FF] p-6 rounded-3xl shadow-lg flex items-center justify-between group transition-all"
          >
            <div className="text-left">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🏆</span>
              <h2 className="text-white font-black uppercase tracking-widest text-lg">Area Tornei</h2>
              <p className="text-gray-500 text-xs font-bold mt-1">Tabelloni e risultati live</p>
            </div>
            <div className="text-[#00E5FF] font-black text-xl">→</div>
          </button>

          {/* Tasto Bacheca */}
          <button 
            onClick={() => setActiveView("bacheca")}
            className="bg-[#0B0D14] border border-[#1E222B] hover:border-[#E91E63] p-6 rounded-3xl shadow-lg flex items-center justify-between group transition-all"
          >
            <div className="text-left">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">📌</span>
              <h2 className="text-white font-black uppercase tracking-widest text-lg">Bacheca Avvisi</h2>
              <p className="text-gray-500 text-xs font-bold mt-1">Comunicazioni del club</p>
            </div>
            <div className="text-[#E91E63] font-black text-xl">→</div>
          </button>

          {/* Tasto Info */}
          <button 
            onClick={() => setActiveView("info")}
            className="bg-[#0B0D14] border border-[#1E222B] hover:border-[#00E676] p-6 rounded-3xl shadow-lg flex items-center justify-between group transition-all opacity-70"
          >
            <div className="text-left">
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">ℹ️</span>
              <h2 className="text-white font-black uppercase tracking-widest text-lg">Altro / Info</h2>
              <p className="text-gray-500 text-xs font-bold mt-1">Regolamenti e contatti</p>
            </div>
            <div className="text-[#00E676] font-black text-xl">→</div>
          </button>
        </main>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: SEZIONE TORNEI (IL TABELLONE LIVE)
  // ==========================================
  if (activeView === "tornei") {
    return (
      <div className="min-h-screen bg-[#E6F0EB] font-sans flex flex-col">
        <header className="bg-[#0B0D14] border-b border-[#1E222B] p-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
          <button onClick={() => setActiveView("hub")} className="text-gray-400 hover:text-white font-black text-xs uppercase bg-[#1A1D24] px-4 py-2 rounded-lg border border-gray-800">
            ← Menu
          </button>
          <div className="text-right">
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Area Tornei</p>
            <h1 className="text-sm md:text-base font-black text-white uppercase italic tracking-tight">{nomeSala}</h1>
          </div>
        </header>

        <main className="flex-1 p-4 w-full max-w-7xl mx-auto">
          {!torneoAttivo ? (
            <div className="bg-[#0B0D14] rounded-2xl p-10 text-center border border-[#1E222B] mt-10 shadow-lg">
              <span className="text-4xl mb-4 block">🎱</span>
              <h2 className="text-white font-black uppercase tracking-widest mb-2">Nessun Torneo in Corso</h2>
              <p className="text-gray-500 text-sm font-bold">I tabelloni appariranno qui non appena la Direzione di Gara avvierà una competizione.</p>
            </div>
          ) : (
            <div className="bg-[#0B0D14] border border-[#1E222B] rounded-2xl p-4 md:p-8 shadow-xl overflow-hidden flex flex-col mt-4">
              <div className="text-center mb-6 border-b border-[#1E222B] pb-4">
                <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black tracking-widest uppercase mb-3 ${torneoAttivo.stato === 'concluso' ? 'bg-gray-800 text-gray-400' : 'bg-[#E91E63]/20 text-[#E91E63]'}`}>
                  {torneoAttivo.stato === 'concluso' ? '🏆 Torneo Concluso' : '🔴 Live: Direzione Gara'}
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight">{torneoAttivo.nome}</h2>
                <p className="text-[#00ADC6] text-xs font-black uppercase tracking-widest mt-2">{torneoAttivo.disciplina}</p>
              </div>

              <div className="overflow-x-auto custom-scrollbar flex-1 pb-4">
                <div className="flex gap-6 min-w-max h-full min-h-[500px] items-stretch">
                  {
                    [...new Set(partite.map(p => p.turno))].sort((a, b) => a - b).map(turnoNum => {
                      const partiteTurno = partite.filter(p => p.turno === turnoNum);
                      return (
                        <div key={turnoNum} className="flex flex-col w-[260px] md:w-[300px] shrink-0">
                          <h3 className="text-center text-[11px] md:text-xs font-black uppercase tracking-widest text-[#00E5FF] mb-4 bg-[#1A1D24] py-2 rounded-lg border border-[#2A2E39]">
                            {getNomeTurno(partiteTurno.length)}
                          </h3>
                          <div className="flex-1 flex flex-col justify-around gap-3 relative">
                            {partiteTurno.map((p) => (
                              <div key={p.id} className={`bg-[#1A1D24] border ${p.stato === 'conclusa' ? 'border-[#00E676]/50' : 'border-[#2A2E39]'} rounded-xl p-3 relative z-10 shadow-md`}>
                                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl ${p.stato === 'conclusa' ? 'bg-[#00E676]' : (p.turno === 1 ? 'bg-[#E91E63]' : 'bg-[#00ADC6]')}`}></div>
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Match #{p.partita_num}</span>
                                  {p.stato === 'conclusa' && <span className="text-[9px] text-[#00E676] font-black uppercase tracking-widest">✓ Conclusa</span>}
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center bg-[#0B0D14] p-2 rounded-lg border border-[#2A2E39]">
                                    <span className={`font-bold text-[11px] md:text-xs truncate ${p.giocatore1_nome?.includes('BYE') || p.giocatore1_nome === 'In Attesa' ? 'text-gray-600' : 'text-white'}`}>{p.giocatore1_nome}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-[#0B0D14] p-2 rounded-lg border border-[#2A2E39]">
                                    <span className={`font-bold text-[11px] md:text-xs truncate ${p.giocatore2_nome?.includes('BYE') || p.giocatore2_nome === 'In Attesa' ? 'text-gray-600' : 'text-white'}`}>{p.giocatore2_nome}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==========================================
  // VISTA 3: SEZIONE BACHECA / ALTRO (Placeholder)
  // ==========================================
  if (activeView === "bacheca" || activeView === "info") {
    return (
      <div className="min-h-screen bg-[#E6F0EB] font-sans flex flex-col">
        <header className="bg-[#0B0D14] border-b border-[#1E222B] p-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
          <button onClick={() => setActiveView("hub")} className="text-gray-400 hover:text-white font-black text-xs uppercase bg-[#1A1D24] px-4 py-2 rounded-lg border border-gray-800">
            ← Menu
          </button>
          <div className="text-right">
            <h1 className="text-sm md:text-base font-black text-white uppercase italic tracking-tight">{nomeSala}</h1>
          </div>
        </header>

        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="bg-[#0B0D14] rounded-2xl p-10 text-center border border-[#1E222B] shadow-lg max-w-md w-full">
            <span className="text-4xl mb-4 block">🚧</span>
            <h2 className="text-white font-black uppercase tracking-widest mb-2">Lavori in Corso</h2>
            <p className="text-gray-500 text-sm font-bold">Questa sezione è attualmente in fase di costruzione. Presto sarà disponibile!</p>
          </div>
        </main>
      </div>
    );
  }

  return null;
}