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
    doc.setTextColor(50, 5, 5);
  }}