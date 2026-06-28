"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Tornei({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  // LIVELLO 1: BANDO
  const [torneiList, setTorneiList] = useState<any[]>([]);
  const [nomeTorneo, setNomeTorneo] = useState("");
  const [disciplina, setDisciplina] = useState("5 Birilli");
  const [quota, setQuota] = useState("");
  const [iscrittiMax, setIscrittiMax] = useState("32");
  const [formula, setFormula] = useState("Eliminazione Diretta");
  
  // Nuovi campi Bando
  const [dataInizio, setDataInizio] = useState("");
  const [dataFine, setDataFine] = useState("");
  const [scadenzaIscrizioni, setScadenzaIscrizioni] = useState("");
  const [note, setNote] = useState("");
  
  const [loading, setLoading] = useState(false);

  // LIVELLO 2: BOTTEGHINO & TABELLONE
  const [torneoSelezionato, setTorneoSelezionato] = useState<any>(null);
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [partite, setPartite] = useState<any[]>([]);
  const [nomeGiocatore, setNomeGiocatore] = useState("");
  const [quotaPagata, setQuotaPagata] = useState(false);

  // LIVELLO 3: DIREZIONE GARA & VISUALIZZAZIONE
  const [partitaDaArbitrare, setPartitaDaArbitrare] = useState<any>(null);
  const [vistaCompatta, setVistaCompatta] = useState(false);

  // STATO PER MODAL CONDIVISIONE E MODIFICA
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  // URL generato dinamicamente per l'app dei soci
  const urlSoci = typeof window !== "undefined" ? `${window.location.origin}/club/${salaId}` : "";

  // ==========================================
  // FETCH INIZIALE CON PROIEZIONE AUTOMATICA
  // ==========================================
  async function fetchTornei(isInitial = false) {
    if (!salaId) return;
    const { data, error } = await supabase
      .from('tornei')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTorneiList(data);
      
      if (isInitial) {
        const torneoAttivo = data.find(t => t.stato === 'in_corso');
        if (torneoAttivo) {
          setTorneoSelezionato(torneoAttivo);
        }
      }
    }
  }

  useEffect(() => {
    fetchTornei(true);
  }, [salaId]);

  async function fetchIscrittiEPartite(torneo: any) {
    const resIscritti = await supabase.from('iscritti_torneo').select('*').eq('torneo_id', torneo.id).order('created_at', { ascending: true });
    if (resIscritti.data) setIscritti(resIscritti.data);

    if (torneo.stato === 'in_corso' || torneo.stato === 'concluso') {
      const resPartite = await supabase.from('partite_torneo').select('*').eq('torneo_id', torneo.id).order('partita_num', { ascending: true });
      if (resPartite.data) setPartite(resPartite.data);
    }
  }

  useEffect(() => {
    if (torneoSelezionato) fetchIscrittiEPartite(torneoSelezionato);
  }, [torneoSelezionato]);

  // ==========================================
  // AZIONI REAZIONALI BANDO
  // ==========================================
  const handleCreaTorneo = async (e: any) => {
    e.preventDefault();
    if (!nomeTorneo || !quota) return;
    setLoading(true);
    
    const payload = {
      sala_id: salaId, 
      nome: nomeTorneo, 
      disciplina, 
      max_iscritti: parseInt(iscrittiMax), 
      quota: parseFloat(quota), 
      formula, 
      stato: 'iscrizioni',
      data_inizio: dataInizio || null,
      data_fine: dataFine || null,
      scadenza_iscrizioni: scadenzaIscrizioni || null,
      note: note
    };

    const { error } = await supabase.from('tornei').insert([payload]);
    
    setLoading(false);
    if (error) alert(`DIAGNOSTICA: ${error.message}`);
    else { 
      setNomeTorneo(""); setQuota(""); setDataInizio(""); setDataFine(""); setScadenzaIscrizioni(""); setNote("");
      fetchTornei(false); 
    }
  };

  const apriModifica = () => {
    setEditForm({
      nome: torneoSelezionato.nome || "",
      disciplina: torneoSelezionato.disciplina || "5 Birilli",
      max_iscritti: torneoSelezionato.max_iscritti || 32,
      quota: torneoSelezionato.quota || 0,
      formula: torneoSelezionato.formula || "Eliminazione Diretta",
      data_inizio: torneoSelezionato.data_inizio || "",
      data_fine: torneoSelezionato.data_fine || "",
      scadenza_iscrizioni: torneoSelezionato.scadenza_iscrizioni || "",
      note: torneoSelezionato.note || ""
    });
    setShowEditModal(true);
  };

  const handleSalvaModifiche = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      nome: editForm.nome,
      disciplina: editForm.disciplina,
      max_iscritti: parseInt(editForm.max_iscritti),
      quota: parseFloat(editForm.quota),
      formula: editForm.formula,
      data_inizio: editForm.data_inizio || null,
      data_fine: editForm.data_fine || null,
      scadenza_iscrizioni: editForm.scadenza_iscrizioni || null,
      note: editForm.note
    };

    const { error } = await supabase.from('tornei').update(payload).eq('id', torneoSelezionato.id);

    setLoading(false);
    if (error) {
      alert(`DIAGNOSTICA: ${error.message}`);
    } else {
      const torneoAggiornato = { ...torneoSelezionato, ...payload };
      setTorneoSelezionato(torneoAggiornato);
      fetchTornei(false); 
      setShowEditModal(false);
    }
  };

  // ==========================================
  // GESTIONE ISCRITTI ED EVENTI
  // ==========================================
  const handleIscriviGiocatore = async (e: any) => {
    e.preventDefault();
    if (iscritti.length >= torneoSelezionato.max_iscritti) {
      alert("🚨 Attenzione: Raggiunto il limite massimo di iscritti per questo torneo!");
      return;
    }
    
    if (!nomeGiocatore) return;
    const { error } = await supabase.from('iscritti_torneo').insert([{ torneo_id: torneoSelezionato.id, nominativo: nomeGiocatore, pagato: quotaPagata }]);
    if (error) alert(`DIAGNOSTICA: ${error.message}`);
    else { setNomeGiocatore(""); setQuotaPagata(false); fetchIscrittiEPartite(torneoSelezionato); }
  };

  const togglePagamento = async (iscritto: any) => {
    await supabase.from('iscritti_torneo').update({ pagato: !iscritto.pagato }).eq('id', iscritto.id);
    fetchIscrittiEPartite(torneoSelezionato);
  };

  const eliminaIscritto = async (id: string) => {
    if(!window.confirm("Rimuovere il giocatore?")) return;
    await supabase.from('iscritti_torneo').delete().eq('id', id);
    fetchIscrittiEPartite(torneoSelezionato);
  };

  const handleGeneraTabellone = async () => {
    if (iscritti.length < 2) return alert("Servono almeno 2 iscritti.");
    if (!window.confirm("Attenzione: stai per chiudere le iscrizioni e generare l'intero organigramma. Procedere?")) return;

    setLoading(true);
    let giocatori = [...iscritti];

    const potenze = [2, 4, 8, 16, 32, 64, 128];
    const targetSize = potenze.find(p => p >= giocatori.length) || 32;

    const byesNeeded = targetSize - giocatori.length;
    for (let i = 0; i < byesNeeded; i++) {
      giocatori.push({ id: null, nominativo: "BYE (Passaggio Turno)" });
    }

    giocatori.sort(() => Math.random() - 0.5);

    const nuovePartite = [];
    let turnoCorrente = 1;
    let partiteInQuestoTurno = targetSize / 2;

    for (let i = 0; i < targetSize; i += 2) {
      nuovePartite.push({
        torneo_id: torneoSelezionato.id,
        turno: turnoCorrente,
        partita_num: (i / 2) + 1,
        giocatore1_id: giocatori[i].id,
        giocatore2_id: giocatori[i+1].id,
        giocatore1_nome: giocatori[i].nominativo,
        giocatore2_nome: giocatori[i+1].nominativo,
        stato: 'da_giocare'
      });
    }

    turnoCorrente++;
    partiteInQuestoTurno /= 2;

    while (partiteInQuestoTurno >= 1) {
      for (let i = 0; i < partiteInQuestoTurno; i++) {
        nuovePartite.push({
          torneo_id: torneoSelezionato.id,
          turno: turnoCorrente,
          partita_num: i + 1,
          giocatore1_nome: 'In Attesa',
          giocatore2_nome: 'In Attesa',
          stato: 'da_giocare'
        });
      }
      turnoCorrente++;
      partiteInQuestoTurno /= 2;
    }

    const { error: partiteError } = await supabase.from('partite_torneo').insert(nuovePartite);
    if (partiteError) {
      alert(`ERRORE: ${partiteError.message}`);
      setLoading(false);
      return;
    }

    await supabase.from('tornei').update({ stato: 'in_corso' }).eq('id', torneoSelezionato.id);

    const torneoAggiornato = { ...torneoSelezionato, stato: 'in_corso' };
    setTorneoSelezionato(torneoAggiornato);
    fetchTornei(false);
    fetchIscrittiEPartite(torneoAggiornato);
    setLoading(false);
  };

  const dichiaraVincitore = async (vincitoreId: string | null, vincitoreNome: string) => {
    if (!partitaDaArbitrare) return;
    setLoading(true);

    await supabase
      .from('partite_torneo')
      .update({ stato: 'conclusa' })
      .eq('id', partitaDaArbitrare.id);

    const nextTurno = partitaDaArbitrare.turno + 1;
    const nextPartitaNum = Math.ceil(partitaDaArbitrare.partita_num / 2);
    const isGiocatore1Slot = partitaDaArbitrare.partita_num % 2 !== 0;

    const nextMatch = partite.find(p => p.turno === nextTurno && p.partita_num === nextPartitaNum);

    if (nextMatch) {
      const updatePayload = isGiocatore1Slot
        ? { giocatore1_id: vincitoreId, giocatore1_nome: vincitoreNome }
        : { giocatore2_id: vincitoreId, giocatore2_nome: vincitoreNome };

      await supabase.from('partite_torneo').update(updatePayload).eq('id', nextMatch.id);
    } else {
      await supabase.from('tornei').update({ stato: 'concluso' }).eq('id', torneoSelezionato.id);
      setTorneoSelezionato({ ...torneoSelezionato, stato: 'concluso' });
      fetchTornei(false);
    }

    setPartitaDaArbitrare(null);
    fetchIscrittiEPartite(torneoSelezionato);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(urlSoci);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReturn = () => {
    if (torneoSelezionato) { 
      setTorneoSelezionato(null); 
      fetchTornei(false); 
    } else if (typeof setActiveView === 'function') {
      setActiveView("hub");
    }
  };

  const getNomeTurno = (numPartite: number) => {
    if (numPartite === 1) return "Finale";
    if (numPartite === 2) return "Semifinali";
    if (numPartite === 4) return "Quarti di Finale";
    if (numPartite === 8) return "Ottavi di Finale";
    if (numPartite === 16) return "Sedicesimi";
    return `Turno Preliminare`;
  };

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center print:bg-white print:py-0 print:px-0">
      
      {/* SEZIONE COMPONENTI DI STAMPA */}
      <style dangerouslySetInnerHTML={{__html: `
      @media print {
        @page { size: A4 landscape; margin: 8mm; }
        body { background-color: #ffffff !important; color: #000000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-area { transform: scale(0.85); transform-origin: top left; width: 115% !important; }
      }
      `}} />

      {/* MODALE MODIFICA BANDO */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-[#0B0D14] border border-[#2A2E39] p-8 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-[#FFCC00] font-black uppercase tracking-widest text-lg mb-6 border-b border-[#2A2E39] pb-4">⚙️ Modifica Bando</h3>
            <form onSubmit={handleSalvaModifiche} className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Nome Torneo</label>
                <input className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors" value={editForm.nome} onChange={(e) => setEditForm({...editForm, nome: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Disciplina</label>
                  <select className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors appearance-none" value={editForm.disciplina} onChange={(e) => setEditForm({...editForm, disciplina: e.target.value})}>
                    <option>5 Birilli</option><option>Goriziana</option><option>Boccette</option><option>Pool (Palla 8)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Max Iscritti</label>
                  <select className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors appearance-none" value={editForm.max_iscritti} onChange={(e) => setEditForm({...editForm, max_iscritti: e.target.value})}>
                    <option>8</option><option>16</option><option>32</option><option>64</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Quota Iscrizione (€)</label>
                <input type="number" className="w-full bg-[#1A1D24] text-[#E91E63] font-black text-xl p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors" value={editForm.quota} onChange={(e) => setEditForm({...editForm, quota: e.target.value})} required />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Formula di Gara</label>
                <select className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors appearance-none" value={editForm.formula} onChange={(e) => setEditForm({...editForm, formula: e.target.value})}>
                  <option>Eliminazione Diretta</option><option>Doppia Eliminazione (In Sviluppo)</option><option>Gironi (In Sviluppo)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Data Inizio</label>
                  <input type="date" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors" value={editForm.data_inizio} onChange={(e) => setEditForm({...editForm, data_inizio: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Data Fine</label>
                  <input type="date" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors" value={editForm.data_fine} onChange={(e) => setEditForm({...editForm, data_fine: e.target.value})} />
                </div>
              </div>
              
              <div className="mt-2">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Scadenza Iscrizioni</label>
                <input type="date" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors" value={editForm.scadenza_iscrizioni} onChange={(e) => setEditForm({...editForm, scadenza_iscrizioni: e.target.value})} />
              </div>
              
              <div className="mt-2 mb-6">
                <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Note / Istruzioni</label>
                <textarea className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#FFCC00] transition-colors resize-none h-24" value={editForm.note} onChange={(e) => setEditForm({...editForm, note: e.target.value})}></textarea>
              </div>

              <div className="flex gap-4 pt-4 border-t border-[#2A2E39]">
                <button type="button" onClick={() => setShowEditModal(false)} className="w-1/3 bg-[#1A1D24] hover:bg-[#2A2E39] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors">
                  Annulla
                </button>
                <button type="submit" disabled={loading} className="w-2/3 bg-[#FFCC00] hover:bg-[#E6B800] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95">
                  {loading ? "Salvataggio..." : "Salva Modifiche"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DI CONDIVISIONE LINK & QR CODE */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-[#0B0D14] border border-[#2A2E39] p-8 rounded-[2rem] w-full max-w-sm text-center shadow-2xl">
            <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">App Pubblica Soci</h3>
            <p className="text-gray-400 text-xs mb-6 font-bold">Fai inquadrare questo codice o condividi il link per mostrare i tabelloni live.</p>
            <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-inner">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(urlSoci)}`} alt="QR Code Club" className="w-40 h-40" />
            </div>
            <div className="space-y-3">
              <input type="text" readOnly value={urlSoci} className="w-full bg-black text-xs text-gray-400 p-3 rounded-lg border border-[#2A2E39] text-center select-all focus:outline-none" />
              <button onClick={copyToClipboard} className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors ${copied ? 'bg-[#00E676] text-black' : 'bg-[#00ADC6] hover:bg-[#008A9E] text-white'}`}>
                {copied ? "✓ Copiato negli Appunti" : "Copia Link Rapido"}
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className="mt-6 text-gray-500 hover:text-white uppercase text-[10px] font-black tracking-widest block mx-auto">Chiudi Finestra</button>
          </div>
        </div>
      )}

      {/* MODALE ARBITRAGGIO */}
      {partitaDaArbitrare && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="bg-[#0B0D14] border border-[#2A2E39] p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-[#E91E63] font-black uppercase tracking-widest text-sm mb-6 text-center border-b border-gray-800 pb-4">Decretare il Vincitore</h3>
            <div className="space-y-4">
              <button onClick={() => dichiaraVincitore(partitaDaArbitrare.giocatore1_id, partitaDaArbitrare.giocatore1_nome)} className="w-full bg-[#1A1D24] hover:bg-[#2A2E39] border border-gray-700 hover:border-[#00E5FF] text-white font-bold p-5 rounded-xl transition-all">🏆 {partitaDaArbitrare.giocatore1_nome}</button>
              <div className="text-center text-gray-600 font-black text-xs uppercase">VS</div>
              <button onClick={() => dichiaraVincitore(partitaDaArbitrare.giocatore2_id, partitaDaArbitrare.giocatore2_nome)} className="w-full bg-[#1A1D24] hover:bg-[#2A2E39] border border-gray-700 hover:border-[#00E5FF] text-white font-bold p-5 rounded-xl transition-all">🏆 {partitaDaArbitrare.giocatore2_nome}</button>
            </div>
            <button onClick={() => setPartitaDaArbitrare(null)} className="w-full mt-8 text-gray-500 hover:text-white uppercase text-xs font-bold tracking-widest">Annulla</button>
          </div>
        </div>
      )}

      <div className="w-full max-w-[95%] bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col print:shadow-none print:border-none print:p-0 print:bg-white print:text-black">
        
        {/* INTERFACCIA DI INTESTAZIONE UNIFICATA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[#1E222B] pb-6 gap-6 shrink-0 print:border-b-2 print:border-gray-300 print:mb-4">
          <div>
            <p className="text-[10px] text-[#00E676] font-black uppercase tracking-widest mb-1 print:text-gray-500">
              {torneoSelezionato ? (torneoSelezionato.stato === 'concluso' ? '🏆 Torneo Concluso' : (torneoSelezionato.stato === 'iscrizioni' ? '🟢 Iscrizioni Aperte' : '🔴 Live: Organigramma Torneo')) : 'Direzione Gara'}
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight print:text-black">
              {torneoSelezionato ? torneoSelezionato.nome : 'Gestione Tornei'}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3 print:hidden">
            {torneoSelezionato && torneoSelezionato.stato === 'iscrizioni' && (
              <button onClick={apriModifica} className="bg-[#FFCC00]/10 hover:bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/30 px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all">
                ⚙️ Modifica Bando
              </button>
            )}
            
            <button onClick={() => setShowShareModal(true)} className="bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-all">
              🔗 Condividi Club
            </button>
            
            {torneoSelezionato && (torneoSelezionato.stato === 'in_corso' || torneoSelezionato.stato === 'concluso') && (
              <>
                <button onClick={() => setVistaCompatta(!vistaCompatta)} className="bg-[#1A1D24] hover:bg-[#2A2E39] text-white border border-gray-700 px-4 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors">
                  {vistaCompatta ? "🔎 Espandi Griglia" : "📱 Vista Compatta"}
                </button>
                <button onClick={() => window.print()} className="bg-[#E91E63] hover:bg-[#C2185B] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors">
                  🖨️ Stampa PDF
                </button>
              </>
            )}
            <button onClick={handleReturn} className="bg-[#1A1D24] hover:bg-[#2A2E39] text-white border border-gray-700 px-5 py-2.5 rounded-lg text-xs font-bold uppercase transition-colors">
              {torneoSelezionato ? "← Torna ai Tornei" : "← Torre di Controllo"}
            </button>
          </div>
        </div>

        {/* CONTENUTO IN CORSO (VISTA 3) */}
        {torneoSelezionato && (torneoSelezionato.stato === 'in_corso' || torneoSelezionato.stato === 'concluso') && (
          <div className="bg-[#0B0D14] border border-gray-800 rounded-2xl p-6 flex-1 overflow-x-auto custom-scrollbar print:border-none print:p-0 print:overflow-visible print:bg-white">
            <div className="print-area flex gap-12 min-w-max h-full min-h-[600px] items-stretch pb-4 print:min-h-0 print:pb-0">
              {[...new Set(partite.map(p => p.turno))].sort((a, b) => a - b).map(turnoNum => {
                const partiteTurno = partite.filter(p => p.turno === turnoNum);
                return (
                  <div key={turnoNum} className="flex flex-col shrink-0 print:w-[230px]" style={{ width: vistaCompatta ? '230px' : '320px', transition: 'all 0.3s' }}>
                    <h3 className={`text-center font-black uppercase tracking-widest text-[#00E5FF] bg-[#1A1D24] py-3 rounded-lg border border-[#2A2E39] print:bg-gray-100 print:text-black print:border-gray-300 print:mb-4 ${vistaCompatta ? 'text-[11px] mb-4' : 'text-sm mb-8'}`}>
                      {getNomeTurno(partiteTurno.length)}
                    </h3>
                    <div className="flex-1 flex flex-col justify-around gap-4 relative">
                      {partiteTurno.map((p) => (
                        <div key={p.id} className={`bg-[#1A1D24] border ${p.stato === 'conclusa' ? 'border-[#00E676]/50' : 'border-[#2A2E39]'} rounded-xl ${vistaCompatta ? 'p-2.5 shadow-md' : 'p-4 shadow-lg'} relative z-10 group print:border-gray-400 print:bg-white print:shadow-none print:break-inside-avoid`}>
                          <div className={`absolute top-0 left-0 w-1 h-full rounded-l-xl print:hidden ${p.stato === 'conclusa' ? 'bg-[#00E676]' : (p.turno === 1 ? 'bg-[#E91E63]' : 'bg-[#00ADC6]')}`}></div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest print:text-black">Incontro #{p.partita_num}</span>
                            {p.stato === 'conclusa' && <span className="text-[9px] text-[#00E676] font-black uppercase tracking-widest print:text-gray-500">✓</span>}
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center bg-[#0B0D14] p-2 rounded-lg border border-[#2A2E39] print:bg-white print:border-gray-300">
                              <span className={`font-bold truncate print:text-black ${vistaCompatta ? 'text-[11px]' : 'text-xs'} ${p.giocatore1_nome?.includes('BYE') || p.giocatore1_nome === 'In Attesa' ? 'text-gray-600 print:text-gray-400' : 'text-white'}`}>{p.giocatore1_nome}</span>
                            </div>
                            <div className="flex justify-between items-center bg-[#0B0D14] p-2 rounded-lg border border-[#2A2E39] print:bg-white print:border-gray-300">
                              <span className={`font-bold truncate print:text-black ${vistaCompatta ? 'text-[11px]' : 'text-xs'} ${p.giocatore2_nome?.includes('BYE') || p.giocatore2_nome === 'In Attesa' ? 'text-gray-600 print:text-gray-400' : 'text-white'}`}>{p.giocatore2_nome}</span>
                            </div>
                          </div>
                          {p.stato !== 'conclusa' && p.giocatore1_nome !== 'In Attesa' && p.giocatore2_nome !== 'In Attesa' && (
                            <button onClick={() => setPartitaDaArbitrare(p)} className={`w-full border border-gray-700 hover:border-[#00E5FF] hover:text-[#00E5FF] text-gray-500 font-bold uppercase tracking-widest rounded-md transition-colors print:hidden ${vistaCompatta ? 'text-[8px] py-1 mt-2' : 'text-[9px] py-1.5 mt-3'}`}>Arbitra</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ISCRIZIONI APERTE (VISTA 2) */}
        {torneoSelezionato && torneoSelezionato.stato === 'iscrizioni' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="col-span-1 md:col-span-8 bg-transparent border border-gray-700 rounded-2xl p-6 flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Elenco Giocatori</h3>
                <span className="bg-[#1A1D24] px-3 py-1 rounded-md text-[10px] text-white font-black tracking-widest">ISCRITTI: {iscritti.length} / {torneoSelezionato.max_iscritti}</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {iscritti.length === 0 ? <div className="h-full flex items-center justify-center opacity-50"><p className="font-black text-sm uppercase tracking-widest">Nessun giocatore iscritto</p></div> 
                : iscritti.map((iscritto, i) => (
                  <div key={iscritto.id} className="bg-[#1A1D24] border border-[#2A2E39] p-4 rounded-xl flex justify-between items-center group">
                    <div className="flex items-center gap-4"><span className="text-gray-600 font-black w-6 text-right">{i + 1}.</span><h4 className="text-white font-bold text-sm uppercase">{iscritto.nominativo}</h4></div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => togglePagamento(iscritto)} className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border ${iscritto.pagato ? 'bg-[#00E676]/20 text-[#00E676] border-[#00E676]/30' : 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'}`}>{iscritto.pagato ? '✓ PAGATO' : 'DA PAGARE'}</button>
                      <button onClick={() => eliminaIscritto(iscritto.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="col-span-1 md:col-span-4 bg-transparent border border-gray-700 rounded-2xl p-6 h-fit sticky top-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-[#E91E63] border-b border-gray-800 pb-4">Nuovo Iscritto</h3>
              <form onSubmit={handleIscriviGiocatore} className="space-y-5">
                <input className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63]" placeholder="Es. Mario Rossi" value={nomeGiocatore} onChange={(e) => setNomeGiocatore(e.target.value)} disabled={iscritti.length >= torneoSelezionato.max_iscritti} />
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#1A1D24] border border-[#2A2E39] rounded-lg">
                  <input type="checkbox" className="w-5 h-5 accent-[#E91E63]" checked={quotaPagata} onChange={(e) => setQuotaPagata(e.target.checked)} disabled={iscritti.length >= torneoSelezionato.max_iscritti}/>
                  <span className="text-sm font-bold text-white">Quota Versata (€ {torneoSelezionato.quota})</span>
                </label>
                <button type="submit" disabled={!nomeGiocatore && iscritti.length < torneoSelezionato.max_iscritti} className={`w-full py-4 rounded-xl font-black uppercase text-sm mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${iscritti.length >= torneoSelezionato.max_iscritti ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-[#E91E63] text-white hover:bg-[#C2185B]'}`}>
                  {iscritti.length >= torneoSelezionato.max_iscritti ? "Torneo Completo" : "Iscrivi"}
                </button>
              </form>
              <div className="mt-8 pt-6 border-t border-gray-800">
                <button onClick={handleGeneraTabellone} disabled={iscritti.length < 2 || loading} className="w-full bg-[#00ADC6] hover:bg-[#008A9E] disabled:bg-gray-800 text-white py-4 rounded-xl font-black uppercase text-xs shadow-[0_5px_15px_rgba(0,173,198,0.2)]">
                  {loading ? 'Elaborazione...' : 'Genera Tabellone 🏁'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCHERMATA DEFAULT ARCHIVIO (VISTA 1) */}
        {!torneoSelezionato && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="col-span-1 md:col-span-8 flex flex-col gap-6">
              <div className="bg-transparent border border-gray-700 rounded-2xl p-6 flex-1 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#E91E63] animate-pulse"></span> Archivio Competizioni</h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3">
                  {torneiList.map((torneo) => (
                    <div key={torneo.id} onClick={() => setTorneoSelezionato(torneo)} className="bg-[#1A1D24] border border-[#2A2E39] p-5 rounded-xl flex justify-between items-center hover:border-[#E91E63] hover:shadow-[0_0_15px_rgba(233,30,99,0.2)] transition-all cursor-pointer group">
                      <div>
                        <h4 className="text-white font-black text-lg uppercase tracking-tight group-hover:text-[#E91E63] transition-colors">{torneo.nome}</h4>
                        <div className="flex gap-3 mt-2">
                          <span className="text-[10px] text-[#00E5FF] font-black uppercase bg-[#00E5FF]/10 px-2 py-0.5 rounded-sm">{torneo.disciplina}</span>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm ${torneo.stato === 'in_corso' ? 'bg-[#00E676]/10 text-[#00E676]' : (torneo.stato === 'concluso' ? 'bg-gray-600/20 text-gray-400' : 'bg-[#FFCC00]/10 text-[#FFCC00]')}`}>
                            {torneo.stato === 'in_corso' ? 'In Corso' : (torneo.stato === 'concluso' ? 'Concluso' : 'Iscrizioni Aperte')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="col-span-1 md:col-span-4 bg-transparent border border-gray-700 rounded-2xl p-6 h-fit sticky top-6">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-[#E91E63] border-b border-gray-800 pb-4">Nuovo Bando</h3>
              <form onSubmit={handleCreaTorneo} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Nome Torneo</label>
                  <input className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors" placeholder="Es. 1° Trofeo Cittadino" value={nomeTorneo} onChange={(e) => setNomeTorneo(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Disciplina</label>
                    <select className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors appearance-none" value={disciplina} onChange={(e) => setDisciplina(e.target.value)}>
                      <option>5 Birilli</option><option>Goriziana</option><option>Boccette</option><option>Pool (Palla 8)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Max Iscritti</label>
                    <select className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors appearance-none" value={iscrittiMax} onChange={(e) => setIscrittiMax(e.target.value)}>
                      <option>8</option><option>16</option><option>32</option><option>64</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Quota Iscrizione (€)</label>
                  <input type="number" className="w-full bg-[#1A1D24] text-[#E91E63] font-black text-xl p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors" placeholder="0.00" value={quota} onChange={(e) => setQuota(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Formula di Gara</label>
                  <select className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors appearance-none" value={formula} onChange={(e) => setFormula(e.target.value)}>
                    <option>Eliminazione Diretta</option><option>Doppia Eliminazione (In Sviluppo)</option><option>Gironi (In Sviluppo)</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Data Inizio</label>
                    <input type="date" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors" value={dataInizio} onChange={(e) => setDataInizio(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Data Fine</label>
                    <input type="date" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors" value={dataFine} onChange={(e) => setDataFine(e.target.value)} />
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Scadenza Iscrizioni</label>
                  <input type="date" className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors" value={scadenzaIscrizioni} onChange={(e) => setScadenzaIscrizioni(e.target.value)} />
                </div>
                
                <div className="mt-2 mb-6">
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Note / Istruzioni</label>
                  <textarea className="w-full bg-[#1A1D24] text-white font-bold p-3.5 rounded-lg border border-[#2A2E39] focus:outline-none focus:border-[#E91E63] transition-colors resize-none h-24" placeholder="Es. Iscrizioni aperte tramite AppWeb o al bancone..." value={note} onChange={(e) => setNote(e.target.value)}></textarea>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-[#E91E63] hover:bg-[#C2185B] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 mt-4">
                  {loading ? "Generazione..." : "Genera Bando"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}