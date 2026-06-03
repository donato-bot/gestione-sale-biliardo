"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; 
import { useParams, useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardSala() {
  const params = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"hub" | "plancia" | "magazzino" | "report" | "soci" | "impostazioni" | "statistiche" | "staff" | "tornei" | "prenotazioni" | "bacheca">("hub");
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentSalaId, setCurrentSalaId] = useState<string | null>(null);
  const [nomeSala, setNomeSala] = useState<string>("La Mia Sala");
  
  // STATI PER LA SICUREZZA E SOSPENSIONE
  const [isSalaSuspended, setIsSalaSuspended] = useState(false);
  const [supportActive, setSupportActive] = useState(false); 

  const [tariffaStandard, setTariffaStandard] = useState(10.00);
  const [tariffaSoci, setTariffaSoci] = useState(8.00);

  const [tavoli, setTavoli] = useState<any[]>([]);
  const [recenti, setRecenti] = useState<any[]>([]);
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [soci, setSoci] = useState<any[]>([]);
  const [listaStaff, setListaStaff] = useState<any[]>([]);
  const [tornei, setTornei] = useState<any[]>([]); 
  const [prenotazioniList, setPrenotazioniList] = useState<any[]>([]); 
  
  const [bachecaPosts, setBachecaPosts] = useState<any[]>([]);
  const [newPostText, setNewPostText] = useState("");

  const [incassoTotale, setIncassoTotale] = useState(0);
  const [incassoContanti, setIncassoContanti] = useState(0);
  const [incassoPOS, setIncassoPOS] = useState(0);
  const [primaNota, setPrimaNota] = useState<any[]>([]);
  const [usciteTotali, setUsciteTotali] = useState(0);
  
  // STATO PER IL GRAFICO DEGLI INCASSI
  const [datiGrafico, setDatiGrafico] = useState<{data: string, totale: number}[]>([]);
  
  // STATI PER ESPORTAZIONE AVANZATA
  const [storicoDal, setStoricoDal] = useState("");
  const [storicoAl, setStoricoAl] = useState("");

  const [isNewUscitaModalOpen, setIsNewUscitaModalOpen] = useState(false);
  const [uscitaImporto, setUscitaImporto] = useState("");
  const [uscitaDescrizione, setUscitaDescrizione] = useState("");
  const [uscitaMetodo, setUscitaMetodo] = useState("contanti");
  
  const [rechargeMetodo, setRechargeMetodo] = useState("contanti");

  const [activeTableId, setActiveTableId] = useState<string | null>(null); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  
  // MODALI MAGAZZINO
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editProdId, setEditProdId] = useState("");
  const [editProdName, setEditProdName] = useState("");
  const [editProdPrice, setEditProdPrice] = useState("");
  const [editProdStock, setEditProdStock] = useState("");
  
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [isEditSocioModalOpen, setIsEditSocioModalOpen] = useState(false);
  const [editSocioId, setEditSocioId] = useState("");
  const [editSocioNome, setEditSocioNome] = useState("");
  const [editSocioCognome, setEditSocioCognome] = useState("");
  const [editSocioTelefono, setEditSocioTelefono] = useState("");

  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [editTableNumber, setEditTableNumber] = useState("");

  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isNewTorneoModalOpen, setIsNewTorneoModalOpen] = useState(false); 
  const [isManageIscrittiOpen, setIsManageIscrittiOpen] = useState(false); 
  const [isBracketModalOpen, setIsBracketModalOpen] = useState(false); 
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  const [pinBuffer, setPinBuffer] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

  const [activeStaff, setActiveStaff] = useState<any>(null);

  const [filtroStatoPrenotazione, setFiltroStatoPrenotazione] = useState<"da_impostare" | "impostate" | "tutte">("tutte");
  const [filtroTempoPrenotazione, setFiltroTempoPrenotazione] = useState<"oggi" | "settimana" | "mese" | "tutte">("tutte");

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
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Calcolo delle prenotazioni in attesa per l'avviso globale
  const pendingPrenotazioni = prenotazioniList.filter(p => p.stato === 'in_attesa');

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
          const email = session.user.email ?? null;
          setUserEmail(email);
          const { data: salaData } = await supabase.from("sale").select("*").eq("manager_email", email).single();
          
          if (salaData) {
            setIsSalaSuspended(salaData.is_active === false);
            setCurrentSalaId(salaData.id);
            setNomeSala(salaData.name);
            setTariffaStandard(salaData.tariffa_standard || 10.00);
            setTariffaSoci(salaData.tariffa_soci || 8.00);
            setSupportActive(salaData.support_active || false); 
            await refreshDati(salaData.id);
          }
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!currentSalaId) return;
    
    const channel = supabase.channel('realtime_prenotazioni')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prenotazioni', filter: `sala_id=eq.${currentSalaId}` }, (payload) => {
        
        if (payload.eventType === 'INSERT' && payload.new.stato === 'in_attesa') {
           const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
           audio.play().catch(() => console.log("Audio bloccato dal browser"));

           fetch('/api/notify-reservation', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               managerEmail: userEmail,
               salaName: nomeSala,
               cliente: payload.new.nome_cliente,
               dataOra: payload.new.data_ora
             })
           });
        }
        refreshDati(currentSalaId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentSalaId, userEmail, nomeSala]);

  async function refreshDati(salaId: string) {
    try {
        const oggi = new Date(); oggi.setHours(0, 0, 0, 0);
        const setteGiorniFa = new Date(oggi); 
        setteGiorniFa.setDate(oggi.getDate() - 6);

        const { data: sInfo } = await supabase.from('sale').select('support_active').eq('id', salaId).single();
        if (sInfo) setSupportActive(sInfo.support_active);

        const { data: tDB } = await supabase.from('tavoli').select('*').eq('sala_id', salaId).order('numero', { ascending: true });
        const { data: sDB } = await supabase.from('sessioni').select('*, consumazioni(*), staff(nome)').eq('sala_id', salaId).eq('stato', 'in_corso');
        const { data: pDB } = await supabase.from('prodotti').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
        const { data: sociDB } = await supabase.from('soci').select('*').eq('sala_id', salaId).order('cognome', { ascending: true });
        const { data: staffDB } = await supabase.from('staff').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
        const { data: torneiDB } = await supabase.from('tornei').select('*').eq('sala_id', salaId).order('data_inizio', { ascending: false }); 
        const { data: prenDB } = await supabase.from('prenotazioni').select('*').eq('sala_id', salaId).order('data_ora', { ascending: true });
        const { data: bachecaDB } = await supabase.from('bacheca').select('*, reazioni_bacheca(*)').eq('sala_id', salaId).order('created_at', { ascending: false });
        const { data: movimentiDB } = await supabase.from('movimenti_cassa').select('*, staff(nome)').eq('sala_id', salaId).gte('created_at', setteGiorniFa.toISOString()).order('created_at', { ascending: false });

        if (pDB) setProdotti(pDB);
        if (sociDB) setSoci(sociDB);
        if (staffDB) setListaStaff(staffDB);
        if (prenDB) setPrenotazioniList(prenDB);
        if (bachecaDB) setBachecaPosts(bachecaDB);

        if (movimentiDB) {
          const movimentiOggi = movimentiDB.filter(m => new Date(m.created_at) >= oggi);
          setPrimaNota(movimentiOggi);
          
          let entrate = 0, uscite = 0, contanti = 0, pos = 0;
          movimentiOggi.forEach(m => {
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
          setIncassoContanti(contanti); 
          setIncassoPOS(pos);

          const raggruppamentoGiorni: Record<string, number> = {};
          for(let i=6; i>=0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dataStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
            raggruppamentoGiorni[dataStr] = 0;
          }

          movimentiDB.forEach(m => {
            if(m.tipo === 'entrata' && m.metodo_pagamento !== 'credito_vip') {
              const dataStr = new Date(m.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
              if(raggruppamentoGiorni[dataStr] !== undefined) {
                raggruppamentoGiorni[dataStr] += parseFloat(m.importo);
              }
            }
          });

          const arrayGrafico = Object.keys(raggruppamentoGiorni).map(k => ({
            data: k,
            totale: raggruppamentoGiorni[k]
          }));
          setDatiGrafico(arrayGrafico);
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
    if (isSalaSuspended) {
      alert("⚠️ Azione bloccata: Il servizio è sospeso ed è in modalità Sola Lettura.");
      return;
    }
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
    await supabase.from('tavoli').update({ stato: 'prenotato', prenotato_da: reserveName, prenotato_alle: reserveTime }).eq('id', activeTableId);
    alert("✅ Prenotazione registrata!");
    await refreshDati(currentSalaId!); setIsReserveModalOpen(false); setReserveName(""); setReserveTime("");
  };

  const annullaPrenotazioneTavolo = async (tavoloId: string, staffId: string) => {
    await supabase.from('tavoli').update({ stato: 'libero', prenotato_da: null, prenotato_alle: null }).eq('id', tavoloId);
    await refreshDati(currentSalaId!);
  };

  const salvaNuovoTorneo = async (staffId: string) => {
    if(!newTorneoNome || !newTorneoData) { alert("Inserisci Nome e Data!"); return; }
    await supabase.from('tornei').insert([{ sala_id: currentSalaId, nome: newTorneoNome, data_inizio: newTorneoData, quota_iscrizione: parseFloat(newTorneoQuota) || 0, stato: 'iscrizioni', iscritti: [], tabellone: [] }]);
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
      if (currentIscritti.find(i => i.id === iscrittoSelezionato)) { alert("⚠️ Questo socio è già iscritto."); return; }
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

  const avviaTorneo = async (torneo: any, staffId: string) => {
    const iscritti = normalizeIscritti(torneo.iscritti);
    if (iscritti.length < 2) { alert("⚠️ Servono almeno 2 iscritti per avviare il torneo!"); return; }
    const shuffled = [...iscritti].sort(() => 0.5 - Math.random());
    
    let round1 = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      let p1 = shuffled[i];
      let p2 = shuffled[i+1] || null; 
      round1.push({ id: 'match_' + Date.now() + i, p1: p1, p2: p2, vincitore: p2 === null ? p1 : null });
    }
    await supabase.from('tornei').update({ stato: 'in_corso', tabellone: [round1] }).eq('id', torneo.id);
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
    
    if (ultimoTurno.some((m: any) => m.vincitore === null)) { alert("⚠️ Devi assegnare il vincitore a tutti i match prima di procedere!"); return; }

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
      nuovoTurno.push({ id: 'match_' + Date.now() + i, p1: p1, p2: p2, vincitore: p2 === null ? p1 : null });
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

  const apriModificaTavolo = (tavolo: any) => {
    if (isSalaSuspended) { alert("⚠️ Sala sospesa: impossibile modificare i tavoli."); return; }
    setActiveTableId(tavolo.id); setEditTableNumber(tavolo.numero.toString()); setIsEditTableModalOpen(true);
  };

  const salvaModificaTavolo = async (staffId: string) => {
    await supabase.from('tavoli').update({ numero: parseInt(editTableNumber) }).eq('id', activeTableId);
    await refreshDati(currentSalaId!); setIsEditTableModalOpen(false);
  };

  const salvaNuovoProdotto = async (staffId: string) => {
    await supabase.from('prodotti').insert([{ sala_id: currentSalaId, nome: newProdName, prezzo_vendita: parseFloat(newProdPrice), quantita_stock: parseInt(newProdStock) || 0 }]);
    await refreshDati(currentSalaId!); setIsNewProductModalOpen(false);
  };

  const apriModificaProdotto = (prodotto: any) => {
    if (isSalaSuspended) { alert("⚠️ Sala sospesa."); return; }
    setEditProdId(prodotto.id); setEditProdName(prodotto.nome); setEditProdPrice(prodotto.prezzo_vendita.toString()); setEditProdStock(prodotto.quantita_stock.toString()); setIsEditProductModalOpen(true);
  };

  const salvaModificaProdotto = async (staffId: string) => {
    await supabase.from('prodotti').update({ nome: editProdName, prezzo_vendita: parseFloat(editProdPrice), quantita_stock: parseInt(editProdStock) || 0 }).eq('id', editProdId);
    await refreshDati(currentSalaId!); setIsEditProductModalOpen(false);
  };

  const eliminaProdotto = async (id: string, staffId: string) => {
    if (confirm("⚠️ Vuoi davvero eliminare definitivamente questo prodotto?")) {
      await supabase.from('prodotti').delete().eq('id', id); await refreshDati(currentSalaId!);
    }
  };

  const salvaNuovoSocio = async (staffId: string) => {
    await supabase.from('soci').insert([{ sala_id: currentSalaId, nome: newSocioNome, cognome: newSocioCognome, credito: 0 }]);
    await refreshDati(currentSalaId!); setIsNewSocioModalOpen(false);
  };

  const apriModificaSocio = (socio: any) => {
    if (isSalaSuspended) return;
    setEditSocioId(socio.id); setEditSocioNome(socio.nome || ""); setEditSocioCognome(socio.cognome || ""); setEditSocioTelefono(socio.telefono || ""); setIsEditSocioModalOpen(true);
  };

  const salvaModificaSocio = async (staffId: string) => {
    await supabase.from('soci').update({ nome: editSocioNome, cognome: editSocioCognome, telefono: editSocioTelefono }).eq('id', editSocioId);
    await refreshDati(currentSalaId!); setIsEditSocioModalOpen(false);
  };
  
  const eliminaSocio = async (id: string, staffId: string) => {
    if (confirm("⚠️ Vuoi davvero eliminare questo socio?")) {
      await supabase.from('soci').delete().eq('id', id); await refreshDati(currentSalaId!);
    }
  };

  const salvaRicarica = async (staffId: string) => {
    const importoVal = parseFloat(rechargeAmount);
    const nuovoCredito = parseFloat(socioToRecharge.credito || 0) + importoVal;
    await supabase.from('soci').update({ credito: nuovoCredito }).eq('id', socioToRecharge.id);
    await supabase.from('movimenti_cassa').insert([{ sala_id: currentSalaId, tipo: 'entrata', categoria: 'ricarica_vip', metodo_pagamento: rechargeMetodo, importo: importoVal.toFixed(2), descrizione: `Ricarica: ${socioToRecharge.cognome}`, staff_id: staffId }]);
    await refreshDati(currentSalaId!); setIsRechargeModalOpen(false); setRechargeAmount("");
  };

  const confermaChiusura = async (metodo: any, staffId: string) => {
    if (metodo === 'credito') {
      const socio = soci.find(s => s.id === summaryData.socio_id);
      await supabase.from('soci').update({ credito: (socio.credito || 0) - summaryData.totale }).eq('id', socio.id);
    }
    await supabase.from('movimenti_cassa').insert([{ sala_id: currentSalaId, tipo: 'entrata', categoria: 'biliardo_bar', metodo_pagamento: metodo === 'credito' ? 'credito_vip' : metodo, importo: summaryData.totale.toFixed(2), descrizione: `Incasso ${summaryData.nome}`, staff_id: staffId }]);
    await supabase.from('sessioni').update({ fine: new Date().toISOString(), stato: 'terminata', costo_totale: summaryData.totale.toFixed(2), metodo_pagamento: metodo, staff_id: staffId }).eq('id', summaryData.sessioneId);
    await supabase.from('tavoli').update({ stato: 'libero' }).eq('id', summaryData.tavoloId);
    await refreshDati(currentSalaId!); setIsSummaryModalOpen(false);
  };

  const salvaUscita = async (staffId: string) => {
    if(!uscitaImporto || !uscitaDescrizione) return;
    await supabase.from('movimenti_cassa').insert([{ sala_id: currentSalaId, tipo: 'uscita', categoria: 'spese_varie', metodo_pagamento: uscitaMetodo, importo: parseFloat(uscitaImporto).toFixed(2), descrizione: uscitaDescrizione, staff_id: staffId }]);
    await refreshDati(currentSalaId!); setIsNewUscitaModalOpen(false); setUscitaImporto(""); setUscitaDescrizione("");
  };

  const stornoMovimento = async (id: string, staffId: string) => {
    if(confirm("Annullare questo movimento di cassa?")) {
      await supabase.from('movimenti_cassa').delete().eq('id', id); await refreshDati(currentSalaId!);
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

  const aggiungiBar = async (staffId: string) => {
    const tavolo = tavoli.find(t => t.id === activeTableId);
    const prodotto = prodotti.find(p => p.id === selectedProdottoId);
    await supabase.from('consumazioni').insert([{ sessione_id: tavolo.sessioneId, prodotto_id: prodotto.id, quantita: 1, prezzo_istante: prodotto.prezzo_vendita, staff_id: staffId }]);
    await supabase.from('prodotti').update({ quantita_stock: prodotto.quantita_stock - 1 }).eq('id', prodotto.id);
    await refreshDati(currentSalaId!); setIsBarModalOpen(false);
  };

  const salvaNuovoPost = async (staffId: string) => {
    if (!newPostText.trim()) return;
    await supabase.from('bacheca').insert([{ sala_id: currentSalaId, testo: newPostText.trim() }]);
    setNewPostText(""); await refreshDati(currentSalaId!); alert("✅ Avviso pubblicato!");
  };

  const eliminaPost = async (postId: string, staffId: string) => {
    if (confirm("Vuoi davvero eliminare questo avviso?")) {
      await supabase.from('bacheca').delete().eq('id', postId); await refreshDati(currentSalaId!);
    }
  };

  const inviaLinkWhatsApp = (socio: any) => {
    const idReale = socio.id; 
    const url = `${window.location.origin}/vip/${currentSalaId}/${idReale}`;
    const messaggioTesto = `Ciao ${socio.nome}, ecco la tua Tessera Digitale VIP per ${nomeSala}. Clicca qui per vedere il tuo credito e prenotare: ${url}`;
    const messaggioCodificato = encodeURIComponent(messaggioTesto);
    if (socio.telefono && socio.telefono.trim() !== "") {
      const numeroPulito = socio.telefono.replace(/\D/g, '');
      const prefisso = numeroPulito.startsWith('39') ? '' : '39';
      window.open(`https://wa.me/${prefisso}${numeroPulito}?text=${messaggioCodificato}`, '_blank');
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

  const eseguiStampa = () => window.print();

  const esportaCSV = () => {
    try {
      if (!primaNota || primaNota.length === 0) { alert("⚠️ Nessun movimento da esportare oggi."); return; }
      let csvContent = "Data e Ora;Causale;Operatore;Metodo Pagamento;Tipo Movimento;Importo\n";
      primaNota.forEach(m => {
        csvContent += `${new Date(m.created_at).toLocaleString()};${m.descrizione ? m.descrizione.replace(/;/g, ',') : ""};${m.staff?.nome || "ADMIN"};${m.metodo_pagamento ? m.metodo_pagamento.toUpperCase() : ""};${m.tipo ? m.tipo.toUpperCase() : ""};${parseFloat(m.importo || 0).toFixed(2)}\n`;
      });
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Prima_Nota_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    } catch (error) { alert("❌ Errore esportazione."); }
  };

  const scaricaPrimaNotaPDF = () => {
    const doc = new jsPDF();
    const dataOggi = new Date().toLocaleDateString('it-IT');
    const oraOggi = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    doc.setFontSize(22); doc.setTextColor(34, 197, 94); doc.text(nomeSala.toUpperCase(), 14, 20);
    doc.setFontSize(14); doc.setTextColor(50, 50, 50); doc.text("Report Chiusura Cassa (Prima Nota Ufficiale)", 14, 30);
    doc.setFontSize(10); doc.text(`Data e Ora: ${dataOggi} - ${oraOggi}`, 14, 38);
    autoTable(doc, {
      startY: 75, head: [["Ora", "Causale", "Operatore", "Metodo", "Importo"]],
      body: primaNota.map(m => [new Date(m.created_at).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit'}), m.descrizione || '', m.staff?.nome || "ADMIN", m.metodo_pagamento.toUpperCase().replace('_', ' '), (m.tipo === 'entrata' ? '+ ' : '- ') + '€ ' + parseFloat(m.importo).toFixed(2)])
    });
    doc.save(`Prima_Nota_${nomeSala.replace(/\s+/g, '_')}_${dataOggi.replace(/\//g, '-')}.pdf`);
  };

  const esportaStorico = async (formato: 'csv' | 'pdf') => {
    if (!storicoDal || !storicoAl) { alert("⚠️ Seleziona Date!"); return; }
    const dataInizio = new Date(storicoDal); dataInizio.setHours(0, 0, 0, 0);
    const dataFine = new Date(storicoAl); dataFine.setHours(23, 59, 59, 999);
    try {
      const { data, error } = await supabase.from('movimenti_cassa').select('*, staff(nome)').eq('sala_id', currentSalaId).gte('created_at', dataInizio.toISOString()).lte('created_at', dataFine.toISOString()).order('created_at', { ascending: false });
      if (formato === 'csv' && data) {
         let csvContent = "Data e Ora;Causale;Operatore;Metodo Pagamento;Tipo Movimento;Importo\n";
         data.forEach(m => { csvContent += `${new Date(m.created_at).toLocaleString('it-IT')};${m.descrizione?.replace(/;/g, ',')};${m.staff?.nome || "ADMIN"};${m.metodo_pagamento.toUpperCase()};${m.tipo.toUpperCase()};${parseFloat(m.importo).toFixed(2)}\n`; });
         const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
         const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Storico_Cassa.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
      }
    } catch (e) { alert("Errore"); }
  };

  const scaricaSociPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(202, 138, 4); doc.text(nomeSala.toUpperCase(), 14, 20);
    autoTable(doc, { startY: 55, head: [["Cognome", "Nome", "Telefono", "Credito"]], body: soci.map(s => [s.cognome.toUpperCase(), s.nome.toUpperCase(), s.telefono || "-", '€ ' + parseFloat(s.credito || 0).toFixed(2)]) });
    doc.save("Soci.pdf");
  };

  const scaricaMagazzinoPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text(nomeSala.toUpperCase(), 14, 20);
    autoTable(doc, { startY: 55, head: [["Prodotto", "Prezzo", "Quantità", "Valore Totale"]], body: prodotti.map(p => [p.nome.toUpperCase(), `€ ${parseFloat(p.prezzo_vendita).toFixed(2)}`, p.quantita_stock.toString(), `€ ${(p.quantita_stock * parseFloat(p.prezzo_vendita)).toFixed(2)}`]) });
    doc.save("Magazzino.pdf");
  };

  const scaricaPrenotazioniPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text(nomeSala.toUpperCase(), 14, 20);
    autoTable(doc, { startY: 45, head: [["Data e Ora", "Cliente", "Telefono", "Stato", "Note"]], body: getPrenotazioniFiltrate().map(p => { const d = new Date(p.data_ora); return [`${d.toLocaleDateString()} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`, p.nome_cliente.toUpperCase(), p.telefono || "-", p.stato.toUpperCase().replace('_', ' '), p.note || ""]; }) });
    doc.save("Prenotazioni.pdf");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl tracking-widest italic animate-pulse">CARICAMENTO TORRE DI CONTROLLO...</div>;
 return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter overflow-x-hidden relative print:bg-white print:text-black">
        
        {isSalaSuspended && (
          <div className="fixed top-0 left-0 w-full z-[150] bg-red-600 text-white py-3 px-6 text-center font-black uppercase tracking-widest shadow-2xl animate-pulse print:hidden">
            ⚠️ MODALITÀ SOLA LETTURA: IL SERVIZIO È SOSPESO. NON È POSSIBILE EFFETTUARE NUOVE OPERAZIONI.
          </div>
        )}

        {pendingPrenotazioni.length > 0 && !isSalaSuspended && (
          <div onClick={() => setActiveView('prenotazioni')} className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-teal-500 border-4 border-white text-black px-6 py-3 rounded-full font-black uppercase text-lg shadow-[0_0_40px_rgba(20,184,166,0.8)] animate-bounce flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform print:hidden">
            <span className="text-3xl">🔔</span>
            <span>{pendingPrenotazioni.length} Prenotazion{pendingPrenotazioni.length === 1 ? 'e' : 'i'} in Attesa!</span>
            <span className="bg-black text-teal-400 px-3 py-1 rounded-full text-xs ml-2 shadow-inner">VAI A GESTIRE</span>
          </div>
        )}

        <button onClick={() => setIsHelpModalOpen(true)} className="fixed bottom-6 right-6 z-40 bg-cyan-900 border-2 border-cyan-500 hover:bg-cyan-500 text-cyan-100 hover:text-black font-black rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] hover:scale-110 transition-all duration-300" title="Apri Manuale Operativo">❓</button> 

      {activeStaff && (
        <div className="absolute top-6 right-6 z-40 bg-gray-900 border border-cyan-600 px-6 py-3 rounded-2xl flex items-center gap-6 shadow-[0_0_15px_rgba(8,145,178,0.3)] animate-in slide-in-from-top print:hidden">
          <div><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Operatore Attivo</p><p className="text-cyan-400 font-black text-lg uppercase italic leading-none">{activeStaff.nome}</p></div>
          <button onClick={() => setActiveStaff(null)} className="bg-red-950 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors">CAMBIO TURNO</button>
        </div>
      )}

      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-gray-900 border-2 border-cyan-600 p-8 md:p-12 rounded-[3rem] shadow-[0_0_50px_rgba(6,182,212,0.2)] max-w-4xl w-full max-h-[90vh] overflow-y-auto relative custom-scrollbar">
            <button onClick={() => setIsHelpModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-gray-800 hover:bg-red-600 rounded-full w-12 h-12 flex items-center justify-center transition-all text-2xl font-black">✕</button>
            <div className="text-center mb-10"><span className="text-5xl mb-4 block">📖</span><h2 className="text-3xl md:text-4xl font-black text-cyan-400 uppercase tracking-widest">Manuale Operativo</h2></div>
            <div className="mt-12 text-center"><button onClick={() => setIsHelpModalOpen(false)} className="bg-cyan-600 hover:bg-cyan-500 text-black font-black text-lg py-5 px-10 rounded-[2rem] shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all uppercase tracking-widest w-full md:w-auto">Ho capito, chiudi guida</button></div>
          </div>
        </div>
      )}

      <div className={`print:hidden ${isSalaSuspended ? 'pt-16' : ''}`}>
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
              <button onClick={() => setActiveView("prenotazioni")} className="bg-gray-900 border-2 border-teal-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all relative"><div className="text-5xl mb-4">📅</div><h2 className="text-xl font-black uppercase">Prenotazioni</h2></button>
              <button onClick={() => setActiveView("tornei")} className="bg-gray-900 border-2 border-pink-600 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">🏆</div><h2 className="text-xl font-black uppercase">Tornei</h2></button>
              <button onClick={() => setActiveView("bacheca")} className="bg-gray-900 border-2 border-orange-500 p-8 rounded-[2.5rem] shadow-2xl hover:bg-gray-800 transition-all"><div className="text-5xl mb-4">📢</div><h2 className="text-xl font-black uppercase">Bacheca</h2></button>
              <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="col-span-1 md:col-span-3 bg-red-950/30 border-2 border-red-600 p-6 rounded-[2rem] text-red-500 font-black uppercase mt-0 flex items-center justify-center">Esci dal Sistema</button>
            </div>
          </div>
        )}

        {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 border-2 border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase italic flex items-center justify-center gap-4 transition-all hover:bg-gray-800">🔙 MENU PRINCIPALE</button>)}

        {/* BACHECA */}
        {activeView === 'bacheca' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8">
            <h3 className="text-4xl font-black text-orange-500 uppercase italic mb-8 text-center drop-shadow-md">Bacheca Avvisi</h3>
            {!isSalaSuspended && (
              <div className="bg-gray-900 p-6 rounded-[2rem] border-2 border-orange-900 mb-10 shadow-xl">
                <textarea value={newPostText} onChange={(e) => setNewPostText(e.target.value)} placeholder="Scrivi un nuovo avviso per i soci..." className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-lg text-white mb-4 outline-none resize-none h-32 focus:border-orange-500 transition-colors" />
                <button onClick={() => richiedePin((sid) => salvaNuovoPost(sid), "Pubblica in Bacheca")} className="w-full py-5 bg-orange-600 text-white font-black uppercase text-xl rounded-2xl shadow-xl active:scale-95 transition-all">📣 PUBBLICA AVVISO</button>
              </div>
            )}
            <div className="space-y-6">
              {bachecaPosts.map((post) => (
                <div key={post.id} className="bg-gray-950 border border-gray-800 p-6 rounded-3xl shadow-lg relative">
                  {!isSalaSuspended && <button onClick={() => richiedePin((sid) => eliminaPost(post.id, sid), "Elimina Avviso")} className="absolute top-4 right-4 text-red-900 hover:text-red-500 transition-colors p-2 text-xl">🗑️</button>}
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-3">🗓️ {new Date(post.created_at).toLocaleDateString()}</p>
                  <p className="text-xl text-white whitespace-pre-wrap mb-6">{post.testo}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLANCIA */}
        {activeView === 'plancia' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            {!isSalaSuspended && <button onClick={() => setIsNewTableModalOpen(true)} className="w-full mb-8 py-8 bg-gray-900 border-4 border-dashed border-green-900 rounded-[2.5rem] text-green-500 font-black text-2xl uppercase italic hover:bg-green-900/10 transition-all">+ AGGIUNGI TAVOLO</button>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tavoli.map((t) => (
                <div key={t.id} className={`p-8 rounded-[2.5rem] border-4 transition-colors shadow-2xl ${t.stato === 'IN GIOCO' ? 'border-red-600 bg-gray-900' : t.stato === 'PRENOTATO' ? 'border-yellow-500 bg-yellow-900/30' : 'border-green-900 bg-gray-950'}`}>
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-4xl font-black italic">{t.nome}</h3>
                    <div className="flex flex-col items-end gap-2">
                       <div className={`h-6 w-6 rounded-full ${t.stato === 'LIBERO' ? 'bg-green-500' : t.stato === 'PRENOTATO' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div>
                       {t.stato === 'LIBERO' && !isSalaSuspended && (
                         <div className="flex gap-2 mt-2">
                           <button onClick={() => apriModificaTavolo(t)} className="bg-blue-900/50 hover:bg-blue-600 text-blue-300 hover:text-white p-2 rounded-lg transition-colors text-xs font-black uppercase" title="Modifica Tavolo">✏️</button>
                           <button onClick={async () => { if(confirm(`Vuoi davvero eliminare il ${t.nome}?`)) { await supabase.from('tavoli').delete().eq('id', t.id); refreshDati(currentSalaId!); } }} className="bg-red-950/50 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded-lg transition-colors text-xs font-black uppercase" title="Elimina Tavolo">🗑️</button>
                         </div>
                       )}
                    </div>
                  </div>
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
                  {!isSalaSuspended && t.stato === 'LIBERO' && (
                    <div className="flex gap-4">
                      <button onClick={() => { setActiveTableId(t.id); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-700 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">AVVIA</button>
                      <button onClick={() => { setActiveTableId(t.id); setIsReserveModalOpen(true); }} className="flex-1 py-8 bg-yellow-600 rounded-3xl text-3xl shadow-xl active:scale-95">📅</button>
                    </div>
                  )}
                  {!isSalaSuspended && t.stato === 'PRENOTATO' && (
                    <div className="flex gap-4">
                      <button onClick={() => { setActiveTableId(t.id); setReserveName(t.prenotato_da); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">INIZIA PARTITA</button>
                      <button onClick={() => richiedePin((sid) => annullaPrenotazioneTavolo(t.id, sid), "Annulla Prenotazione")} className="flex-1 py-8 bg-gray-800 text-red-500 rounded-3xl text-xl shadow-xl active:scale-95">❌</button>
                    </div>
                  )}
                  {!isSalaSuspended && t.stato === 'IN GIOCO' && (
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
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAGAZZINO, SOCI E CASSA */}
        {activeView === 'magazzino' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {!isSalaSuspended && <button onClick={() => setIsNewProductModalOpen(true)} className="flex-[2] py-8 bg-blue-600 rounded-[2.5rem] text-white font-black text-2xl uppercase shadow-xl hover:bg-blue-500 transition-colors">+ NUOVO PRODOTTO BAR</button>}
              <button onClick={scaricaMagazzinoPDF} className="flex-1 py-8 bg-gray-900 border-2 border-blue-500 text-blue-500 font-black text-xl uppercase shadow-xl rounded-[2.5rem] hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-95"><span>🖨️</span> INVENTARIO (PDF)</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {prodotti.map((p) => (
                <div key={p.id} className="bg-gray-900 p-6 rounded-[2rem] border-2 border-gray-800 text-center flex flex-col justify-between shadow-xl">
                  <div>
                    <h4 className="text-xl font-black uppercase italic mb-2">{p.nome}</h4>
                    <p className="text-blue-400 font-black text-lg mb-4">€ {parseFloat(p.prezzo_vendita).toFixed(2)}</p>
                    <div className={`py-2 rounded-xl font-black text-xs uppercase mb-4 ${p.quantita_stock > 5 ? 'bg-green-900/20 text-green-500' : 'bg-red-950 text-red-500 animate-pulse'}`}>STOCK: {p.quantita_stock}</div>
                  </div>
                  {!isSalaSuspended && (
                    <div className="flex gap-2 mt-auto border-t border-gray-800 pt-4">
                      <button onClick={() => apriModificaProdotto(p)} className="flex-1 bg-blue-900/50 border border-blue-800 text-blue-400 py-2 rounded-xl text-[10px] font-black uppercase">✏️ Modifica</button>
                      <button onClick={() => richiedePin((sid) => eliminaProdotto(p.id, sid), "Elimina Prodotto")} className="flex-1 bg-red-950/50 border border-red-900 text-red-500 py-2 rounded-xl text-[10px] font-black uppercase">🗑️ Elimina</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'soci' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {!isSalaSuspended && <button onClick={() => setIsNewSocioModalOpen(true)} className="flex-[2] py-8 bg-yellow-600 text-black font-black text-2xl uppercase shadow-xl rounded-[2rem]">+ NUOVO SOCIO</button>}
              <button onClick={scaricaSociPDF} className="flex-1 py-8 bg-gray-900 border-2 border-yellow-500 text-yellow-500 font-black text-xl uppercase shadow-xl rounded-[2rem]"><span>🖨️</span> STAMPA ELENCO (PDF)</button>
            </div>
            <div className="bg-gray-900 border-2 border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <table className="w-full text-left font-bold">
                <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                  <tr><th className="p-6">Socio</th><th className="p-6">Credito Attuale</th><th className="p-6 text-center">App Personale</th><th className="p-6 text-right">Azione</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {soci.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-800/30 transition-all">
                      <td className="p-6 text-xl uppercase italic">{s.cognome} {s.nome}</td>
                      <td className="p-6 text-2xl text-green-500 italic">€ {parseFloat(s.credito || 0).toFixed(2)}</td>
                      <td className="p-6 text-center"><button onClick={() => inviaLinkWhatsApp(s)} className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 mx-auto"><span className="text-lg">💬</span> Invia WhatsApp</button></td>
                      <td className="p-6 text-right">
                        {!isSalaSuspended && (
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => apriModificaSocio(s)} className="bg-blue-900/50 border border-blue-700 text-blue-300 px-4 py-3 rounded-xl text-xs font-black uppercase">✏️ Modifica</button>
                            <button onClick={() => { setSocioToRecharge(s); setIsRechargeModalOpen(true); }} className="bg-green-600 text-black px-4 py-3 rounded-xl text-xs font-black uppercase">💰 Ricarica</button>
                            <button onClick={() => richiedePin((sid) => eliminaSocio(s.id, sid), "Elimina Socio")} className="bg-red-950/80 border border-red-800 text-red-500 px-4 py-3 rounded-xl text-xs font-black uppercase">🗑️ Elimina</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'report' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8 text-center">
            {!isSalaSuspended && <button onClick={() => setIsNewUscitaModalOpen(true)} className="w-full mb-8 py-8 bg-red-600 text-white font-black text-2xl uppercase shadow-xl rounded-[2rem]">- REGISTRA SPESA / USCITA CASSA</button>}
            <div className="flex flex-col md:flex-row gap-4 mb-12">
              <button onClick={scaricaPrimaNotaPDF} className="flex-1 py-6 bg-gray-900 border-2 border-green-500 text-green-400 font-black text-xl uppercase shadow-xl rounded-[2rem]"><span>🖨️</span> STAMPA PRIMA NOTA</button>
              <button onClick={esportaCSV} className="flex-1 py-6 bg-gray-900 border-2 border-blue-500 text-blue-400 font-black text-xl uppercase shadow-xl rounded-[2rem]"><span>📥</span> SCARICA (EXCEL)</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-green-600"><p className="text-green-500 font-black uppercase text-[10px] tracking-widest mb-2">Totale Entrate Oggi</p><h3 className="text-4xl font-black text-white italic">€ {incassoTotale.toFixed(2)}</h3></div>
              <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-red-600"><p className="text-red-500 font-black uppercase text-[10px] tracking-widest mb-2">Totale Uscite Oggi</p><h3 className="text-4xl font-black text-white italic">€ {usciteTotali.toFixed(2)}</h3></div>
              <div className="bg-cyan-950 p-8 rounded-[3rem] border-4 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)] md:col-span-2"><p className="text-cyan-400 font-black uppercase text-[10px] tracking-widest mb-2">Saldo Cassetto</p><h3 className="text-5xl font-black text-cyan-300 italic">€ {incassoContanti.toFixed(2)}</h3><p className="text-gray-500 text-xs mt-2 uppercase font-bold tracking-widest">In POS/Banca: € {incassoPOS.toFixed(2)}</p></div>
            </div>
            {datiGrafico.length > 0 && (
              <div className="bg-gray-900 border-2 border-gray-800 rounded-[3rem] p-8 mb-12 shadow-2xl">
                <h3 className="text-2xl font-black text-green-500 uppercase italic mb-8 text-left">Andamento Incassi (Ultimi 7 Giorni)</h3>
                <div className="flex items-end justify-around gap-2 h-48 mt-8 border-b-2 border-gray-800 pb-2">
                  {datiGrafico.map((g, idx) => {
                    const maxIncasso = Math.max(...datiGrafico.map(d => d.totale), 10);
                    const altezza = `${(g.totale / maxIncasso) * 100}%`;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group h-full justify-end">
                        <div className="opacity-0 group-hover:opacity-100 text-green-400 font-black text-sm mb-2 transition-opacity">€ {g.totale.toFixed(0)}</div>
                        <div className="w-full max-w-[50px] bg-green-900/30 group-hover:bg-green-500 transition-colors rounded-t-xl border-b-4 border-green-500 relative" style={{ height: altezza, minHeight: '8px' }}></div>
                        <div className="text-gray-500 text-xs font-bold mt-4 uppercase tracking-widest">{g.data}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="bg-gray-900 border-2 border-gray-800 rounded-[3rem] p-8 mb-12 shadow-2xl">
              <h3 className="text-2xl font-black text-blue-500 uppercase italic mb-2 text-left">Esportazione Storico Avanzata</h3>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full"><label className="block text-gray-500 text-xs font-black uppercase mb-2 text-left">Dal</label><input type="date" value={storicoDal} onChange={(e) => setStoricoDal(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none" /></div>
                <div className="flex-1 w-full"><label className="block text-gray-500 text-xs font-black uppercase mb-2 text-left">Al</label><input type="date" value={storicoAl} onChange={(e) => setStoricoAl(e.target.value)} className="w-full bg-black border border-gray-800 p-4 rounded-2xl text-white outline-none" /></div>
                <div className="flex-[2] w-full flex gap-2 mt-6 md:mt-0 self-end">
                   <button onClick={() => esportaStorico('pdf')} className="flex-1 bg-blue-900/50 border border-blue-600 text-blue-400 py-4 rounded-2xl font-black uppercase shadow-lg text-sm">📄 SCARICA PDF</button>
                   <button onClick={() => esportaStorico('csv')} className="flex-1 bg-green-900/50 border border-green-600 text-green-400 py-4 rounded-2xl font-black uppercase shadow-lg text-sm">📊 SCARICA EXCEL</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'staff' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            {!isSalaSuspended && <button onClick={() => setIsNewStaffModalOpen(true)} className="mb-8 w-full py-8 bg-cyan-600 rounded-[2rem] font-black text-2xl text-black uppercase shadow-xl">+ AGGIUNGI STAFF</button>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {listaStaff.map((s) => (
                <div key={s.id} className="bg-gray-900 p-6 md:p-8 rounded-[2.5rem] border-2 border-cyan-900 flex justify-between items-center shadow-2xl gap-4">
                  <div className="flex-1 min-w-0"><h4 className="text-lg md:text-xl font-black uppercase text-white italic break-all">{s.nome}</h4><p className="text-cyan-500 font-mono font-bold text-base md:text-lg mt-1 tracking-[0.2em] md:tracking-[0.5em]">PIN: {s.pin}</p></div>
                  {!isSalaSuspended && <button onClick={async () => { if(confirm("Eliminare staff?")) { await supabase.from('staff').delete().eq('id', s.id); refreshDati(currentSalaId!); } }} className="shrink-0 bg-red-950 text-red-500 p-4 md:p-5 rounded-2xl shadow-lg hover:bg-red-900 transition-colors">🗑️</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- SEZIONE IMPOSTAZIONI --- */}
        {activeView === 'impostazioni' && (
          <div className="max-w-2xl mx-auto bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 animate-in slide-in-from-bottom-8 shadow-2xl">
            <h3 className="text-3xl font-black text-white uppercase italic mb-8 border-b border-gray-800 pb-4">Configurazione Tariffe</h3>
            <div className="space-y-8 mb-12">
              <div><label className="block text-gray-500 font-black text-xs uppercase mb-4 text-left">Standard (€/h)</label><input type="number" value={tariffaStandard} onChange={(e) => setTariffaStandard(parseFloat(e.target.value))} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl text-white font-black" disabled={isSalaSuspended} /></div>
              <div><label className="block text-yellow-500 font-black text-xs uppercase mb-4 text-left">Soci (€/h)</label><input type="number" value={tariffaSoci} onChange={(e) => setTariffaSoci(parseFloat(e.target.value))} className="w-full bg-black border border-yellow-900 p-6 rounded-2xl text-4xl text-white font-black" disabled={isSalaSuspended} /></div>
            </div>
            {!isSalaSuspended && <button onClick={() => richiedePin((sid) => salvaTariffe(sid), "Aggiornamento Tariffe")} className="w-full py-8 bg-green-600 text-black font-black uppercase text-xl rounded-3xl shadow-xl active:scale-95 transition-all">SALVA TARIFFE</button>}
          </div>
        )}

        {/* SEZIONE PRENOTAZIONI */}
        {activeView === 'prenotazioni' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            <h3 className="text-4xl font-black text-teal-500 uppercase italic mb-8 text-center drop-shadow-md">Gestione Prenotazioni</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getPrenotazioniFiltrate().map((p) => {
                  const dataPrenotazione = new Date(p.data_ora);
                  const isDaImpostare = p.stato === 'in_attesa';
                  return (
                    <div key={p.id} className={`border-2 p-6 rounded-3xl shadow-xl flex flex-col justify-between transition-colors ${isDaImpostare ? 'bg-gray-900 border-teal-600' : 'bg-gray-950 border-gray-800'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-2xl font-black italic text-white uppercase truncate pr-2">{p.nome_cliente}</h4>
                          <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase whitespace-nowrap ${isDaImpostare ? 'bg-teal-900 text-teal-300 animate-pulse' : p.stato === 'confermata' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>{p.stato.replace('_', ' ')}</span>
                        </div>
                        <div className="mb-4">
                          <p className="text-teal-500 font-bold uppercase text-xs tracking-widest">Data e Ora</p>
                          <p className="text-xl font-mono font-black text-white">{dataPrenotazione.toLocaleDateString()} - {dataPrenotazione.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        {isDaImpostare && !isSalaSuspended && (
                          <>
                            <button onClick={() => richiedePin((sid) => gestisciStatoPrenotazione(p.id, 'confermata', sid), "Conferma Prenotazione")} className="flex-[2] bg-teal-600 text-black font-black uppercase py-3 rounded-xl hover:bg-teal-500 transition-colors shadow-lg">Conferma</button>
                            <button onClick={() => richiedePin((sid) => gestisciStatoPrenotazione(p.id, 'rifiutata', sid), "Rifiuta Prenotazione")} className="flex-[1] bg-gray-800 text-red-500 font-black uppercase py-3 rounded-xl hover:bg-red-900 hover:text-white transition-colors">Rifiuta</button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
          </div>
        )}

        {/* TORNEI E TABELLONE LIVE/MOBILE */}
        {activeView === 'tornei' && (
          <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
            {!isSalaSuspended && <button onClick={() => setIsNewTorneoModalOpen(true)} className="w-full mb-8 py-8 bg-pink-600 text-white font-black text-2xl uppercase shadow-xl">+ NUOVO TORNEO</button>}
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
                          <button onClick={() => { setActiveTorneo(tr); setIsManageIscrittiOpen(true); }} className="w-full py-4 bg-pink-900/50 border border-pink-700 text-pink-300 font-black uppercase rounded-2xl hover:bg-pink-700 hover:text-white transition-all">Gestisci Iscritti ({(tr.iscritti || []).length})</button>
                          {!isSalaSuspended && <button onClick={() => richiedePin((sid) => avviaTorneo(tr, sid), "Avvio Torneo")} className="w-full py-4 bg-green-600 text-black font-black uppercase rounded-2xl hover:bg-green-500 transition-all shadow-lg">🔀 AVVIA TABELLONE</button>}
                        </>
                      )}
                      {tr.stato === 'in_corso' && (
                        <button onClick={() => { setActiveTorneo(tr); setIsBracketModalOpen(true); }} className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-2xl hover:bg-blue-500 transition-all shadow-lg flex justify-center items-center gap-2"><span>🏆</span> APRI TABELLONE LIVE</button>
                      )}
                      {tr.stato === 'completato' && (
                        <button onClick={() => { setActiveTorneo(tr); setIsBracketModalOpen(true); }} className="w-full py-4 bg-gray-700 text-white font-black uppercase rounded-2xl hover:bg-gray-600 transition-all flex justify-center items-center gap-2"><span>📜</span> RISULTATI FINALI</button>
                      )}
                      <button onClick={() => {
                          const testoShare = encodeURIComponent(`🏆 Segui il tabellone del torneo "${tr.nome}" live da qui:\n${window.location.origin}/tornei`);
                          window.open(`https://wa.me/?text=${testoShare}`, '_blank');
                        }} className="w-full py-4 bg-green-600 text-black font-black uppercase rounded-2xl hover:bg-green-500 transition-all text-sm mt-2 shadow-lg flex items-center justify-center gap-2">
                        💬 CONDIVIDI SU WHATSAPP
                      </button>
                      {!isSalaSuspended && <button onClick={async () => { if(confirm("Eliminare definitivamente il torneo?")) { await supabase.from('tornei').delete().eq('id', tr.id); refreshDati(currentSalaId!); } }} className="w-full text-gray-600 text-[10px] font-bold uppercase hover:text-red-500 py-2 mt-1">Elimina Torneo</button>}
                    </div>
                  </div>
                ))}
              </div>
          </div>
        )}
      </div>

      {/* ---------------- MODALI ---------------- */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-[200] animate-in zoom-in-95 print:hidden">
          <div className="w-full max-w-[320px] bg-[#0B1021] border-4 border-pink-500 p-8 rounded-[3rem] shadow-[0_0_40px_rgba(236,72,153,0.2)] text-center relative">
            <div className="flex justify-center gap-4 mb-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border-2 border-cyan-400 ${pinBuffer.length > i ? 'bg-cyan-400 shadow-[0_0_15px_#22d3ee]' : 'bg-transparent'}`}></div>
              ))}
            </div>
            <h2 className="text-3xl font-black text-pink-500 mb-1 italic uppercase tracking-tighter">{pendingAction?.descrizione}</h2>
            <div className="grid grid-cols-3 gap-3">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "X"].map((btn) => (
                <button key={btn} onClick={() => { if(btn === 'X') { setIsPinModalOpen(false); setPinBuffer(""); } else if(btn === 'C') setPinBuffer(""); else handlePinDigit(btn); }} className={`aspect-square rounded-[1.5rem] text-4xl font-black transition-all active:scale-95 flex items-center justify-center shadow-lg ${btn === 'X' ? 'bg-[#1e293b] text-gray-500' : btn === 'C' ? 'bg-[#450a0a] text-red-500' : 'bg-[#0f172a] text-white hover:bg-[#1e293b]'}`}>{btn}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isBracketModalOpen && activeTorneo && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in zoom-in-95 print:relative print:bg-white print:text-black print:p-0 print:block">
          <div className="bg-gray-950 border-4 border-blue-600 p-4 md:p-8 rounded-[3rem] w-full max-w-[95vw] shadow-2xl flex flex-col max-h-[95vh] relative print:border-none print:shadow-none print:bg-white print:max-h-none print:h-auto print:overflow-visible">
            <button onClick={() => { setIsBracketModalOpen(false); setActiveTorneo(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white text-3xl font-black transition-colors z-20 bg-black hover:bg-red-600 w-16 h-16 rounded-full flex items-center justify-center border-4 border-gray-700 shadow-2xl print:hidden">✕</button>
            <h3 className="text-3xl md:text-5xl font-black text-blue-500 mb-2 mt-16 md:mt-0 uppercase italic text-center print:text-black">{activeTorneo.nome}</h3>
            <p className="text-gray-400 text-center font-bold mb-8 uppercase tracking-widest print:text-gray-600">{activeTorneo.stato === 'completato' ? '🏆 TABELLONE FINALE 🏆' : 'SCONTRI DIRETTI IN CORSO'}</p>

            <div className="flex-1 overflow-x-auto overflow-y-auto bg-black p-4 md:p-8 rounded-3xl border-4 border-gray-900 shadow-inner custom-scrollbar relative print:bg-white print:border-none print:shadow-none print:overflow-visible">
              <div className="flex flex-row min-w-max h-full min-h-[500px] gap-8 md:gap-12 print:gap-8">
                {activeTorneo.tabellone?.map((turno: any, turnoIndex: number) => (
                  <div key={turnoIndex} className="flex flex-col justify-around w-64 md:w-80 relative print:w-48">
                    <div className="absolute -top-4 w-full text-center border-b-2 border-gray-800 pb-2 print:border-gray-300">
                       <span className="bg-blue-900/50 text-blue-400 font-black uppercase tracking-widest px-4 py-1 rounded-lg text-xs print:bg-gray-200 print:text-black print:border print:border-black">Turno {turnoIndex + 1}</span>
                    </div>
                    {turno.map((match: any) => (
                      <div key={match.id} className="relative w-full bg-gray-900 border border-gray-700 rounded-2xl shadow-xl flex flex-col z-10 overflow-hidden mt-8 mb-8 print:bg-white print:border-black print:shadow-none">
                        <button 
                          onClick={() => { if(!match.vincitore && activeTorneo.stato !== 'completato' && !isSalaSuspended) richiedePin((sid) => impostaVincitore(turnoIndex, match.id, match.p1, sid), "Vittoria Giocatore 1") }}
                          disabled={!!match.vincitore || isSalaSuspended}
                          className={`px-4 py-5 md:py-6 border-b border-gray-800 flex justify-between items-center transition-all print:border-black print:text-black print:bg-white active:scale-95 ${match.vincitore?.id === match.p1.id ? 'bg-green-600 text-black font-black print:font-black' : match.vincitore ? 'bg-gray-800 text-gray-500' : 'bg-gray-900 hover:bg-blue-900 text-white font-bold'}`}
                        >
                          <span className="uppercase truncate w-full text-left text-base md:text-lg">{match.p1.nome}</span>
                          {match.vincitore?.id === match.p1.id && <span className="text-xl ml-2 print:text-black">🏆</span>}
                        </button>
                        {match.p2 ? (
                          <button 
                            onClick={() => { if(!match.vincitore && activeTorneo.stato !== 'completato' && !isSalaSuspended) richiedePin((sid) => impostaVincitore(turnoIndex, match.id, match.p2, sid), "Vittoria Giocatore 2") }}
                            disabled={!!match.vincitore || isSalaSuspended}
                            className={`px-4 py-5 md:py-6 flex justify-between items-center transition-all print:text-black print:bg-white active:scale-95 ${match.vincitore?.id === match.p2.id ? 'bg-green-600 text-black font-black print:font-black' : match.vincitore ? 'bg-gray-800 text-gray-500' : 'bg-gray-900 hover:bg-blue-900 text-white font-bold'}`}
                          >
                            <span className="uppercase truncate w-full text-left text-base md:text-lg">{match.p2.nome}</span>
                            {match.vincitore?.id === match.p2.id && <span className="text-xl ml-2 print:text-black">🏆</span>}
                          </button>
                        ) : (
                          <div className="py-3 px-4 text-gray-600 font-black text-center uppercase tracking-widest text-xs bg-gray-950 print:bg-white print:text-gray-400">
                            BYE (Passaggio Diretto)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col md:flex-row gap-4 print:hidden">
              {activeTorneo.stato === 'in_corso' && !isSalaSuspended && (
                <button onClick={() => richiedePin((sid) => generaProssimoTurno(sid), "Genera Turno / Concludi")} className="flex-[3] py-6 bg-blue-600 text-white uppercase font-black rounded-3xl hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95 text-xl">
                  AVANZA AL TURNO / CONCLUDI
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