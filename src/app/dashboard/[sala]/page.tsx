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
  const [activeView, setActiveView] = useState<"hub" | "plancia" | "magazzino" | "report" | "soci" | "impostazioni" | "statistiche" | "staff">("hub");
  
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
  
  const [incassoTotale, setIncassoTotale] = useState(0);
  const [incassoContanti, setIncassoContanti] = useState(0);
  const [incassoPOS, setIncassoPOS] = useState(0);

  const [activeTableId, setActiveTableId] = useState<string | null>(null); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinBuffer, setPinBuffer] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

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
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newSocioNome, setNewSocioNome] = useState("");
  const [newSocioCognome, setNewSocioCognome] = useState("");
  const [newStaffNome, setNewStaffNome] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  
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
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    init();
  }, []);

  async function refreshDati(salaId: string) {
    try {
        const oggi = new Date();
        oggi.setHours(0, 0, 0, 0);

        const { data: tDB } = await supabase.from('tavoli').select('*').eq('sala_id', salaId).order('numero', { ascending: true });
        const { data: sDB } = await supabase.from('sessioni').select('*, consumazioni(*), staff(nome)').eq('sala_id', salaId).eq('stato', 'in_corso');
        const { data: pDB } = await supabase.from('prodotti').select('*').eq('sala_id', salaId).order('nome', { ascending: true });
        const { data: rDB } = await supabase.from('sessioni').select('*, staff(nome)').eq('sala_id', salaId).eq('stato', 'terminata').gte('fine', oggi.toISOString()).order('fine', { ascending: false });
        const { data: sociDB } = await supabase.from('soci').select('*').eq('sala_id', salaId).order('cognome', { ascending: true });
        const { data: staffDB } = await supabase.from('staff').select('*').eq('sala_id', salaId).order('nome', { ascending: true });

        if (pDB) setProdotti(pDB);
        if (sociDB) setSoci(sociDB);
        if (staffDB) setListaStaff(staffDB);
        
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
            
            // LOGICA STATI CORRETTA
            let statoTesto = "LIBERO";
            if (t.stato === 'prenotato') statoTesto = "PRENOTATO";
            else if (t.stato === 'occupato') statoTesto = "IN GIOCO";

            return {
              id: t.id, numero: t.numero, nome: `Tavolo ${t.numero}`, 
              prezzo: sess ? sess.tariffa_oraria : tariffaStandard, 
              stato: statoTesto, 
              startTime: sess ? new Date(sess.inizio).getTime() : null,
              giocatori: sess?.giocatori || [], barTotal: bTot, sessioneId: sess?.id, socio_id: sess?.socio_id,
              consumazioni: consumazioniDettaglio, prenotato_da: t.prenotato_da, prenotato_alle: t.prenotato_alle,
              staff_nome: sess?.staff?.nome
            };
          }));
        }
    } catch (e) { console.error("Errore caricamento dati:", e); }
  }

  const handlePinDigit = (digit: string) => {
    if (pinBuffer.length < 4) {
      const newBuffer = pinBuffer + digit;
      setPinBuffer(newBuffer);
      if (newBuffer.length === 4) verifyPin(newBuffer);
    }
  };

  const verifyPin = (pin: string) => {
    const staff = listaStaff.find(s => s.pin === pin);
    if (staff) {
      const action = pendingAction;
      setPinBuffer("");
      setIsPinModalOpen(false);
      setPendingAction(null);
      action.callback(staff.id);
    } else {
      alert("❌ PIN Errato!");
      setPinBuffer("");
    }
  };

  const richiedePin = (callback: (staffId: string) => void, descrizione: string) => {
    if (listaStaff.length === 0) { 
      alert("⚠️ ATTENZIONE: Devi prima creare un profilo STAFF (es. 'CAPO') con un PIN di 4 cifre per poter operare sui tavoli!"); 
      setActiveView("staff");
      return; 
    }
    setPendingAction({ callback, descrizione });
    setIsPinModalOpen(true);
  };

  const avviaSessione = async (staffId: string) => { 
    if (!activeTableId || !currentSalaId) return;
    let tariffaApplicata = selectedSocioId ? tariffaSoci : tariffaStandard;
    let giocatoriFinali = [...players];
    if (selectedSocioId) {
        const socio = soci.find(s => s.id === selectedSocioId);
        if (socio) giocatoriFinali[0] = `🏆 ${socio.cognome} ${socio.nome}`;
    }
    await supabase.from('sessioni').insert([{ 
      tavolo_id: activeTableId, sala_id: currentSalaId, inizio: new Date().toISOString(), giocatori: giocatoriFinali.filter(p => p.trim() !== ""), 
      tariffa_oraria: tariffaApplicata, stato: 'in_corso', socio_id: selectedSocioId || null, staff_id: staffId 
    }]);
    await supabase.from('tavoli').update({ stato: 'occupato', prenotato_da: null, prenotato_alle: null }).eq('id', activeTableId);
    await refreshDati(currentSalaId); setIsStartModalOpen(false);
  };

  const confermaChiusura = async (metodo: any, staffId: string) => { 
    if (!summaryData || !currentSalaId) return;
    if (metodo === 'credito') {
      const socio = soci.find(s => s.id === summaryData.socio_id);
      if (!socio || (socio.credito || 0) < summaryData.totale) { alert("❌ Credito insufficiente!"); return; }
      await supabase.from('soci').update({ credito: (socio.credito || 0) - summaryData.totale }).eq('id', socio.id);
    }
    await supabase.from('sessioni').update({ fine: new Date().toISOString(), stato: 'terminata', costo_totale: summaryData.totale.toFixed(2), metodo_pagamento: metodo, staff_id: staffId }).eq('id', summaryData.sessioneId);
    await supabase.from('tavoli').update({ stato: 'libero' }).eq('id', summaryData.tavoloId);
    await refreshDati(currentSalaId); setIsSummaryModalOpen(false);
  };

  const aggiungiBar = async (staffId: string) => { 
    const tavolo = tavoli.find(t => t.id === activeTableId);
    const prodotto = prodotti.find(p => p.id === selectedProdottoId);
    if (!tavolo?.sessioneId || !prodotto || !currentSalaId) return;
    await supabase.from('consumazioni').insert([{ sessione_id: tavolo.sessioneId, prodotto_id: prodotto.id, quantita: 1, prezzo_istante: prodotto.prezzo_vendita, staff_id: staffId }]);
    await supabase.from('prodotti').update({ quantita_stock: prodotto.quantita_stock - 1 }).eq('id', prodotto.id);
    await refreshDati(currentSalaId); setIsBarModalOpen(false);
  };

  const salvaNuovoStaff = async () => {
    if (!newStaffNome || newStaffPin.length !== 4) return;
    await supabase.from('staff').insert([{ sala_id: currentSalaId, nome: newStaffNome, pin: newStaffPin }]);
    await refreshDati(currentSalaId!); setIsNewStaffModalOpen(false); setNewStaffNome(""); setNewStaffPin("");
  };

  const prenotaTavolo = async () => {
    if (!activeTableId || !currentSalaId || !reserveName.trim() || !reserveTime.trim()) return;
    await supabase.from('tavoli').update({ stato: 'prenotato', prenotato_da: reserveName.trim(), prenotato_alle: reserveTime.trim() }).eq('id', activeTableId);
    await refreshDati(currentSalaId); setIsReserveModalOpen(false); setReserveName(""); setReserveTime("");
  };

  const annullaPrenotazione = async (tavoloId: string) => {
    if(!currentSalaId) return;
    if(confirm("Annullare?")) {
      await supabase.from('tavoli').update({ stato: 'libero', prenotato_da: null, prenotato_alle: null }).eq('id', tavoloId);
      await refreshDati(currentSalaId);
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

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); };
  const apriStatistiche = async () => { 
    setActiveView("statistiche"); 
    if(!currentSalaId) return;
    // Logica statistiche (semplificata per ora)
    setStatsStorico({ giorni: [], topProdotto: "...", topTavolo: "...", incassoMese: 0 });
  };
  const salvaImpostazioni = async () => { if (!currentSalaId) return; await supabase.from('sale').update({ tariffa_standard: tariffaStandard, tariffa_soci: tariffaSoci }).eq('id', currentSalaId); alert("✅ Salvato!"); setActiveView("hub"); };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl tracking-tighter italic">CARICAMENTO TORRE DI CONTROLLO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter print:hidden overflow-x-hidden">
      
      {/* HUB PRINCIPALE */}
      {activeView === "hub" && (
        <div className="animate-in fade-in duration-500">
          <div className="text-center mb-12 mt-8"><h1 className="text-5xl font-black text-green-500 uppercase italic tracking-tighter mb-4">{nomeSala}</h1><p className="text-gray-500 font-mono text-sm uppercase italic">Torre di Controllo</p></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            <button onClick={() => setActiveView("plancia")} className="bg-gray-900 border-2 border-green-600 p-8 rounded-[2.5rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl mb-4">🎱</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Plancia</h2></button>
            <button onClick={() => setActiveView("magazzino")} className="bg-gray-900 border-2 border-blue-600 p-8 rounded-[2.5rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl mb-4">📦</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Magazzino</h2></button>
            <button onClick={() => setActiveView("soci")} className="bg-gray-900 border-2 border-yellow-600 p-8 rounded-[2.5rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl mb-4">👥</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Soci</h2></button>
            <button onClick={() => setActiveView("report")} className="bg-gray-900 border-2 border-purple-600 p-8 rounded-[2.5rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl mb-4">📊</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Cassa</h2></button>
            <button onClick={apriStatistiche} className="col-span-2 bg-gray-900 border-2 border-pink-600 p-8 rounded-[2.5rem] flex items-center justify-center gap-6 hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl">📈</div><div className="text-left"><h2 className="text-2xl font-black uppercase tracking-widest text-white">Statistiche</h2></div></button>
            <button onClick={() => setActiveView("staff")} className="bg-gray-900 border-2 border-cyan-600 p-8 rounded-[2.5rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl mb-4">🧑‍🍳</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Staff</h2></button>
            <button onClick={() => setActiveView("impostazioni")} className="bg-gray-900 border-2 border-gray-600 p-8 rounded-[2.5rem] text-center hover:bg-gray-800 transition-all active:scale-95 shadow-2xl"><div className="text-5xl mb-4">⚙️</div><h2 className="text-xl font-black uppercase tracking-widest text-white">Tariffe</h2></button>
            <button onClick={logout} className="col-span-2 md:col-span-4 bg-red-950/30 border-2 border-red-600 p-6 rounded-[2rem] text-center hover:bg-red-900/50 transition-all active:scale-95 mt-4 text-red-500 font-black uppercase tracking-[0.3em]">Esci dal Sistema</button>
          </div>
        </div>
      )}

      {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase tracking-[0.2em] text-lg flex items-center justify-center gap-4 transition-all active:scale-95 shadow-lg"><span className="text-3xl">🔙</span> MENU PRINCIPALE</button>)}

      {/* PLANCIA */}
      {activeView === 'plancia' && (
        <div className="animate-in slide-in-from-bottom-8 duration-500 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tavoli.map((t) => (
              <div key={t.id} className={`p-8 rounded-[2.5rem] border-4 transition-colors ${t.stato === 'LIBERO' ? 'border-green-900 bg-gray-950' : t.stato === 'PRENOTATO' ? 'border-yellow-500 bg-yellow-900/30' : 'border-red-600 bg-gray-900 shadow-2xl'}`}>
                <div className="flex justify-between items-center mb-8"><h3 className="text-4xl font-black italic">{t.nome}</h3><div className={`h-6 w-6 rounded-full ${t.stato === 'LIBERO' ? 'bg-green-500' : t.stato === 'PRENOTATO' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500 animate-pulse'}`}></div></div>
                
                {t.stato !== 'PRENOTATO' && (
                  <div className="space-y-6 mb-10">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Tempo</span><span className="font-mono text-4xl font-black">{formattaCronometro(t.startTime)}</span></div>
                    <div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Bar</span><span className="text-3xl font-black text-orange-400">€ {t.barTotal.toFixed(2)}</span></div>
                  </div>
                )}

                {t.stato === 'PRENOTATO' && (
                  <div className="bg-black/50 border border-yellow-700 p-6 rounded-3xl mb-10 text-center">
                    <p className="text-yellow-500 font-bold uppercase tracking-widest text-xs mb-2">Riservato a:</p><h4 className="text-2xl font-black text-white mb-4 uppercase">{t.prenotato_da}</h4>
                    <p className="text-yellow-600 font-bold uppercase tracking-widest text-xs mb-1">Ore:</p><h5 className="text-3xl font-black text-yellow-400 font-mono">{t.prenotato_alle}</h5>
                  </div>
                )}

                {t.stato === 'LIBERO' && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-700 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl active:scale-95 transition-transform">AVVIA</button>
                    <button onClick={() => { setActiveTableId(t.id); setIsReserveModalOpen(true); }} className="flex-1 py-8 bg-yellow-600 rounded-3xl text-3xl shadow-xl active:scale-95 transition-transform">📅</button>
                  </div>
                )}

                {t.stato === 'PRENOTATO' && (
                   <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setPlayers([t.prenotato_da || "", "", "", ""]); setIsStartModalOpen(true); }} className="flex-[3] py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl">INIZIA</button>
                    <button onClick={() => annullaPrenotazione(t.id)} className="flex-1 py-8 bg-gray-800 text-red-500 rounded-3xl text-xl shadow-xl">❌</button>
                   </div>
                )}

                {t.stato === 'IN GIOCO' && (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setIsBarModalOpen(true); }} className="flex-1 py-8 bg-orange-600 rounded-3xl text-4xl shadow-xl active:scale-95 transition-transform">🍺</button>
                    <button onClick={() => { 
                      const durata = (Date.now() - t.startTime!) / 3600000; 
                      const costB = durata * parseFloat(t.prezzo); 
                      setSummaryData({ tavoloId: t.id, sessioneId: t.sessioneId, nome: t.nome, tempo: formattaCronometro(t.startTime), costoBiliardo: costB, costoBar: t.barTotal, totale: costB + t.barTotal, giocatori: t.giocatori, socio_id: t.socio_id, consumazioni: t.consumazioni }); 
                      setIsSummaryModalOpen(true); 
                    }} className="flex-[2] py-8 bg-red-700 rounded-3xl font-black uppercase text-xl tracking-widest shadow-xl">CHIUDI</button>
                  </div>
                )}
              </div>
            ))}
            {tavoli.length === 0 && <div className="col-span-full text-center text-gray-500 font-black p-20 border-2 border-dashed border-gray-800 rounded-[3rem]">NESSUN TAVOLO CONFIGURATO NEL DATABASE</div>}
          </div>
        </div>
      )}

      {/* STAFF VIEW */}
      {activeView === 'staff' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <button onClick={() => setIsNewStaffModalOpen(true)} className="mb-8 w-full py-8 bg-cyan-600 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl text-black">+ REGISTRA NUOVO STAFF (PIN)</button>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {listaStaff.map((s) => (
              <div key={s.id} className="bg-gray-900 p-8 rounded-[2.5rem] border-2 border-cyan-900 flex justify-between items-center shadow-xl">
                <div><h4 className="text-2xl font-black uppercase text-white">{s.nome}</h4><p className="text-cyan-500 font-mono font-bold text-lg mt-1 tracking-[0.5em]">PIN: {s.pin}</p></div>
                <button onClick={async () => { if(confirm("Eliminare?")) { await supabase.from('staff').delete().eq('id', s.id); refreshDati(currentSalaId!); } }} className="bg-red-950 text-red-500 p-4 rounded-2xl">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALI NUOVI (PIN PAD, START, BAR, ECC.) */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center p-4 z-[100]">
          <div className="w-full max-w-md text-center">
            <h2 className="text-3xl font-black text-white mb-8 italic uppercase tracking-widest">{pendingAction?.descrizione} - INSERISCI PIN</h2>
            <div className="flex justify-center gap-6 mb-12">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`w-6 h-6 rounded-full border-2 border-cyan-500 ${pinBuffer.length > i ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-transparent'}`}></div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "X"].map((btn) => (
                <button key={btn} onClick={() => {
                  if(btn === 'X') { setIsPinModalOpen(false); setPinBuffer(""); }
                  else if(btn === 'C') setPinBuffer("");
                  else handlePinDigit(btn);
                }} className={`aspect-square rounded-[2rem] text-4xl font-black transition-all active:scale-90 ${btn === 'X' ? 'bg-gray-800' : btn === 'C' ? 'bg-red-950 text-red-500' : 'bg-gray-900 border-2 border-gray-800 hover:bg-cyan-600'}`}>{btn}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isNewStaffModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-cyan-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl"><h3 className="text-3xl font-black text-cyan-500 mb-8 uppercase italic text-center text-white">Nuovo Dipendente</h3><input value={newStaffNome} onChange={(e) => setNewStaffNome(e.target.value)} placeholder="Nome (es. Marco)" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none focus:border-cyan-500" /><input type="password" maxLength={4} value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value)} placeholder="PIN di 4 Cifre" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-3xl font-mono text-cyan-400 tracking-[0.5em] mb-8 text-center outline-none focus:border-cyan-500" /><button onClick={salvaNuovoStaff} className="w-full py-8 bg-cyan-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">SALVA COLLABORATORE</button><button onClick={()=>setIsNewStaffModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}
      {isStartModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic text-center">Avvia Tavolo</h3><select value={selectedSocioId} onChange={(e) => setSelectedSocioId(e.target.value)} className="w-full bg-gray-900 border-4 border-blue-900 p-6 rounded-2xl text-xl text-white mb-8 outline-none"><option value="">👤 Cliente Occasionale</option>{soci.map(s => (<option key={s.id} value={s.id}>🏆 Socio: {s.cognome} {s.nome}</option>))}</select><button onClick={() => richiedePin((staffId) => avviaSessione(staffId), "Avvio Partita")} className="w-full py-8 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all">CONFERMA CON PIN</button><button onClick={()=>setIsStartModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4 text-center">Annulla</button></div></div>)}
      {isReserveModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-yellow-500 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-yellow-500 mb-8 uppercase italic">Prenotazione</h3><input value={reserveName} onChange={(e)=>setReserveName(e.target.value)} placeholder="Nome Cliente" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 outline-none"/><input type="time" value={reserveTime} onChange={(e)=>setReserveTime(e.target.value)} className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-3xl font-mono text-yellow-400 mb-8 text-center outline-none"/><button onClick={prenotaTavolo} className="w-full py-8 bg-yellow-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl">CONFERMA PRENOTAZIONE</button><button onClick={()=>setIsReserveModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}
      {isBarModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-orange-500 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-orange-500 mb-8 uppercase italic">Servizio Bar</h3><select value={selectedProdottoId} onChange={(e) => setSelectedProdottoId(e.target.value)} className="w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-xl text-white mb-12 outline-none"><option value="">Scegli prodotto...</option>{prodotti.map(p => (<option key={p.id} value={p.id}>{p.nome} (€{p.prezzo_vendita})</option>))}</select><button onClick={() => richiedePin((staffId) => aggiungiBar(staffId), "Servizio Bar")} className="w-full py-8 bg-orange-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">CONFERMA CON PIN</button><button onClick={()=>setIsBarModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}
      {isSummaryModalOpen && summaryData && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-green-600 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-green-500 uppercase italic mb-8 italic">Chiusura Tavolo</h3><div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 mb-8 font-bold text-left"><div className="flex justify-between text-xl uppercase mb-2 text-gray-400"><span>Tempo Biliardo</span><span>€ {summaryData.costoBiliardo.toFixed(2)}</span></div><div className="flex justify-between text-xl uppercase text-orange-400 mb-4"><span>Totale Bar</span><span>€ {summaryData.costoBar.toFixed(2)}</span></div><div className="border-t-2 border-gray-700 pt-6 flex justify-between items-center"><span className="text-3xl font-black italic text-white uppercase italic">Totale Conto</span><span className="text-5xl font-black text-green-500 italic">€ {summaryData.totale.toFixed(2)}</span></div></div><div className="flex flex-col gap-4"><button onClick={() => richiedePin((staffId) => confermaChiusura('contanti', staffId), "Pagamento Contanti")} className="w-full py-6 bg-green-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">💵 PAGAMENTO CONTANTI</button><button onClick={() => richiedePin((staffId) => confermaChiusura('pos', staffId), "Pagamento POS")} className="w-full py-6 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">💳 PAGAMENTO POS</button>{summaryData.socio_id && (<button onClick={() => richiedePin((staffId) => confermaChiusura('credito', staffId), "Pagamento Credito")} className="w-full py-6 bg-yellow-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95">💳 SCALA DA TESSERA</button>)}</div><button onClick={()=>setIsSummaryModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Torna Indietro</button></div></div>)}

    </div>
  );
}