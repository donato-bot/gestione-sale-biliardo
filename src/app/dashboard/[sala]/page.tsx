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
  const [activeView, setActiveView] = useState<"hub" | "plancia" | "magazzino" | "report" | "soci" | "impostazioni" | "statistiche">("hub");
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentSalaId, setCurrentSalaId] = useState<string | null>(null);
  const [nomeSala, setNomeSala] = useState<string>("La Mia Sala");
  
  const [tariffaStandard, setTariffaStandard] = useState(10.00);
  const [tariffaSoci, setTariffaSoci] = useState(8.00);

  const [tavoli, setTavoli] = useState<any[]>([]);
  const [recenti, setRecenti] = useState<any[]>([]);
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [soci, setSoci] = useState<any[]>([]);
  
  const [incassoTotale, setIncassoTotale] = useState(0);
  const [incassoContanti, setIncassoContanti] = useState(0);
  const [incassoPOS, setIncassoPOS] = useState(0);
  const [conteggioSessioni, setConteggioSessioni] = useState(0);

  const [activeTableId, setActiveTableId] = useState<string | null>(null); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  
  const [socioForStatement, setSocioForStatement] = useState<any>(null);
  const [statementHistory, setStatementHistory] = useState<any[]>([]);
  const [isPrintingStatement, setIsPrintingStatement] = useState(false);
  const [reserveName, setReserveName] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [socioToRecharge, setSocioToRecharge] = useState<any>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
  const [statsStorico, setStatsStorico] = useState<{ giorni: any[], topProdotto: string, topTavolo: string, incassoMese: number } | null>(null);

  const [players, setPlayers] = useState(["", "", "", ""]);
  const [selectedSocioId, setSelectedSocioId] = useState(""); 
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedProdottoId, setSelectedProdottoId] = useState("");
  const [quantitaBar, setQuantitaBar] = useState(1);
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newSocioNome, setNewSocioNome] = useState("");
  const [newSocioCognome, setNewSocioCognome] = useState("");
  const [newSocioTelefono, setNewSocioTelefono] = useState("");
  const [newSocioTessera, setNewSocioTessera] = useState("");
  
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email ?? null;
        setUserEmail(email);
        const { data: salaData } = await supabase.from("sale").select("*").eq("manager_email", email).single();
        if (salaData) {
          setCurrentSalaId(salaData.id);
          setNomeSala(salaData.name);
          setTariffaStandard(salaData.tariffa_standard || 10.00);
          setTariffaSoci(salaData.tariffa_soci || 8.00);
          await refreshDati(salaData.id);
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function refreshDati(salaId: string) {
    const oggi = new Date();
    oggi.setHours(0, 0, 0, 0);

    const { data: tDB } = await supabase.from('tavoli').select('*').eq('sala_id', salaId).order('numero', { ascending: true });
    const { data: sDB } = await supabase.from('sessioni').select('*, consumazioni(*)').eq('sala_id', salaId).eq('stato', 'in_corso');
    const { data: pDB } = await supabase.from('prodotti').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
    const { data: rDB } = await supabase.from('sessioni').select('*').eq('sala_id', salaId).eq('stato', 'terminata').gte('fine', oggi.toISOString()).order('fine', { ascending: false });
    const { data: sociDB } = await supabase.from('soci').select('*').eq('sala_id', salaId).order('cognome', { ascending: true });

    if (pDB) setProdotti(pDB);
    if (sociDB) setSoci(sociDB);
    if (rDB) {
      setRecenti(rDB);
      let tot = 0, contanti = 0, pos = 0;
      rDB.forEach(r => {
        const importo = parseFloat(r.costo_totale || 0);
        if (r.metodo_pagamento === 'credito') return; 
        tot += importo;
        if (r.metodo_pagamento === 'pos') pos += importo;
        else if (r.metodo_pagamento === 'misto') { pos += (importo / 2); contanti += (importo / 2); }
        else contanti += importo; 
      });
      setIncassoTotale(tot);
      setIncassoContanti(contanti);
      setIncassoPOS(pos);
      setConteggioSessioni(rDB.length);
    }
    if (tDB) {
      setTavoli(tDB.map(t => {
        const sess = sDB?.find(s => s.tavolo_id === t.id);
        const consumazioniDettaglio = sess?.consumazioni?.map(c => {
           const p = pDB?.find(prod => prod.id === c.prodotto_id);
           return { ...c, nome_prodotto: p?.nome || "Prodotto" };
        }) || [];
        const bTot = consumazioniDettaglio.reduce((acc: number, c: any) => acc + (c.prezzo_istante * c.quantita), 0);
        let statoEffettivo = "LIBERO";
        if (t.stato === 'prenotato') statoEffettivo = "PRENOTATO";
        if (t.stato === 'occupato') statoEffettivo = "IN GIOCO";
        return {
          id: t.id, numero: t.numero, nome: `Tavolo ${t.numero}`, 
          prezzo: sess ? sess.tariffa_oraria : tariffaStandard, 
          stato: statoEffettivo, startTime: sess ? new Date(sess.inizio).getTime() : null,
          giocatori: sess?.giocatori || [], barTotal: bTot, sessioneId: sess?.id, socio_id: sess?.socio_id,
          consumazioni: consumazioniDettaglio, prenotato_da: t.prenotato_da, prenotato_alle: t.prenotato_alle
        };
      }));
    }
  }

  const formattaCronometro = (startTime: number | null) => {
    if (!startTime) return "00:00:00";
    const diff = Math.max(0, now - startTime);
    const ore = Math.floor(diff / 3600000);
    const minuti = Math.floor((diff % 3600000) / 60000);
    const secondi = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const apriStatistiche = async () => {
    setActiveView("statistiche");
    setStatsStorico(null); 
    if(!currentSalaId) return;
    try {
      const trentaGiorniFa = new Date();
      trentaGiorniFa.setDate(trentaGiorniFa.getDate() - 30);
      const { data: sDB } = await supabase.from('sessioni').select('*, consumazioni(*)').eq('sala_id', currentSalaId).eq('stato', 'terminata').gte('fine', trentaGiorniFa.toISOString());
      if(!sDB || sDB.length === 0) {
        setStatsStorico({ giorni: [], topProdotto: "Nessun Dato", topTavolo: "Nessun Dato", incassoMese: 0 });
        return;
      }
      const incassoMese = sDB.reduce((acc, s) => {
        if (s.metodo_pagamento === 'credito') return acc;
        const costo = parseFloat(s.costo_totale);
        return isNaN(costo) ? acc : acc + costo;
      }, 0);
      const tavoliCount: Record<string, number> = {};
      sDB.forEach(s => { if(s.tavolo_id) tavoliCount[s.tavolo_id] = (tavoliCount[s.tavolo_id] || 0) + 1; });
      let topTavolo = "Nessun Dato";
      if (Object.keys(tavoliCount).length > 0) {
         const topTavoloId = Object.keys(tavoliCount).sort((a,b) => tavoliCount[b] - tavoliCount[a])[0];
         topTavolo = tavoli.find(t => t.id === topTavoloId)?.nome || "Tavolo Eliminato";
      }
      const prodottiCount: Record<string, number> = {};
      sDB.forEach(s => {
        if(s.consumazioni && Array.isArray(s.consumazioni)) {
          s.consumazioni.forEach((c: any) => { if(c.prodotto_id) prodottiCount[c.prodotto_id] = (prodottiCount[c.prodotto_id] || 0) + c.quantita; });
        }
      });
      let topProdotto = "Nessuna Vendita";
      if (Object.keys(prodottiCount).length > 0) {
        const topProdottoId = Object.keys(prodottiCount).sort((a,b) => prodottiCount[b] - prodottiCount[a])[0];
        topProdotto = prodotti.find(p => p.id === topProdottoId)?.nome || "Prodotto Eliminato";
      }
      const trend = [];
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().split('T')[0]; 
        const incassoGiorno = sDB.filter(s => s.fine && typeof s.fine === 'string' && s.fine.startsWith(dateString) && s.metodo_pagamento !== 'credito')
          .reduce((acc, s) => { const costo = parseFloat(s.costo_totale); return isNaN(costo) ? acc : acc + costo; }, 0);
        trend.push({ data: d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }), incasso: incassoGiorno });
      }
      setStatsStorico({ giorni: trend, topProdotto, topTavolo, incassoMese });
    } catch (err) {
      alert("❌ Errore caricamento statistiche."); setActiveView("hub");
    }
  };

  const prenotaTavolo = async () => {
    if (!activeTableId || !currentSalaId || !reserveName.trim() || !reserveTime.trim()) return;
    await supabase.from('tavoli').update({ stato: 'prenotato', prenotato_da: reserveName.trim(), prenotato_alle: reserveTime.trim() }).eq('id', activeTableId);
    await refreshDati(currentSalaId); setIsReserveModalOpen(false); setReserveName(""); setReserveTime("");
  };

  const annullaPrenotazione = async (tavoloId: string) => {
    if(!currentSalaId) return;
    if(confirm("Vuoi annullare questa prenotazione?")) {
      await supabase.from('tavoli').update({ stato: 'libero', prenotato_da: null, prenotato_alle: null }).eq('id', tavoloId);
      await refreshDati(currentSalaId);
    }
  };

  const avviaSessione = async () => { 
    if (!activeTableId || !currentSalaId) return;
    let tariffaApplicata = tariffaStandard;
    let giocatoriFinali = [...players];
    let idSocioEffettivo = null;
    if (selectedSocioId) {
      tariffaApplicata = tariffaSoci; idSocioEffettivo = selectedSocioId;
      const socio = soci.find(s => s.id === selectedSocioId);
      if (socio) giocatoriFinali[0] = `🏆 ${socio.cognome} ${socio.nome}`; 
    }
    await supabase.from('sessioni').insert([{ tavolo_id: activeTableId, sala_id: currentSalaId, inizio: new Date().toISOString(), giocatori: giocatoriFinali.filter(p => p.trim() !== ""), tariffa_oraria: tariffaApplicata, stato: 'in_corso', socio_id: idSocioEffettivo }]);
    await supabase.from('tavoli').update({ stato: 'occupato', prenotato_da: null, prenotato_alle: null }).eq('id', activeTableId);
    await refreshDati(currentSalaId); setIsStartModalOpen(false);
  };

  const confermaChiusura = async (metodo: 'contanti' | 'pos' | 'misto' | 'credito') => { 
    if (!summaryData || !currentSalaId) return;
    if (metodo === 'credito') {
      const socio = soci.find(s => s.id === summaryData.socio_id);
      if (!socio || (socio.credito || 0) < summaryData.totale) { alert("❌ Credito insufficiente!"); return; }
      const nuovoCredito = (socio.credito || 0) - summaryData.totale;
      await supabase.from('soci').update({ credito: nuovoCredito }).eq('id', socio.id);
    }
    await supabase.from('sessioni').update({ fine: new Date().toISOString(), stato: 'terminata', costo_totale: summaryData.totale.toFixed(2), metodo_pagamento: metodo }).eq('id', summaryData.sessioneId);
    await supabase.from('tavoli').update({ stato: 'libero' }).eq('id', summaryData.tavoloId);
    await refreshDati(currentSalaId); setIsSummaryModalOpen(false);
  };

  const salvaRicarica = async () => {
    if (!socioToRecharge || !rechargeAmount || !currentSalaId) return;
    const importo = parseFloat(rechargeAmount);
    if (isNaN(importo) || importo <= 0) return;
    const nuovoCredito = parseFloat(socioToRecharge.credito || 0) + importo;
    await supabase.from('soci').update({ credito: nuovoCredito }).eq('id', socioToRecharge.id);
    alert(`✅ Ricarica effettuata!`); await refreshDati(currentSalaId); setIsRechargeModalOpen(false); setRechargeAmount(""); setSocioToRecharge(null);
  };

  const apriEstrattoConto = async (socio: any) => {
    setSocioForStatement(socio); setIsStatementModalOpen(true);
    const { data } = await supabase.from('sessioni').select('*').eq('socio_id', socio.id).eq('metodo_pagamento', 'credito').order('fine', { ascending: false }).limit(15);
    setStatementHistory(data || []);
  };

  const aggiungiBar = async () => { 
    const tavolo = tavoli.find(t => t.id === activeTableId);
    const prodotto = prodotti.find(p => p.id === selectedProdottoId);
    if (!tavolo?.sessioneId || !prodotto || !currentSalaId) return;
    await supabase.from('consumazioni').insert([{ sessione_id: tavolo.sessioneId, prodotto_id: prodotto.id, quantita: quantitaBar, prezzo_istante: prodotto.prezzo_vendita }]);
    await supabase.from('prodotti').update({ quantita_stock: prodotto.quantita_stock - quantitaBar }).eq('id', prodotto.id);
    await refreshDati(currentSalaId); setIsBarModalOpen(false);
  };

  const eliminaConsumazione = async (consumazioneId: string, prodottoId: string, quantita: number, prezzoIstante: number) => {
    if(!currentSalaId) return;
    await supabase.from('consumazioni').delete().eq('id', consumazioneId);
    const prod = prodotti.find(p => p.id === prodottoId);
    if(prod) await supabase.from('prodotti').update({ quantita_stock: prod.quantita_stock + quantita }).eq('id', prodottoId);
    const nuovoCostoBar = summaryData.costoBar - (prezzoIstante * quantita);
    setSummaryData({ ...summaryData, costoBar: nuovoCostoBar, totale: summaryData.costoBiliardo + nuovoCostoBar, consumazioni: summaryData.consumazioni.filter((c: any) => c.id !== consumazioneId) });
    refreshDati(currentSalaId);
  };

  const salvaNuovoProdotto = async () => {
    if (!newProdName || !currentSalaId) return;
    await supabase.from('prodotti').insert([{ sala_id: currentSalaId, nome: newProdName, prezzo_vendita: parseFloat(newProdPrice), quantita_stock: parseInt(newProdStock) || 0 }]);
    await refreshDati(currentSalaId); setIsNewProductModalOpen(false); setNewProdName(""); setNewProdPrice(""); setNewProdStock("");
  };

  const salvaNuovoSocio = async () => {
    if (!newSocioNome.trim() || !newSocioCognome.trim() || !currentSalaId) return;
    await supabase.from('soci').insert([{ sala_id: currentSalaId, nome: newSocioNome.trim(), cognome: newSocioCognome.trim(), telefono: newSocioTelefono.trim(), codice_tessera: newSocioTessera.trim(), credito: 0 }]);
    await refreshDati(currentSalaId); setIsNewSocioModalOpen(false); setNewSocioNome(""); setNewSocioCognome(""); setNewSocioTelefono(""); setNewSocioTessera("");
  };

  const salvaImpostazioni = async () => {
    if (!currentSalaId) return;
    await supabase.from('sale').update({ tariffa_standard: tariffaStandard, tariffa_soci: tariffaSoci }).eq('id', currentSalaId);
    alert("✅ Impostazioni salvate!"); setActiveView("hub");
  };

  const stampaScontrino = () => { setReceiptToPrint(summaryData); setTimeout(() => { window.print(); setReceiptToPrint(null); }, 500); };
  const stampaEstrattoConto = () => { setIsPrintingStatement(true); setTimeout(() => { window.print(); setIsPrintingStatement(false); }, 500); };

  const renderPulsanteCredito = () => {
    if (!summaryData?.socio_id) return null;
    const socio = soci.find(s => s.id === summaryData.socio_id);
    if (!socio) return null;
    const credito = parseFloat(socio.credito || 0);
    if (credito >= summaryData.totale) {
      return (<button onClick={() => confermaChiusura('credito')} className="w-full py-6 bg-yellow-600 text-black border-4 border-yellow-500 rounded-3xl font-black uppercase text-xl tracking-widest shadow-[0_0_20px_rgba(202,138,4,0.3)] active:scale-95 transition-all flex flex-col items-center justify-center"><span>💳 PAGA CON TESSERA</span><span className="text-xs font-bold mt-1 opacity-80">(Saldo: €{credito.toFixed(2)})</span></button>);
    } else {
      return (<div className="w-full py-4 bg-gray-900 border-2 border-red-900/50 rounded-3xl flex flex-col items-center justify-center text-gray-500"><span className="text-sm font-bold uppercase">❌ Credito Tessera Insufficiente</span><span className="text-xs mt-1">(Saldo: €{credito.toFixed(2)})</span></div>);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl">CARICAMENTO...</div>;

  if (receiptToPrint) {
    const isSplit = receiptToPrint.giocatori && receiptToPrint.giocatori.length > 1;
    const splitAmount = isSplit ? (receiptToPrint.totale / receiptToPrint.giocatori.length).toFixed(2) : 0;
    return (
      <div className="bg-white text-black p-4 w-full max-w-[80mm] mx-auto font-mono text-sm leading-tight">
        <div className="text-center font-black text-2xl mb-2">{nomeSala}</div><div className="text-center text-xs mb-6 border-b border-black pb-2">PRECONTO NON FISCALE</div>
        <div className="mb-4"><div><strong>Tavolo:</strong> {receiptToPrint.nome}</div><div><strong>Data:</strong> {new Date().toLocaleDateString()}</div><div><strong>Ora:</strong> {new Date().toLocaleTimeString()}</div></div>
        {isSplit && (<div className="mb-4 border border-black p-2 text-center text-xs"><strong>GIOCATORI: {receiptToPrint.giocatori.length}</strong><br/>{receiptToPrint.giocatori.join(", ")}</div>)}
        <div className="border-t border-dashed border-black pt-2 mt-2 mb-2"><div className="flex justify-between font-bold"><span>BILIARDO ({receiptToPrint.tempo})</span><span>€ {receiptToPrint.costoBiliardo.toFixed(2)}</span></div>
          {receiptToPrint.consumazioni && receiptToPrint.consumazioni.map((c: any) => (<div key={c.id} className="flex justify-between text-xs mt-1"><span>{c.quantita}x {c.nome_prodotto}</span><span>€ {(c.prezzo_istante * c.quantita).toFixed(2)}</span></div>))}
        </div>
        <div className="border-t border-black pt-2 mt-4 flex justify-between items-center"><span className="font-black text-lg">TOTALE</span><span className="font-black text-2xl">€ {receiptToPrint.totale.toFixed(2)}</span></div>
        {isSplit && (<div className="mt-4 bg-gray-200 p-2 text-center font-bold">DIVISIONE CONTO:<br/><span className="text-lg">€ {splitAmount} a persona</span></div>)}
        <div className="text-center text-xs mt-8 italic">Grazie e Arrivederci!</div>
      </div>
    );
  }

  if (isPrintingStatement && socioForStatement) {
    return (
      <div className="bg-white text-black p-4 w-full max-w-[80mm] mx-auto font-mono text-sm leading-tight">
        <div className="text-center font-black text-2xl mb-2">{nomeSala}</div><div className="text-center text-xs mb-6 border-b border-black pb-2">ESTRATTO CONTO TESSERA</div>
        <div className="mb-4"><div><strong>Socio:</strong> {socioForStatement.cognome} {socioForStatement.nome}</div><div><strong>Tessera:</strong> {socioForStatement.codice_tessera || 'N/D'}</div><div><strong>Data:</strong> {new Date().toLocaleDateString()}</div></div>
        <div className="border-t border-dashed border-black pt-2 mt-2 mb-2"><div className="font-bold mb-2">ULTIMI ADDEBITI</div>{statementHistory.length === 0 ? <div className="text-xs">Nessun movimento.</div> : statementHistory.map(h => (<div key={h.id} className="flex justify-between text-xs mt-1 border-b border-gray-300 pb-1 mb-1 last:border-0"><span>{new Date(h.fine).toLocaleDateString()} {new Date(h.fine).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span><span className="font-bold">-€ {parseFloat(h.costo_totale).toFixed(2)}</span></div>))}</div>
        <div className="border-t border-black pt-2 mt-4 flex justify-between items-center"><span className="font-black">SALDO ATTUALE</span><span className="font-black text-xl">€ {parseFloat(socioForStatement.credito || 0).toFixed(2)}</span></div><div className="text-center text-xs mt-8 italic">Grazie per la fiducia!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter print:hidden">
      {activeView === "hub" && (
        <div>
          <div className="text-center mb-12 mt-8"><h1 className="text-5xl font-black text-green-500 uppercase italic tracking-tighter mb-4">{nomeSala}</h1><p className="text-gray-500 font-mono text-sm uppercase">Accesso: {userEmail}</p></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <button onClick={() => setActiveView("plancia")} className="bg-gray-900 border-2 border-green-600 p-10 rounded-[3rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-7xl mb-6">🎱</div><h2 className="text-2xl font-black uppercase tracking-widest text-white">Plancia</h2></button>
            <button onClick={() => setActiveView("magazzino")} className="bg-gray-900 border-2 border-blue-600 p-10 rounded-[3rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-7xl mb-6">📦</div><h2 className="text-2xl font-black uppercase tracking-widest text-white">Magazzino</h2></button>
            <button onClick={() => setActiveView("soci")} className="bg-gray-900 border-2 border-yellow-600 p-10 rounded-[3rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-7xl mb-6">👥</div><h2 className="text-2xl font-black uppercase tracking-widest text-white">Soci</h2></button>
            <button onClick={() => setActiveView("report")} className="bg-gray-900 border-2 border-purple-600 p-10 rounded-[3rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-7xl mb-6">📊</div><h2 className="text-2xl font-black uppercase tracking-widest text-white">Cassa</h2></button>
            <button onClick={apriStatistiche} className="md:col-span-2 bg-gray-900 border-2 border-pink-600 p-10 rounded-[3rem] flex items-center justify-center gap-8 hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-7xl">📈</div><div className="text-left"><h2 className="text-3xl font-black uppercase tracking-widest text-white">Statistiche</h2><p className="text-gray-400 mt-2 font-bold uppercase tracking-widest">Trend e Analisi</p></div></button>
            <button onClick={() => setActiveView("impostazioni")} className="bg-gray-900 border-2 border-gray-500 p-10 rounded-[3rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-6xl mb-4">⚙️</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Tariffe</h2></button>
            <button onClick={logout} className="bg-gray-900 border-2 border-red-600 p-10 rounded-[3rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-6xl mb-4">🚪</div><h2 className="text-xl font-black uppercase tracking-widest text-red-500">Esci</h2></button>
          </div>
        </div>
      )}
      {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-4 transition-all active:scale-95"><span className="text-3xl">🔙</span> TORNA AL MENU</button>)}
      
      {activeView === 'statistiche' && !statsStorico && (<div className="text-center text-pink-500 font-black text-2xl mt-20 animate-pulse uppercase tracking-widest">Calcolo statistiche in corso... ⏳</div>)}
      {activeView === 'statistiche' && statsStorico && (
        <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-6xl mx-auto">
          <h3 className="text-4xl font-black text-pink-500 uppercase italic mb-8 border-b border-pink-900/50 pb-4">📈 Business Intelligence (Ultimi 30 Giorni)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-pink-900 text-center shadow-2xl"><p className="text-pink-500 font-bold uppercase text-sm tracking-widest mb-4">Incasso 30 Giorni</p><h4 className="text-5xl font-black text-white italic">€ {statsStorico.incassoMese.toFixed(2)}</h4></div>
            <div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-blue-900 text-center shadow-2xl"><p className="text-blue-500 font-bold uppercase text-sm tracking-widest mb-4">Tavolo Top</p><h4 className="text-4xl font-black text-white italic uppercase">{statsStorico.topTavolo}</h4></div>
            <div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-orange-900 text-center shadow-2xl"><p className="text-orange-500 font-bold uppercase text-sm tracking-widest mb-4">Prodotto Top</p><h4 className="text-4xl font-black text-white italic uppercase">{statsStorico.topProdotto}</h4></div>
          </div>
          <div className="bg-gray-900 p-10 rounded-[3rem] border-2 border-gray-800">
            <h4 className="text-xl font-black text-gray-400 uppercase mb-8 tracking-widest">Trend Incassi (Ultimi 7 Giorni)</h4>
            <div className="flex items-end justify-between gap-4 h-64 mt-4 border-b-2 border-gray-800 pb-2">
              {statsStorico.giorni.map((g, idx) => {
                const maxIncasso = Math.max(...statsStorico.giorni.map(d => d.incasso), 1); 
                const altezza = `${(g.incasso / maxIncasso) * 100}%`;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full gap-3 group"><span className="text-pink-400 font-black text-xl opacity-0 group-hover:opacity-100 transition-opacity bg-black p-2 rounded-xl">€{g.incasso.toFixed(0)}</span><div className="w-full bg-pink-600 hover:bg-pink-400 rounded-t-xl transition-all duration-500 cursor-pointer shadow-[0_0_15px_rgba(219,39,119,0.3)]" style={{ height: altezza, minHeight: '10px' }}></div><span className="text-sm text-gray-400 font-black">{g.data}</span></div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeView === 'plancia' && (
        <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tavoli.map((t) => (
              <div key={t.id} className={`p-8 rounded-[2.5rem] border-4 transition-colors ${t.stato === 'LIBERO' ? 'border-green-900 bg-gray-950' : t.stato === 'PRENOTATO' ? 'border-yellow-500 bg-yellow-900/30' : 'border-red-600 bg-gray-900'}`}>
                <div className="flex justify-between items-center mb-8"><h3 className="text-4xl font-black italic">{t.nome}</h3><div className={`h-6 w-6 rounded-full ${t.stato === 'LIBERO' ? 'bg-green-500' : t.stato === 'PRENOTATO' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div></div>
                {t.stato !== 'PRENOTATO' && (<div className="space-y-6 mb-10"><div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Tempo</span><span className="font-mono text-4xl font-black">{formattaCronometro(t.startTime)}</span></div><div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Bar</span><span className="text-3xl font-black text-orange-400">€ {t.barTotal.toFixed(2)}</span></div></div>)}
                {t.stato === 'PRENOTATO' && (<div className="bg-black/50 border border-yellow-700 p-6 rounded-3xl mb-10 text-center"><p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-2">Riservato a:</p><h4 className="text-3xl font-black text-white mb-4 uppercase">{t.prenotato_da}</h4><p className="text-yellow-600 font-bold uppercase tracking-widest text-xs mb-1">Per le ore:</p><h5 className="text-4xl font-black text-yellow-400 font-mono">{t.prenotato_alle}</h5></div>)}
                {t.stato === 'IN GIOCO' && t.giocatori.length > 1 && (<div className="mb-6 bg-blue-900/30 text-blue-400 p-3 rounded-xl text-center font-bold text-sm uppercase">👥 Tavolo Diviso: {t.giocatori.length} Giocatori</div>)}
                {t.stato === 'LIBERO' && (<div className="flex gap-4"><button onClick={() => { setActiveTableId(t.id); setSelectedSocioId(""); setPlayers(["", "", "", ""]); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-700 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl active:scale-95 transition-transform">AVVIA PARTITA</button><button onClick={() => { setActiveTableId(t.id); setIsReserveModalOpen(true); }} className="flex-1 py-8 bg-yellow-600 rounded-3xl text-3xl shadow-xl active:scale-95 transition-transform" title="Prenota">📅</button></div>)}
                {t.stato === 'PRENOTATO' && (<div className="flex gap-4"><button onClick={() => { setActiveTableId(t.id); setSelectedSocioId(""); setPlayers([t.prenotato_da || "", "", "", ""]); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-600 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl active:scale-95 transition-transform text-black">INIZIA A GIOCARE</button><button onClick={() => annullaPrenotazione(t.id)} className="flex-1 py-8 bg-gray-800 border border-gray-600 text-gray-400 rounded-3xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-red-900 hover:text-red-400 active:scale-95 transition-colors">❌</button></div>)}
                {t.stato === 'IN GIOCO' && (<div className="flex gap-4"><button onClick={() => { setActiveTableId(t.id); setIsBarModalOpen(true); }} className="flex-1 py-8 bg-orange-600 rounded-3xl text-4xl shadow-xl active:scale-95 transition-transform">🍺</button><button onClick={() => { const durata = (Date.now() - t.startTime!) / 3600000; const costB = durata * parseFloat(t.prezzo); setSummaryData({ tavoloId: t.id, sessioneId: t.sessioneId, nome: t.nome, tempo: formattaCronometro(t.startTime), costoBiliardo: costB, costoBar: t.barTotal, totale: costB + t.barTotal, giocatori: t.giocatori, socio_id: t.socio_id, consumazioni: t.consumazioni }); setIsSummaryModalOpen(true); }} className="flex-1 py-8 bg-red-700 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl active:scale-95 transition-transform">CHIUDI CONTO</button></div>)}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'soci' && (
        <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-6xl mx-auto"><button onClick={() => setIsNewSocioModalOpen(true)} className="mb-8 w-full py-8 bg-yellow-600 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl text-black">+ REGISTRA NUOVO SOCIO</button><div className="bg-gray-900/50 border border-gray-800 rounded-[3rem] overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-800/80 text-xs text-gray-400 uppercase font-black"><tr><th className="p-6">Socio</th><th className="p-6">Tessera</th><th className="p-6">Credito Disponibile</th><th className="p-6 text-right">Azioni</th></tr></thead><tbody className="divide-y divide-gray-800">{soci.map((s) => (<tr key={s.id} className="hover:bg-gray-800/30 transition-colors"><td className="p-6 font-bold text-xl uppercase text-white">{s.cognome} {s.nome}</td><td className="p-6 font-mono text-yellow-400 text-lg font-bold">{s.codice_tessera || "---"}</td><td className="p-6 font-black text-2xl text-green-400">€ {parseFloat(s.credito || 0).toFixed(2)}</td><td className="p-6 text-right"><div className="flex justify-end gap-3"><button onClick={() => apriEstrattoConto(s)} className="bg-blue-800 hover:bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm tracking-widest">📜 Movimenti</button><button onClick={() => { setSocioToRecharge(s); setIsRechargeModalOpen(true); }} className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-sm tracking-widest">💰 Ricarica</button></div></td></tr>))}{soci.length === 0 && (<tr><td colSpan={4} className="p-10 text-center text-gray-500 font-black uppercase">Nessun socio.</td></tr>)}</tbody></table></div></div>
      )}

      {activeView === 'report' && (
        <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-6xl mx-auto"><div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"><div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-purple-600 shadow-2xl text-center"><p className="text-purple-400 font-black uppercase tracking-[0.2em] mb-2 text-xs">Totale Giornata</p><h3 className="text-6xl font-black italic text-white">€ {incassoTotale.toFixed(2)}</h3></div><div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-green-600 text-center"><p className="text-green-500 font-black uppercase tracking-[0.2em] mb-2 text-xs">Di cui Contanti</p><h3 className="text-4xl font-black italic text-white">€ {incassoContanti.toFixed(2)}</h3></div><div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-blue-600 text-center"><p className="text-blue-500 font-black uppercase tracking-[0.2em] mb-2 text-xs">Di cui POS</p><h3 className="text-4xl font-black italic text-white">€ {incassoPOS.toFixed(2)}</h3></div></div><h3 className="text-xl font-black text-gray-400 uppercase italic mb-6">Prima Nota</h3><div className="bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden mb-8"><table className="w-full text-left"><thead className="bg-gray-800/80 text-[10px] text-gray-500 uppercase font-black"><tr><th className="p-5">Ora</th><th className="p-5">Giocatori</th><th className="p-5">Metodo</th><th className="p-5 text-right">Importo</th></tr></thead><tbody className="divide-y divide-gray-800">{recenti.map((r) => (<tr key={r.id} className="hover:bg-gray-800/30 transition-colors"><td className="p-5 font-mono text-gray-400">{new Date(r.fine).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td><td className="p-5 font-bold uppercase text-xs">{r.giocatori?.join(" / ") || "OCCASIONALE"}</td><td className="p-5"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${r.metodo_pagamento === 'credito' ? 'bg-yellow-900/50 text-yellow-400' : r.metodo_pagamento === 'pos' ? 'bg-blue-900/50 text-blue-400' : r.metodo_pagamento === 'misto' ? 'bg-purple-900/50 text-purple-400' : 'bg-green-900/50 text-green-400'}`}>{r.metodo_pagamento === 'credito' ? '💳 TESSERA' : r.metodo_pagamento === 'misto' ? '💳💵 Misto' : r.metodo_pagamento === 'pos' ? '💳 POS' : '💵 Contanti'}</span></td><td className="p-5 text-right font-black text-white text-lg">€ {parseFloat(r.costo_totale).toFixed(2)}</td></tr>))}</tbody></table></div></div>
      )}

      {activeView === 'impostazioni' && (
        <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-6xl mx-auto"><div className="max-w-3xl mx-auto"><h3 className="text-4xl font-black text-white uppercase italic mb-8">⚙️ Impostazioni Sala</h3><div className="bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 shadow-2xl mb-8"><h4 className="text-2xl font-black text-gray-400 uppercase mb-8 border-b border-gray-800 pb-4">Gestione Tariffe Orarie</h4><div className="space-y-8 mb-12"><div><label className="block text-gray-500 font-bold uppercase text-sm tracking-widest mb-4">Tariffa Standard</label><div className="flex items-center bg-black border-2 border-gray-800 rounded-2xl overflow-hidden"><span className="text-3xl font-black text-gray-500 px-6">€</span><input type="number" value={tariffaStandard} onChange={(e) => setTariffaStandard(parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-6 text-3xl text-white outline-none font-black" /></div></div><div><label className="block text-yellow-500 font-bold uppercase text-sm tracking-widest mb-4">Tariffa Scontata Soci</label><div className="flex items-center bg-black border-2 border-yellow-900 rounded-2xl overflow-hidden"><span className="text-3xl font-black text-yellow-600 px-6">€</span><input type="number" value={tariffaSoci} onChange={(e) => setTariffaSoci(parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-6 text-3xl text-white outline-none font-black" /></div></div></div><button onClick={salvaImpostazioni} className="w-full py-8 bg-white text-black hover:bg-gray-200 rounded-3xl font-black uppercase text-2xl tracking-widest shadow-xl">SALVA MODIFICHE</button></div></div></div>
      )}

      {activeView === 'magazzino' && (
        <div className="animate-in slide-in-from-bottom-8 duration-300 max-w-6xl mx-auto"><button onClick={() => setIsNewProductModalOpen(true)} className="mb-8 w-full py-8 bg-blue-600 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl">+ AGGIUNGI PRODOTTO</button><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{prodotti.map((p) => (<div key={p.id} className="bg-gray-900 p-8 rounded-[2rem] border-2 border-gray-800"><h4 className="text-2xl font-black uppercase mb-2">{p.nome}</h4><p className="text-gray-400 text-lg font-bold mb-6">Prezzo: € {p.prezzo_vendita}</p><div className={`text-center py-4 rounded-2xl font-black text-lg ${p.quantita_stock > 5 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/50 text-red-400 border border-red-500 animate-pulse'}`}>IN MAGAZZINO: {p.quantita_stock}</div></div>))}</div></div>
      )}

      {/* --- MODALI POPUP --- */}
      {isStartModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-4xl font-black text-blue-500 mb-8 uppercase italic">Avvia Partita</h3><div className="mb-8"><label className="block text-gray-500 font-bold uppercase text-sm mb-4">1. Seleziona Tariffa</label><select value={selectedSocioId} onChange={(e) => setSelectedSocioId(e.target.value)} className="w-full bg-gray-900 border-4 border-blue-900 p-6 rounded-2xl text-xl text-white outline-none focus:border-blue-500"><option value="">👤 Cliente Occasionale (€ {tariffaStandard.toFixed(2)}/h)</option>{soci.map(s => (<option key={s.id} value={s.id}>🏆 Socio: {s.cognome} {s.nome} (€ {tariffaSoci.toFixed(2)}/h)</option>))}</select></div><div className="space-y-4 mb-12"><label className="block text-gray-500 font-bold uppercase text-sm mb-4">2. Compila Giocatori per dividere il conto</label>{selectedSocioId ? (<div className="w-full bg-blue-900/30 border-2 border-blue-800 p-6 rounded-2xl text-xl text-blue-300 font-black uppercase">{soci.find(s => s.id === selectedSocioId)?.cognome} {soci.find(s => s.id === selectedSocioId)?.nome} (Intestatario)</div>) : (<input value={players[0]} onChange={(e) => { const nP = [...players]; nP[0] = e.target.value; setPlayers(nP); }} autoComplete="off" placeholder="Nome Giocatore 1" className="w-full bg-gray-800 border-2 border-gray-700 p-6 rounded-2xl text-xl text-white outline-none" />)}<input value={players[1]} onChange={(e) => { const nP = [...players]; nP[1] = e.target.value; setPlayers(nP); }} autoComplete="off" placeholder="Giocatore 2" className="w-full bg-gray-800 border-2 border-gray-700 p-6 rounded-2xl text-xl text-white outline-none" /><input value={players[2]} onChange={(e) => { const nP = [...players]; nP[2] = e.target.value; setPlayers(nP); }} autoComplete="off" placeholder="Giocatore 3" className="w-full bg-gray-800 border-2 border-gray-700 p-6 rounded-2xl text-xl text-white outline-none" /><input value={players[3]} onChange={(e) => { const nP = [...players]; nP[3] = e.target.value; setPlayers(nP); }} autoComplete="off" placeholder="Giocatore 4" className="w-full bg-gray-800 border-2 border-gray-700 p-6 rounded-2xl text-xl text-white outline-none" /></div><button onClick={avviaSessione} className="w-full py-8 bg-blue-600 rounded-3xl font-black uppercase text-2xl tracking-widest mb-4">AVVIA ORA</button><button onClick={() => setIsStartModalOpen(false)} className="w-full py-6 text-gray-500 font-bold uppercase text-lg">Annulla</button></div></div>)}
      {isReserveModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-yellow-500 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-4xl font-black text-yellow-500 uppercase italic mb-8">📅 Prenota Tavolo</h3><div className="space-y-6 mb-12"><div><label className="block text-gray-500 font-bold uppercase text-sm mb-4">Nome Cliente</label><input type="text" value={reserveName} onChange={(e) => setReserveName(e.target.value)} placeholder="Es. Mario Rossi" autoComplete="off" className="w-full bg-black border-2 border-gray-800 p-6 rounded-2xl text-2xl text-white outline-none focus:border-yellow-500" /></div><div><label className="block text-gray-500 font-bold uppercase text-sm mb-4">Orario di Arrivo</label><input type="time" value={reserveTime} onChange={(e) => setReserveTime(e.target.value)} className="w-full bg-black border-2 border-gray-800 p-6 rounded-2xl text-3xl font-mono text-yellow-400 outline-none focus:border-yellow-500" /></div></div><button onClick={prenotaTavolo} className="w-full py-8 bg-yellow-500 text-black rounded-3xl font-black uppercase text-2xl tracking-widest mb-4">CONFERMA PRENOTAZIONE</button><button onClick={() => { setIsReserveModalOpen(false); setReserveName(""); setReserveTime(""); }} className="w-full py-6 text-gray-500 font-bold uppercase text-lg">Annulla</button></div></div>)}
      {isSummaryModalOpen && summaryData && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-6"><h3 className="text-4xl font-black text-green-500 uppercase italic">Scontrino</h3><button onClick={stampaScontrino} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-2xl shadow-xl" title="Stampa Preconto">🖨️</button></div><div className="space-y-4 mb-8 bg-gray-900 p-8 rounded-3xl border border-gray-800 font-bold"><div className="flex justify-between text-xl uppercase"><span className="text-gray-500">Biliardo</span><span>€ {summaryData.costoBiliardo.toFixed(2)}</span></div><div className="border-t border-gray-700 pt-4 mt-4"><div className="flex justify-between text-xl uppercase text-orange-400 mb-2"><span>Bar</span><span>€ {summaryData.costoBar.toFixed(2)}</span></div>{summaryData.consumazioni && summaryData.consumazioni.length > 0 && (<div className="bg-black/50 p-4 rounded-2xl border border-gray-800 mt-2"><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Prodotti (Clicca ❌ per eliminare)</p>{summaryData.consumazioni.map((c: any) => (<div key={c.id} className="flex justify-between items-center text-sm text-gray-300 mb-2 pb-2 border-b border-gray-800/50 last:border-0 last:mb-0 last:pb-0"><span>{c.quantita}x {c.nome_prodotto}</span><div className="flex items-center gap-3"><span className="font-mono text-orange-300">€ {(c.prezzo_istante * c.quantita).toFixed(2)}</span><button onClick={() => eliminaConsumazione(c.id, c.prodotto_id, c.quantita, c.prezzo_istante)} className="bg-red-900/50 hover:bg-red-600 text-red-300 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">❌</button></div></div>))}</div>)}</div><div className="border-t border-gray-700 pt-6 flex justify-between items-center"><span className="text-3xl font-black italic">TOTALE</span><span className="text-5xl font-black text-green-500">€ {summaryData.totale.toFixed(2)}</span></div></div>{summaryData.giocatori && summaryData.giocatori.length > 1 && (<div className="mb-8 bg-blue-900/20 border-2 border-blue-900 p-6 rounded-3xl text-center"><p className="text-blue-400 font-black uppercase tracking-widest text-xs mb-2">Divisione in {summaryData.giocatori.length} quote</p><h4 className="text-4xl font-black text-white">€ {(summaryData.totale / summaryData.giocatori.length).toFixed(2)} <span className="text-lg text-gray-500">/cad.</span></h4></div>)}<p className="text-gray-500 font-black uppercase tracking-widest text-xs mb-4 text-center">Registra Pagamento:</p><div className="flex flex-col gap-4 mb-4">{renderPulsanteCredito()}<div className="flex gap-4"><button onClick={() => confermaChiusura('contanti')} className="flex-1 py-8 bg-green-600 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl active:scale-95 transition-all">💵 CONTANTI</button><button onClick={() => confermaChiusura('pos')} className="flex-1 py-8 bg-blue-600 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl active:scale-95 transition-all">💳 POS</button></div>{summaryData.giocatori && summaryData.giocatori.length > 1 && (<button onClick={() => confermaChiusura('misto')} className="w-full py-6 bg-purple-700 rounded-3xl font-black uppercase text-lg tracking-widest shadow-xl active:scale-95 transition-all">💳💵 MISTO</button>)}</div><button onClick={() => setIsSummaryModalOpen(false)} className="w-full py-6 text-gray-500 font-bold uppercase text-lg mt-4">Torna Indietro</button></div></div>)}
      {isNewSocioModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-yellow-600 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-3xl font-black text-yellow-500 mb-8 uppercase italic">Registra Socio</h3><div className="space-y-6 mb-12"><input value={newSocioNome} onChange={(e) => setNewSocioNome(e.target.value)} autoComplete="off" placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /><input value={newSocioCognome} onChange={(e) => setNewSocioCognome(e.target.value)} autoComplete="off" placeholder="Cognome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /><input value={newSocioTelefono} onChange={(e) => setNewSocioTelefono(e.target.value)} autoComplete="off" placeholder="Telefono (Opzionale)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /><input value={newSocioTessera} onChange={(e) => setNewSocioTessera(e.target.value)} autoComplete="off" placeholder="Numero Tessera (Opzionale)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /></div><button onClick={salvaNuovoSocio} className="w-full py-8 bg-yellow-600 text-black rounded-3xl font-black uppercase text-2xl tracking-widest mb-4">SALVA SOCIO</button><button onClick={() => setIsNewSocioModalOpen(false)} className="w-full py-6 text-gray-500 font-bold uppercase text-lg">Annulla</button></div></div>)}
      {isBarModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-orange-500 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-4xl font-black text-orange-500 mb-8 uppercase italic">Consumazione</h3><select value={selectedProdottoId} onChange={(e) => setSelectedProdottoId(e.target.value)} className="w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-xl text-white mb-12 outline-none"><option value="">Seleziona dal listino...</option>{prodotti.map(p => (<option key={p.id} value={p.id}>{p.nome} (€{p.prezzo_vendita})</option>))}</select><button onClick={aggiungiBar} disabled={!selectedProdottoId} className="w-full py-8 bg-orange-600 disabled:opacity-30 rounded-3xl font-black uppercase text-2xl tracking-widest mb-4">AGGIUNGI AL CONTO</button><button onClick={() => setIsBarModalOpen(false)} className="w-full py-6 text-gray-500 font-bold uppercase text-lg">Annulla</button></div></div>)}
      {isNewProductModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic">Nuovo Prodotto</h3><div className="space-y-6 mb-12"><input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /><input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} placeholder="Prezzo Vendita (€)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /><input type="number" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} placeholder="Scorte" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white outline-none" /></div><button onClick={salvaNuovoProdotto} className="w-full py-8 bg-blue-600 rounded-3xl font-black uppercase text-2xl tracking-widest mb-4">SALVA LISTINO</button><button onClick={() => setIsNewProductModalOpen(false)} className="w-full py-6 text-gray-500 font-bold uppercase text-lg">Annulla</button></div></div>)}
      {isStatementModalOpen && socioForStatement && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6"><div><h3 className="text-3xl font-black text-blue-500 uppercase italic mb-1">Estratto Conto</h3><p className="text-xl text-white font-bold uppercase">{socioForStatement.cognome} {socioForStatement.nome}</p></div><button onClick={stampaEstrattoConto} className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-2xl shadow-xl border border-gray-700" title="Stampa Estratto">🖨️</button></div><div className="bg-black/50 p-6 rounded-3xl border border-gray-800 mb-8"><h4 className="text-gray-500 font-bold uppercase text-xs tracking-widest mb-6">Ultimi Addebiti</h4>{statementHistory.length === 0 ? (<p className="text-gray-400 italic text-center py-4">Nessun movimento.</p>) : (<div className="space-y-4">{statementHistory.map(h => (<div key={h.id} className="flex justify-between items-center border-b border-gray-800/50 pb-4 last:border-0 last:pb-0"><div><div className="text-white font-bold">{new Date(h.fine).toLocaleDateString()} - {new Date(h.fine).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div></div><div className="text-2xl font-black text-red-400">- € {parseFloat(h.costo_totale).toFixed(2)}</div></div>))}</div>)}</div><button onClick={() => { setIsStatementModalOpen(false); setSocioForStatement(null); setStatementHistory([]); }} className="w-full py-6 bg-gray-800 hover:bg-gray-700 text-white rounded-3xl font-black uppercase text-lg tracking-widest shadow-xl">Chiudi Finestra</button></div></div>)}
      {isRechargeModalOpen && socioToRecharge && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto"><h3 className="text-3xl font-black text-green-500 mb-2 uppercase italic">Ricarica Tessera</h3><p className="text-xl text-white font-bold mb-8 uppercase border-b border-gray-800 pb-4">{socioToRecharge.cognome} {socioToRecharge.nome}</p><div className="space-y-6 mb-12"><label className="block text-gray-500 font-bold uppercase text-sm mb-4 tracking-widest">Importo da Caricare</label><div className="flex items-center bg-black border-2 border-green-900 rounded-2xl overflow-hidden focus-within:border-green-500 transition-colors"><span className="text-3xl font-black text-green-600 px-6">€</span><input type="number" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} placeholder="Es. 50" className="w-full bg-transparent p-6 text-3xl text-white outline-none font-black" /></div></div><button onClick={salvaRicarica} className="w-full py-8 bg-green-600 text-white rounded-3xl font-black uppercase text-2xl tracking-widest mb-4 shadow-xl active:scale-95 transition-all">CONFERMA RICARICA</button><button onClick={() => { setIsRechargeModalOpen(false); setRechargeAmount(""); setSocioToRecharge(null); }} className="w-full py-6 text-gray-500 font-bold uppercase text-lg">Annulla</button></div></div>)}
    </div>
  );
}