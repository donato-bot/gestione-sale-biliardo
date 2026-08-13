// ==========================================
// FILE: src/components/TorneiManager.tsx
// ==========================================
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

interface Torneo {
  id: string;
  manager_email: string;
  nome: string;
  data_inizio: string | null;
  quota_iscrizione: number | null;
  stato: string | null;
  formato: string | null;
  max_partecipanti: number | null;
}

interface Socio {
  id: string;
  nome_completo: string;
  telefono: string | null;
}

interface Iscrizione {
  id: string;
  nome_giocatore: string;
  telefono: string | null;
  quota_pagata: boolean;
}

interface Partita {
  id: string;
  turno: number;
  partita_num: number;
  giocatore1_nome: string;
  giocatore2_nome: string;
  stato: string;
}

export default function TorneiManager({ managerEmail }: { managerEmail: string }) {
  const [tornei, setTornei] = useState<Torneo[]>([]);
  const [loading, setLoading] = useState(true);

  const [torneoAttivo, setTorneoAttivo] = useState<Torneo | null>(null);
  const [soci, setSoci] = useState<Socio[]>([]);
  const [iscrizioni, setIscrizioni] = useState<Iscrizione[]>([]);
  const [partite, setPartite] = useState<Partita[]>([]);
  const [socioSelezionato, setSocioSelezionato] = useState<string>("");

  const [nome, setNome] = useState("");
  const [dataInizio, setDataInizio] = useState("");
  const [quota, setQuota] = useState("");
  const [formato, setFormato] = useState("solo_iscrizioni");
  const [maxPartecipanti, setMaxPartecipanti] = useState("32");

  useEffect(() => {
    if (managerEmail) {
      fetchTornei();
      fetchSoci(); 
    }
  }, [managerEmail]);

  useEffect(() => {
    if (torneoAttivo) {
      fetchIscrizioni(torneoAttivo.id);
      if (torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso') {
        fetchPartite(torneoAttivo.id);
      }
    }
  }, [torneoAttivo]);

  const fetchTornei = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tornei')
      .select('*')
      .eq('manager_email', managerEmail)
      .order('created_at', { ascending: false });

    if (!error) setTornei(data || []);
    setLoading(false);
  };

  const fetchSoci = async () => {
    const { data, error } = await supabase
      .from('soci')
      .select('*')
      .eq('manager_email', managerEmail)
      .order('nome_completo', { ascending: true });
    
    if (!error) setSoci(data || []);
  };

  const fetchIscrizioni = async (torneoId: string) => {
    const { data, error } = await supabase
      .from('torneo_iscrizioni')
      .select('*')
      .eq('torneo_id', torneoId)
      .order('created_at', { ascending: true });
      
    if (!error) setIscrizioni(data || []);
  };

  const fetchPartite = async (torneoId: string) => {
    const { data, error } = await supabase
      .from('partite_torneo')
      .select('*')
      .eq('torneo_id', torneoId)
      .order('turno', { ascending: true })
      .order('partita_num', { ascending: true });

    if (!error) setPartite(data || []);
  };

  const creaTorneo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !managerEmail) return;

    const { error } = await supabase.from('tornei').insert([
      {
        manager_email: managerEmail,
        nome: nome.toUpperCase(),
        data_inizio: dataInizio || null,
        quota_iscrizione: quota ? parseFloat(quota) : 0,
        formato: formato,
        max_partecipanti: parseInt(maxPartecipanti, 10),
        stato: 'iscrizioni_aperte'
      }
    ]);

    if (error) alert("Errore creazione torneo: " + error.message);
    else {
      setNome(""); setDataInizio(""); setQuota(""); setFormato("solo_iscrizioni"); setMaxPartecipanti("32");
      fetchTornei();
    }
  };

  const eliminaTorneo = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo torneo?")) return;
    const { error } = await supabase.from('tornei').delete().eq('id', id);
    if (!error) fetchTornei();
  };

  const aggiungiIscrizione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socioSelezionato || !torneoAttivo) return;

    if (torneoAttivo.max_partecipanti && iscrizioni.length >= torneoAttivo.max_partecipanti) {
      alert(`Attenzione: Il torneo ha raggiunto il limite massimo di ${torneoAttivo.max_partecipanti} iscritti.`);
      return;
    }

    const socio = soci.find(s => s.id === socioSelezionato);
    if (!socio) return;

    const { error } = await supabase.from('torneo_iscrizioni').insert([
      {
        torneo_id: torneoAttivo.id,
        manager_email: managerEmail,
        nome_giocatore: socio.nome_completo,
        telefono: socio.telefono,
        quota_pagata: false
      }
    ]);

    if (error) alert("Errore iscrizione: " + error.message);
    else {
      setSocioSelezionato("");
      fetchIscrizioni(torneoAttivo.id);
    }
  };

  const segnaPagato = async (idIscrizione: string, statoAttuale: boolean) => {
    const { error } = await supabase.from('torneo_iscrizioni')
      .update({ quota_pagata: !statoAttuale })
      .eq('id', idIscrizione);
    
    if (!error && torneoAttivo) fetchIscrizioni(torneoAttivo.id);
  };

  const rimuoviIscrizione = async (idIscrizione: string) => {
    if (!confirm("Rimuovere questo giocatore dal torneo?")) return;
    const { error } = await supabase.from('torneo_iscrizioni').delete().eq('id', idIscrizione);
    if (!error && torneoAttivo) fetchIscrizioni(torneoAttivo.id);
  };

  const handleGestisciTabellone = async () => {
    if (iscrizioni.length < 2) {
      alert("Servono almeno 2 iscritti per generare il tabellone.");
      return;
    }

    let giocatori = [...iscrizioni];
    const targetSize = torneoAttivo!.max_partecipanti || 32;

    if (iscrizioni.length > targetSize) {
      alert(`Attenzione: Hai ${iscrizioni.length} iscritti, ma il limite del torneo è fissato a ${targetSize}. Rimuovi gli iscritti in eccesso.`);
      return;
    }

    if (iscrizioni.length < targetSize) {
      const procedi = window.confirm(
        `Attenzione: Ci sono ${iscrizioni.length} iscritti. Il tabellone è impostato per ${targetSize} posti.\nIl sistema calcolerà automaticamente ${targetSize - iscrizioni.length} passaggi diretti al Turno 2 (BYE). Vuoi procedere?`
      );
      if (!procedi) return;
    }

    const byesNeeded = targetSize - giocatori.length;
    for (let i = 0; i < byesNeeded; i++) {
      giocatori.push({ id: `bye_${i}`, nome_giocatore: "BYE", telefono: null, quota_pagata: true });
    }

    giocatori.sort(() => Math.random() - 0.5);

    const nuovePartite = [];
    const totalRounds = Math.log2(targetSize);
    let turniMatches = targetSize / 2;

    for (let t = 1; t <= totalRounds; t++) {
      for (let m = 1; m <= turniMatches; m++) {
        if (t === 1) {
          const g1 = giocatori[(m - 1) * 2].nome_giocatore;
          const g2 = giocatori[(m - 1) * 2 + 1].nome_giocatore;
          const hasBye = g1 === "BYE" || g2 === "BYE";

          nuovePartite.push({
            torneo_id: torneoAttivo!.id,
            manager_email: managerEmail,
            turno: 1,
            partita_num: m,
            giocatore1_nome: g1,
            giocatore2_nome: g2,
            stato: hasBye ? 'conclusa' : 'da_giocare'
          });
        } else {
          const prevMatch1 = nuovePartite.find(p => p.turno === t - 1 && p.partita_num === m * 2 - 1);
          const prevMatch2 = nuovePartite.find(p => p.turno === t - 1 && p.partita_num === m * 2);

          let g1 = "In attesa...";
          let g2 = "In attesa...";

          if (prevMatch1 && prevMatch1.stato === 'conclusa') {
            g1 = prevMatch1.giocatore1_nome === "BYE" ? prevMatch1.giocatore2_nome : prevMatch1.giocatore1_nome;
          }
          if (prevMatch2 && prevMatch2.stato === 'conclusa') {
            g2 = prevMatch2.giocatore1_nome === "BYE" ? prevMatch2.giocatore2_nome : prevMatch2.giocatore1_nome;
          }

          const hasOneBye = g1 === "BYE" || g2 === "BYE";
          
          let statoMatch = 'in_attesa';
          if (g1 !== "In attesa..." && g2 !== "In attesa...") {
            statoMatch = hasOneBye ? 'conclusa' : 'da_giocare';
          }

          nuovePartite.push({
            torneo_id: torneoAttivo!.id,
            manager_email: managerEmail,
            turno: t,
            partita_num: m,
            giocatore1_nome: g1,
            giocatore2_nome: g2,
            stato: statoMatch
          });
        }
      }
      turniMatches = turniMatches / 2;
    }

    const { error } = await supabase.from('partite_torneo').insert(nuovePartite);
    
    if (error) {
      alert("Errore nella generazione del tabellone: " + error.message);
    } else {
      await supabase.from('tornei').update({ stato: 'in_corso' }).eq('id', torneoAttivo!.id);
      const torneoAggiornato = { ...torneoAttivo!, stato: 'in_corso' };
      setTorneoAttivo(torneoAggiornato);
      fetchPartite(torneoAttivo!.id);
      alert(`✓ Tabellone a ${targetSize} generato con successo!`);
    }
  };

  const registraVittoria = async (partitaId: string, vincitoreNome: string) => {
    if (!confirm(`Confermi che ${vincitoreNome} ha vinto la partita?`)) return;

    const matchCorrente = partite.find(p => p.id === partitaId);
    if (!matchCorrente) return;

    // 1. Chiudi il match corrente
    const { error: err1 } = await supabase
      .from('partite_torneo')
      .update({ stato: 'conclusa' })
      .eq('id', partitaId);

    if (err1) {
      alert("Errore nell'aggiornamento della partita: " + err1.message);
      return;
    }

    // 2. Calcola lo slot del turno successivo
    const nextTurno = matchCorrente.turno + 1;
    const nextPartitaNum = Math.ceil(matchCorrente.partita_num / 2);
    const isPlayer1 = matchCorrente.partita_num % 2 !== 0;

    const nextMatch = partite.find(p => p.turno === nextTurno && p.partita_num === nextPartitaNum);

    if (nextMatch) {
      // Prepara i dati per il prossimo match
      let updateData: any = {};
      
      if (isPlayer1) {
        updateData.giocatore1_nome = vincitoreNome;
        if (nextMatch.giocatore2_nome !== "In attesa..." && nextMatch.giocatore2_nome !== "BYE") {
          updateData.stato = 'da_giocare';
        }
      } else {
        updateData.giocatore2_nome = vincitoreNome;
        if (nextMatch.giocatore1_nome !== "In attesa..." && nextMatch.giocatore1_nome !== "BYE") {
          updateData.stato = 'da_giocare';
        }
      }

      // Aggiorna il match successivo
      await supabase.from('partite_torneo').update(updateData).eq('id', nextMatch.id);
    } else {
      // Se non c'è un nextMatch, significa che abbiamo registrato la Finale!
      alert(`🏆 IL TORNEO È CONCLUSO! 🏆\nIl grande campione è ${vincitoreNome}!`);
      await supabase.from('tornei').update({ stato: 'concluso' }).eq('id', torneoAttivo!.id);
      
      const torneoAggiornato = { ...torneoAttivo!, stato: 'concluso' };
      setTorneoAttivo(torneoAggiornato);
      fetchTornei(); // Aggiorna la lista principale
    }

    // Sincronizza l'interfaccia
    fetchPartite(torneoAttivo!.id);
  };

  const turniPresenti = Array.from(new Set(partite.map(p => p.turno))).sort((a, b) => a - b);

  if (torneoAttivo) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#0B0D14] border border-[#2A2E39] p-6 rounded-2xl shadow-xl gap-4">
          <div>
            <button 
              onClick={() => setTorneoAttivo(null)}
              className="text-cyan-500 hover:text-cyan-400 font-bold text-xs uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors"
            >
              ⟵ Torna ai Tornei
            </button>
            <h3 className="text-2xl text-white font-black uppercase tracking-widest">{torneoAttivo.nome}</h3>
            <p className="text-gray-400 text-xs mt-1 font-mono">
              {torneoAttivo.stato === 'concluso' ? '🏆 TORNEO CONCLUSO' : 
               torneoAttivo.stato === 'in_corso' ? 'TABELLONE UFFICIALE - ELIMINAZIONE DIRETTA' : 
               'SEGRETERIA E ISCRIZIONI'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {torneoAttivo.formato !== 'solo_iscrizioni' && torneoAttivo.stato !== 'in_corso' && torneoAttivo.stato !== 'concluso' && (
              <button 
                type="button"
                onClick={handleGestisciTabellone}
                className="bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-pulse"
              >
                🏁 Genera Tabellone
              </button>
            )}
            <div className="text-right">
              <span className="block text-3xl font-black text-emerald-400">
                {torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso' ? partite.length : iscrizioni.length}
                <span className="text-lg text-gray-600">/{torneoAttivo.max_partecipanti || '∞'}</span>
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                {torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso' ? 'Partite Totali' : 'Iscritti Totali'}
              </span>
            </div>
          </div>
        </div>

        {torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso' ? (
          <div className="bg-[#0B0D14] border border-[#2A2E39] p-6 rounded-2xl shadow-xl space-y-10 overflow-x-auto">
            {turniPresenti.map(turno => (
              <div key={turno} className="relative min-w-[300px]">
                <div className="flex items-center gap-4 mb-6">
                  <h4 className="text-lg text-cyan-400 font-black uppercase tracking-widest bg-[#0B0D14] pr-4">
                    🏆 Griglia Turno {turno} {turno === turniPresenti.length ? '(FINALE)' : ''}
                  </h4>
                  <div className="flex-1 border-b border-gray-800"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {partite.filter(p => p.turno === turno).map(p => {
                    const isP1Bye = p.giocatore1_nome === "BYE";
                    const isP2Bye = p.giocatore2_nome === "BYE";

                    return (
                      <div key={p.id || `${p.turno}-${p.partita_num}`} className="bg-[#121520] border border-gray-800 p-4 rounded-xl flex flex-col justify-between hover:border-gray-700 transition-colors">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-mono text-cyan-500 uppercase font-bold">Match #{p.partita_num}</span>
                          {p.stato === 'conclusa' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase font-black">Conclusa</span>
                          ) : p.stato === 'da_giocare' ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase font-black animate-pulse">Da Giocare</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-500/20 text-gray-500 uppercase font-bold">In Attesa</span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {/* Giocatore 1 */}
                          <div className={`flex justify-between items-center text-xs font-bold uppercase px-3 py-2.5 rounded-lg border transition-all ${
                            p.stato === 'conclusa' && isP2Bye ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                            isP1Bye ? 'bg-black/20 text-gray-700 border-gray-800/50 opacity-50 line-through' : 
                            'bg-black/40 text-white border-gray-800/80'
                          }`}>
                            <span className="truncate pr-2">{p.giocatore1_nome}</span>
                            {p.stato === 'da_giocare' && !isP1Bye && (
                              <button 
                                onClick={() => registraVittoria(p.id, p.giocatore1_nome)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded shadow-md transition-transform active:scale-95"
                                title="Dichiara Vincitore"
                              >
                                🏆
                              </button>
                            )}
                          </div>
                          
                          <div className="text-center text-gray-700 font-black text-[10px]">VS</div>
                          
                          {/* Giocatore 2 */}
                          <div className={`flex justify-between items-center text-xs font-bold uppercase px-3 py-2.5 rounded-lg border transition-all ${
                            p.stato === 'conclusa' && isP1Bye ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                            isP2Bye ? 'bg-black/20 text-gray-700 border-gray-800/50 opacity-50 line-through' : 
                            'bg-black/40 text-white border-gray-800/80'
                          }`}>
                            <span className="truncate pr-2">{p.giocatore2_nome}</span>
                            {p.stato === 'da_giocare' && !isP2Bye && (
                              <button 
                                onClick={() => registraVittoria(p.id, p.giocatore2_nome)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded shadow-md transition-transform active:scale-95"
                                title="Dichiara Vincitore"
                              >
                                🏆
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="bg-[#0B0D14] border border-[#2A2E39] p-6 rounded-2xl shadow-xl">
              <form onSubmit={aggiungiIscrizione} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-2">Seleziona Socio dal database</label>
                  <select 
                    value={socioSelezionato}
                    onChange={e => setSocioSelezionato(e.target.value)}
                    className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-cyan-500 w-full appearance-none cursor-pointer"
                    required
                  >
                    <option value="">-- Scegli un giocatore --</option>
                    {soci.map(socio => (
                      <option key={socio.id} value={socio.id}>{socio.nome_completo}</option> 
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] w-full md:w-auto"
                >
                  + Iscrivi
                </button>
              </form>
            </div>

            <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-2xl shadow-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#121520] border-b border-gray-800">
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Giocatore</th>
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest">Quota</th>
                    <th className="p-4 text-[10px] text-gray-500 font-black uppercase tracking-widest text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {iscrizioni.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500 text-xs font-bold uppercase">
                        Nessun giocatore iscritto al momento.
                      </td>
                    </tr>
                  ) : (
                    iscrizioni.map(iscr => (
                      <tr key={iscr.id} className="border-b border-gray-800/50 hover:bg-[#121520] transition-colors">
                        <td className="p-4 text-white font-bold uppercase text-sm">{iscr.nome_giocatore}</td>
                        <td className="p-4">
                          <button 
                            onClick={() => segnaPagato(iscr.id, iscr.quota_pagata)}
                            className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${
                              iscr.quota_pagata 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}
                          >
                            {iscr.quota_pagata ? '✅ Pagato' : '❌ Da Pagare'}
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => rimuoviIscrizione(iscr.id)}
                            className="text-gray-600 hover:text-red-500 font-black transition-colors"
                          >
                            ✖
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#0B0D14] border border-[#2A2E39] p-6 rounded-2xl shadow-xl">
        <div className="mb-6">
          <h3 className="text-xl text-white font-black uppercase tracking-widest">🏆 Nuovo Torneo</h3>
          <p className="text-gray-400 text-xs mt-1">Imposta i parametri e scegli il formato della competizione.</p>
        </div>

        <form onSubmit={creaTorneo} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-2">Nome Competizione</label>
            <input type="text" placeholder="Es. TROFEO DI PRIMAVERA" value={nome} onChange={e => setNome(e.target.value)} className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white text-xs font-bold uppercase placeholder-gray-600 focus:outline-none focus:border-cyan-500 w-full" required />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-2">Data Inizio</label>
            <input type="date" value={dataInizio} onChange={e => setDataInizio(e.target.value)} className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-cyan-500 w-full" />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-2">Quota (€)</label>
            <input type="number" placeholder="Es. 15" value={quota} onChange={e => setQuota(e.target.value)} className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white text-xs font-bold uppercase placeholder-gray-600 focus:outline-none focus:border-cyan-500 w-full" />
          </div>
          <div>
            <label className="block text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-2">Max Iscritti</label>
            <select value={maxPartecipanti} onChange={e => setMaxPartecipanti(e.target.value)} className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-cyan-500 w-full appearance-none cursor-pointer">
              <option value="8">8 Giocatori</option>
              <option value="16">16 Giocatori</option>
              <option value="32">32 Giocatori</option>
              <option value="64">64 Giocatori</option>
              <option value="128">128 Giocatori</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-2">Formato Torneo</label>
            <select value={formato} onChange={e => setFormato(e.target.value)} className="bg-black border border-gray-800 px-4 py-3 rounded-xl text-white text-xs font-bold uppercase focus:outline-none focus:border-cyan-500 w-full appearance-none cursor-pointer">
              <option value="solo_iscrizioni">Solo Iscrizioni (Gestione Manuale)</option>
              <option value="eliminazione_diretta">Tabellone a Eliminazione Diretta</option>
              <option value="gironi">Gironi + Eliminazione Diretta</option>
            </select>
          </div>
          <div className="lg:col-span-3 flex justify-end">
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] w-full md:w-auto">
              + Crea Torneo
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="p-10 text-center text-cyan-500 animate-pulse font-bold uppercase tracking-widest">Caricamento tornei in corso...</div>
      ) : tornei.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tornei.map(torneo => (
            <div key={torneo.id} className="bg-[#0B0D14] border border-[#2A2E39] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between hover:border-cyan-900/50 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl text-white font-black uppercase tracking-tight">{torneo.nome}</h4>
                  <button type="button" onClick={() => eliminaTorneo(torneo.id)} className="text-gray-600 hover:text-red-500 transition-colors">✖</button>
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-xs text-gray-400 font-mono"><span className="text-gray-500">FORMATO:</span> {torneo.formato?.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-xs text-gray-400 font-mono"><span className="text-gray-500">DATA:</span> {torneo.data_inizio ? new Date(torneo.data_inizio).toLocaleDateString('it-IT') : 'Da definire'}</p>
                  <p className="text-xs text-gray-400 font-mono">
                    <span className="text-gray-500">QUOTA:</span> {torneo.quota_iscrizione ? `€ ${torneo.quota_iscrizione}` : 'Gratis'}
                    <span className="mx-2 text-gray-700">|</span>
                    <span className="text-gray-500">MAX ISCRITTI:</span> {torneo.max_partecipanti || 'N/D'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-800 pt-4 mt-4">
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${
                  torneo.stato === 'in_corso' ? 'bg-cyan-500/20 text-cyan-400' : 
                  torneo.stato === 'concluso' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {torneo.stato ? torneo.stato.replace('_', ' ') : 'ATTIVO'}
                </span>
                <button 
                  type="button" 
                  onClick={() => setTorneoAttivo(torneo)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                >
                  Gestisci ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-2xl p-16 text-center">
          <p className="text-gray-500 font-black uppercase tracking-widest mb-2">Nessun torneo in programma.</p>
        </div>
      )}
    </div>
  );
}