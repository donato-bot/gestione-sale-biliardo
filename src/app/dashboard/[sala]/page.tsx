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
  // AGGIUNTO 'bacheca' AI TIPI DI VISUALE
  const [activeView, setActiveView] = useState<"hub" | "plancia" | "magazzino" | "report" | "soci" | "impostazioni" | "statistiche" | "staff" | "tornei" | "prenotazioni" | "bacheca">("hub");
  
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
  const [prenotazioniList, setPrenotazioniList] = useState<any[]>([]); 
  
  // NUOVI STATI: Bacheca
  const [bachecaPosts, setBachecaPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState("");

  const [incassoTotale, setIncassoTotale] = useState(0);
  const [incassoContanti, setIncassoContanti] = useState(0);
  const [incassoPOS, setIncassoPOS] = useState(0);
  // NUOVI STATI: Prima Nota Contabile
  const [primaNota, setPrimaNota] = useState<any[]>([]);
  const [usciteTotali, setUsciteTotali] = useState(0);
  
  // Stati Modale: Registra Uscita
  const [isNewUscitaModalOpen, setIsNewUscitaModalOpen] = useState(false);
  const [uscitaImporto, setUscitaImporto] = useState("");
  const [uscitaDescrizione, setUscitaDescrizione] = useState("");
  const [uscitaMetodo, setUscitaMetodo] = useState("contanti");
  
  // Metodo pagamento per la ricarica socio
  const [rechargeMetodo, setRechargeMetodo] = useState("contanti");

  // Stati Modali
  const [activeTableId, setActiveTableId] = useState<string | null>(null); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [isEditSocioModalOpen, setIsEditSocioModalOpen] = useState(false);
  const [editSocioId, setEditSocioId] = useState("");
  const [editSocioNome, setEditSocioNome] = useState("");
  const [editSocioCognome, setEditSocioCognome] = useState("");
  const [editSocioTelefono, setEditSocioTelefono] = useState("");

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

  // STATO: OPERATORE LOGGATO
  const [activeStaff, setActiveStaff] = useState<any>(null);

  // Stati Filtri Prenotazioni
  const [filtroStatoPrenotazione, setFiltroStatoPrenotazione] = useState<"da_impostare" | "impostate" | "tutte">("tutte");
  const [filtroTempoPrenotazione, setFiltroTempoPrenotazione] = useState<"oggi" | "settimana" | "mese" | "tutte">("tutte");

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
        const { data: sociDB } = await supabase.from('soci').select('*').eq('sala_id', salaId).order('cognome', { ascending: true });
        const { data: staffDB } = await supabase.from('staff').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
        const { data: torneiDB } = await supabase.from('tornei').select('*').eq('sala_id', salaId).order('data_inizio', { ascending: false }); 
        const { data: prenDB } = await supabase.from('prenotazioni').select('*').eq('sala_id', salaId).order('data_ora', { ascending: true });
        const { data: bachecaDB } = await supabase.from('bacheca').select('*, reazioni_bacheca(*)').eq('sala_id', salaId).order('created_at', { ascending: false });
        
        // NUOVO: RECUPERO PRIMA NOTA (MOVIMENTI DI OGGI)
        const { data: movimentiDB } = await supabase.from('movimenti_cassa').select('*, staff(nome)').eq('sala_id', salaId).gte('created_at', oggi.toISOString()).order('created_at', { ascending: false });

        if (pDB) setProdotti(pDB);
        if (sociDB) setSoci(sociDB);
        if (staffDB) setListaStaff(staffDB);
        if (prenDB) setPrenotazioniList(prenDB);
        if (bachecaDB) setBachecaPosts(bachecaDB);

        if (movimentiDB) {
          setPrimaNota(movimentiDB);
          let entrate = 0, uscite = 0, contanti = 0, pos = 0;
          
          movimentiDB.forEach(m => {
            const val = parseFloat(m.importo);
            if (m.tipo === 'entrata') {
              if (m.metodo_pagamento !== 'credito_vip') entrate += val; 
              if (m.metodo_pagamento === 'contanti') contanti += val;
              if (m.metodo_pagamento === 'pos') pos += val;
            } else if (m.tipo === 'uscita') {
              uscite += val;
              if (m.metodo_pagamento === 'contanti') contanti -= val;
              if (m.metodo_pagamento === 'pos') pos -= val;
            }
          });
          
          setIncassoTotale(entrate);
          setUsciteTotali(uscite);
          setIncassoContanti(contanti); // Saldo REALE cassetto
          setIncassoPOS(pos);
        }

        if (torneiDB) {
          setTornei(torneiDB);
          if(activeTorneo) {
            const up = torneiDB.find(tx => tx.id === activeTorneo.id);
            if(up) setActiveTorneo(up);
          }
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
          setActiveStaff(staff); 
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
    if (activeStaff) { callback(activeStaff.id); return; }
    setPendingAction({ callback, descrizione }); setIsPinModalOpen(true);
  };

  const getPrenotazioniFiltrate = () => {
    let filtered = [...prenotazioniList];
    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    
    if (filtroStatoPrenotazione === 'da_impostare') {
      filtered = filtered.filter(p => p.stato === 'in_attesa');
    } else if (filtroStatoPrenotazione === 'impostate') {
      filtered = filtered.filter(p => p.stato === 'confermata');
    }

    if (filtroTempoPrenotazione === 'oggi') {
      filtered = filtered.filter(p => {
        const d = new Date(p.data_ora);
        d.setHours(0,0,0,0);
        return d.getTime() === oggi.getTime();
      });
    } else if (filtroTempoPrenotazione === 'settimana') {
      const prossimaSettimana = new Date(oggi);
      prossimaSettimana.setDate(oggi.getDate() + 7);
      filtered = filtered.filter(p => {
        const d = new Date(p.data_ora);
        return d >= oggi && d <= prossimaSettimana;
      });
    } else if (filtroTempoPrenotazione === 'mese') {
      filtered = filtered.filter(p => {
        const d = new Date(p.data_ora);
        return d.getMonth() === oggi.getMonth() && d.getFullYear() === oggi.getFullYear();
      });
    }

    return filtered;
  };

  const getPrenotazioniConfermateOggi = () => {
    const oggi = new Date();
    oggi.setHours(0,0,0,0);
    return prenotazioniList.filter(p => {
      const d = new Date(p.data_ora);
      d.setHours(0,0,0,0);
      return d.getTime() === oggi.getTime() && p.stato === 'confermata';
    }).sort((a,b) => new Date(a.data_ora).getTime() - new Date(b.data_ora).getTime());
  };

  const gestisciStatoPrenotazione = async (id: string, nuovoStato: 'confermata' | 'rifiutata', staffId: string) => {
    await supabase.from('prenotazioni').update({ stato: nuovoStato }).eq('id', id);
    await refreshDati(currentSalaId!);
  };

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

  const annullaPrenotazioneTavolo = async (tavoloId: string, staffId: string) => {
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

  const apriModificaSocio = (socio: any) => {
    setEditSocioId(socio.id);
    setEditSocioNome(socio.nome || "");
    setEditSocioCognome(socio.cognome || "");
    setEditSocioTelefono(socio.telefono || ""); 
    setIsEditSocioModalOpen(true);
  };

  const salvaModificaSocio = async (staffId: string) => {
    await supabase.from('soci').update({ 
      nome: editSocioNome, 
      cognome: editSocioCognome,
      telefono: editSocioTelefono
    }).eq('id', editSocioId);
    await refreshDati(currentSalaId!); 
    setIsEditSocioModalOpen(false);
  };

  // 1. Ricarica Tessera (Ora scrive in Prima Nota)
  const salvaRicarica = async (staffId: string) => {
    const importoVal = parseFloat(rechargeAmount);
    const nuovoCredito = parseFloat(socioToRecharge.credito || 0) + importoVal;
    
    await supabase.from('soci').update({ credito: nuovoCredito }).eq('id', socioToRecharge.id);
    
    await supabase.from('movimenti_cassa').insert([{
      sala_id: currentSalaId,
      tipo: 'entrata',
      categoria: 'ricarica_vip',
      metodo_pagamento: rechargeMetodo,
      importo: importoVal.toFixed(2),
      descrizione: `Ricarica Tessera: ${socioToRecharge.cognome} ${socioToRecharge.nome}`,
      staff_id: staffId
    }]);

    await refreshDati(currentSalaId!); setIsRechargeModalOpen(false); setRechargeAmount("");
  };

  // 2. Chiusura Tavolo (Ora scrive in Prima Nota)
  const confermaChiusura = async (metodo: any, staffId: string) => {
    if (metodo === 'credito') {
      const socio = soci.find(s => s.id === summaryData.socio_id);
      await supabase.from('soci').update({ credito: (socio.credito || 0) - summaryData.totale }).eq('id', socio.id);
    }
    
    await supabase.from('movimenti_cassa').insert([{
      sala_id: currentSalaId,
      tipo: 'entrata',
      categoria: 'biliardo_bar',
      metodo_pagamento: metodo === 'credito' ? 'credito_vip' : metodo,
      importo: summaryData.totale.toFixed(2),
      descrizione: `Incasso ${summaryData.nome}`,
      staff_id: staffId
    }]);

    await supabase.from('sessioni').update({ fine: new Date().toISOString(), stato: 'terminata', costo_totale: summaryData.totale.toFixed(2), metodo_pagamento: metodo, staff_id: staffId }).eq('id', summaryData.sessioneId);
    await supabase.from('tavoli').update({ stato: 'libero' }).eq('id', summaryData.tavoloId);
    await refreshDati(currentSalaId!); setIsSummaryModalOpen(false);
  };

  // 3. NUOVA: Registra una spesa/uscita manuale
  const salvaUscita = async (staffId: string) => {
    if(!uscitaImporto || !uscitaDescrizione) return;
    await supabase.from('movimenti_cassa').insert([{
      sala_id: currentSalaId,
      tipo: 'uscita',
      categoria: 'spese_varie',
      metodo_pagamento: uscitaMetodo,
      importo: parseFloat(uscitaImporto).toFixed(2),
      descrizione: uscitaDescrizione,
      staff_id: staffId
    }]);
    await refreshDati(currentSalaId!); 
    setIsNewUscitaModalOpen(false); setUscitaImporto(""); setUscitaDescrizione("");
  };

  // 4. NUOVA: Annulla Transazione Cassa (Storno Prima Nota)
  const stornoMovimento = async (id: string, staffId: string) => {
    if(confirm("Vuoi davvero annullare questo movimento di cassa?")) {
      await supabase.from('movimenti_cassa').delete().eq('id', id);
      await refreshDati(currentSalaId!);
    }
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

  // NUOVE FUNZIONI: BACHECA AVVISI
  const salvaNuovoPost = async (staffId: string) => {
    if (!newPostText.trim()) return;
    await supabase.from('bacheca').insert([{ sala_id: currentSalaId, testo: newPostText.trim() }]);
    setNewPostText("");
    await refreshDati(currentSalaId!);
    alert("✅ Avviso pubblicato in Bacheca!");
  };

  const eliminaPost = async (postId: string, staffId: string) => {
    if (confirm("Vuoi davvero eliminare questo avviso?")) {
      await supabase.from('bacheca').delete().eq('id', postId);
      await refreshDati(currentSalaId!);
    }
  };

  const inviaLinkWhatsApp = (socio: any) => {
    const url = `${window.location.origin}/vip/${params.sala}/${socio.token}`;
    const messaggioTesto = `Ciao ${socio.nome}, ecco la tua Tessera Digitale VIP per ${nomeSala}. Clicca qui per vedere il tuo credito e prenotare: ${url}`;
    const messaggioCodificato = encodeURIComponent(messaggioTesto);

    if (socio.telefono && socio.telefono.trim() !== "") {
      const numeroPulito = socio.telefono.replace(/\D/g, '');
      const prefisso = numeroPulito.startsWith('39') ? '' : '39';
      const waUrl = `https://wa.me/${prefisso}${numeroPulito}?text=${messaggioCodificato}`;
      window.open(waUrl, '_blank');
    } else {
      navigator.clipboard.writeText(url);
      alert(`⚠️ Nessun numero di telefono salvato per ${socio.nome}.\n\n✅ Link copiato negli appunti! Apri tu WhatsApp e incollalo.`);
    }
  };

  const formattaCronometro = (startTime: number | null) => {
    if (!startTime) return "00:00:00";
    const diff = Math.max(0, now - startTime);
    const ore = Math.floor(diff / 3600000);
    const minuti = Math.floor((diff % 3600000) / 60000);
    const secondi = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
  };

  const eseguiStampa = () => {
    window.print();
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl tracking-widest italic animate-pulse">CARICAMENTO TORRE DI CONTROLLO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter overflow-x-hidden relative print:bg-white print:text-black">
      
      {/* BADGE OPERATORE LOGGATO - NASCOSTO IN STAMPA */}
      {activeStaff && (
        <div className="absolute top-6 right-6 z-40 bg-gray-900 border border-cyan-600 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-[0_0_15px_rgba(8,145,178,0.3)] animate-in slide-in-from-top print:hidden">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Operatore Attivo</p>
            <p className="text-cyan-400 font-black text-lg uppercase italic leading-none">{activeStaff.nome}</p>
          </div>
          <button onClick={() => setActiveStaff(null)} className="bg-red-950 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors">
            CAMBIO TURNO
          </button>
        </div>
      )}

      {/* HUB E VISTE - NASCOSTO IN STAMPA */}
      <div className="print:hidden">
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
              <button onClick={() => setActiveView("prenotazioni")} className="bg-gray-900 border-2 border-teal-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">📅</div><h2 className="text-xl font-black uppercase">Prenotazioni</h2></button>
              <button onClick={() => setActiveView("tornei")} className="bg-gray-900 border-2 border-pink-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">🏆</div><h2 className="text-xl font-black uppercase">Tornei</h2></button>
              
              {/* NUOVO BOTTONE BACHECA NELL'HUB */}
              <button onClick={() => setActiveView("bacheca")} className="bg-gray-900 border-2 border-orange-500 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">📢</div><h2 className="text-xl font-black uppercase">Bacheca</h2></button>

              <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="col-span-1 md:col-span-3 bg-red-950/30 border-2 border-red-600 p-6 rounded-[2rem] text-red-500 font-black uppercase mt-0 flex items-center justify-center">Esci dal Sistema</button>
            </div>
          </div>
        )}

        {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 border-2 border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase italic flex items-center justify-center gap-4 transition-all">🔙 MENU PRINCIPALE</button>)}

        {/* BACHECA AVVISI (NUOVA SEZIONE) */}
        {activeView === 'bacheca' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
            <h3 className="text-4xl font-black text-orange-500 uppercase italic mb-8 text-center drop-shadow-md">Bacheca Avvisi</h3>
            
            <div className="bg-gray-900 p-6 rounded-[2rem] border-2 border-orange-900 mb-10 shadow-xl">
              <textarea 
                value={newPostText} 
                onChange={(e) => setNewPostText(e.target.value)} 
                placeholder="Scrivi un nuovo avviso per i soci... (es. Risultati del torneo, nuove promozioni al bar, chiusura per festività)" 
                className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-lg text-white mb-4 outline-none resize-none h-32 focus:border-orange-500 transition-colors" 
              />
              <button 
                onClick={() => richiedePin((sid) => salvaNuovoPost(sid), "Pubblica in Bacheca")} 
                className="w-full py-5 bg-orange-600 text-white font-black uppercase text-xl rounded-2xl shadow-xl active:scale-95 transition-all">
                📣 PUBBLICA AVVISO
              </button>
            </div>

            <div className="space-y-6">
              {bachecaPosts.length === 0 ? (
                <div className="bg-gray-900 p-10 rounded-[3rem] border-2 border-gray-800 shadow-2xl text-center">
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-lg">Nessun avviso pubblicato.</p>
                </div>
              ) : (
                bachecaPosts.map((post) => {
                  const reazioni = post.reazioni_bacheca || [];
                  const conteggio = reazioni.reduce((acc: any, curr: any) => { 
                    acc[curr.tipo] = (acc[curr.tipo] || 0) + 1; 
                    return acc; 
                  }, {});

                  return (
                    <div key={post.id} className="bg-gray-950 border border-gray-800 p-6 rounded-3xl shadow-lg relative">
                      <button onClick={() => richiedePin((sid) => eliminaPost(post.id, sid), "Elimina Avviso")} className="absolute top-4 right-4 text-red-900 hover:text-red-500 transition-colors p-2 text-xl">🗑️</button>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">🗓️ {new Date(post.created_at).toLocaleDateString()} - {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      <p className="text-xl text-white whitespace-pre-wrap mb-6">{post.testo}</p>
                      
                      {/* Recap Reazioni per il Gestore */}
                      <div className="flex flex-wrap gap-2 border-t border-gray-800 pt-4">
                        {Object.entries(conteggio).length === 0 ? (
                          <span className="text-gray-600 text-xs font-bold uppercase tracking-widest">Nessuna reazione ancora</span>
                        ) : (
                          Object.entries(conteggio).map(([emoji, count]) => (
                            <span key={emoji} className="bg-gray-900 px-3 py-1 rounded-full text-sm border border-gray-700">
                              {emoji} <span className="font-bold text-white ml-1">{count as number}</span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PLANCIA CON ALERT PRENOTAZIONI */}
        {activeView === 'plancia' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            
            {/* ALERT PRENOTAZIONI CONFERMATE OGGI */}
            {getPrenotazioniConfermateOggi().length > 0 && (
              <div className="mb-8 bg-teal-900/30 border-2 border-teal-600 rounded-3xl p-6 shadow-lg animate-in fade-in">
                <h3 className="text-teal-400 font-black uppercase mb-4 flex items-center gap-2 tracking-widest text-sm">
                  <span className="text-xl">📅</span> Prenotazioni Confermate in arrivo oggi
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {getPrenotazioniConfermateOggi().map(p => (
                    <div key={p.id} className="min-w-[250px] bg-black p-4 rounded-2xl border border-teal-800 flex flex-col justify-between">
                      <div>
                        <p className="font-black text-white uppercase truncate">{p.nome_cliente}</p>
                        <p className="text-teal-500 font-mono text-2xl font-black">{new Date(p.data_ora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <p className="text-gray-500 text-xs truncate mt-2 uppercase font-bold tracking-widest">Tel: {p.telefono}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <button onClick={() => richiedePin((sid) => annullaPrenotazioneTavolo(t.id, sid), "Annulla Prenotazione")} className="flex-1 py-8 bg-gray-800 text-red-500 rounded-3xl text-xl shadow-xl active:scale-95">❌</button>
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
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="p-6">Socio</th>
                    <th className="p-6">Credito Attuale</th>
                    <th className="p-6 text-center">App Personale</th>
                    <th className="p-6 text-right">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {soci.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-800/30 transition-all">
                      <td className="p-6 text-xl uppercase italic">
                        {s.cognome} {s.nome}
                        {s.telefono && <p className="text-gray-500 text-xs mt-1 font-mono">{s.telefono}</p>}
                      </td>
                      <td className="p-6 text-2xl text-green-500 italic">€ {parseFloat(s.credito || 0).toFixed(2)}</td>
                      <td className="p-6 text-center">
                        <button 
                          onClick={() => inviaLinkWhatsApp(s)} 
                          className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-green-600 hover:text-white transition-all shadow-md flex items-center justify-center gap-2 mx-auto">
                          <span className="text-lg">💬</span> Invia WhatsApp
                        </button>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-end items-center gap-3">
                          <button 
                            onClick={() => apriModificaSocio(s)} 
                            className="bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-md">
                            ✏️ Modifica
                          </button>
                          <button 
                            onClick={() => { setSocioToRecharge(s); setIsRechargeModalOpen(true); }} 
                            className="bg-green-600 text-black px-6 py-3 rounded-2xl font-black uppercase shadow-lg active:scale-95">
                            💰 Ricarica
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT CASSA (PRIMA NOTA AGGIORNATA) */}
        {activeView === 'report' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8 text-center">
            
            <button onClick={() => setIsNewUscitaModalOpen(true)} className="w-full mb-8 py-8 bg-red-600 text-white font-black text-2xl uppercase shadow-xl rounded-[2rem] hover:bg-red-500 transition-colors">
              - REGISTRA SPESA / USCITA CASSA
            </button>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-green-600">
                <p className="text-green-500 font-black uppercase text-[10px] tracking-widest mb-2">Totale Entrate Oggi</p>
                <h3 className="text-4xl font-black text-white italic">€ {incassoTotale.toFixed(2)}</h3>
              </div>
              <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-red-600">
                <p className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-2">Totale Uscite Oggi</p>
                <h3 className="text-4xl font-black text-white italic">€ {usciteTotali.toFixed(2)}</h3>
              </div>
              <div className="bg-cyan-950 p-8 rounded-[3rem] border-4 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)] md:col-span-2">
                <p className="text-cyan-400 font-black uppercase text-[10px] tracking-widest mb-2">Saldo Cassetto (Contanti Reali)</p>
                <h3 className="text-5xl font-black text-cyan-300 italic">€ {incassoContanti.toFixed(2)}</h3>
                <p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-widest">In POS/Banca: € {incassoPOS.toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden text-left shadow-2xl">
              <div className="p-6 bg-gray-800 border-b border-gray-700 text-center">
                <h3 className="text-white font-black uppercase tracking-widest">Prima Nota Contabile</h3>
              </div>
              <table className="w-full text-xs uppercase font-bold">
                <thead className="bg-gray-800 text-gray-500">
                  <tr><th className="p-5">Ora</th><th className="p-5">Causale</th><th className="p-5">Staff</th><th className="p-5 text-center">Metodo</th><th className="p-5 text-right">Importo</th><th className="p-5 text-center">Storno</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {primaNota.length === 0 ? (
                    <tr><td colSpan={6} className="p-10 text-center text-gray-500">Nessun movimento registrato oggi.</td></tr>
                  ) : (
                    primaNota.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-800/20 transition-all">
                        <td className="p-5 font-mono text-gray-400">{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td className="p-5 text-white">{m.descrizione}</td>
                        <td className="p-5 text-gray-500">{m.staff?.nome || "ADMIN"}</td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] ${m.metodo_pagamento === 'contanti' ? 'bg-cyan-900/50 text-cyan-400' : m.metodo_pagamento === 'pos' ? 'bg-blue-900/50 text-blue-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                            {m.metodo_pagamento.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`p-5 text-right font-black text-lg italic ${m.tipo === 'entrata' ? 'text-green-500' : 'text-red-500'}`}>
                          {m.tipo === 'entrata' ? '+' : '-'} € {parseFloat(m.importo).toFixed(2)}
                        </td>
                        <td className="p-5 text-center"><button onClick={() => richiedePin((sid) => stornoMovimento(m.id, sid), "Storno Movimento")} className="text-gray-600 hover:text-red-500 text-xl transition-colors">✕</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}  
       /* )}*/

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
            <h3 className="text-4xl font-black text-teal-500 uppercase italic mb-8 text-center drop-shadow-md">Gestione Prenotazioni</h3>
            
            <div className="bg-gray-900 p-6 rounded-[2rem] border-2 border-teal-900 mb-8 shadow-xl flex flex-col md:flex-row gap-6 justify-between items-center">
              
              <div className="flex gap-2 bg-black p-2 rounded-2xl border border-gray-800">
                <button 
                  onClick={() => setFiltroStatoPrenotazione('da_impostare')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroStatoPrenotazione === 'da_impostare' ? 'bg-teal-600 text-black' : 'text-gray-500 hover:text-teal-400'}`}
                >
                  Da Impostare
                </button>
                <button 
                  onClick={() => setFiltroStatoPrenotazione('impostate')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroStatoPrenotazione === 'impostate' ? 'bg-teal-600 text-black' : 'text-gray-500 hover:text-teal-400'}`}
                >
                  Impostate
                </button>
                <button 
                  onClick={() => setFiltroStatoPrenotazione('tutte')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroStatoPrenotazione === 'tutte' ? 'bg-teal-600 text-black' : 'text-gray-500 hover:text-teal-400'}`}
                >
                  Tutte
                </button>
              </div>

              <div className="flex gap-2 bg-black p-2 rounded-2xl border border-gray-800 flex-wrap justify-center">
                <button 
                  onClick={() => setFiltroTempoPrenotazione('oggi')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroTempoPrenotazione === 'oggi' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Oggi
                </button>
                <button 
                  onClick={() => setFiltroTempoPrenotazione('settimana')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroTempoPrenotazione === 'settimana' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Settimana
                </button>
                <button 
                  onClick={() => setFiltroTempoPrenotazione('mese')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroTempoPrenotazione === 'mese' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Mese
                </button>
                <button 
                  onClick={() => setFiltroTempoPrenotazione('tutte')} 
                  className={`px-6 py-2 rounded-xl text-sm font-black uppercase transition-all ${filtroTempoPrenotazione === 'tutte' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-white'}`}
                >
                  Tutte
                </button>
              </div>
            </div>

            {getPrenotazioniFiltrate().length === 0 ? (
              <div className="bg-gray-900 p-10 rounded-[3rem] border-2 border-gray-800 shadow-2xl text-center">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-lg">Nessuna prenotazione attiva al momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPrenotazioniFiltrate().map((p) => {
                  const dataPrenotazione = new Date(p.data_ora);
                  const isDaImpostare = p.stato === 'in_attesa';
                  
                  return (
                    <div key={p.id} className={`border-2 p-6 rounded-3xl shadow-xl flex flex-col justify-between transition-colors ${isDaImpostare ? 'bg-gray-900 border-teal-600' : 'bg-gray-950 border-gray-800'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-2xl font-black italic text-white uppercase truncate pr-2">{p.nome_cliente}</h4>
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase whitespace-nowrap ${isDaImpostare ? 'bg-teal-900 text-teal-300 animate-pulse' : p.stato === 'confermata' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                            {p.stato.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mb-4">
                          <p className="text-teal-500 font-bold uppercase text-xs tracking-widest">Data e Ora</p>
                          <p className="text-xl font-mono font-black text-white">
                            {dataPrenotazione.toLocaleDateString()} - {dataPrenotazione.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                        <div className="mb-6">
                          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Telefono / Note</p>
                          <p className="text-md text-gray-300 font-bold">{p.telefono}</p>
                          {p.note && <p className="text-sm text-gray-400 italic mt-1 bg-black p-2 rounded-lg border border-gray-800">{p.note}</p>}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto">
                        {isDaImpostare ? (
                          <>
                            <button onClick={() => richiedePin((sid) => gestisciStatoPrenotazione(p.id, 'confermata', sid), "Conferma Prenotazione")} className="flex-[2] bg-teal-600 text-black font-black uppercase py-3 rounded-xl hover:bg-teal-500 transition-colors shadow-lg">
                              Conferma
                            </button>
                            <button onClick={() => richiedePin((sid) => gestisciStatoPrenotazione(p.id, 'rifiutata', sid), "Rifiuta Prenotazione")} className="flex-[1] bg-gray-800 text-red-500 font-black uppercase py-3 rounded-xl hover:bg-red-900 hover:text-white transition-colors">
                              Rifiuta
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-3 bg-black rounded-xl border border-gray-800 text-gray-600 font-black uppercase text-xs tracking-widest">
                            {p.stato === 'confermata' ? 'PRENOTAZIONE CONFERMATA' : 'PRENOTAZIONE RIFIUTATA'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                  <div key={tr.id} className="bg-gray-900 p-8 rounded-[2.5rem] border-2 border-pink-900 shadow-2xl flex flex-col justify-between relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-32 py-1 text-center font-black text-[10px] uppercase tracking-widest translate-x-8 translate-y-4 rotate-45 ${tr.stato === 'iscrizioni' ? 'bg-yellow-500 text-black' : tr.stato === 'in_corso' ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'}`}>
                      {tr.stato === 'iscrizioni' ? 'Aperto' : tr.stato === 'in_corso' ? 'Live' : 'Chiuso'}
                    </div>

                    <div>
                      <h4 className="text-2xl font-black uppercase text-white italic mb-2">{tr.nome}</h4>
                      <p className="text-pink-400 font-mono font-bold text-lg mb-2">📅 Data: {new Date(tr.data_inizio).toLocaleDateString()}</p>
                      <p className="text-green-500 font-bold mb-6">💰 Quota: € {parseFloat(tr.quota_iscrizione).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {tr.stato === 'iscrizioni' && (
                        <>
                          <button onClick={() => { setActiveTorneo(tr); setIsManageIscrittiOpen(true); }} className="w-full py-4 bg-pink-900/50 border border-pink-700 text-pink-300 font-black uppercase rounded-2xl hover:bg-pink-700 hover:text-white transition-all">
                            Gestisci Iscritti ({(tr.iscritti || []).length})
                          </button>
                          <button onClick={() => richiedePin((sid) => avviaTorneo(tr, sid), "Avvio Torneo")} className="w-full py-4 bg-green-600 text-black font-black uppercase rounded-2xl hover:bg-green-500 transition-all shadow-lg">
                            🔀 AVVIA TABELLONE
                          </button>
                        </>
                      )}

                      {tr.stato === 'in_corso' && (
                        <button onClick={() => { setActiveTorneo(tr); setIsBracketModalOpen(true); }} className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-2xl hover:bg-blue-500 transition-all shadow-lg flex justify-center items-center gap-2">
                          <span>🏆</span> APRI TABELLONE LIVE
                        </button>
                      )}

                      {tr.stato === 'completato' && (
                        <button onClick={() => { setActiveTorneo(tr); setIsBracketModalOpen(true); }} className="w-full py-4 bg-gray-700 text-white font-black uppercase rounded-2xl hover:bg-gray-600 transition-all flex justify-center items-center gap-2">
                          <span>📜</span> RISULTATI FINALI
                        </button>
                      )}

                      <button onClick={() => {
                          const urlBacheca = `${window.location.origin}/bacheca/${params['nome-sala']}/${tr.id}`;
                          alert(`Invia questo link ai giocatori per far loro seguire il tabellone in diretta sul cellulare:\n\n${urlBacheca}`);
                        }} className="w-full py-3 bg-gray-900 border border-gray-700 text-gray-400 font-black uppercase rounded-2xl hover:text-white transition-all text-xs mt-2">
                        🔗 LINK PER I SOCI (CELLULARI)
                      </button>

                      <button onClick={async () => { if(confirm("Eliminare definitivamente il torneo?")) { await supabase.from('tornei').delete().eq('id', tr.id); refreshDati(currentSalaId!); } }} className="w-full text-gray-600 text-[10px] font-bold uppercase hover:text-red-500 py-2 mt-1">
                        Elimina Torneo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div> {/* FINE VISTE NASCOSTE IN STAMPA */}


      {/* ---------------- MODALI ---------------- */}
      
      {/* PIN PAD (STILE AGGIORNATO) - NASCOSTO IN STAMPA */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[200] animate-in zoom-in-95 print:hidden">
          <div className="w-full max-w-[320px] bg-[#0B1021] border-4 border-pink-500 p-8 rounded-[3rem] shadow-[0_0_40px_rgba(236,72,153,0.2)] text-center relative">
            
            {/* Punti PIN in alto (Cyan) */}
            <div className="flex justify-center gap-4 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border-2 border-cyan-400 ${pinBuffer.length > i ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-transparent'}`}></div>
              ))}
            </div>

            <h2 className="text-3xl font-black text-pink-500 mb-1 italic uppercase tracking-tighter">{pendingAction?.descrizione}</h2>
            <p className="text-white font-bold text-[10px] uppercase tracking-widest mb-8">Inserire PIN per registrare</p>
            
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "X"].map((btn) => (
                <button 
                  key={btn} 
                  onClick={() => {
                    if(btn === 'X') { setIsPinModalOpen(false); setPinBuffer(""); }
                    else if(btn === 'C') setPinBuffer("");
                    else handlePinDigit(btn);
                  }} 
                  className={`aspect-square rounded-[1.5rem] text-4xl font-black transition-all active:scale-95 flex items-center justify-center shadow-lg
                    ${btn === 'X' ? 'bg-[#1e293b] text-gray-500' : 
                      btn === 'C' ? 'bg-[#450a0a] text-red-500' : 
                      'bg-[#0f172a] text-white hover:bg-[#1e293b]'}`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prenotazione Tavolo Manuale */}
      {isReserveModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-900 border-4 border-yellow-500 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-3xl font-black text-yellow-500 mb-8 uppercase italic">Blocca Tavolo</h3><input value={reserveName} onChange={(e)=>setReserveName(e.target.value)} placeholder="Nome Cliente" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-2xl text-white mb-4 outline-none text-center" /><input type="time" value={reserveTime} onChange={(e)=>setReserveTime(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-5xl font-mono text-yellow-400 mb-8 text-center outline-none" /><button onClick={() => richiedePin((sid) => prenotaTavolo(sid), "Registra Prenotazione")} className="w-full py-8 bg-yellow-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95">CONFERMA PRENOTAZIONE</button><button onClick={()=>setIsReserveModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}

      {/* Avvia Partita */}
      {isStartModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-950 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic italic">Apertura Tavolo</h3><select value={selectedSocioId} onChange={(e) => setSelectedSocioId(e.target.value)} className="w-full bg-gray-900 border-4 border-blue-900 p-6 rounded-2xl text-xl text-white mb-8 outline-none"><option value="">👤 CLIENTE OCCASIONALE</option>{soci.map(s => (<option key={s.id} value={s.id}>🏆 SOCIO: {s.cognome} {s.nome}</option>))}</select><button onClick={() => richiedePin((sid) => avviaSessione(sid), "Avvio Partita")} className="w-full py-8 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">APRI TAVOLO CON PIN</button><button onClick={()=>setIsStartModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Aggiungi Bar */}
      {isBarModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-950 border-4 border-orange-500 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-3xl font-black text-orange-500 mb-8 uppercase italic italic">Servizio Bar</h3><select value={selectedProdottoId} onChange={(e) => setSelectedProdottoId(e.target.value)} className="w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-xl text-white mb-12 outline-none"><option value="">Seleziona prodotto...</option>{prodotti.map(p => (<option key={p.id} value={p.id}>{p.nome} (€{p.prezzo_vendita})</option>))}</select><button onClick={() => richiedePin((sid) => aggiungiBar(sid), "Servizio Bar")} className="w-full py-8 bg-orange-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">AGGIUNGI AL CONTO</button><button onClick={()=>setIsBarModalOpen(false)} className="w-full py-4 text-gray-500 font-bold mt-4">Annulla</button></div></div>)}

      {/* Chiusura Conto */}
      {isSummaryModalOpen && summaryData && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-950 border-4 border-green-600 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-green-500 uppercase italic mb-8">Riepilogo e Chiusura</h3><div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 mb-8 font-bold text-left"><div className="flex justify-between text-xl uppercase mb-2 text-gray-400"><span>Tempo Gioco</span><span>€ {summaryData.costoBiliardo.toFixed(2)}</span></div><div className="flex justify-between text-xl uppercase text-orange-400 mb-4"><span>Totale Bar</span><span>€ {summaryData.costoBar.toFixed(2)}</span></div><div className="border-t-2 border-gray-700 pt-6 flex justify-between items-center"><span className="text-3xl font-black italic text-white uppercase italic">Totale Conto</span><span className="text-5xl font-black text-green-500 italic">€ {summaryData.totale.toFixed(2)}</span></div></div><div className="flex flex-col gap-4"><button onClick={() => richiedePin((sid) => confermaChiusura('contanti', sid), "Pagamento Contanti")} className="w-full py-6 bg-green-600 rounded-3xl font-black uppercase text-xl shadow-xl">💵 PAGAMENTO CONTANTI</button><button onClick={() => richiedePin((sid) => confermaChiusura('pos', sid), "Pagamento POS")} className="w-full py-6 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl">💳 PAGAMENTO POS</button>{summaryData.socio_id && (<button onClick={() => richiedePin((sid) => confermaChiusura('credito', sid), "Pagamento Credito")} className="w-full py-6 bg-yellow-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl">💳 SCALA DA TESSERA</button>)}</div><button onClick={()=>setIsSummaryModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}

      {/* {/* Registra Uscita (NUOVO MODALE) */}
      {isNewUscitaModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden">
          <div className="bg-gray-900 border-4 border-red-600 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl">
            <h3 className="text-3xl font-black text-red-500 mb-8 uppercase italic">Registra Spesa</h3>
            <input value={uscitaDescrizione} onChange={(e)=>setUscitaDescrizione(e.target.value)} placeholder="Causale (es. Fornitore, Pulizie...)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center focus:border-red-500" />
            <input type="number" value={uscitaImporto} onChange={(e)=>setUscitaImporto(e.target.value)} placeholder="Importo (€)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl font-mono text-red-400 mb-4 text-center outline-none focus:border-red-500" />
            
            <select value={uscitaMetodo} onChange={(e)=>setUscitaMetodo(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center focus:border-red-500">
              <option value="contanti">Prelevati in Contanti</option>
              <option value="pos">Pagati con Carta/Dal Conto</option>
            </select>

            <button onClick={() => richiedePin((sid) => salvaUscita(sid), "Registrazione Uscita")} className="w-full py-8 bg-red-600 text-white font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95 transition-colors">CONFERMA USCITA</button>
            <button onClick={()=>setIsNewUscitaModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button>
          </div>
        </div>
      )}

      {/* Ricarica Credito (AGGIORNATO CON METODO PAGAMENTO) */}
      {isRechargeModalOpen && socioToRecharge && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in fade-in print:hidden">
          <div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl">
            <h3 className="text-2xl font-black text-green-500 mb-2 uppercase italic tracking-tighter">Ricarica Credito</h3>
            <p className="text-3xl font-black text-white mb-8 uppercase italic">{socioToRecharge.nome} {socioToRecharge.cognome}</p>
            
            <input type="number" value={rechargeAmount} onChange={(e)=>setRechargeAmount(e.target.value)} placeholder="€" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-6xl text-center text-green-500 mb-4 outline-none font-black focus:border-green-500" />
            
            <select value={rechargeMetodo} onChange={(e)=>setRechargeMetodo(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-lg text-white mb-8 outline-none text-center focus:border-green-500">
              <option value="contanti">Il socio mi ha dato Contanti</option>
              <option value="pos">Il socio ha pagato col POS</option>
            </select>

            <button onClick={() => richiedePin((sid) => salvaRicarica(sid), `Ricarica ${socioToRecharge.nome}`)} className="w-full py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">CONFERMA CON PIN</button>
            <button onClick={()=>setIsRechargeModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button>
          </div>
        </div>
      )}
      
      
      {/* Nuovo Staff */}
      {isNewStaffModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-900 border-4 border-cyan-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-white mb-8 uppercase italic">Nuovo Collaboratore</h3><input value={newStaffNome} onChange={(e) => setNewStaffNome(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 text-center outline-none focus:border-cyan-500" /><input type="password" maxLength={4} value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value)} placeholder="PIN 4 Cifre" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl font-mono text-cyan-400 tracking-[0.5em] mb-8 text-center outline-none focus:border-cyan-500" /><button onClick={salvaNuovoStaff} className="w-full py-8 bg-cyan-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">SALVA PROFILO</button><button onClick={()=>setIsNewStaffModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Nuovo Prodotto */}
      {isNewProductModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-900 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic">Magazzino</h3><input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Prodotto" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center" /><input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Prezzo (€)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center" /><input type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} placeholder="Stock" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center" /><button onClick={() => richiedePin((sid) => salvaNuovoProdotto(sid), "Caricamento Magazzino")} className="w-full py-8 bg-blue-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95">SALVA PRODOTTO</button><button onClick={()=>setIsNewProductModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Nuovo Socio */}
      {isNewSocioModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-900 border-4 border-yellow-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 text-center"><h3 className="text-3xl font-black text-yellow-500 mb-8 uppercase italic italic">Nuovo Socio</h3><input value={newSocioNome} onChange={(e) => setNewSocioNome(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center" /><input value={newSocioCognome} onChange={(e) => setNewSocioCognome(e.target.value)} placeholder="Cognome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center" /><button onClick={() => richiedePin((sid) => salvaNuovoSocio(sid), "Registrazione Socio")} className="w-full py-8 bg-yellow-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">SALVA ANAGRAFICA</button><button onClick={()=>setIsNewSocioModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* Modifica Socio */}
      {isEditSocioModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden">
          <div className="bg-gray-900 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 text-center">
            <h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic">Modifica Dati Socio</h3>
            <input value={editSocioNome} onChange={(e) => setEditSocioNome(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center focus:border-blue-500 transition-all" />
            <input value={editSocioCognome} onChange={(e) => setEditSocioCognome(e.target.value)} placeholder="Cognome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center focus:border-blue-500 transition-all" />
            <input value={editSocioTelefono} onChange={(e) => setEditSocioTelefono(e.target.value)} placeholder="Telefono (es. 3331234567)" type="tel" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center focus:border-blue-500 transition-all" />
            
            <button onClick={() => richiedePin((sid) => salvaModificaSocio(sid), "Modifica Socio")} className="w-full py-8 bg-blue-600 text-white rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">
              SALVA MODIFICHE
            </button>
            <button onClick={()=>setIsEditSocioModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Nuovo Tavolo */}
      {isNewTableModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-3xl font-black text-green-500 mb-8 uppercase italic">Configura Tavolo</h3><input type="number" value={newTableNumber} onChange={(e)=>setNewTableNumber(e.target.value)} placeholder="Numero" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-6xl text-center text-white mb-8 outline-none" /><button onClick={() => richiedePin((sid) => salvaNuovoTavolo(sid), "Configurazione Tavolo")} className="w-full py-8 bg-green-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95">CONFERMA CON PIN</button><button onClick={()=>setIsNewTableModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Indietro</button></div></div>)}

      {/* Nuovo Torneo */}
      {isNewTorneoModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden"><div className="bg-gray-900 border-4 border-pink-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-pink-500 mb-8 uppercase italic">Nuovo Torneo</h3><input value={newTorneoNome} onChange={(e) => setNewTorneoNome(e.target.value)} placeholder="Nome del Torneo (es. Trofeo Invernale)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none text-center focus:border-pink-500 transition-all" /><input type="date" value={newTorneoData} onChange={(e) => setNewTorneoData(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white/70 mb-4 outline-none text-center focus:border-pink-500 transition-all" /><input type="number" value={newTorneoQuota} onChange={(e) => setNewTorneoQuota(e.target.value)} placeholder="Quota di Iscrizione (€)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-8 outline-none text-center focus:border-pink-500 transition-all" /><button onClick={() => richiedePin((sid) => salvaNuovoTorneo(sid), "Creazione Torneo")} className="w-full py-8 bg-pink-600 text-white font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95 transition-all">CREA TORNEO</button><button onClick={()=>setIsNewTorneoModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}

      {/* GESTIONE ISCRITTI TORNEO */}
      {isManageIscrittiOpen && activeTorneo && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:hidden">
          <div className="bg-gray-950 border-4 border-pink-600 p-8 rounded-[3rem] w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] relative">
            <button onClick={() => { setIsManageIscrittiOpen(false); setActiveTorneo(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white text-3xl font-black transition-colors z-20 bg-black hover:bg-red-600 w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-700 shadow-2xl">✕</button>
            <h3 className="text-4xl font-black text-pink-500 mb-2 uppercase italic text-center pr-16">{activeTorneo.nome}</h3>
            <p className="text-gray-400 text-center font-bold mb-8 uppercase tracking-widest text-sm">Gestione Iscritti (Totale: {(activeTorneo.iscritti || []).length})</p>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden">
              <div className="lg:col-span-7 flex flex-col bg-black rounded-[2rem] border-2 border-gray-800 overflow-hidden">
                <div className="bg-gray-900 p-4 border-b border-gray-800 text-center font-black uppercase text-gray-500 tracking-widest text-xs">Elenco Partecipanti</div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {(activeTorneo.iscritti || []).length === 0 ? (
                    <p className="text-center text-gray-600 font-bold uppercase mt-10">Nessun giocatore iscritto.</p>
                  ) : (
                    normalizeIscritti(activeTorneo.iscritti).map((iscritto: any, index: number) => (
                      <div key={iscritto.id} className="flex justify-between items-center p-4 rounded-2xl border border-gray-800 bg-gray-900">
                        <div className="flex items-center gap-4">
                          <span className="text-pink-600 font-black text-xl w-6">{index + 1}.</span>
                          <span className="text-white font-black text-xl uppercase italic">{iscritto.nome}</span>
                          <span className={`text-[10px] px-3 py-1 rounded uppercase font-black tracking-widest ${iscritto.tipo === 'socio' ? 'bg-pink-600 text-white' : 'bg-purple-600 text-white'}`}>{iscritto.tipo}</span>
                        </div>
                        <button onClick={() => richiedePin((sid) => rimuoviIscritto(iscritto.id, sid), "Annulla Iscrizione")} className="bg-red-950 text-red-500 p-3 rounded-xl hover:bg-red-900 transition-colors">✕</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2">
                <div className="bg-gray-900 p-6 rounded-[2rem] border border-gray-800 flex flex-col justify-center">
                  <p className="text-purple-400 font-black uppercase text-xs tracking-widest text-center mb-4">Aggiungi Giocatore Esterno</p>
                  <div className="flex flex-col gap-4">
                    <input type="text" value={iscrittoEsterno} onChange={(e) => setIscrittoEsterno(e.target.value)} placeholder="Nome e Cognome..." className="w-full bg-black border border-gray-700 p-4 rounded-xl text-lg text-white outline-none focus:border-purple-500 transition-all text-center" />
                    <button onClick={() => richiedePin((sid) => aggiungiIscritto(sid, 'esterno'), "Iscrizione Esterno")} className="w-full py-4 bg-purple-600 text-white font-black uppercase rounded-xl hover:bg-purple-500 active:scale-95 transition-all text-lg">➕ ESTERNO</button>
                  </div>
                </div>
                <div className="bg-gray-900 p-6 rounded-[2rem] border border-gray-800 flex flex-col justify-center">
                  <p className="text-pink-400 font-black uppercase text-xs tracking-widest text-center mb-4">Aggiungi Socio Tesserato</p>
                  <div className="flex flex-col gap-4">
                    <select value={iscrittoSelezionato} onChange={(e) => setIscrittoSelezionato(e.target.value)} className="w-full bg-black border border-gray-700 p-4 rounded-xl text-lg text-white outline-none focus:border-pink-500 transition-all text-center">
                      <option value="">Seleziona un socio...</option>
                      {soci.map(s => {
                        const current = normalizeIscritti(activeTorneo.iscritti);
                        if (current.find((i:any) => i.id === s.id)) return null;
                        return <option key={s.id} value={s.id}>{s.cognome} {s.nome}</option>
                      })}
                    </select>
                    <button onClick={() => richiedePin((sid) => aggiungiIscritto(sid, 'socio'), "Iscrizione Socio")} className="w-full py-4 bg-pink-600 text-white font-black uppercase rounded-xl hover:bg-pink-500 active:scale-95 transition-all text-lg">➕ SOCIO</button>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => { setIsManageIscrittiOpen(false); setActiveTorneo(null); }} className="w-full py-6 mt-8 bg-gray-800 text-white uppercase font-black rounded-3xl hover:bg-gray-700 transition-all tracking-widest">CHIUDI GESTIONE</button>
          </div>
        </div>
      )}

      {/* MODALE TABELLONE AD ALBERO ORIZZONTALE */}
      {isBracketModalOpen && activeTorneo && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:relative print:bg-white print:text-black print:p-0 print:block">
          
          <div className="bg-gray-950 border-4 border-blue-600 p-8 rounded-[3rem] w-full max-w-[95vw] shadow-2xl flex flex-col max-h-[95vh] relative print:border-none print:shadow-none print:bg-white print:max-h-none print:h-auto print:overflow-visible">
            
            <button onClick={() => { setIsBracketModalOpen(false); setActiveTorneo(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white text-3xl font-black transition-colors z-20 bg-black hover:bg-red-600 w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-700 shadow-2xl print:hidden">✕</button>

            <button onClick={eseguiStampa} className="absolute top-6 left-6 bg-yellow-500 text-black font-black uppercase tracking-widest px-6 py-4 rounded-2xl hover:bg-yellow-400 transition-all shadow-xl z-20 print:hidden flex items-center gap-2">
              🖨️ Stampa Tabellone
            </button>

            <h3 className="text-5xl font-black text-blue-500 mb-2 uppercase italic text-center print:text-black">{activeTorneo.nome}</h3>
            <p className="text-gray-400 text-center font-bold mb-8 uppercase tracking-widest print:text-gray-600">{activeTorneo.stato === 'completato' ? '🏆 TABELLONE FINALE 🏆' : 'SCONTRI DIRETTI IN CORSO'}</p>

            <div className="flex-1 overflow-x-auto overflow-y-auto bg-black p-8 rounded-3xl border-4 border-gray-900 shadow-inner custom-scrollbar relative print:bg-white print:border-none print:shadow-none print:overflow-visible">
              <div className="flex flex-row min-w-max h-full min-h-[500px] gap-12 print:gap-8">
                {activeTorneo.tabellone?.map((turno: any, turnoIndex: number) => (
                  <div key={turnoIndex} className="flex flex-col justify-around w-72 relative print:w-48">
                    
                    <div className="absolute -top-4 w-full text-center border-b-2 border-gray-800 pb-2 print:border-gray-300">
                       <span className="bg-blue-900/50 text-blue-400 font-black uppercase tracking-widest px-4 py-1 rounded-lg text-xs print:bg-gray-200 print:text-black print:border print:border-black">Turno {turnoIndex + 1}</span>
                    </div>

                    {turno.map((match: any) => (
                      <div key={match.id} className="relative w-full bg-gray-900 border border-gray-700 rounded-xl shadow-xl flex flex-col z-10 overflow-hidden mt-8 mb-8 print:bg-white print:border-black print:shadow-none">
                        
                        <button 
                          onClick={() => { if(!match.vincitore && activeTorneo.stato !== 'completato') richiedePin((sid) => impostaVincitore(turnoIndex, match.id, match.p1, sid), "Vittoria Giocatore 1") }}
                          disabled={!!match.vincitore}
                          className={`p-4 border-b border-gray-800 flex justify-between items-center transition-all print:border-black print:text-black print:bg-white ${match.vincitore?.id === match.p1.id ? 'bg-green-600 text-black font-black print:font-black' : match.vincitore ? 'bg-gray-800 text-gray-500' : 'bg-gray-900 hover:bg-blue-900 text-white font-bold'}`}
                        >
                          <span className="uppercase truncate w-full text-left text-sm">{match.p1.nome}</span>
                          {match.vincitore?.id === match.p1.id && <span className="print:text-black">✓</span>}
                        </button>

                        {match.p2 ? (
                          <button 
                            onClick={() => { if(!match.vincitore && activeTorneo.stato !== 'completato') richiedePin((sid) => impostaVincitore(turnoIndex, match.id, match.p2, sid), "Vittoria Giocatore 2") }}
                            disabled={!!match.vincitore}
                            className={`p-4 flex justify-between items-center transition-all print:text-black print:bg-white ${match.vincitore?.id === match.p2.id ? 'bg-green-600 text-black font-black print:font-black' : match.vincitore ? 'bg-gray-800 text-gray-500' : 'bg-gray-900 hover:bg-blue-900 text-white font-bold'}`}
                          >
                            <span className="uppercase truncate w-full text-left text-sm">{match.p2.nome}</span>
                            {match.vincitore?.id === match.p2.id && <span className="print:text-black">✓</span>}
                          </button>
                        ) : (
                          <div className="p-4 text-gray-600 font-black text-center uppercase tracking-widest text-xs bg-gray-800/20 print:bg-white print:text-gray-400">
                            BYE
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 flex gap-4 print:hidden">
              {activeTorneo.stato === 'in_corso' && (
                <button onClick={() => richiedePin((sid) => generaProssimoTurno(sid), "Genera Turno / Concludi")} className="flex-[3] py-6 bg-blue-600 text-white uppercase font-black rounded-3xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 text-xl">
                  AVANZA AL TURNO SUCCESSIVO / CONCLUDI TORNEO
                </button>
              )}
              <button onClick={() => { setIsBracketModalOpen(false); setActiveTorneo(null); }} className="flex-[1] py-6 bg-gray-800 text-gray-400 uppercase font-black rounded-3xl hover:bg-gray-700 transition-all text-xl">
                CHIUDI TABELLONE
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}