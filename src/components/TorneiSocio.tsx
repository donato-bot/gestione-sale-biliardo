"use client";

// ==========================================
// FILE: src/components/TorneiSocio.tsx
// OBIETTIVO: Bacheca Pubblica Soci (Iscrizioni Online e Tabellone Live)
// ==========================================

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TorneiSocio({ salaId }: { salaId: string }) {
  const [tornei, setTornei] = useState<any[]>([]);
  const [torneoAttivo, setTorneoAttivo] = useState<any>(null);
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [partite, setPartite] = useState<any[]>([]);
  
  const [nomeSocio, setNomeSocio] = useState("");
  const [inIscrizione, setInIscrizione] = useState(false);

  useEffect(() => {
    fetchTorneiPubblici();

    // Recupera il nome del socio se si è già tesserato o iscritto sul dispositivo
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

    if (!error && data) {
      setTornei(data);
    }
  }

  async function selezionaTorneo(torneo: any) {
    setTorneoAttivo(torneo);
    
    // 1. Scarica la lista dei giocatori iscritti (sia online che da bancone)
    const resIscritti = await supabase
      .from('iscritti_torneo')
      .select('*')
      .eq('torneo_id', torneo.id)
      .order('created_at', { ascending: true });
    if (resIscritti.data) setIscritti(resIscritti.data);

    // 2. Se il bando è chiuso e la gara è in corso/conclusa, scarica gli abbinamenti
    if (torneo.stato === 'in_corso' || torneo.stato === 'concluso') {
      const resPartite = await supabase
        .from('partite_torneo')
        .select('*')
        .eq('torneo_id', torneo.id)
        .order('turno', { ascending: true })
        .order('partita_num', { ascending: true });
      if (resPartite.data) setPartite(resPartite.data);
    }
  }

  const handleAutoIscrizione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeSocio.trim() || !torneoAttivo) return;

    if (iscritti.length >= torneoAttivo.max_iscritti) {
      alert("🚨 Posti esauriti per questo torneo! Contatta la direzione in sala.");
      return;
    }

    setInIscrizione(true);

    try {
      const { error } = await supabase
        .from('iscritti_torneo')
        .insert([{ 
          torneo_id: torneoAttivo.id, 
          nominativo: nomeSocio.trim().toUpperCase(), 
          pagato: false // L'iscrizione autonoma da app richiede saldo al bancone
        }]);
      
      if (error) throw error;

      localStorage.setItem(`nomeSocio_${salaId}`, nomeSocio.trim());
      alert("📥 Iscrizione inviata con successo! Regolarizza la quota in cassa al tuo arrivo.");
      
      setNomeSocio("");
      await selezionaTorneo(torneoAttivo); 
    } catch (err: any) {
      alert("Errore di rete: " + err.message);
    } finally {
      setInIscrizione(false);
    }
  };

  const getNomeTurno = (turno: number, totalePartite: number) => {
    if (totalePartite === 1) return "🏆 Finale Assoluta";
    if (totalePartite === 2) return "Semifinali";
    if (totalePartite === 4) return "Quarti di Finale";
    if (totalePartite === 8) return "Ottavi di Finale";
    return `Turno Eliminatorio ${turno}`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans pb-24">
      
      <header className="mb-8 text-center border-b border-gray-800 pb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest text-[#00E5FF]">Bacheca Live Club</h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mt-1">Tornei e Gare in Programma</p>
      </header>

      {/* VISTA 1: LISTA DEI BANDI ATTIVI IN SALA */}
      {!torneoAttivo && (
        <div className="space-y-4 max-w-md mx-auto">
          {tornei.length === 0 ? (
            <div className="text-center p-12 border border-gray-800 rounded-3xl bg-[#11131a]/30">
              <p className="text-gray-500 font-bold uppercase text-sm tracking-widest">Nessun torneo in bacheca</p>
            </div>
          ) : (
            tornei.map(t => (
              <div 
                key={t.id} 
                onClick={() => selezionaTorneo(t)} 
                className="bg-[#11131a] border border-gray-800 p-5 rounded-2xl cursor-pointer hover:border-cyan-500/50 active:scale-98 transition-all shadow-lg relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${t.stato === 'iscrizioni' ? 'bg-green-500' : (t.stato === 'in_corso' ? 'bg-purple-500' : 'bg-gray-600')}`}></div>
                <div className="flex justify-between items-start mb-2 pl-2">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                    t.stato === 'iscrizioni' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                    (t.stato === 'in_corso' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-gray-800 text-gray-400')
                  }`}>
                    {t.stato === 'iscrizioni' ? '🟢 Iscrizioni Aperte' : (t.stato === 'in_corso' ? '🔴 Gara in Corso' : '⚫ Concluso')}
                  </span>
                  <span className="text-xs font-mono text-gray-500">{t.data_inizio ? new Date(t.data_inizio).toLocaleDateString('it-IT') : 'Da definire'}</span>
                </div>
                <h2 className="text-xl font-black uppercase tracking-wide pl-2 mt-1 text-white">{t.nome}</h2>
                <div className="flex justify-between items-end mt-4 pl-2 border-t border-gray-800/50 pt-3">
                  <p className="text-gray-400 text-xs font-bold uppercase">{t.disciplina}</p>
                  <p className="text-yellow-500 font-black text-sm">Quota: €{Number(t.quota).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VISTA 2: DETTAGLIO INTERATTIVO DEL TORNEO */}
      {torneoAttivo && (
        <div className="max-w-xl mx-auto animate-in fade-in duration-300">
          <button 
            onClick={() => { setTorneoAttivo(null); fetchTorneiPubblici(); }} 
            className="text-gray-500 font-bold uppercase text-xs mb-6 flex items-center gap-2 hover:text-white transition-colors"
          >
            ← Torna alla Bacheca Generale
          </button>
          
          <div className="bg-[#11131a] border border-gray-800 p-6 rounded-3xl shadow-xl mb-6">
            <h2 className="text-2xl font-black uppercase text-white tracking-wide mb-1">{torneoAttivo.nome}</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">{torneoAttivo.disciplina} • Formula {torneoAttivo.formula}</p>
            
            <div className="grid grid-cols-2 gap-4 bg-black p-4 rounded-xl border border-gray-800/80 text-center">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Giocatori Iscritti</p>
                <p className="text-lg font-black text-cyan-400">{iscritti.length} / {torneoAttivo.max_iscritti}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Quota d'Ingresso</p>
                <p className="text-lg font-black text-yellow-500}>€{Number(torneoAttivo.quota).toFixed(2)}</p>
              </div>
            </div>

            {torneoAttivo.note && (
              <div className="mt-4 bg-gray-900/40 p-4 rounded-xl border border-gray-800/50">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Note Organizzative</p>
                <p className="text-sm text-gray-300 font-medium whitespace-pre-line">{torneoAttivo.note}</p>
              </div>
            )}
          </div>

          {/* SOTTO-VISTA A: ISCRIZIONI APERTE -> FORM + ELENCO */}
          {torneoAttivo.stato === 'iscrizioni' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-[#12151f] to-black border border-gray-800 p-6 rounded-3xl shadow-2xl">
                <h3 className="text-xs font-black uppercase tracking-widest text-green-400 mb-4">Modulo di Iscrizione Online</h3>
                <form onSubmit={handleAutoIscrizione} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Inserisci Nome e Cognome..." 
                    value={nomeSocio} 
                    onChange={e => setNomeSocio(e.target.value)}
                    required
                    disabled={iscritti.length >= torneoAttivo.max_iscritti || inIscrizione}
                    className="w-full bg-black border border-gray-700 p-4 rounded-xl text-white font-bold placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors uppercase"
                  />
                  <button 
                    type="submit" 
                    disabled={inIscrizione || iscritti.length >= torneoAttivo.max_iscritti || !nomeSocio.trim()}
                    className="w-full bg-green-600 hover:bg-green-500 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg text-sm"
                  >
                    {iscritti.length >= torneoAttivo.max_iscritti ? '🚨 Gara Completa' : (inIscrizione ? 'Registrazione...' : 'Invia Iscrizione')}
                  </button>
                </form>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3 pl-2">Giocatori Attualmente in Elenco</h3>
                <div className="bg-[#11131a] border border-gray-800 rounded-2xl overflow-hidden shadow-inner">
                  {iscritti.length === 0 ? (
                    <p className="p-6 text-center text-xs text-gray-500 font-bold uppercase tracking-wider">Nessun partecipante. Iscriviti per primo!</p>
                  ) : (
                    <ul className="divide-y divide-gray-800/60">
                      {iscritti.map((isc, idx) => (
                        <li key={isc.id} className="p-4 flex justify-between items-center text-sm font-bold uppercase tracking-wide">
                          <span className="text-white"><span className="text-gray-600 font-mono mr-3">{idx + 1}.</span> {isc.nominativo}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded ${isc.pagato ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                            {isc.pagato ? 'CONFERMATO' : 'REGISTRAZIONE'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SOTTO-VISTA B: IN CORSO / CONCLUSO -> TABELLONE ABBINAMENTI LIVE */}
          {(torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso') && (
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4 pl-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                Organigramma del Torneo Live
              </h3>
              
              {[...new Set(partite.map(p => p.turno))].sort((a, b) => a - b).map(turnoNum => {
                const partiteTurno = partite.filter(p => p.turno === turnoNum);
                return (
                  <div key={turnoNum} className="mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 pl-2 border-l border-purple-500/30">
                      {getNomeTurno(turnoNum, partiteTurno.length)}
                    </h4>
                    <div className="space-y-3">
                      {partiteTurno.map(p => (
                        <div key={p.id} className={`bg-[#11131a] border ${p.stato === 'conclusa' ? 'border-green-500/20 bg-green-950/5' : 'border-gray-800/80'} p-4 rounded-2xl relative overflow-hidden shadow-md`}>
                          {p.stato === 'conclusa' && (
                            <div className="absolute top-0 right-0 bg-green-500 text-black text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-widest">
                              Fine
                            </div>
                          )}
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${p.stato === 'conclusa' && p.giocatore1_id ? 'bg-green-400' : 'bg-gray-700'}`}></div>
                                <span className={`font-bold uppercase text-xs truncate max-w-[180px] ${p.giocatore1_nome.includes('BYE') || p.giocatore1_nome === 'In Attesa' ? 'text-gray-600 italic' : 'text-white'}`}>
                                  {p.giocatore1_nome}
                                </span>
                              </div>
                            </div>
                            <div className="h-px bg-gray-800/50 my-0.5"></div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${p.stato === 'conclusa' && p.giocatore2_id ? 'bg-green-400' : 'bg-gray-700'}`}></div>
                                <span className={`font-bold uppercase text-xs truncate max-w-[180px] ${p.giocatore2_nome.includes('BYE') || p.giocatore2_nome === 'In Attesa' ? 'text-gray-600 italic' : 'text-white'}`}>
                                  {p.giocatore2_nome}
                                </span>
                              </div>
                            </div>
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
    </div>
  );
}