"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Tornei({ salaId }: { salaId: string }) {
  const [tornei, setTornei] = useState<any[]>([]);
  const [activeTorneo, setActiveTorneo] = useState<any>(null);
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [partite, setPartite] = useState<any[]>([]);

  const [newTorneo, setNewTorneo] = useState({ 
    nome: "", specialita: "5 Birilli", quota: "", max_partecipanti: "32", struttura: "eliminazione" 
  });
  const [newIscritto, setNewIscritto] = useState({ nome: "", haPagato: false });

  // --- LETTURA DATI ---

  const fetchTornei = async () => {
    if (!salaId) return;
    const { data, error } = await supabase.from("tornei").select("*").eq("sala_id", salaId).order('created_at', { ascending: false });
    if (error) console.error("Errore lettura tornei:", error.message);
    if (data) setTornei(data);
  };

  const fetchIscritti = async (torneoId: string) => {
    const { data, error } = await supabase.from("tornei_iscritti").select("*").eq("torneo_id", torneoId).order('created_at', { ascending: true });
    if (data) setIscritti(data);
  };

  const fetchPartite = async (torneoId: string) => {
    const { data, error } = await supabase.from("tornei_partite").select("*").eq("torneo_id", torneoId).order('id', { ascending: true });
    if (data) setPartite(data);
  };

  useEffect(() => {
    fetchTornei();
  }, [salaId]);

  // --- AZIONI TORNEO ---

  const creaTorneo = async () => {
    if (!newTorneo.nome.trim() || newTorneo.quota === "" || newTorneo.max_partecipanti === "") {
      alert("⚠️ ATTENZIONE: Compila Nome, Quota e Max Partecipanti.");
      return;
    }

    const { error } = await supabase.from('tornei').insert([{
      sala_id: salaId,
      nome: newTorneo.nome.trim(),
      specialita: newTorneo.specialita,
      quota_iscrizione: Number(newTorneo.quota),
      max_partecipanti: Number(newTorneo.max_partecipanti),
      tipo_struttura: newTorneo.struttura,
      stato: 'iscrizioni_aperte'
    }]);

    // ORA L'ERRORE PARLA CHIARO
    if (error) {
      alert("🛑 ERRORE DI SISTEMA: Impossibile creare il torneo. Dettaglio: " + error.message);
    } else {
      setNewTorneo({ nome: "", specialita: "5 Birilli", quota: "", max_partecipanti: "32", struttura: "eliminazione" });
      fetchTornei();
    }
  };

  const eliminaTorneo = async (id: string, nome: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'intero torneo "${nome}"?`)) {
      const { error } = await supabase.from('tornei').delete().eq('id', id);
      if (error) alert("🛑 ERRORE: " + error.message);
      fetchTornei();
      setActiveTorneo(null);
    }
  };

  const apriDettaglio = (torneo: any) => {
    setActiveTorneo(torneo);
    fetchIscritti(torneo.id);
    fetchPartite(torneo.id);
  };

  // --- AZIONI BOTTEGHINO ---

  const aggiungiGiocatore = async () => {
    if (!newIscritto.nome.trim()) { alert("⚠️ Inserisci il nome."); return; }
    if (iscritti.length >= activeTorneo.max_partecipanti) { alert("⚠️ Torneo al completo!"); return; }

    const { error } = await supabase.from('tornei_iscritti').insert([{
      torneo_id: activeTorneo.id, nome_giocatore: newIscritto.nome.trim(), quota_pagata: newIscritto.haPagato
    }]);

    if (error) {
      alert("🛑 ERRORE ISCRIZIONE: " + error.message);
    } else {
      if (newIscritto.haPagato && activeTorneo.quota_iscrizione > 0) {
        await supabase.from('movimenti_cassa').insert([{ 
          sala_id: salaId, tipo: 'entrata', categoria: 'torneo', metodo_pagamento: 'contanti', 
          importo: activeTorneo.quota_iscrizione, descrizione: `Iscrizione Torneo (${activeTorneo.nome}): ${newIscritto.nome.trim()}` 
        }]);
      }
      setNewIscritto({ nome: "", haPagato: false });
      fetchIscritti(activeTorneo.id);
    }
  };

  const saldaQuotaGiocatore = async (giocatore: any) => {
    if (window.confirm(`Confermi di aver ricevuto € ${activeTorneo.quota_iscrizione} da ${giocatore.nome_giocatore}?`)) {
      const { error } = await supabase.from('tornei_iscritti').update({ quota_pagata: true }).eq('id', giocatore.id);
      if (error) { alert("ERRORE SALDO: " + error.message); return; }
      
      await supabase.from('movimenti_cassa').insert([{ 
        sala_id: salaId, tipo: 'entrata', categoria: 'torneo', metodo_pagamento: 'contanti', 
        importo: activeTorneo.quota_iscrizione, descrizione: `Saldo Iscrizione (${activeTorneo.nome}): ${giocatore.nome_giocatore}` 
      }]);
      fetchIscritti(activeTorneo.id);
    }
  };

  const rimuoviGiocatore = async (id: string) => {
    if (window.confirm("Vuoi rimuovere questo giocatore?")) {
      const { error } = await supabase.from('tornei_iscritti').delete().eq('id', id);
      if (error) alert("ERRORE RIMOZIONE: " + error.message);
      fetchIscritti(activeTorneo.id);
    }
  };

  // --- MOTORE DI SORTEGGIO E TABELLONE ---

  const generaTabellone = async () => {
    if (iscritti.length < 2) { alert("Servono almeno 2 iscritti!"); return; }
    
    if (window.confirm("Procedere con il sorteggio? Le iscrizioni verranno chiuse definitivamente.")) {
      const shuffled = [...iscritti].sort(() => Math.random() - 0.5);
      
      let power = 2;
      while (power < shuffled.length) power *= 2;
      while (shuffled.length < power) shuffled.push({ nome_giocatore: "BYE" });

      const nuovePartite = [];
      for (let i = 0; i < shuffled.length; i += 2) {
        const g1 = shuffled[i].nome_giocatore;
        const g2 = shuffled[i + 1].nome_giocatore;
        const isBye = g2 === "BYE"; 

        nuovePartite.push({
          torneo_id: activeTorneo.id,
          fase: "Turno 1",
          giocatore1_nome: g1,
          giocatore2_nome: g2,
          vincitore_nome: isBye ? g1 : null,
          stato: isBye ? 'conclusa' : 'da_giocare'
        });
      }

      const { error: err1 } = await supabase.from("tornei_partite").insert(nuovePartite);
      if (err1) { alert("ERRORE TABELLONE: " + err1.message); return; }

      const { error: err2 } = await supabase.from("tornei").update({ stato: 'in_corso' }).eq("id", activeTorneo.id);
      if (err2) { alert("ERRORE STATO TORNEO: " + err2.message); return; }
      
      setActiveTorneo({ ...activeTorneo, stato: 'in_corso' });
      fetchPartite(activeTorneo.id);
    }
  };

  const impostaVincitore = async (partitaId: string, vincitore: string) => {
    if (window.confirm(`Dichiari ${vincitore} vincitore del match?`)) {
      const { error } = await supabase.from("tornei_partite").update({ vincitore_nome: vincitore, stato: 'conclusa' }).eq("id", partitaId);
      if (error) alert("ERRORE MATCH: " + error.message);
      fetchPartite(activeTorneo.id);
    }
  };

  const generaTurnoSuccessivo = async () => {
    const turniEsistenti = partite.map(p => parseInt(p.fase.replace("Turno ", "")));
    const turnoCorrente = Math.max(...turniEsistenti);
    const partiteCorrenti = partite.filter(p => p.fase === `Turno ${turnoCorrente}`);
    
    const daGiocare = partiteCorrenti.filter(p => p.stato !== 'conclusa');
    if (daGiocare.length > 0) {
      alert("⚠️ Attenzione: Devi dichiarare i vincitori di tutte le partite del turno corrente prima di procedere.");
      return;
    }

    if (partiteCorrenti.length === 1) {
      if (window.confirm("La finale è conclusa! Vuoi archiviare il torneo?")) {
        const { error } = await supabase.from("tornei").update({ stato: 'concluso' }).eq("id", activeTorneo.id);
        if (error) { alert("ERRORE CONCLUSIONE: " + error.message); return; }
        setActiveTorneo({ ...activeTorneo, stato: 'concluso' });
      }
      return;
    }

    const vincitori = partiteCorrenti.map(p => p.vincitore_nome);
    const nuovePartite = [];
    for (let i = 0; i < vincitori.length; i += 2) {
      nuovePartite.push({
        torneo_id: activeTorneo.id,
        fase: `Turno ${turnoCorrente + 1}`,
        giocatore1_nome: vincitori[i],
        giocatore2_nome: vincitori[i + 1],
        stato: 'da_giocare'
      });
    }

    const { error } = await supabase.from("tornei_partite").insert(nuovePartite);
    if (error) alert("ERRORE NUOVO TURNO: " + error.message);
    fetchPartite(activeTorneo.id);
  };


  // ==========================================
  // VISTA 2: DETTAGLIO TORNEO / TABELLONE
  // ==========================================
  if (activeTorneo) {
    const turni = [...new Set(partite.map(p => p.fase))].sort();

    return (
      <div className="p-4 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
        <button onClick={() => setActiveTorneo(null)} className="text-pink-500 font-bold uppercase text-xs mb-6 hover:text-white border border-pink-900/50 px-4 py-2 rounded-full">
          ← Torna all'Archivio
        </button>

        <div className="bg-[#11131a] p-8 rounded-[2rem] border-t-8 border-pink-600 shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">{activeTorneo.nome}</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2">
              {activeTorneo.specialita} • Stato: <span className={activeTorneo.stato === 'in_corso' ? 'text-orange-500' : 'text-green-500'}>{activeTorneo.stato.replace('_', ' ')}</span>
            </p>
          </div>
        </div>

        {/* --- SCENARIO A: ISCRIZIONI APERTE (BOTTEGHINO) --- */}
        {activeTorneo.stato === 'iscrizioni_aperte' && (
          <>
            <div className="bg-[#0a0b0e] border border-gray-800 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center">
              <input 
                placeholder="Nome Giocatore / Socio" value={newIscritto.nome} onChange={e => setNewIscritto({...newIscritto, nome: e.target.value})} 
                className="w-full bg-black p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-pink-500 font-bold"
              />
              <label className="flex items-center gap-2 text-sm font-bold text-gray-300 whitespace-nowrap bg-black p-4 rounded-xl border border-gray-800 cursor-pointer">
                <input type="checkbox" checked={newIscritto.haPagato} onChange={e => setNewIscritto({...newIscritto, haPagato: e.target.checked})} className="w-5 h-5 accent-pink-600"/>
                Ha pagato (€{activeTorneo.quota_iscrizione})
              </label>
              <button onClick={aggiungiGiocatore} className="w-full md:w-auto bg-pink-600 px-8 py-4 rounded-xl font-black text-white hover:bg-pink-500 transition-all uppercase whitespace-nowrap">
                + Iscrivi
              </button>
            </div>

            <div className="bg-[#11131a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-800 bg-black/20 flex justify-between items-center">
                <h3 className="text-lg font-black text-white uppercase tracking-widest">Elenco Iscritti ({iscritti.length}/{activeTorneo.max_partecipanti})</h3>
                {iscritti.length >= 2 && (
                  <button onClick={generaTabellone} className="bg-white text-black px-6 py-3 rounded-lg font-black text-xs uppercase hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    Genera Tabellone 🎲
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-800/50">
                {iscritti.map((g, index) => (
                  <div key={g.id} className="p-4 px-6 flex justify-between items-center hover:bg-gray-900/50">
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600 font-mono font-bold text-sm w-6">{index + 1}.</span>
                      <span className="font-bold text-lg text-gray-200">{g.nome_giocatore}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {g.quota_pagata ? (
                        <span className="bg-green-900/30 text-green-500 border border-green-500/50 px-3 py-1 rounded text-xs font-black uppercase tracking-widest">Pagato</span>
                      ) : (
                        <button onClick={() => saldaQuotaGiocatore(g)} className="bg-orange-600 text-white px-4 py-1.5 rounded text-xs font-black hover:bg-orange-500 transition-all uppercase tracking-widest">Saldare</button>
                      )}
                      <button onClick={() => rimuoviGiocatore(g.id)} className="text-gray-600 hover:text-red-500 bg-black/50 p-2 rounded-lg" title="Rimuovi">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* --- SCENARIO B: TORNEO IN CORSO (IL TABELLONE) --- */}
        {(activeTorneo.stato === 'in_corso' || activeTorneo.stato === 'concluso') && (
          <div className="space-y-12">
            {turni.map((fase) => {
              const matchDelTurno = partite.filter(p => p.fase === fase);
              const turnoCompletato = matchDelTurno.every(p => p.stato === 'conclusa');

              return (
                <div key={fase} className="bg-[#11131a] rounded-3xl border border-gray-800 p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                    <h3 className="text-2xl font-black text-pink-500 uppercase tracking-widest">{fase}</h3>
                    {turnoCompletato && fase === turni[turni.length - 1] && activeTorneo.stato !== 'concluso' && (
                       <button onClick={generaTurnoSuccessivo} className="bg-pink-600 text-white px-6 py-2 rounded-lg font-black text-xs uppercase hover:bg-pink-500 transition-all animate-pulse shadow-[0_0_20px_rgba(219,39,119,0.4)]">
                         Genera Turno Successivo ⚔️
                       </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {matchDelTurno.map(match => (
                      <div key={match.id} className={`border-2 rounded-2xl overflow-hidden flex flex-col ${match.stato === 'conclusa' ? 'border-gray-800 opacity-70' : 'border-pink-600/50 shadow-[0_0_15px_rgba(219,39,119,0.1)]'}`}>
                        {/* GIOCATORE 1 */}
                        <div 
                          onClick={() => match.stato === 'da_giocare' && impostaVincitore(match.id, match.giocatore1_nome)}
                          className={`p-4 flex justify-between items-center cursor-pointer transition-all ${match.vincitore_nome === match.giocatore1_nome ? 'bg-green-900/30' : 'bg-black'} ${match.stato === 'da_giocare' ? 'hover:bg-gray-900' : ''}`}
                        >
                          <span className={`font-black ${match.vincitore_nome === match.giocatore1_nome ? 'text-green-500' : 'text-gray-200'}`}>{match.giocatore1_nome}</span>
                          {match.vincitore_nome === match.giocatore1_nome && <span className="text-xl">🏆</span>}
                        </div>
                        
                        <div className="bg-gray-900 text-center py-1 border-y border-gray-800">
                          <span className="text-[10px] text-gray-500 font-black uppercase">VS</span>
                        </div>

                        {/* GIOCATORE 2 */}
                        <div 
                          onClick={() => match.stato === 'da_giocare' && impostaVincitore(match.id, match.giocatore2_nome)}
                          className={`p-4 flex justify-between items-center cursor-pointer transition-all ${match.vincitore_nome === match.giocatore2_nome ? 'bg-green-900/30' : 'bg-black'} ${match.stato === 'da_giocare' ? 'hover:bg-gray-900' : ''}`}
                        >
                          <span className={`font-black ${match.vincitore_nome === match.giocatore2_nome ? 'text-green-500' : match.giocatore2_nome === 'BYE' ? 'text-gray-600' : 'text-gray-200'}`}>{match.giocatore2_nome}</span>
                          {match.vincitore_nome === match.giocatore2_nome && <span className="text-xl">🏆</span>}
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
    );
  }

  // ==========================================
  // VISTA 1: CREAZIONE E LISTA TORNEI (HUB)
  // ==========================================
  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto animate-in fade-in duration-500">
      <h2 className="text-3xl font-black text-pink-500 mb-8 uppercase italic text-center">Gestione Tornei</h2>
      
      <div className="bg-[#11131a] p-8 rounded-3xl border border-gray-800 mb-12 shadow-2xl">
        <h3 className="text-pink-600 text-xs font-bold uppercase tracking-widest mb-6">Crea Nuovo Bando di Gara</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <input placeholder="Nome Torneo" value={newTorneo.nome} onChange={e => setNewTorneo({...newTorneo, nome: e.target.value})} className="bg-black p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-pink-500 lg:col-span-2 font-bold"/>
          <select value={newTorneo.specialita} onChange={e => setNewTorneo({...newTorneo, specialita: e.target.value})} className="bg-black p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-pink-500 font-bold">
            <option value="5 Birilli">5 Birilli</option>
            <option value="Goriziana">Goriziana</option>
            <option value="Boccette">Boccette</option>
            <option value="Pool">Pool</option>
          </select>
          <input type="number" placeholder="Quota (€)" value={newTorneo.quota} onChange={e => setNewTorneo({...newTorneo, quota: e.target.value})} className="bg-black p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-pink-500 font-bold tabular-nums"/>
          <input type="number" placeholder="Max iscritti" value={newTorneo.max_partecipanti} onChange={e => setNewTorneo({...newTorneo, max_partecipanti: e.target.value})} className="bg-black p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-pink-500 font-bold tabular-nums"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select value={newTorneo.struttura} onChange={e => setNewTorneo({...newTorneo, struttura: e.target.value})} className="bg-black p-4 rounded-xl border border-gray-800 text-white outline-none focus:border-pink-500 md:col-span-2 font-bold">
            <option value="eliminazione">🏆 Eliminazione Diretta (Tabellone Tennistico)</option>
          </select>
          <button onClick={creaTorneo} className="bg-pink-600 py-4 rounded-xl font-black text-white hover:bg-pink-500 transition-all uppercase tracking-widest shadow-[0_0_20px_rgba(219,39,119,0.3)]">
            Genera Torneo
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-2 mb-4">Archivio Tornei</h3>
        {tornei.map((t: any) => (
          <div key={t.id} className="p-6 bg-[#11131a] rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center border border-gray-800 hover:border-pink-500/50 transition-all group">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-1">
                <span className={`w-3 h-3 rounded-full ${t.stato === 'iscrizioni_aperte' ? 'bg-green-500 animate-pulse' : t.stato === 'in_corso' ? 'bg-orange-500' : 'bg-gray-600'}`}></span>
                <span className="font-black text-xl uppercase italic text-white">{t.nome}</span>
              </div>
              <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t.specialita} • {t.stato.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="text-right hidden md:block">
                <p className="text-xs text-gray-500 font-bold uppercase">Quota</p>
                <p className="font-black text-pink-500 tabular-nums">€ {t.quota_iscrizione}</p>
              </div>
              <button onClick={() => apriDettaglio(t)} className="flex-1 md:flex-none bg-black border border-gray-700 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-white hover:text-black transition-all">
                Apri Gestione →
              </button>
              <button onClick={() => eliminaTorneo(t.id, t.nome)} className="bg-black border border-red-900 text-red-500 p-3 rounded-xl hover:bg-red-900 hover:text-white transition-all">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}