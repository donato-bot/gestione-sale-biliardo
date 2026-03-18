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
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false); // PRENOTAZIONI
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  const [pinBuffer, setPinBuffer] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

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

  // --- LOGICA PIN ---
  const handlePinDigit = (digit: string) => {
    if (pinBuffer.length < 4) {
      const newBuffer = pinBuffer + digit;
      setPinBuffer(newBuffer);
      if (newBuffer.length === 4) {
        const staff = listaStaff.find(s => s.pin === newBuffer);
        if (staff) {
          const action = pendingAction;
          setPinBuffer(""); setIsPinModalOpen(false); setPendingAction(null);
          action.callback(staff.id);
        } else {
          alert("❌ PIN Errato!"); setPinBuffer("");
        }
      }
    }
  };

  const richiedePin = (callback: (staffId: string) => void, descrizione: string) => {
    if (listaStaff.length === 0) { alert("⚠️ Crea Staff."); setActiveView("staff"); return; }
    setPendingAction({ callback, descrizione }); setIsPinModalOpen(true);
  };

  // --- FUNZIONI PRENOTAZIONI ---
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

  // --- ALTRE AZIONI DB ---
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
    if (players[0] === "" && reserveName !== "") giocatoriFinali[0] = reserveName; // Se veniamo da prenotazione
    
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
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter overflow-x-hidden">
      
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
            {/* Qui aggiungeremo il calendario e la lista */}
          </div>
        </div>
      )}

      {/* TORNEI */}
      {activeView === 'tornei' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <h3 className="text-3xl font-black text-pink-500 uppercase italic mb-8 border-b border-gray-800 pb-4">Gestione Tornei</h3>
          <div className="bg-gray-900 p-10 rounded-[3rem] border-4 border-gray-800 shadow-2xl text-center">
            <p className="text-gray-500 font-bold uppercase">Modulo Tornei in costruzione...</p>
            {/* Qui aggiungeremo il tabellone e le iscrizioni */}
          </div>
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

      {/* ---------------- MODALI DI INPUT ---------------- */}
      
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

    </div>
  );
}