"use client";

// ==========================================
// FILE: src/components/TorneiSocio.tsx
// OBIETTIVO: Portale Unificato Socio (Bacheca Gare + Prenotazioni Tavoli)
// ==========================================

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";
import PrenotazioniSocio from "./PrenotazioniSocio";

export default function TorneiSocio({ salaId }: { salaId: string }) {
  const [vistaAttiva, setVistaAttiva] = useState<"tornei" | "prenota">("tornei");
  const [tornei, setTornei] = useState<any[]>([]);
  const [torneoAttivo, setTorneoAttivo] = useState<any>(null);
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [partite, setPartite] = useState<any[]>([]);
  
  const [nomeSocio, setNomeSocio] = useState("");
  const [inIscrizione, setInIscrizione] = useState(false);

  useEffect(() => {
    fetchTorneiPubblici();
    const nomeSalvato = localStorage.getItem(`nomeSocio_${salaId}`);
    if (nomeSalvato) setNomeSocio(nomeSalvato);
  }, [salaId]);

  async function fetchTorneiPubblici() {
    if (!salaId) return;
    const { data, error } = await supabase
      .from('tornei')
      .select('*')
      .eq('sala_id', salaId)
      .in('stato', ['iscrizioni', 'in_corso', 'concluso'])
      .order('created_at', { ascending: false });

    if (!error && data) setTornei(data);
  }

  async function selezionaTorneo(torneo: any) {
    setTorneoAttivo(torneo);
    const resIscritti = await supabase.from('iscritti_torneo').select('*').eq('torneo_id', torneo.id).order('created_at', { ascending: true });
    if (resIscritti.data) setIscritti(resIscritti.data);

    if (torneo.stato === 'in_corso' || torneo.stato === 'concluso') {
      const resPartite = await supabase.from('partite_torneo').select('*').eq('torneo_id', torneo.id).order('turno', { ascending: true }).order('partita_num', { ascending: true });
      if (resPartite.data) setPartite(resPartite.data);
    }
  }

  const handleAutoIscrizione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSocio.trim() || !torneoAttivo) return;
    if (iscritti.length >= torneoAttivo.max_iscritti) {
      alert("🚨 Posti esauriti!");
      return;
    }
    setInIscrizione(true);
    try {
      const { error } = await supabase.from('iscritti_torneo').insert([{ torneo_id: torneoAttivo.id, nominativo: nomeSocio.trim().toUpperCase(), pagato: false }]);
      if (error) throw error;
      localStorage.setItem(`nomeSocio_${salaId}`, nomeSocio.trim());
      alert("📥 Iscrizione inviata!");
      setNomeSocio("");
      await selezionaTorneo(torneoAttivo); 
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInIscrizione(false);
    }
  };

  const getNomeTurno = (turno: number, totalePartite: number) => {
    if (totalePartite === 1) return "🏆 Finale Assoluta";
    if (totalePartite === 2) return "Semifinali";
    if (totalePartite === 4) return "Quarti di Finale";
    return `Turno Eliminatorio ${turno}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      
      <header className="mb-6 text-center border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#00E5FF]">Bacheca Club</h1>
        
        {/* NAVIGAZIONE INTERNA SOCI */}
        <div className="flex justify-center gap-2 mt-4 bg-black p-1.5 rounded-xl border border-gray-800 max-w-xs mx-auto">
          <button 
            type="button"
            onClick={() => { setVistaAttiva("tornei"); setTorneoAttivo(null); }}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${vistaAttiva === "tornei" ? "bg-cyan-600 text-white" : "text-gray-500 hover:text-white"}`}
          >
            🏆 Tornei
          </button>
          <button 
            type="button"
            onClick={() => setVistaAttiva("prenota")}
            className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${vistaAttiva === "prenota" ? "bg-cyan-600 text-white" : "text-gray-500 hover:text-white"}`}
          >
            🗓️ Prenota
          </button>
        </div>
      </header>

      {/* SE SELEZIONA PRENOTA */}
      {vistaAttiva === "prenota" && <PrenotazioniSocio salaId={salaId} />}

      {/* SE SELEZIONA TORNEI */}
      {vistaAttiva === "tornei" && (
        <>
          {!torneoAttivo && (
            <div className="space-y-4 max-w-md mx-auto">
              {tornei.length === 0 ? (
                <div className="text-center p-12 border border-gray-800 rounded-3xl bg-[#11131a]/30">
                  <p className="text-gray-500 font-bold uppercase text-sm tracking-widest">Nessun torneo attivo</p>
                </div>
              ) : (
                tornei.map(t => (
                  <div key={t.id} onClick={() => { localStorage.setItem(`nomeSocio_${salaId}`, nomeSocio.trim()); selezionaTorneo(t); }} className="bg-[#11131a] border border-gray-800 p-5 rounded-2xl cursor-pointer hover:border-cyan-500/50 transition-all shadow-lg relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${t.stato === 'iscrizioni' ? 'bg-green-500' : (t.stato === 'in_corso' ? 'bg-purple-500' : 'bg-gray-600')}`}></div>
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-800">{t.stato === 'iscrizioni' ? '🟢 Aperto' : '🔴 In Corso'}</span>
                      <span className="text-xs font-mono text-gray-500">{t.data_inizio ? new Date(t.data_inizio).toLocaleDateString('it-IT') : ''}</span>
                    </div>
                    <h2 className="text-xl font-black uppercase pl-2">{t.nome}</h2>
                    <div className="flex justify-between items-end mt-4 pl-2 pt-2 border-t border-gray-800/30">
                      <p className="text-gray-400 text-xs font-bold uppercase">{t.disciplina}</p>
                      <p className="text-yellow-500 font-black text-sm">€{Number(t.quota).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {torneoAttivo && (
            <div className="max-w-xl mx-auto animate-in fade-in duration-300">
              <button onClick={() => { setTorneoAttivo(null); fetchTorneiPubblici(); }} className="text-gray-500 font-bold uppercase text-xs mb-6 flex items-center gap-2 hover:text-white">
                ← Torna alla lista tornei
              </button>
              
              <div className="bg-[#11131a] border border-gray-800 p-6 rounded-3xl shadow-xl mb-6">
                <h2 className="text-2xl font-black uppercase text-white mb-1">{torneoAttivo.nome}</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">{torneoAttivo.disciplina} • {torneoAttivo.formula}</p>
                <div className="grid grid-cols-2 gap-4 bg-black p-4 rounded-xl border border-gray-800 text-center">
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Iscritti</p>
                    <p className="text-lg font-black text-cyan-400">{iscritti.length} / {torneoAttivo.max_iscritti}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Quota</p>
                    <p className="text-lg font-black text-yellow-500">€{Number(torneoAttivo.quota).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {torneoAttivo.stato === 'iscrizioni' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-[#12151f] to-black border border-gray-800 p-6 rounded-3xl shadow-2xl">
                    <h3 className="text-xs font-black uppercase tracking-widest text-green-400 mb-4">Iscriviti Online</h3>
                    <form onSubmit={handleAutoIscrizione} className="space-y-4">
                      <input type="text" placeholder="Tuo Nome e Cognome" value={nomeSocio} onChange={e => setNomeSocio(e.target.value)} required className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white font-bold uppercase" />
                      <button type="submit" disabled={inIscrizione} className="w-full bg-green-600 text-black font-black uppercase tracking-widest py-4 rounded-xl text-sm">Conferma Iscrizione</button>
                    </form>
                  </div>

                  <div className="bg-[#11131a] border border-gray-800 rounded-2xl overflow-hidden">
                    <ul className="divide-y divide-gray-800">
                      {iscritti.map((isc, idx) => (
                        <li key={isc.id} className="p-4 flex justify-between items-center text-sm font-bold uppercase">
                          <span><span className="text-gray-600 mr-3">{idx + 1}.</span> {isc.nominativo}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {(torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso') && (
                <div className="space-y-6">
                  {[...new Set(partite.map(p => p.turno))].sort((a, b) => a - b).map(turnoNum => {
                    const partiteTurno = partite.filter(p => p.turno === turnoNum);
                    return (
                      <div key={turnoNum} className="mb-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 pl-2 border-l border-purple-500">{getNomeTurno(turnoNum, partiteTurno.length)}</h4>
                        <div className="space-y-3">
                          {partiteTurno.map(p => (
                            <div key={p.id} className="bg-[#11131a] border border-gray-800 p-4 rounded-2xl shadow-md">
                              <div className="flex flex-col gap-2">
                                <span className={`text-xs font-bold uppercase ${p.giocatore1_nome.includes('BYE') ? 'text-gray-600' : 'text-white'}`}>{p.giocatore1_nome}</span>
                                <div className="h-px bg-gray-800"></div>
                                <span className={`text-xs font-bold uppercase ${p.giocatore2_nome.includes('BYE') ? 'text-gray-600' : 'text-white'}`}>{p.giocatore2_nome}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}