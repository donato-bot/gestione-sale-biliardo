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

  // Stati Modali
  const [activeTableId, setActiveTableId] = useState<string | null>(null); 
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isBarModalOpen, setIsBarModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewSocioModalOpen, setIsNewSocioModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false); // NUOVO
  
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinBuffer, setPinBuffer] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

  const [reserveName, setReserveName] = useState("");
  const [reserveTime, setReserveTime] = useState("");
  const [newTableNumber, setNewTableNumber] = useState(""); // NUOVO
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdStock, setNewProdStock] = useState("");
  const [newSocioNome, setNewSocioNome] = useState("");
  const [newSocioCognome, setNewSocioCognome] = useState("");
  const [newStaffNome, setNewStaffNome] = useState("");
  const [newStaffPin, setNewStaffPin] = useState("");
  
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedSocioId, setSelectedSocioId] = useState(""); 
  const [selectedProdottoId, setSelectedProdottoId] = useState("");
  const [players, setPlayers] = useState(["", "", "", ""]);
  const [statsStorico, setStatsStorico] = useState<any>(null);

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
            return {
              id: t.id, numero: t.numero, nome: `Tavolo ${t.numero}`, 
              prezzo: sess ? sess.tariffa_oraria : tariffaStandard, 
              stato: t.stato === 'prenotato' ? "PRENOTATO" : (t.stato === 'occupato' ? "IN GIOCO" : "LIBERO"), 
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
      if (newBuffer.length === 4) verifyPin(newBuffer);
    }
  };

  const verifyPin = (pin: string) => {
    const staff = listaStaff.find(s => s.pin === pin);
    if (staff) {
      const action = pendingAction;
      setPinBuffer(""); setIsPinModalOpen(false); setPendingAction(null);
      action.callback(staff.id);
    } else {
      alert("❌ PIN Errato!"); setPinBuffer("");
    }
  };

  const richiedePin = (callback: (staffId: string) => void, descrizione: string) => {
    if (listaStaff.length === 0) { 
      alert("⚠️ Crea prima uno Staff nel Menu."); setActiveView("staff"); return; 
    }
    setPendingAction({ callback, descrizione }); setIsPinModalOpen(true);
  };

  // --- FUNZIONI DATABASE ---
  const salvaNuovoTavolo = async (staffId: string) => {
    if (!newTableNumber || !currentSalaId) return;
    const { error } = await supabase.from('tavoli').insert([{ sala_id: currentSalaId, numero: parseInt(newTableNumber), stato: 'libero' }]);
    if (error) alert("Errore: " + error.message);
    else { await refreshDati(currentSalaId); setIsNewTableModalOpen(false); setNewTableNumber(""); }
  };

  const eliminaTavolo = async (id: string) => {
    if(confirm("Eliminare definitivamente questo tavolo?")) {
        await supabase.from('tavoli').delete().eq('id', id);
        refreshDati(currentSalaId!);
    }
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

  const formattaCronometro = (startTime: number | null) => {
    if (!startTime) return "00:00:00";
    const diff = Math.max(0, now - startTime);
    const ore = Math.floor(diff / 3600000);
    const minuti = Math.floor((diff % 3600000) / 60000);
    const secondi = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/login'); };
  const stampaScontrino = () => { setReceiptToPrint(summaryData); setTimeout(() => { window.print(); setReceiptToPrint(null); }, 500); };
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl tracking-tighter italic">CARICAMENTO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter print:hidden overflow-x-hidden">
      
      {/* HUB PRINCIPALE */}
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
            <button onClick={logout} className="col-span-2 md:col-span-4 bg-red-950/30 border-2 border-red-600 p-6 rounded-[2rem] text-red-500 font-black uppercase mt-4">Esci dal Sistema</button>
          </div>
        </div>
      )}

      {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase text-lg flex items-center justify-center gap-4 transition-all">🔙 MENU PRINCIPALE</button>)}

      {/* PLANCIA CON TASTO AGGIUNGI TAVOLO */}
      {activeView === 'plancia' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          
          <button 
            onClick={() => setIsNewTableModalOpen(true)}
            className="w-full mb-8 py-8 bg-gray-900 border-4 border-dashed border-green-900 rounded-[2.5rem] text-green-500 font-black text-2xl uppercase italic hover:bg-green-900/20 transition-all"
          >
            ➕ AGGIUNGI NUOVO TAVOLO
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tavoli.map((t) => (
              <div key={t.id} className={`p-8 rounded-[2.5rem] border-4 relative transition-colors ${t.stato === 'LIBERO' ? 'border-green-900 bg-gray-950' : t.stato === 'PRENOTATO' ? 'border-yellow-500 bg-yellow-900/30' : 'border-red-600 bg-gray-900 shadow-2xl'}`}>
                
                {t.stato === 'LIBERO' && (
                    <button onClick={()=>eliminaTavolo(t.id)} className="absolute top-4 right-4 text-gray-700 hover:text-red-500">🗑️</button>
                )}

                <div className="flex justify-between items-center mb-8"><h3 className="text-4xl font-black italic">{t.nome}</h3><div className={`h-6 w-6 rounded-full ${t.stato === 'LIBERO' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div></div>
                <div className="space-y-6 mb-10">
                  <div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Tempo</span><span className="font-mono text-4xl font-black">{formattaCronometro(t.startTime)}</span></div>
                  <div className="flex justify-between items-end border-b border-gray-800 pb-4"><span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Bar</span><span className="text-3xl font-black text-orange-400">€ {t.barTotal.toFixed(2)}</span></div>
                </div>

                {t.stato === 'LIBERO' ? (
                  <button onClick={() => { setActiveTableId(t.id); setIsStartModalOpen(true); }} className="w-full py-8 bg-green-700 rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-transform">AVVIA PARTITA</button>
                ) : (
                  <div className="flex gap-4">
                    <button onClick={() => { setActiveTableId(t.id); setIsBarModalOpen(true); }} className="flex-1 py-8 bg-orange-600 rounded-3xl text-4xl shadow-xl active:scale-95 transition-transform">🍺</button>
                    <button onClick={() => { 
                      const durata = (Date.now() - t.startTime!) / 3600000; 
                      const costB = durata * parseFloat(t.prezzo); 
                      setSummaryData({ tavoloId: t.id, sessioneId: t.sessioneId, nome: t.nome, tempo: formattaCronometro(t.startTime), costoBiliardo: costB, costoBar: t.barTotal, totale: costB + t.barTotal, giocatori: t.giocatori, socio_id: t.socio_id, consumazioni: t.consumazioni }); 
                      setIsSummaryModalOpen(true); 
                    }} className="flex-[2] py-8 bg-red-700 rounded-3xl font-black uppercase text-xl shadow-xl">CHIUDI</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALE: NUOVO TAVOLO */}
      {isNewTableModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center">
            <h3 className="text-3xl font-black text-green-500 mb-8 uppercase italic">Configura Tavolo</h3>
            <label className="block text-gray-500 uppercase font-bold text-xs mb-4">Numero del Tavolo (es. 2, 3, 4...)</label>
            <input 
              type="number" 
              value={newTableNumber} 
              onChange={(e)=>setNewTableNumber(e.target.value)} 
              placeholder="Esempio: 2"
              className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-4xl text-center text-white mb-8 outline-none focus:border-green-500"
            />
            <button 
              onClick={() => richiedePin((staffId) => salvaNuovoTavolo(staffId), "Aggiunta Tavolo")}
              className="w-full py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl active:scale-95 transition-all"
            >
              CONFERMA CON PIN
            </button>
            <button onClick={()=>setIsNewTableModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button>
          </div>
        </div>
      )}

      {/* PIN PAD MODALE */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center p-4 z-[100] animate-in zoom-in-95">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-black text-cyan-500 mb-8 italic uppercase tracking-widest">{pendingAction?.descrizione}</h2>
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

      {/* ALTRI MODALI (Invariati per brevità, ma necessari per il funzionamento) */}
      {isStartModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-blue-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl"><h3 className="text-3xl font-black text-blue-500 mb-8 uppercase italic text-center">Avvia Tavolo</h3><select value={selectedSocioId} onChange={(e) => setSelectedSocioId(e.target.value)} className="w-full bg-gray-900 border-4 border-blue-900 p-6 rounded-2xl text-xl text-white mb-8 outline-none"><option value="">👤 Cliente Occasionale</option>{soci.map(s => (<option key={s.id} value={s.id}>🏆 Socio: {s.cognome} {s.nome}</option>))}</select><button onClick={() => richiedePin((staffId) => avviaSessione(staffId), "Avvio Partita")} className="w-full py-8 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl">CONFERMA CON PIN</button></div></div>)}
      {isBarModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-orange-500 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-orange-500 mb-8 uppercase italic">Servizio Bar</h3><select value={selectedProdottoId} onChange={(e) => setSelectedProdottoId(e.target.value)} className="w-full bg-gray-900 p-8 rounded-2xl border border-gray-800 text-xl text-white mb-12"><option value="">Scegli prodotto...</option>{prodotti.map(p => (<option key={p.id} value={p.id}>{p.nome} (€{p.prezzo_vendita})</option>))}</select><button onClick={() => richiedePin((staffId) => aggiungiBar(staffId), "Servizio Bar")} className="w-full py-8 bg-orange-600 rounded-3xl font-black uppercase text-xl shadow-xl">CONFERMA CON PIN</button></div></div>)}
      {isSummaryModalOpen && summaryData && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-950 border-4 border-green-600 p-8 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-4xl font-black text-green-500 uppercase italic mb-8 italic">Chiusura Tavolo</h3><div className="bg-gray-900 p-6 rounded-3xl border border-gray-800 mb-8 font-bold text-left"><div className="flex justify-between text-xl uppercase mb-2 text-gray-400"><span>Tempo</span><span>€ {summaryData.costoBiliardo.toFixed(2)}</span></div><div className="flex justify-between text-xl uppercase text-orange-400 mb-4"><span>Bar</span><span>€ {summaryData.costoBar.toFixed(2)}</span></div><div className="border-t-2 border-gray-700 pt-6 flex justify-between items-center"><span className="text-3xl font-black italic text-white italic">TOTALE</span><span className="text-5xl font-black text-green-500 italic">€ {summaryData.totale.toFixed(2)}</span></div></div><div className="flex flex-col gap-4"><button onClick={() => richiedePin((staffId) => confermaChiusura('contanti', staffId), "Pagamento Contanti")} className="w-full py-6 bg-green-600 rounded-3xl font-black uppercase text-xl shadow-xl">💵 CONTANTI</button><button onClick={() => richiedePin((staffId) => confermaChiusura('pos', staffId), "Pagamento POS")} className="w-full py-6 bg-blue-600 rounded-3xl font-black uppercase text-xl shadow-xl">💳 POS</button></div><button onClick={()=>setIsSummaryModalOpen(false)} className="w-full py-4 text-gray-500 uppercase font-bold mt-4">Annulla</button></div></div>)}
      {activeView === 'staff' && (<div className="max-w-6xl mx-auto"><button onClick={() => setIsNewStaffModalOpen(true)} className="mb-8 w-full py-8 bg-cyan-600 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl text-black">+ REGISTRA NUOVO STAFF (PIN)</button><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{listaStaff.map((s) => (<div key={s.id} className="bg-gray-900 p-8 rounded-[2.5rem] border-2 border-cyan-900 flex justify-between items-center shadow-xl"><div><h4 className="text-2xl font-black uppercase text-white">{s.nome}</h4><p className="text-cyan-500 font-mono font-bold text-lg mt-1 tracking-[0.5em]">PIN: {s.pin}</p></div><button onClick={async () => { if(confirm("Eliminare?")) { await supabase.from('staff').delete().eq('id', s.id); refreshDati(currentSalaId!); } }} className="bg-red-950 text-red-500 p-4 rounded-2xl">🗑️</button></div>))}</div></div>)}
      {isNewStaffModalOpen && (<div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-cyan-600 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl text-center"><h3 className="text-3xl font-black text-cyan-500 mb-8 uppercase italic text-white">Nuovo Dipendente</h3><input value={newStaffNome} onChange={(e) => setNewStaffNome(e.target.value)} placeholder="Nome" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-xl text-white mb-4 text-center" /><input type="password" maxLength={4} value={newStaffPin} onChange={(e) => setNewStaffPin(e.target.value)} placeholder="PIN di 4 Cifre" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-3xl font-mono text-cyan-400 tracking-[0.5em] mb-8 text-center" /><button onClick={salvaNuovoStaff} className="w-full py-8 bg-cyan-600 text-black rounded-3xl font-black uppercase text-xl shadow-xl">SALVA</button></div></div>)}

    </div>
  );
}