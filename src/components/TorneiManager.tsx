// ==========================================
// FILE: src/components/TorneiManager.tsx
// OBIETTIVO: Gestione Tornei e Tabelloni (Design Premium + Stampa Ottimizzata)
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
  vincitore: string | null;
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
  
  const [sociSelezionati, setSociSelezionati] = useState<string[]>([]);
  const [nomeEsterno, setNomeEsterno] = useState("");

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
      setSociSelezionati([]);
      setNomeEsterno("");
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
        stato: 'iscrizioni_aperte',
        vincitore: null
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

  const generaGiocatoriTest = async () => {
    const nomiTest = [
      "ALDO BIANCHI", "BEATRICE NERI", "CARLO VERDI", "DIANA GIALLI",
      "ENRICO BLU", "FEDERICA ROSA", "GIACOMO MARRONE", "ILARIA VIOLA",
      "LORENZO GRIGI", "MARTINA AZZURRA", "NICOLA ARANCIO", "OLIVIA LILLA",
      "PAOLO ROSSI", "QUINTINO BIANCHI", "ROBERTA NERI", "STEFANO VERDI"
    ];

    const nomiEsistenti = soci.map(s => s.nome_completo.toUpperCase());
    const nomiDaAggiungere = nomiTest.filter(nome => !nomiEsistenti.includes(nome));

    if (nomiDaAggiungere.length === 0) {
      alert("I giocatori di test sono già tutti presenti nel database Soci.");
      return;
    }

    const nuoviSoci = nomiDaAggiungere.map(nome => ({
      manager_email: managerEmail,
      nome_completo: nome,
      telefono: "0000000000"
    }));

    const { error } = await supabase.from('soci').insert(nuoviSoci);

    if (error) {
      alert("Errore durante la generazione dei tester: " + error.message);
    } else {
      fetchSoci();
      alert(`✓ Aggiunti ${nomiDaAggiungere.length} giocatori fittizi al database Soci!`);
    }
  };

  const toggleSocio = (id: string, checked: boolean) => {
    if (checked) {
      setSociSelezionati(prev => [...prev, id]);
    } else {
      setSociSelezionati(prev => prev.filter(sId => sId !== id));
    }
  };

  const iscriviSociInBlocco = async () => {
    if (sociSelezionati.length === 0 || !torneoAttivo) return;

    const max = torneoAttivo.max_partecipanti;
    if (max && (iscrizioni.length + sociSelezionati.length) > max) {
      alert(`Attenzione: Stai cercando di iscrivere ${sociSelezionati.length} persone, ma ci sono solo ${max - iscrizioni.length} posti disponibili.`);
      return;
    }

    const sociDaIscrivere = soci.filter(s => sociSelezionati.includes(s.id));
    const inserimenti = sociDaIscrivere.map(s => ({
      torneo_id: torneoAttivo.id,
      manager_email: managerEmail,
      nome_giocatore: s.nome_completo,
      telefono: s.telefono,
      quota_pagata: false
    }));

    const { error } = await supabase.from('torneo_iscrizioni').insert(inserimenti);

    if (error) {
      alert("Errore iscrizione in blocco: " + error.message);
    } else {
      setSociSelezionati([]);
      fetchIscrizioni(torneoAttivo.id);
    }
  };

  const iscriviEsterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeEsterno.trim() || !torneoAttivo) return;

    const max = torneoAttivo.max_partecipanti;
    if (max && iscrizioni.length >= max) {
      alert(`Attenzione: Il torneo ha raggiunto il limite massimo di ${max} iscritti.`);
      return;
    }

    const giaIscritto = iscrizioni.some(i => i.nome_giocatore.toUpperCase() === nomeEsterno.toUpperCase().trim());
    if (giaIscritto) {
      alert(`Un giocatore con il nome ${nomeEsterno.toUpperCase()} è già iscritto a questo torneo.`);
      return;
    }

    const { error } = await supabase.from('torneo_iscrizioni').insert([
      {
        torneo_id: torneoAttivo.id,
        manager_email: managerEmail,
        nome_giocatore: nomeEsterno.toUpperCase().trim(),
        telefono: null,
        quota_pagata: false
      }
    ]);

    if (error) {
      alert("Errore iscrizione ospite esterno: " + error.message);
    } else {
      setNomeEsterno("");
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
    if (!confirm("Sei sicuro di voler rimuovere questo giocatore dal torneo?")) return;
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

    const { error: err1 } = await supabase
      .from('partite_torneo')
      .update({ stato: 'conclusa' })
      .eq('id', partitaId);

    if (err1) {
      alert("Errore nell'aggiornamento della partita: " + err1.message);
      return;
    }

    const nextTurno = matchCorrente.turno + 1;
    const nextPartitaNum = Math.ceil(matchCorrente.partita_num / 2);
    const isPlayer1 = matchCorrente.partita_num % 2 !== 0;

    const nextMatch = partite.find(p => p.turno === nextTurno && p.partita_num === nextPartitaNum);

    if (nextMatch) {
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

      await supabase.from('partite_torneo').update(updateData).eq('id', nextMatch.id);
    } else {
      await supabase.from('tornei').update({ stato: 'concluso', vincitore: vincitoreNome }).eq('id', torneoAttivo!.id);
      const torneoAggiornato = { ...torneoAttivo!, stato: 'concluso', vincitore: vincitoreNome };
      setTorneoAttivo(torneoAggiornato);
      fetchTornei(); 
    }

    fetchPartite(torneoAttivo!.id);
  };

  const turniPresenti = Array.from(new Set(partite.map(p => p.turno))).sort((a, b) => a - b);

  if (torneoAttivo) {
    return (
      <div className="space-y-6">
        
        {/* STILI OTTIMIZZATI PER LA STAMPA CARTACEA PULITA */}
        <style>{`
          @media print {
            @page { size: landscape; margin: 6mm; }
            body { background-color: white !important; color: black !important; -webkit-print-color-adjust: exact; font-size: 11pt; }
            .no-print { display: none !important; }
            .print-text-black { color: black !important; }
            .print-bg-white { 
              background-color: white !important; 
              border: 1px solid #cbd5e1 !important; 
              box-shadow: none !important; 
              padding: 10px !important; 
              margin-bottom: 10px !important;
            }
            .print-border-light { border-color: #cbd5e1 !important; }
            .print-title { font-size: 18pt !important; color: black !important; text-align: center; margin-bottom: 10px; font-weight: 900; }
            #dashboard-sidebar, #dashboard-header { display: none !important; }
          }
        `}</style>

        {/* HEADER DETTAGLIO TORNEO SELEZIONATO */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 p-6 rounded-2xl shadow-xl gap-4 print-bg-white">
          <div>
            <button 
              onClick={() => setTorneoAttivo(null)}
              className="no-print text-emerald-500 hover:text-emerald-400 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-2 transition-colors"
            >
              ⟵ Torna alla bacheca Tornei
            </button>
            <h3 className="text-2xl text-white font-black uppercase tracking-widest print-text-black print-title">{torneoAttivo.nome}</h3>
            <p className="no-print text-gray-400 text-xs mt-1 font-mono uppercase tracking-widest">
              {torneoAttivo.stato === 'concluso' ? '🏆 TORNEO CONCLUSO' : 
               torneoAttivo.stato === 'in_corso' ? '⚔️ TABELLONE UFFICIALE (ELIMINAZIONE DIRETTA)' : 
               '📝 SEGRETERIA E ISCRIZIONI APERTE'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* PULSANTE STAMPA VISIBILE SOLO SE IL TABELLONE E' GENERATO */}
            {(torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso') && (
              <button 
                type="button"
                onClick={() => window.print()}
                className="no-print bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-black px-4 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md"
                title="Stampa il tabellone su carta"
              >
                🖨️ Stampa
              </button>
            )}

            {torneoAttivo.formato !== 'solo_iscrizioni' && torneoAttivo.stato !== 'in_corso' && torneoAttivo.stato !== 'concluso' && (
              <button 
                type="button"
                onClick={handleGestisciTabellone}
                className="no-print bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse"
              >
                🏁 Genera Tabellone
              </button>
            )}
            
            <div className="text-right no-print flex-1 md:flex-none bg-[#0b0e14]/50 px-4 py-2 rounded-xl border border-gray-800">
              <span className="block text-3xl font-black text-amber-400">
                {torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso' ? partite.length : iscrizioni.length}
                <span className="text-lg text-gray-600">/{torneoAttivo.max_partecipanti || '∞'}</span>
              </span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                {torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso' ? 'Partite Generali' : 'Iscritti Totali'}
              </span>
            </div>
          </div>
        </div>

        {/* CONTENUTO: TABELLONE O FASE ISCRIZIONE */}
        {torneoAttivo.stato === 'in_corso' || torneoAttivo.stato === 'concluso' ? (
          <div className="bg-[#111827] border border-gray-700/70 p-6 rounded-2xl shadow-xl space-y-10 overflow-x-auto print-bg-white print-border-light custom-scrollbar">
            
            {/* BANNER VINCITORE ASSOLUTO */}
            {torneoAttivo.stato === 'concluso' && torneoAttivo.vincitore && (
              <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-8 rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.5)] border-4 border-yellow-300/50 text-center animate-pulse print-bg-white print:border-black print:animate-none print:shadow-none mb-10">
                <p className="text-yellow-900 font-black uppercase tracking-[0.3em] mb-2 text-sm print-text-black">🏆 Il Campione Assoluto 🏆</p>
                <h2 className="text-5xl md:text-7xl font-black text-black drop-shadow-md tracking-tighter print-text-black">
                  {torneoAttivo.vincitore}
                </h2>
              </div>
            )}

            {/* GRIGLIA TURNI */}
            {turniPresenti.map(turno => (
              <div key={turno} className="relative min-w-[300px]">
                <div className="flex items-center gap-4 mb-6">
                  <h4 className="text-lg text-cyan-400 font-black uppercase tracking-widest bg-[#111827] pr-4 print-text-black print-bg-white">
                    🏆 Griglia Turno {turno} {turno === turniPresenti.length ? '(FINALE)' : ''}
                  </h4>
                  <div className="flex-1 border-b border-gray-700/50 print-border-light"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {partite.filter(p => p.turno === turno).map(p => {
                    const isP1Bye = p.giocatore1_nome === "BYE";
                    const isP2Bye = p.giocatore2_nome === "BYE";

                    return (
                      <div key={p.id || `${p.turno}-${p.partita_num}`} className="bg-[#1e293b] border border-gray-700/50 p-4 rounded-xl flex flex-col justify-between hover:border-cyan-500/30 transition-colors shadow-lg print-bg-white print-border-light">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold print-text-black">Match #{p.partita_num}</span>
                          {p.stato === 'conclusa' ? (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 uppercase font-black tracking-widest print-text-black print:bg-gray-100">Conclusa</span>
                          ) : p.stato === 'da_giocare' ? (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50 uppercase font-black tracking-widest animate-pulse print-text-black print:animate-none print:bg-gray-100">Da Giocare</span>
                          ) : (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 uppercase font-bold tracking-widest print-text-black print:bg-gray-100">In Attesa</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          
                          {/* Giocatore 1 */}
                          <div className={`flex justify-between items-center text-xs font-bold uppercase px-3 py-2.5 rounded-lg border transition-all print-bg-white print-border-light print-text-black ${
                            p.stato === 'conclusa' && isP2Bye ? 'bg-emerald-900/20 text-emerald-400 border-emerald-700/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                            isP1Bye ? 'bg-black/40 text-gray-600 border-gray-800 opacity-50 line-through' : 
                            'bg-[#0b0e14] text-white border-gray-700/50'
                          }`}>
                            <span className="truncate pr-2">{p.giocatore1_nome}</span>
                            {p.stato === 'da_giocare' && !isP1Bye && (
                              <button 
                                onClick={() => registraVittoria(p.id, p.giocatore1_nome)}
                                className="no-print bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded shadow-md transition-transform active:scale-95"
                                title="Dichiara Vincitore"
                              >
                                🏆
                              </button>
                            )}
                          </div>
                          
                          <div className="text-center text-gray-600 font-black text-[10px] print-text-black">VS</div>
                          
                          {/* Giocatore 2 */}
                          <div className={`flex justify-between items-center text-xs font-bold uppercase px-3 py-2.5 rounded-lg border transition-all print-bg-white print-border-light print-text-black ${
                            p.stato === 'conclusa' && isP1Bye ? 'bg-emerald-900/20 text-emerald-400 border-emerald-700/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 
                            isP2Bye ? 'bg-black/40 text-gray-600 border-gray-800 opacity-50 line-through' : 
                            'bg-[#0b0e14] text-white border-gray-700/50'
                          }`}>
                            <span className="truncate pr-2">{p.giocatore2_nome}</span>
                            {p.stato === 'da_giocare' && !isP2Bye && (
                              <button 
                                onClick={() => registraVittoria(p.id, p.giocatore2_nome)}
                                className="no-print bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded shadow-md transition-transform active:scale-95"
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
            {/* FASE ISCRIZIONE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
              
              {/* MODULO 1: Iscrizione Soci Multipla */}
              <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 p-6 rounded-2xl shadow-xl flex flex-col">
                <h4 className="text-[10px] text-cyan-400 font-black uppercase tracking-widest mb-4 flex justify-between items-center">
                  <span>1. Selezione Soci in Anagrafica</span>
                  <span className="text-gray-400 bg-gray-800 px-2 py-0.5 rounded">{sociSelezionati.length} selezionati</span>
                </h4>
                
                <div className="flex-1 bg-[#1e293b] border border-gray-700/50 rounded-xl p-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                  {soci.length === 0 ? (
                    <p className="text-xs text-gray-500 uppercase text-center py-4 font-bold">Nessun socio registrato in anagrafica.</p>
                  ) : (
                    <div className="space-y-1">
                      {soci.map(socio => {
                        const isIscritto = iscrizioni.some(i => i.nome_giocatore.toUpperCase() === socio.nome_completo.toUpperCase());
                        return (
                          <label key={socio.id} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isIscritto ? 'opacity-40 grayscale' : 'hover:bg-gray-700/50'}`}>
                            <input 
                              type="checkbox" 
                              disabled={isIscritto}
                              checked={sociSelezionati.includes(socio.id)}
                              onChange={e => toggleSocio(socio.id, e.target.checked)}
                              className="w-4 h-4 accent-cyan-500 bg-black border-gray-800 rounded cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-bold text-white uppercase">{socio.nome_completo}</span>
                            {isIscritto && <span className="ml-auto text-[9px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded font-black uppercase tracking-widest">Già Iscritto</span>}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={generaGiocatoriTest}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md border border-gray-600 w-1/3"
                    title="Aggiungi automaticamente giocatori fittizi al database"
                  >
                    🧪 Tester
                  </button>
                  <button 
                    type="button" 
                    onClick={iscriviSociInBlocco}
                    disabled={sociSelezionati.length === 0}
                    className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none text-black font-black px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] w-2/3"
                  >
                    + Iscrivi Selezione
                  </button>
                </div>
              </div>

              {/* MODULO 2: Iscrizione Esterno */}
              <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-purple-500 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-4">
                    2. Registrazione Ospite Esterno (Wildcard)
                  </h4>
                  <p className="text-xs text-gray-400 mb-6 leading-relaxed uppercase tracking-widest font-bold">
                    Iscrivi giocatori occasionali o esterni. Il nominativo parteciperà al torneo, ma <span className="text-white">non verrà salvato</span> nell'anagrafica ufficiale dei soci.
                  </p>
                  
                  <input 
                    type="text" 
                    placeholder="ES. MARIO ROSSI" 
                    value={nomeEsterno} 
                    onChange={e => setNomeEsterno(e.target.value)} 
                    className="bg-[#1e293b] border-2 border-gray-700 p-4 rounded-xl text-white text-xs font-bold uppercase placeholder-gray-500 focus:outline-none focus:border-purple-500 w-full mb-4 transition-colors" 
                  />
                </div>
                <button 
                  type="button" 
                  onClick={iscriviEsterno}
                  disabled={!nomeEsterno.trim()}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none text-white font-black px-6 py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] w-full"
                >
                  + Inserisci nel Torneo
                </button>
              </div>
            </div>

            {/* TABELLA RIEPILOGO ISCRITTI */}
            <div className="bg-[#111827] border border-gray-700/70 rounded-2xl shadow-xl overflow-hidden mt-6 no-print">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0b0e14]/80 border-b border-gray-800">
                    <th className="p-5 text-[10px] text-gray-400 font-black uppercase tracking-widest">Giocatore Iscritto</th>
                    <th className="p-5 text-[10px] text-gray-400 font-black uppercase tracking-widest">Quota Iscrizione</th>
                    <th className="p-5 text-[10px] text-gray-400 font-black uppercase tracking-widest text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {iscrizioni.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                        Nessun giocatore iscritto al momento.
                      </td>
                    </tr>
                  ) : (
                    iscrizioni.map(iscr => (
                      <tr key={iscr.id} className="hover:bg-[#1e293b]/50 transition-colors">
                        <td className="p-5 text-white font-black uppercase text-sm tracking-wider">{iscr.nome_giocatore}</td>
                        <td className="p-5">
                          <button 
                            onClick={() => segnaPagato(iscr.id, iscr.quota_pagata)}
                            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                              iscr.quota_pagata 
                                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50' 
                                : 'bg-red-900/40 text-red-400 border border-red-800/50 animate-pulse'
                            }`}
                          >
                            {iscr.quota_pagata ? '✅ Pagato' : '❌ Da Pagare'}
                          </button>
                        </td>
                        <td className="p-5 text-right">
                          <button 
                            onClick={() => rimuoviIscrizione(iscr.id)}
                            className="text-gray-500 hover:text-red-400 font-black transition-colors px-3 py-2 border border-transparent hover:border-red-900/50 rounded-lg hover:bg-red-900/10"
                            title="Rimuovi giocatore dal torneo"
                          >
                            ✖ Annulla Iscrizione
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
      {/* FORM CREAZIONE NUOVO TORNEO */}
      <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 p-6 rounded-2xl shadow-xl">
        <div className="mb-6">
          <h3 className="text-lg text-cyan-400 font-black uppercase tracking-widest">🏆 Avvia Nuova Competizione</h3>
          <p className="text-gray-400 text-xs mt-1 uppercase font-bold tracking-widest">Imposta i parametri e scegli il formato del torneo.</p>
        </div>

        <form onSubmit={creaTorneo} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Nome Torneo *</label>
              <input type="text" placeholder="Es. TROFEO DI PRIMAVERA" value={nome} onChange={e => setNome(e.target.value)} className="bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-full transition-colors" required />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Data Inizio</label>
              <input type="date" value={dataInizio} onChange={e => setDataInizio(e.target.value)} className="bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 w-full transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Quota Iscrizione (€)</label>
              <input type="number" placeholder="Es. 15" value={quota} onChange={e => setQuota(e.target.value)} className="bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-emerald-400 font-black text-xs uppercase placeholder-gray-500 focus:outline-none focus:border-cyan-500 w-full transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Limite Giocatori</label>
              <select value={maxPartecipanti} onChange={e => setMaxPartecipanti(e.target.value)} className="bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 w-full cursor-pointer transition-colors">
                <option value="8">8 Giocatori (Quarti)</option>
                <option value="16">16 Giocatori (Ottavi)</option>
                <option value="32">32 Giocatori (Sedicesimi)</option>
                <option value="64">64 Giocatori (Trentaduesimi)</option>
                <option value="128">128 Giocatori</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4">
            <div className="md:col-span-3">
              <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Formato di Gara</label>
              <select value={formato} onChange={e => setFormato(e.target.value)} className="bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 w-full cursor-pointer transition-colors">
                <option value="solo_iscrizioni">Solo Iscrizioni (Gestione Manuale Carta e Penna)</option>
                <option value="eliminazione_diretta">Tabellone Automatico (Eliminazione Diretta)</option>
              </select>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-black font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.3)] w-full">
                + Avvia Torneo
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* LISTA TORNEI ATTIVI E PASSATI */}
      {loading ? (
        <div className="p-10 text-center text-cyan-500 animate-pulse font-black uppercase tracking-widest">Analisi archivio tornei...</div>
      ) : tornei.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tornei.map(torneo => (
            <div key={torneo.id} className="bg-[#111827] border border-gray-700/70 p-6 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between hover:border-cyan-500/50 transition-all hover:scale-[1.01]">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-xl text-white font-black uppercase tracking-wider">{torneo.nome}</h4>
                  <button type="button" onClick={() => eliminaTorneo(torneo.id)} className="text-gray-500 hover:text-red-500 transition-colors font-black text-lg" title="Elimina Torneo">✖</button>
                </div>
                <div className="space-y-3 mb-6 bg-[#0b0e14]/50 p-4 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest"><span className="text-gray-500">Formato:</span> {torneo.formato?.replace('_', ' ')}</p>
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest"><span className="text-gray-500">Data Avvio:</span> {torneo.data_inizio ? new Date(torneo.data_inizio).toLocaleDateString('it-IT') : 'Data non fissata'}</p>
                  <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest flex items-center gap-4">
                    <span><span className="text-gray-500">Quota:</span> {torneo.quota_iscrizione ? `€ ${torneo.quota_iscrizione}` : 'Gratuito'}</span>
                    <span className="text-gray-700">|</span>
                    <span><span className="text-gray-500">Limite Iscritti:</span> {torneo.max_partecipanti || '∞'} Max</span>
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-gray-700/50 pt-4 mt-2">
                <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                  torneo.stato === 'in_corso' ? 'bg-cyan-900/40 text-cyan-400 border-cyan-800/50' : 
                  torneo.stato === 'concluso' ? 'bg-amber-900/40 text-amber-400 border-amber-800/50' :
                  'bg-emerald-900/40 text-emerald-400 border-emerald-800/50'
                }`}>
                  {torneo.stato ? torneo.stato.replace('_', ' ') : 'ISCRIZIONI APERTE'}
                </span>
                <button 
                  type="button" 
                  onClick={() => setTorneoAttivo(torneo)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-black px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all border border-gray-600 shadow-md flex items-center gap-2"
                >
                  Entra ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111827] border border-gray-700/70 border-dashed rounded-2xl p-16 text-center shadow-xl">
          <p className="text-gray-500 font-black uppercase tracking-widest mb-2 text-sm">Nessun torneo in archivio.</p>
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Crea la tua prima competizione per iniziare.</p>
        </div>
      )}
    </div>
  );
}