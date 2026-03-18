"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; 
import { useParams, useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardSala() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"hub" | "plancia" | "magazzino" | "report" | "soci" | "impostazioni" | "statistiche" | "staff" | "tornei" | "prenotazioni">("hub");
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentSalaId, setCurrentSalaId] = useState<string | null>(null);
  const [nomeSala, setNomeSala] = useState<string>("La Mia Sala");
  
  const [tariffaStandard, setTariffaStandard] = useState(10.00);
  const [tariffaSoci, setTariffaSoci] = useState(8.00);

  const [tavoli, setTavoli] = useState<any[]>([]);
  const [recenti, setRecenti] = useState<any[]>([]);
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [soci, setSoci] = useState<any[]>([]);
  const [listaStaff, setListaStaff] = useState<any[]>([]);
  const [tornei, setTornei] = useState<any[]>([]); 
  
  const [incassoTotale, setIncassoTotale] = useState(0);
  const [incassoContanti, setIncassoContanti] = useState(0);
  const [incassoPOS, setIncassoPOS] = useState(0);

  // Stati Modali
  const [activeTableId, setActiveTableId] = useState<string | null>(null); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isNewTorneoModalOpen, setIsNewTorneoModalOpen] = useState(false); 
  const [isManageIscrittiOpen, setIsManageIscrittiOpen] = useState(false); 
  const [isBracketModalOpen, setIsBracketModalOpen] = useState(false); 
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  const [pinBuffer, setPinBuffer] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

  // NUOVO STATO: OPERATORE LOGGATO
  const [activeStaff, setActiveStaff] = useState<any>(null);

  // Input
  const [reserveName, setReserveName] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newSocioNome, setNewSocioNome] = useState("");
  const [newSocioCognome, setNewSocioCognome] = useState("");
  const [newStaffNome, setNewStaffNome] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  const [rechargeAmount, setRechargeAmount] = useState("");
  
  // Input Tornei
  const [newTorneoNome, setNewTorneoNome] = useState("");
  const [newTorneoData, setNewTorneoData] = useState("");
  const [newTorneoQuota, setNewTorneoQuota] = useState("");
  const [activeTorneo, setActiveTorneo] = useState<any>(null); 
  const [iscrittoSelezionato, setIscrittoSelezionato] = useState(""); 
  const [iscrittoEsterno, setIscrittoEsterno] = useState("");

  const [socioToRecharge, setSocioToRecharge] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedSocioId, setSelectedSocioId] = useState(""); 
  const [selectedProdottoId, setSelectedProdottoId] = useState("");
  const [players, setPlayers] = useState(["", "", "", ""]);
  
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserEmail(session.user.email ?? null);
          const { data: salaData } = await supabase.from("sale").select("*").eq("manager_email", session.user.email).single();
          if (salaData) {
            setCurrentSalaId(salaData.id);
            setNomeSala(salaData.name);
            setTariffaStandard(salaData.tariffa_standard || 10.00);
            setTariffaSoci(salaData.tariffa_soci || 8.00);
            await refreshDati(salaData.id);
          }
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    init();
  }, []);

  async function refreshDati(salaId: string) {
    try {
        const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
        const { data: tDB } = await supabase.from('tavoli').select('*').eq('sala_id', salaId).order('numero', { ascending: true });
        const { data: sDB } = await supabase.from('sessioni').select('*, consumazioni(*), staff(nome)').eq('sala_id', salaId).eq('stato', 'in_corso');
        const { data: pDB } = await supabase.from('prodotti').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
        const { data: rDB } = await supabase.from('sessioni').select('*, staff(nome)').eq('sala_id', salaId).eq('stato', 'terminata').gte('fine', oggi.toISOString()).order('fine', { ascending: false });
        const { data: sociDB } = await supabase.from('soci').select('*').eq('sala_id', salaId).order('cognome', { ascending: true });
        const { data: staffDB } = await supabase.from('staff').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
        const { data: torneiDB } = await supabase.from('tornei').select('*').eq('sala_id', salaId).order('data_inizio', { ascending: false }); 

        if (pDB) setProdotti(pDB);
        if (sociDB) setSoci(sociDB);
        if (staffDB) setListaStaff(staffDB);
        if (torneiDB) {
          setTornei(torneiDB);
          if(activeTorneo) {
            const up = torneiDB.find(tx => tx.id === activeTorneo.id);
            if(up) setActiveTorneo(up);
          }
        }

        if (rDB) {
          setRecenti(rDB);
          let tot = 0, contanti = 0, pos = 0;
          rDB.forEach(r => {
            const importo = parseFloat(r.costo_totale || 0);
            if (r.metodo_pagamento === 'credito') return; 
            tot += importo;
            if (r.metodo_pagamento === 'pos') pos += importo;
            else contanti += importo; 
          });
          setIncassoTotale(tot); setIncassoContanti(contanti); setIncassoPOS(pos);
        }
        if (tDB) {
          setTavoli(tDB.map(t => {
            const sess = sDB?.find(s => s.tavolo_id === t.id);
            const consumazioniDettaglio = sess?.consumazioni?.map(c => {
               const p = pDB?.find(prod => prod.id === c.prodotto_id);
               return { ...c, nome_prodotto: p?.nome || "Prodotto" };
            }) || [];
            const bTot = consumazioniDettaglio.reduce((acc: number, c: any) => acc + (c.prezzo_istante * c.quantita), 0);
            return {
              id: t.id, numero: t.numero, nome: `Tavolo ${t.numero}`, 
              prezzo: sess ? sess.tariffa_oraria : tariffaStandard, 
              stato: t.stato === 'occupato' ? "IN GIOCO" : (t.stato === 'prenotato' ? "PRENOTATO" : "LIBERO"), 
              startTime: sess ? new Date(sess.inizio).getTime() : null,
              giocatori: sess?.giocatori || [], barTotal: bTot, sessioneId: sess?.id, socio_id: sess?.socio_id,
              consumazioni: consumazioniDettaglio, prenotato_da: t.prenotato_da, prenotato_alle: t.prenotato_alle,
              staff_nome: sess?.staff?.nome
            };
          }));
        }
    } catch (e) { console.error(e); }
  }

  const handlePinDigit = (digit: string) => {
    if (pinBuffer.length < 4) {
      const newBuffer = pinBuffer + digit;
      setPinBuffer(newBuffer);
      if (newBuffer.length === 4) {
        const staff = listaStaff.find(s => s.pin === newBuffer);
        if (staff) {
          const action = pendingAction;
          setActiveStaff(staff); // SALVIAMO L'OPERATORE IN SESSIONE!
          setPinBuffer(""); setIsPinModalOpen(false); setPendingAction(null);
          if (action) action.callback(staff.id);
        } else {
          alert("❌ PIN Errato!"); setPinBuffer("");
        }
      }
    }
  };

  const richiedePin = (callback: (staffId: string) => void, descrizione: string) => {
    if (listaStaff.length === 0) { alert("⚠️ Crea Staff."); setActiveView("staff"); return; }
    
    // SE L'OPERATORE E' GIA LOGGATO, SALTA IL PIN E ESEGUE SUBITO L'AZIONE
    if (activeStaff) {
      callback(activeStaff.id);
      return;
    }
    
    // ALTRIMENTI CHIEDE IL PIN
    setPendingAction({ callback, descrizione }); setIsPinModalOpen(true);
  };

  // --- FUNZIONI PRENOTAZIONI E TORNEI ---
  const prenotaTavolo = async (staffId: string) => {
    if (!activeTableId || !reserveName || !reserveTime) return;
    await supabase.from('tavoli').update({ 
        stato: 'prenotato', 
        prenotato_da: reserveName, 
        prenotato_alle: reserveTime 
    }).eq('id', activeTableId);
    alert("✅ Prenotazione registrata!");
    await refreshDati(currentSalaId!); setIsReserveModalOpen(false); setReserveName(""); setReserveTime("");
  };

  const annullaPrenotazione = async (tavoloId: string, staffId: string) => {
    await supabase.from('tavoli').update({ stato: 'libero', prenotato_da: null, prenotato_alle: null }).eq('id', tavoloId);
    await refreshDati(currentSalaId!);
  };

  const salvaNuovoTorneo = async (staffId: string) => {
    if(!newTorneoNome || !newTorneoData) { alert("Inserisci Nome e Data!"); return; }
    await supabase.from('tornei').insert([{ 
      sala_id: currentSalaId, 
      nome: newTorneoNome, 
      data_inizio: newTorneoData, 
      quota_iscrizione: parseFloat(newTorneoQuota) || 0,
      stato: 'iscrizioni',
      iscritti: [],
      tabellone: []
    }]);
    alert("✅ Torneo Creato!");
    await refreshDati(currentSalaId!); setIsNewTorneoModalOpen(false); setNewTorneoNome(""); setNewTorneoData(""); setNewTorneoQuota("");
  };

  const normalizeIscritti = (iscrittiArray: any[]) => {
    return (iscrittiArray || []).map(i => {
      if (typeof i === 'string') {
        const s = soci.find(x => x.id === i);
        return { id: i, tipo: 'socio', nome: s ? `${s.cognome} ${s.nome}` : 'Sconosciuto', confermato: true };
      }
      return i;
    });
  };

  const aggiungiIscritto = async (staffId: string, tipo: 'socio' | 'esterno') => {
    if (!activeTorneo) return;
    let currentIscritti = normalizeIscritti(activeTorneo.iscritti);

    if (tipo === 'socio') {
      if (!iscrittoSelezionato) return;
      if (currentIscritti.find(i => i.id === iscrittoSelezionato)) {
        alert("⚠️ Questo socio è già iscritto."); return;
      }
      const s = soci.find(x => x.id === iscrittoSelezionato);
      currentIscritti.push({ id: iscrittoSelezionato, tipo: 'socio', nome: `${s.cognome} ${s.nome}`, confermato: true });
      setIscrittoSelezionato("");
    } else {
      if (!iscrittoEsterno.trim()) return;
      currentIscritti.push({ id: 'ext_' + Date.now(), tipo: 'esterno', nome: iscrittoEsterno.trim(), confermato: true });
      setIscrittoEsterno("");
    }

    await supabase.from('tornei').update({ iscritti: currentIscritti }).eq('id', activeTorneo.id);
    await refreshDati(currentSalaId!);
  };

  const rimuoviIscritto = async (idIscritto: string, staffId: string) => {
    if (!activeTorneo) return;
    let currentIscritti = normalizeIscritti(activeTorneo.iscritti);
    currentIscritti = currentIscritti.filter(i => i.id !== idIscritto);
    await supabase.from('tornei').update({ iscritti: currentIscritti }).eq('id', activeTorneo.id);
    await refreshDati(currentSalaId!);
  };

  const confermaIscrizione = async (idIscritto: string, staffId: string) => {
    if (!activeTorneo) return;
    let currentIscritti = normalizeIscritti(activeTorneo.iscritti);
    currentIscritti = currentIscritti.map(i => i.id === idIscritto ? { ...i, confermato: true } : i);
    await supabase.from('tornei').update({ iscritti: currentIscritti }).eq('id', activeTorneo.id);
    await refreshDati(currentSalaId!);
  };

  const avviaTorneo = async (torneo: any, staffId: string) => {
    const iscritti = normalizeIscritti(torneo.iscritti);
    if (iscritti.length < 2) { alert("⚠️ Servono almeno 2 iscritti per avviare il torneo!"); return; }
    if (iscritti.some(i => !i.confermato)) { alert("⚠️ Ci sono iscritti in attesa di conferma. Conferma tutti o rimuovili prima di avviare."); return; }

    const shuffled = [...iscritti].sort(() => 0.5 - Math.random());
    
    let round1 = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      let p1 = shuffled[i];
      let p2 = shuffled[i+1] || null; 
      round1.push({ 
        id: 'match_' + Date.now() + i, 
        p1: p1, 
        p2: p2, 
        vincitore: p2 === null ? p1 : null 
      });
    }

    const tabellone = [round1];
    
    await supabase.from('tornei').update({ stato: 'in_corso', tabellone: tabellone }).eq('id', torneo.id);
    await refreshDati(currentSalaId!);
  };

  const impostaVincitore = async (roundIndex: number, matchId: string, vincitore: any, staffId: string) => {
    if (!activeTorneo || !activeTorneo.tabellone) return;
    let tab = [...activeTorneo.tabellone];
    let match = tab[roundIndex].find((m: any) => m.id === matchId);
    if (match) match.vincitore = vincitore;
    
    await supabase.from('tornei').update({ tabellone: tab }).eq('id', activeTorneo.id);
    await refreshDati(currentSalaId!);
  };

  const generaProssimoTurno = async (staffId: string) => {
    if (!activeTorneo || !activeTorneo.tabellone) return;
    let tab = [...activeTorneo.tabellone];
    const ultimoTurno = tab[tab.length - 1];
    
    if (ultimoTurno.some((m: any) => m.vincitore === null)) {
      alert("⚠️ Devi assegnare il vincitore a tutti i match prima di procedere!");
      return;
    }

    const vincitori = ultimoTurno.map((m: any) => m.vincitore);

    if (vincitori.length === 1) {
      await supabase.from('tornei').update({ stato: 'completato', tabellone: tab }).eq('id', activeTorneo.id);
      alert(`🎉 TORNEO CONCLUSO! IL CAMPIONE È ${vincitori[0].nome.toUpperCase()}! 🎉`);
      await refreshDati(currentSalaId!);
      setIsBracketModalOpen(false);
      return;
    }

    let nuovoTurno = [];
    for (let i = 0; i < vincitori.length; i += 2) {
      let p1 = vincitori[i];
      let p2 = vincitori[i+1] || null; 
      nuovoTurno.push({ 
        id: 'match_' + Date.now() + i, 
        p1: p1, 
        p2: p2, 
        vincitore: p2 === null ? p1 : null 
      });
    }

    tab.push(nuovoTurno);
    await supabase.from('tornei').update({ tabellone: tab }).eq('id', activeTorneo.id);
    await refreshDati(currentSalaId!);
  };

  const salvaNuovoStaff = async () => {
    const { error } = await supabase.from('staff').insert([{ sala_id: currentSalaId, nome: newStaffNome, pin: newStaffPin }]);
    if (!error) { alert("✅ Staff Salvato!"); await refreshDati(currentSalaId!); setIsNewStaffModalOpen(false); }
  };

  const salvaNuovoTavolo = async (staffId: string) => {
    await supabase.from('tavoli').insert([{ sala_id: currentSalaId, numero: parseInt(newTableNumber), stato: 'libero' }]);
    await refreshDati(currentSalaId!); setIsNewTableModalOpen(false);
  };

  const salvaNuovoProdotto = async (staffId: string) => {
    await supabase.from('prodotti').insert([{ sala_id: currentSalaId, nome: newProdName, prezzo_vendita: parseFloat(newProdPrice), quantita_stock: parseInt(newProdStock) || 0 }]);
    await refreshDati(currentSalaId!); setIsNewProductModalOpen(false);
  };

  const salvaNuovoSocio = async (staffId: string) => {
    await supabase.from('soci').insert([{ sala_id: currentSalaId, nome: newSocioNome, cognome: newSocioCognome, credito: 0 }]);
    await refreshDati(currentSalaId!); setIsNewSocioModalOpen(false);
  };

  const salvaRicarica = async (staffId: string) => {
    const nuovoCredito = parseFloat(socioToRecharge.credito || 0) + parseFloat(rechargeAmount);
    await supabase.from('soci').update({ credito: nuovoCredito }).eq('id', socioToRecharge.id);
    await refreshDati(currentSalaId!); setIsRechargeModalOpen(false);
  };

  const salvaTariffe = async (staffId: string) => {
    await supabase.from('sale').update({ tariffa_standard: tariffaStandard, tariffa_soci: tariffaSoci }).eq('id', currentSalaId!);
    alert("✅ Tariffe OK!"); setActiveView("hub");
  };

  const avviaSessione = async (staffId: string) => {
    const tariffa = selectedSocioId ? tariffaSoci : tariffaStandard;
    let giocatoriFinali = [...players];
    if (players[0] === "" && reserveName !== "") giocatoriFinali[0] = reserveName; 
    
    await supabase.from('sessioni').insert([{ tavolo_id: activeTableId, sala_id: currentSalaId, inizio: new Date().toISOString(), giocatori: giocatoriFinali.filter(p => p.trim() !== ""), tariffa_oraria: tariffa, stato: 'in_corso', socio_id: selectedSocioId || null, staff_id: staffId }]);
    await supabase.from('tavoli').update({ stato: 'occupato', prenotato_da: null, prenotato_alle: null }).eq('id', activeTableId);
    await refreshDati(currentSalaId!); setIsStartModalOpen(false); setReserveName("");
  };

  const confermaChiusura = async (metodo: any, staffId: string) => {
    if (metodo === 'credito') {
      const socio = soci.find(s => s.id === summaryData.socio_id);
      await supabase.from('soci').update({ credito: (socio.credito || 0) - summaryData.totale }).eq('id', socio.id);
    }
    await supabase.from('sessioni').update({ fine: new Date().toISOString(), stato: 'terminata', costo_totale: summaryData.totale.toFixed(2), metodo_pagamento: metodo, staff_id: staffId }).eq('id', summaryData.sessioneId);
    await supabase.from('tavoli').update({ stato: 'libero' }).eq('id', summaryData.tavoloId);
    await refreshDati(currentSalaId!); setIsSummaryModalOpen(false);
  };

  const aggiungiBar = async (staffId: string) => {
    const tavolo = tavoli.find(t => t.id === activeTableId);
    const prodotto = prodotti.find(p => p.id === selectedProdottoId);
    await supabase.from('consumazioni').insert([{ sessione_id: tavolo.sessioneId, prodotto_id: prodotto.id, quantita: 1, prezzo_istante: prodotto.prezzo_vendita, staff_id: staffId }]);
    await supabase.from('prodotti').update({ quantita_stock: prodotto.quantita_stock - 1 }).eq('id', prodotto.id);
    await refreshDati(currentSalaId!); setIsBarModalOpen(false);
  };

  const annullaTransazione = async (id: string, staffId: string) => {
    await supabase.from('sessioni').delete().eq('id', id);
    await refreshDati(currentSalaId!);
  };

  const formattaCronometro = (startTime: number | null) => {
    if (!startTime) return "00:00:00";
    const diff = Math.max(0, now - startTime);
    const ore = Math.floor(diff / 3600000);
    const minuti = Math.floor((diff % 3600000) / 60000);
    const secondi = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl tracking-widest italic animate-pulse">CARICAMENTO TORRE DI CONTROLLO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter overflow-x-hidden relative">
      
      {/* BADGE OPERATORE LOGGATO IN ALTO A DESTRA */}
      {activeStaff && (
        <div className="absolute top-6 right-6 z-40 bg-gray-900 border border-cyan-600 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-[0_0_15px_rgba(8,145,178,0.3)] animate-in slide-in-from-top">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Operatore Attivo</p>
            <p className="text-cyan-400 font-black text-lg uppercase italic leading-none">{activeStaff.nome}</p>
          </div>
          <button onClick={() => setActiveStaff(null)} className="bg-red-950 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors">
            CAMBIO TURNO
          </button>
        </div>
      )}

      {/* HUB */}
      {activeView === "hub" && (
        <div className="animate-in fade-in duration-500 text-center">
          <h1 className="text-5xl font-black text-green-500 uppercase italic mb-12 mt-8 tracking-tighter">{nomeSala}</h1>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <button onClick={() => setActiveView("plancia")} className="bg-gray-900 border-2 border-green-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">🎱</div><h2 className="text-xl font-black uppercase">Plancia</h2></button>
            <button onClick={() => setActiveView("magazzino")} className="bg-gray-900 border-2 border-blue-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">📦</div><h2 className="text-xl font-black uppercase">Magazzino</h2></button>
            <button onClick={() => setActiveView("soci")} className="bg-gray-900 border-2 border-yellow-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">👥</div><h2 className="text-xl font-black uppercase">Soci</h2></button>
            <button onClick={() => setActiveView("report")} className="bg-gray-900 border-2 border-purple-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">📊</div><h2 className="text-xl font-black uppercase">Cassa</h2></button>
            <button onClick={() => setActiveView("staff")} className="bg-gray-900 border-2 border-cyan-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">🧑‍🍳</div><h2 className="text-xl font-black uppercase">Staff</h2></button>
            <button onClick={() => setActiveView("impostazioni")} className="bg-gray-900 border-2 border-gray-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">⚙️</div><h2 className="text-xl font-black uppercase">Tariffe</h2></button>
            <button onClick={() => setActiveView("prenotazioni")} className="bg-gray-900 border-2 border-teal-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">📅</div><h2 className="text-xl font-black uppercase">Prenota</h2></button>
            <button onClick={() => setActiveView("tornei")} className="bg-gray-900 border-2 border-pink-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">🏆</div><h2 className="text-xl font-black uppercase">Tornei</h2></button>
            <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="col-span-2 md:col-span-4 bg-red-950/30 border-2 border-red-600 p-6 rounded-[2rem] text-red-500 font-black uppercase mt-4">Esci dal Sistema</button>
          </div>
        </div>
      )}

      {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 border-2 border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase italic flex items-center justify-center gap-4 transition-all">🔙 MENU PRINCIPALE</button>)}

      {/* PLANCIA COMPLETA */}
      {activeView === 'plancia' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <button onClick={() => setIsNewTableModalOpen(true)} className="w-full mb-8 py-8 bg-gray-900 border-4 border-dashed border-green-900 rounded-[2.5rem] text-green-500 font-black text-2xl uppercase italic">+ AGGIUNGI TAVOLO</button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tavoli.map((t) => (
              <div key={t.id} className={`p-8 rounded-[2.5rem] border-4 transition-colors shadow-2xl ${t.stato === 'IN GIOCO' ? 'border-red-600 bg-gray-900' : t.stato === 'PRENOTATO' ? 'border-yellow-500 bg-yellow-900/30' : 'border-green-900 bg-gray-950'}`}>
                <div className="flex justify-between items-center mb-8"><h3 className="text-4xl font-black italic">{t.nome}</h3><div className={`h-6 w-6 rounded-full ${t.stato === 'LIBERO' ? 'bg-green-500' : t.stato === 'PRENOTATO' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div></div>
                
                {t.stato === 'PRENOTATO' && (
                    <div className="mb-10 text-center bg-black/40 p-4 rounded-3xl border border-yellow-900/50">
                        <p className="text-yellow-500 font-black uppercase text-xs mb-1">Prenotato da:</p>
                        <h4 className="text-2xl font-black uppercase mb-2">{t.prenotato_da}</h4>
                        <p className="text-yellow-500 font-black text-xl font-mono">ORE {t.prenotato_alle}</p>
                    </div>
                )}

                {t.stato !== 'PRENOTATO' && (
                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Tempo</span><span className="font-mono text-4xl font-black">{formattaCronometro(t.startTime)}</span></div>
                    <div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Bar</span><span className="text-3xl font-black text-orange-400">€ {t.barTotal.toFixed(2)}</span></div>
                  </div>
                )}

                {t.stato === 'LIBERO' && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-700 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">AVVIA</button>
                    <button onClick={() => { setActiveTableId(t.id); setIsReserveModalOpen(true); }} className="flex-1 py-8 bg-yellow-600 rounded-3xl text-3xl shadow-xl active:scale-95">📅</button>
                  </div>
                )}

                {t.stato === 'PRENOTATO' && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setReserveName(t.prenotato_da); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">INIZIA PARTITA</button>
                    <button onClick={() => richiedePin((sid) => annullaPrenotazione(t.id, sid), "Annulla Prenotazione")} className="flex-1 py-8 bg-gray-800 text-red-500 rounded-3xl text-xl shadow-xl active:scale-95">❌</button>
                  </div>
                )}

                {t.stato === 'IN GIOCO' && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setIsBarModalOpen(true); }} className="flex-1 py-8 bg-orange-600 rounded-3xl text-4xl shadow-xl active:scale-95">🍺</button>
                    <button onClick={() => { 
                      const durata = (Date.now() - t.startTime!) / 3600000; 
                      const costB = durata * parseFloat(t.prezzo); 
                      setSummaryData({ tavoloId: t.id, sessioneId: t.sessioneId, nome: t.nome, tempo: formattaCronometro(t.startTime), costoBiliardo: costB, costoBar: t.barTotal, totale: costB + t.barTotal, giocatori: t.giocatori, socio_id: t.socio_id, consumazioni: t.consumazioni }); 
                      setIsSummaryModalOpen(true); 
                    }} className="flex-[2] py-8 bg-red-700 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">CHIUDI</button>
                  </div>
                )}
                
                {t.stato === 'LIBERO' && (
                   <button onClick={async () => { if(confirm("Eliminare tavolo?")) { await supabase.from('tavoli').delete().eq('id', t.id); refreshDati(currentSalaId!); } }} className="mt-4 w-full text-gray-700 text-[10px] font-bold uppercase hover:text-red-500">Rimuovi Postazione</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MAGAZZINO */}
      {activeView === 'magazzino' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <button onClick={() => setIsNewProductModalOpen(true)} className="w-full mb-8 py-8 bg-blue-600 rounded-[2.5rem] text-white font-black text-2xl uppercase shadow-xl">+ NUOVO PRODOTTO BAR</button>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {prodotti.map((p) => (
              <div key={p.id} className="bg-gray-900 p-6 rounded-[2rem] border-2 border-gray-800 shadow-xl">
                <h4 className="text-xl font-black uppercase mb-2 italic">{p.nome}</h4>
                <p className="text-blue-400 font-bold mb-4 text-lg">€ {p.prezzo_vendita.toFixed(2)}</p>
                <div className={`text-center py-3 rounded-xl font-black uppercase text-xs ${p.quantita_stock > 5 ? 'bg-green-900/20 text-green-500' : 'bg-red-950 text-red-500 animate-pulse'}`}>STOCK: {p.quantita_stock}</div>
                <button onClick={async () => { if(confirm("Eliminare prodotto?")) { await supabase.from('prodotti').delete().eq('id', p.id); refreshDati(currentSalaId!); } }} className="mt-4 w-full text-gray-700 text-[10px] font-bold uppercase">Rimuovi</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SOCI */}
      {activeView === 'soci' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <button onClick={() => setIsNewSocioModalOpen(true)} className="w-full mb-8 py-8 bg-yellow-600 text-black font-black text-2xl uppercase shadow-xl">+ NUOVO SOCIO</button>
          <div className="bg-gray-900 border-2 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left font-bold">
              <thead className="bg-gray-800 text-gray-400 uppercase text-xs"><tr><th className="p-6">Socio</th><th className="p-6">Credito Attuale</th><th className="p-6 text-right">Azione</th></tr></thead>
              <tbody className="divide-y divide-gray-800">
                {soci.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-800/30 transition-all">
                    <td className="p-6 text-xl uppercase italic">{s.cognome} {s.nome}</td>
                    <td className="p-6 text-2xl text-green-500 italic">€ {parseFloat(s.credito || 0).toFixed(2)}</td>
                    <td className="p-6 text-right">
                      <button onClick={() => { setSocioToRecharge(s); setIsRechargeModalOpen(true); }} className="bg-green-600 text-black px-8 py-4 rounded-2xl font-black uppercase shadow-lg active:scale-95">💰 RICARICA</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASSA */}
      {activeView === 'report' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-purple-600 shadow-2xl"><p className="text-purple-400 font-black uppercase text-xs mb-2">Totale Oggi</p><h3 className="text-6xl font-black italic">€ {incassoTotale.toFixed(2)}</h3></div>
            <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-green-600"><p className="text-green-500 font-black uppercase text-xs mb-2">In Contanti</p><h3 className="text-4xl font-black italic">€ {incassoContanti.toFixed(2)}</h3></div>
            <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-blue-600"><p className="text-blue-500 font-black uppercase text-xs mb-2">Tramite POS</p><h3 className="text-4xl font-black italic">€ {incassoPOS.toFixed(2)}</h3></div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden text-left shadow-2xl">
            <table className="w-full text-xs uppercase font-bold">
              <thead className="bg-gray-800 text-gray-500"><tr><th className="p-5">Ora</th><th className="p-5">Staff</th><th className="p-5">Metodo</th><th className="p-5 text-right">Importo</th><th className="p-5 text-center">Storno</th></tr></thead>
              <tbody className="divide-y divide-gray-800">
                {recenti.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/20 transition-all">
                    <td className="p-5 font-mono">{new Date(r.fine).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                    <td className="p-5 text-cyan-500 font-black italic">{r.staff?.nome || "ADMIN"}</td>
                    <td className="p-5">{r.metodo_pagamento}</td>
                    <td className="p-5 text-right font-black text-white text-lg italic">€ {parseFloat(r.costo_totale).toFixed(2)}</td>
                    <td className="p-5 text-center"><button onClick={() => richiedePin((sid) => annullaTransazione(r.id, sid), "Storno Operazione")} className="text-red-500 text-xl">❌</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAFF */}
      {activeView === 'staff' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <button onClick={() => setIsNewStaffModalOpen(true)} className="mb-8 w-full py-8 bg-cyan-600 rounded-[2rem] font-black text-2xl text-black uppercase shadow-xl">+ AGGIUNGI STAFF</button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listaStaff.map((s) => (
              <div key={s.id} className="bg-gray-900 p-8 rounded-[2.5rem] border-2 border-cyan-900 flex justify-between items-center shadow-2xl">
                <div><h4 className="text-2xl font-black uppercase text-white italic">{s.nome}</h4><p className="text-cyan-500 font-mono font-bold text-lg mt-1 tracking-[0.5em]">PIN: {s.pin}</p></div>
                <button onClick={async () => { if(confirm("Eliminare staff?")) { await supabase.from('staff').delete().eq('id', s.id); refreshDati(currentSalaId!); } }} className="bg-red-950 text-red-500 p-5 rounded-2xl shadow-lg">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TARIFFE */}
      {activeView === 'impostazioni' && (
        <div className="max-w-2xl mx-auto bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 animate-in slide-in-from-bottom-8 shadow-2xl">
          <h3 className="text-3xl font-black text-white uppercase italic mb-8 border-b border-gray-800 pb-4">Configurazione Tariffe</h3>
          <div className="space-y-8 mb-12">
            <div><label className="block text-gray-500 font-black text-xs uppercase mb-4">Standard (€/h)</label><input type="number" value={tariffaStandard} onChange={(e) => setTariffaStandard(parseFloat(e.target.value))} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl text-white font-black" /></div>
            <div><label className="block text-yellow-500 font-black text-xs uppercase mb-4">Soci (€/h)</label><input type="number" value={tariffaSoci} onChange={(e) => setTariffaSoci(parseFloat(e.target.value))} className="w-full bg-black border border-yellow-900 p-6 rounded-2xl text-4xl text-white font-black" /></div>
          </div>
          <button onClick={() => richiedePin((sid) => salvaTariffe(sid), "Aggiornamento Tariffe")} className="w-full py-8 bg-green-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95 transition-all">SALVA TARIFFE</button>
        </div>
      )}

      {/* PRENOTAZIONI */}
      {activeView === 'prenotazioni' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <h3 className="text-3xl font-black text-teal-500 uppercase italic mb-8 border-b border-gray-800 pb-4">Gestione Prenotazioni</h3>
          <div className="bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 shadow-2xl text-center">
            <p className="text-gray-500 font-bold uppercase">Modulo Prenotazioni in costruzione...</p>
          </div>
        </div>
      )}

      {/* TORNEI */}
      {activeView === 'tornei' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <button onClick={() => setIsNewTorneoModalOpen(true)} className="w-full mb-8 py-8 bg-pink-600 text-white font-black text-2xl uppercase shadow-xl">+ NUOVO TORNEO</button>
          
          {tornei.length === 0 ? (
            <div className="bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 shadow-2xl text-center">
              <p className="text-gray-500 font-bold uppercase">Nessun torneo programmato. Creane uno!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tornei.map((tr) => (
                <div key={tr.id} className="bg-gray-900 p-8 rounded-[2.5rem] border-2 border-pink-900 shadow-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-2xl font-black uppercase text-white italic mb-2">{tr.nome}</h4>
                    <p className="text-pink-400 font-mono font-bold text-lg mb-2">📅 Data: {new Date(tr.data_inizio).toLocaleDateString()}</p>
                    <p className="text-green-500 font-bold mb-4">💰 Quota: € {parseFloat(tr.quota_iscrizione).toFixed(2)}</p>
                    <div className={`text-center py-2 rounded-xl font-black uppercase text-xs mb-6 ${tr.stato === 'iscrizioni' ? 'bg-yellow-900/50 text-yellow-500' : tr.stato === 'in_corso' ? 'bg-blue-900/50 text-blue-500' : 'bg-gray-800 text-gray-500'}`}>
                      Stato: {tr.stato === 'iscrizioni' ? 'ISCRIZIONI APERTE' : tr.stato === 'in_corso' ? 'IN CORSO (TABELLONE)' : 'COMPLETATO'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    
                    {tr.stato === 'iscrizioni' && (
                      <>
                        <button onClick={() => { setActiveTorneo(tr); setIsManageIscrittiOpen(true); }} className="w-full py-4 bg-pink-900/50 border border-pink-700 text-pink-300 font-black uppercase rounded-2xl hover:bg-pink-700 hover:text-white transition-all">
                          Gestisci Iscritti ({(tr.iscritti || []).length})
                        </button>
                        <button onClick={() => richiedePin((sid) => avviaTorneo(tr, sid), "Avvio Torneo")} className="w-full py-4 bg-green-600 text-black font-black uppercase rounded-2xl hover:bg-green-500 transition-all shadow-lg">
                          🔀 CREA TABELLONE E AVVIA
                        </button>
                      </>
                    )}

                    {tr.stato === 'in_corso' && (
                      <button onClick={() => { setActiveTorneo(tr); setIsBracketModalOpen(true); }} className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-2xl hover:bg-blue-500 transition-all shadow-lg">
                        🏆 VEDI TABELLONE
                      </button>
                    )}

                    {tr.stato === 'completato' && (
                      <button onClick={() => { setActiveTorneo(tr); setIsBracketModalOpen(true); }} className="w-full py-4 bg-gray-700 text-white font-black uppercase rounded-2xl hover:bg-gray-600 transition-all">
                        📜 RISULTATI FINALI
                      </button>
                    )}

                    <button onClick={async () => { if(confirm("Eliminare definitivamente il torneo?")) { await supabase.from('tornei').delete().eq('id', tr.id); refreshDati(currentSalaId!); } }} className="w-full text-gray-600 text-[10px] font-bold uppercase hover:text-red-500 py-2 mt-2">
                      Elimina Torneo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------- PIN PAD ---------------- */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center p-4 z-[200] animate-in zoom-in-95">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-black text-cyan-500 mb-8 italic uppercase tracking-widest">{pendingAction?.descrizione}</h2>
            <div className="flex justify-center gap-6 mb-12">
              {[...Array(4)].map((_, i) => (<div key={i} className={`w-8 h-8 rounded-full border-2 border-cyan-500 ${pinBuffer.length > i ? 'bg-cyan-500 shadow-[0_0_20px_#06b6d4]' : 'bg-transparent'}`}></div>))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "X"].map((btn) => (
                <button key={btn} onClick={() => {
                  if(btn === 'X') { setIsPinModalOpen(false); setPinBuffer(""); }
                  else if(btn === 'C') setPinBuffer("");
                  else handlePinDigit(btn);
                }} className={`aspect-square rounded-[2rem] text-4xl font-black transition-all active:scale-75 ${btn === 'X' ? 'bg-gray-800' : btn === 'C' ? 'bg-red-950 text-red-500' : 'bg-gray-900 border-2 border-gray-800 hover:bg-cyan-600'}`}>{btn}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODALI DI INPUT E GESTIONE ---------------- */}
      
      {/* Prenotazione */}
      {isReserveModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-900 border-4 border-yellow-500 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-3xl font-black text-yellow-500 mb-8 uppercase italic">Nuova Prenotazione</h3><input value={reserveName} onChange={(e)=>setReserveName(e.target.value)} placeholder="Nome Cliente" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-2xl text-white mb-4 outline-none text-center" /><input type="time" value={reserveTime} onChange={(e)=>setReserveTime(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-5xl font-mono text-yellow-400 mb-8 text-center outline-none" /><button onClick={() => richiedePin((sid) => prenotaTavolo(sid), "Registra Prenotazione")} className="w-full py-8 bg-yellow-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95">CONFERMA PRENOTAZIONE</button><button onClick={()=>setIsReserveModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}

      {/* Avvia Partita */}
      {isStartModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-950 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic italic">Apertura Tavolo</h3><select value={selectedSocioId} onChange={(e) => setSelectedSocioId(e.target.value)} className="w-full bg-gray-900 border-4 border-blue-900 p-6 rounded-2xl text-xl text-white mb-8 outline-none"><option value="">👤 CLIENTE OCCASIONALE</option>{soci.map(s => (<option key={s.id} value={s.id}>🏆 SOCIO: {s.cognome} {s.nome}</option>))}</select><button onClick={() => richiedePin((sid) => avviaSessione(sid), "Avvio Partita")} className="w-full py-8 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">APRI TAVOLO CON PIN</button><button onClick={()=>setIsStartModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Aggiungi Bar */}
      {isBarModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-950 border-4 border-orange-500 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-3xl font-black text-orange-500 mb-8 uppercase italic italic">Servizio Bar</h3><select value={selectedProdottoId} onChange={(e) => setSelectedProdottoId(e.target.value)} className="w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-xl text-white mb-12 outline-none"><option value="">Seleziona prodotto...</option>{prodotti.map(p => (<option key={p.id} value={p.id}>{p.nome} (€{p.prezzo_vendita})</option>))}</select><button onClick={() => richiedePin((sid) => aggiungiBar(sid), "Servizio Bar")} className="w-full py-8 bg-orange-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">AGGIUNGI AL CONTO</button><button onClick={()=>setIsBarModalOpen(false)} className="w-full py-4 text-gray-500 font-bold mt-4">Annulla</button></div></div>)}

      {/* Chiusura Conto */}
      {isSummaryModalOpen && summaryData && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-950 border-4 border-green-600 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-green-500 uppercase italic mb-8">Riepilogo e Chiusura</h3><div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 mb-8 font-bold text-left"><div className="flex justify-between text-xl uppercase mb-2 text-gray-400"><span>Tempo Gioco</span><span>€ {summaryData.costoBiliardo.toFixed(2)}</span></div><div className="flex justify-between text-xl uppercase text-orange-400 mb-4"><span>Totale Bar</span><span>€ {summaryData.costoBar.toFixed(2)}</span></div><div className="border-t-2 border-gray-700 pt-6 flex justify-between items-center"><span className="text-3xl font-black italic text-white uppercase italic">Totale Conto</span><span className="text-5xl font-black text-green-500 italic">€ {summaryData.totale.toFixed(2)}</span></div></div><div className="flex flex-col gap-4"><button onClick={() => richiedePin((sid) => confermaChiusura('contanti', sid), "Pagamento Contanti")} className="w-full py-6 bg-green-600 rounded-3xl font-black uppercase text-xl shadow-xl">💵 PAGAMENTO CONTANTI</button><button onClick={() => richiedePin((sid) => confermaChiusura('pos', sid), "Pagamento POS")} className="w-full py-6 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl">💳 PAGAMENTO POS</button>{summaryData.socio_id && (<button onClick={() => richiedePin((sid) => confermaChiusura('credito', sid), "Pagamento Credito")} className="w-full py-6 bg-yellow-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl">💳 SCALA DA TESSERA</button>)}</div><button onClick={()=>setIsSummaryModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}

      {/* Ricarica Credito */}
      {isRechargeModalOpen && socioToRecharge && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in fade-in"><div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-2xl font-black text-green-500 mb-2 uppercase italic tracking-tighter italic">Ricarica Credito</h3><p className="text-3xl font-black text-white mb-8 uppercase italic italic">{socioToRecharge.nome} {socioToRecharge.cognome}</p><input type="number" value={rechargeAmount} onChange={(e)=>setRechargeAmount(e.target.value)} placeholder="€" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-6xl text-center text-green-500 mb-8 outline-none font-black" /><button onClick={() => richiedePin((sid) => salvaRicarica(sid), `Ricarica ${socioToRecharge.nome}`)} className="w-full py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">CONFERMA CON PIN</button><button onClick={()=>setIsRechargeModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>
      )}

      {/* Nuovo Staff */}
      {isNewStaffModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-900 border-4 border-cyan-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-white mb-8 uppercase italic">Nuovo Collaboratore</h3><input value={newStaffNome} onChange={(e) => setNewStaffNome(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 text-center outline-none focus:border-cyan-500" /><input type="password" maxLength={4} value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value)} placeholder="PIN 4 Cifre" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl font-mono text-cyan-400 tracking-[0.5em] mb-8 text-center outline-none focus:border-cyan-500" /><button onClick={salvaNuovoStaff} className="w-full py-8 bg-cyan-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">SALVA PROFILO</button><button onClick={()=>setIsNewStaffModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Nuovo Prodotto */}
      {isNewProductModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-900 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic">Magazzino</h3><input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Prodotto" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center" /><input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Prezzo (€)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center" /><input type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} placeholder="Stock" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center" /><button onClick={() => richiedePin((sid) => salvaNuovoProdotto(sid), "Caricamento Magazzino")} className="w-full py-8 bg-blue-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95">SALVA PRODOTTO</button><button onClick={()=>setIsNewProductModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Nuovo Socio */}
      {isNewSocioModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-900 border-4 border-yellow-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 text-center"><h3 className="text-3xl font-black text-yellow-500 mb-8 uppercase italic italic">Nuovo Socio</h3><input value={newSocioNome} onChange={(e) => setNewSocioNome(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center" /><input value={newSocioCognome} onChange={(e) => setNewSocioCognome(e.target.value)} placeholder="Cognome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center" /><button onClick={() => richiedePin((sid) => salvaNuovoSocio(sid), "Registrazione Socio")} className="w-full py-8 bg-yellow-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">SALVA ANAGRAFICA</button><button onClick={()=>setIsNewSocioModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Nuovo Tavolo */}
      {isNewTableModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-3xl font-black text-green-500 mb-8 uppercase italic">Configura Tavolo</h3><input type="number" value={newTableNumber} onChange={(e)=>setNewTableNumber(e.target.value)} placeholder="Numero" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-6xl text-center text-white mb-8 outline-none" /><button onClick={() => richiedePin((sid) => salvaNuovoTavolo(sid), "Configurazione Tavolo")} className="w-full py-8 bg-green-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95">CONFERMA CON PIN</button><button onClick={()=>setIsNewTableModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Indietro</button></div></div>)}

      {/* Nuovo Torneo */}
      {isNewTorneoModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95"><div className="bg-gray-900 border-4 border-pink-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-pink-500 mb-8 uppercase italic">Nuovo Torneo</h3><input value={newTorneoNome} onChange={(e) => setNewTorneoNome(e.target.value)} placeholder="Nome del Torneo (es. Trofeo Invernale)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center focus:border-pink-500 transition-all" /><input type="date" value={newTorneoData} onChange={(e) => setNewTorneoData(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white/70 mb-4 outline-none text-center focus:border-pink-500 transition-all" /><input type="number" value={newTorneoQuota} onChange={(e) => setNewTorneoQuota(e.target.value)} placeholder="Quota di Iscrizione (€)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center focus:border-pink-500 transition-all" /><button onClick={() => richiedePin((sid) => salvaNuovoTorneo(sid), "Creazione Torneo")} className="w-full py-8 bg-pink-600 text-white font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95 transition-all">CREA TORNEO</button><button onClick={()=>setIsNewTorneoModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* GESTIONE ISCRITTI TORNEO */}
      {isManageIscrittiOpen && activeTorneo && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-gray-900 border-4 border-pink-600 p-8 rounded-[3rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] relative">
            <button onClick={() => { setIsManageIscrittiOpen(false); setActiveTorneo(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white text-xl transition-colors z-10 bg-black hover:bg-red-600 w-12 h-12 rounded-full flex items-center justify-center border-2 border-gray-700 shadow-lg">✕</button>

            <h3 className="text-3xl font-black text-pink-500 mb-2 uppercase italic text-center">{activeTorneo.nome}</h3>
            <p className="text-gray-400 text-center font-bold mb-6 uppercase text-sm">Gestione Iscritti (Totale: {(activeTorneo.iscritti || []).length})</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-gray-800 pb-8">
              <div className="space-y-3">
                <p className="text-pink-500 font-bold uppercase text-xs text-center">Aggiungi Socio Tesserato</p>
                <div className="flex gap-2">
                  <select value={iscrittoSelezionato} onChange={(e) => setIscrittoSelezionato(e.target.value)} className="flex-1 bg-black border border-gray-800 p-4 rounded-xl text-lg text-white outline-none focus:border-pink-500 transition-all">
                    <option value="">Seleziona un socio...</option>
                    {soci.map(s => {
                      const current = normalizeIscritti(activeTorneo.iscritti);
                      if (current.find((i:any) => i.id === s.id)) return null;
                      return <option key={s.id} value={s.id}>{s.cognome} {s.nome}</option>
                    })}
                  </select>
                  <button onClick={() => richiedePin((sid) => aggiungiIscritto(sid, 'socio'), "Iscrizione Socio")} className="px-6 bg-pink-600 text-white font-black uppercase rounded-xl hover:bg-pink-500 active:scale-95 transition-all">➕ SOCIO</button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-purple-500 font-bold uppercase text-xs text-center">Aggiungi Giocatore Esterno</p>
                <div className="flex gap-2">
                  <input type="text" value={iscrittoEsterno} onChange={(e) => setIscrittoEsterno(e.target.value)} placeholder="Nome e Cognome..." className="flex-1 bg-black border border-gray-800 p-4 rounded-xl text-lg text-white outline-none focus:border-purple-500 transition-all" />
                  <button onClick={() => richiedePin((sid) => aggiungiIscritto(sid, 'esterno'), "Iscrizione Esterno")} className="px-6 bg-purple-600 text-white font-black uppercase rounded-xl hover:bg-purple-500 active:scale-95 transition-all">➕ ESTERNO</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-black p-4 rounded-3xl border border-gray-800 pr-2">
              {(activeTorneo.iscritti || []).length === 0 ? (
                <p className="text-center text-gray-600 font-bold uppercase mt-10">Ancora nessun iscritto.</p>
              ) : (
                <div className="space-y-3">
                  {normalizeIscritti(activeTorneo.iscritti).map((iscritto: any, index: number) => (
                      <div key={iscritto.id} className={`flex justify-between items-center p-4 rounded-2xl border ${iscritto.confermato ? 'bg-gray-900 border-gray-800' : 'bg-yellow-900/20 border-yellow-700/50'}`}>
                        <div className="flex items-center gap-4">
                          <span className="text-pink-600 font-black text-xl w-6">{index + 1}.</span>
                          <span className="text-white font-bold text-lg uppercase italic">{iscritto.nome}</span>
                          <span className={`text-[10px] px-2 py-1 rounded uppercase font-black tracking-widest ${iscritto.tipo === 'socio' ? 'bg-pink-900 text-pink-300' : 'bg-purple-900 text-purple-300'}`}>{iscritto.tipo}</span>
                          {!iscritto.confermato && <span className="text-[10px] px-2 py-1 bg-yellow-600 text-black rounded uppercase font-black animate-pulse">RICHIESTA IN ATTESA</span>}
                        </div>
                        <div className="flex gap-2">
                          {!iscritto.confermato && <button onClick={() => richiedePin((sid) => confermaIscrizione(iscritto.id, sid), "Conferma Iscrizione")} className="bg-green-600 text-black font-black text-xs px-4 rounded-xl hover:bg-green-500 transition-colors uppercase">Conferma</button>}
                          <button onClick={() => richiedePin((sid) => rimuoviIscritto(iscritto.id, sid), "Annulla Iscrizione")} className="bg-red-950 text-red-500 p-3 rounded-xl hover:bg-red-900 transition-colors">❌</button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <button onClick={() => { setIsManageIscrittiOpen(false); setActiveTorneo(null); }} className="w-full py-6 mt-6 bg-gray-800 text-white uppercase font-black rounded-3xl hover:bg-gray-700 transition-all">CHIUDI GESTIONE</button>
          </div>
        </div>
      )}

      {/* MODALE TABELLONE SCONTRI DIRETTI */}
      {isBracketModalOpen && activeTorneo && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95">
          <div className="bg-gray-900 border-4 border-blue-600 p-8 rounded-[3rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh] relative">
            <button onClick={() => { setIsBracketModalOpen(false); setActiveTorneo(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white text-xl transition-colors z-10 bg-black hover:bg-red-600 w-12 h-12 rounded-full flex items-center justify-center border-2 border-gray-700 shadow-lg">✕</button>

            <h3 className="text-4xl font-black text-blue-500 mb-2 uppercase italic text-center pr-12">{activeTorneo.nome}</h3>
            <p className="text-gray-400 text-center font-bold mb-8 uppercase text-sm">{activeTorneo.stato === 'completato' ? '🏆 TABELLONE FINALE 🏆' : 'SCONTRI DIRETTI IN CORSO'}</p>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {activeTorneo.tabellone?.map((turno: any, turnoIndex: number) => (
                <div key={turnoIndex} className="bg-black p-6 rounded-[2rem] border border-gray-800">
                  <div className="w-max mx-auto bg-blue-900 text-blue-300 px-6 py-2 rounded-xl font-black uppercase text-sm tracking-widest border border-blue-700 mb-6 text-center shadow-lg">Turno {turnoIndex + 1}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {turno.map((match: any) => (
                      <div key={match.id} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 ${match.vincitore ? 'border-green-900 bg-gray-900' : 'border-blue-900/50 bg-gray-950'}`}>
                        <button 
                          onClick={() => { if(!match.vincitore && activeTorneo.stato !== 'completato') richiedePin((sid) => impostaVincitore(turnoIndex, match.id, match.p1, sid), "Vittoria Giocatore 1") }}
                          disabled={!!match.vincitore}
                          className={`p-3 rounded-xl flex justify-between items-center transition-all ${match.vincitore?.id === match.p1.id ? 'bg-green-600 text-black font-black' : match.vincitore ? 'bg-gray-800 text-gray-600' : 'bg-gray-800 hover:bg-blue-900 text-white font-bold'}`}
                        >
                          <span className="uppercase italic">{match.p1.nome}</span>
                          {match.vincitore?.id === match.p1.id && <span>🏆</span>}
                        </button>
                        <div className="text-center text-gray-700 font-black text-xs">VS</div>
                        {match.p2 ? (
                          <button 
                            onClick={() => { if(!match.vincitore && activeTorneo.stato !== 'completato') richiedePin((sid) => impostaVincitore(turnoIndex, match.id, match.p2, sid), "Vittoria Giocatore 2") }}
                            disabled={!!match.vincitore}
                            className={`p-3 rounded-xl flex justify-between items-center transition-all ${match.vincitore?.id === match.p2.id ? 'bg-green-600 text-black font-black' : match.vincitore ? 'bg-gray-800 text-gray-600' : 'bg-gray-800 hover:bg-blue-900 text-white font-bold'}`}
                          >
                            <span className="uppercase italic">{match.p2.nome}</span>
                            {match.vincitore?.id === match.p2.id && <span>🏆</span>}
                          </button>
                        ) : (
                          <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800 text-gray-600 font-black text-center uppercase tracking-widest text-sm">PASSAGGIO AUTOMATICO (BYE)</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {activeTorneo.stato === 'in_corso' && (
              <button onClick={() => richiedePin((sid) => generaProssimoTurno(sid), "Genera Turno / Concludi")} className="w-full py-6 mt-8 bg-blue-600 text-white uppercase font-black rounded-3xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95">AVANZA AL TURNO SUCCESSIVO / CONCLUDI TORNEO</button>
            )}
            <button onClick={() => { setIsBracketModalOpen(false); setActiveTorneo(null); }} className="w-full py-4 mt-4 bg-gray-800 text-gray-400 uppercase font-black rounded-3xl hover:bg-gray-700 transition-all">CHIUDI TABELLONE</button>
          </div>
        </div>
      )}

    </div>
  );
}