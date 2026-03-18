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
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState(false);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  
  const [pinBuffer, setPinBuffer] = useState("");
  const [pendingAction, setPendingAction] = useState<any>(null);

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
              consumazioni: consumazioniDettaglio, staff_nome: sess?.staff?.nome
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
    if (listaStaff.length === 0) { alert("⚠️ Registra Staff."); return; }
    setPendingAction({ callback, descrizione }); setIsPinModalOpen(true);
  };

  // --- AZIONI CASSA ---
  const annullaTransazione = async (id: string, staffId: string) => {
    if (confirm("Sei sicuro di voler ANNULLARE questa transazione? L'importo verrà rimosso dalla cassa.")) {
        await supabase.from('sessioni').delete().eq('id', id);
        refreshDati(currentSalaId!);
    }
  };

  // --- FUNZIONI DB (SOCI, STAFF, TAVOLI) ---
  const salvaNuovoSocio = async (staffId: string) => {
    await supabase.from('soci').insert([{ sala_id: currentSalaId, nome: newSocioNome, cognome: newSocioCognome, credito: 0 }]);
    await refreshDati(currentSalaId!); setIsNewSocioModalOpen(false);
  };

  const salvaRicarica = async (staffId: string) => {
    const nuovoCredito = parseFloat(socioToRecharge.credito || 0) + parseFloat(rechargeAmount);
    await supabase.from('soci').update({ credito: nuovoCredito }).eq('id', socioToRecharge.id);
    await refreshDati(currentSalaId!); setIsRechargeModalOpen(false);
  };

  const avviaSessione = async (staffId: string) => {
    const tariffa = selectedSocioId ? tariffaSoci : tariffaStandard;
    await supabase.from('sessioni').insert([{ tavolo_id: activeTableId, sala_id: currentSalaId, inizio: new Date().toISOString(), giocatori: players.filter(p => p.trim() !== ""), tariffa_oraria: tariffa, stato: 'in_corso', socio_id: selectedSocioId || null, staff_id: staffId }]);
    await supabase.from('tavoli').update({ stato: 'occupato' }).eq('id', activeTableId);
    await refreshDati(currentSalaId!); setIsStartModalOpen(false);
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

  const formattaCronometro = (startTime: number | null) => {
    if (!startTime) return "00:00:00";
    const diff = Math.max(0, now - startTime);
    const ore = Math.floor(diff / 3600000);
    const minuti = Math.floor((diff % 3600000) / 60000);
    const secondi = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black text-2xl">CARICAMENTO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans tracking-tighter overflow-x-hidden">
      
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
            <button onClick={() => { supabase.auth.signOut(); router.push('/login'); }} className="col-span-2 md:col-span-4 bg-red-950/30 border-2 border-red-600 p-6 rounded-[2rem] text-red-500 font-black uppercase mt-4">Esci dal Sistema</button>
          </div>
        </div>
      )}

      {activeView !== "hub" && (<button onClick={() => setActiveView("hub")} className="w-full max-w-6xl mx-auto bg-gray-900 hover:bg-gray-800 border border-gray-700 text-white py-6 rounded-[2rem] mb-8 font-black uppercase text-lg flex items-center justify-center gap-4 transition-all">🔙 MENU PRINCIPALE</button>)}

      {/* --- VISTA CASSA (REPORT) AGGIORNATA --- */}
      {activeView === 'report' && (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-center">
            <div className="bg-gray-900 p-8 rounded-[3rem] border-4 border-purple-600 shadow-2xl"><p className="text-purple-400 font-black uppercase text-xs mb-2 tracking-widest">Totale Oggi</p><h3 className="text-6xl font-black italic">€ {incassoTotale.toFixed(2)}</h3></div>
            <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-green-600"><p className="text-green-500 font-black uppercase text-xs mb-2">Contanti</p><h3 className="text-4xl font-black italic">€ {incassoContanti.toFixed(2)}</h3></div>
            <div className="bg-gray-900 p-8 rounded-[3rem] border-2 border-blue-600"><p className="text-blue-500 font-black uppercase text-xs mb-2">POS</p><h3 className="text-4xl font-black italic">€ {incassoPOS.toFixed(2)}</h3></div>
          </div>

          <h3 className="text-2xl font-black uppercase italic mb-6 text-gray-500">Prima Nota (Oggi)</h3>
          <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <table className="w-full text-left text-xs uppercase font-bold">
              <thead className="bg-gray-800/80 text-gray-500">
                <tr><th className="p-5">Ora</th><th className="p-5">Giocatori</th><th className="p-5">Staff</th><th className="p-5">Metodo</th><th className="p-5 text-right">Importo</th><th className="p-5 text-center">Azione</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {recenti.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-5 font-mono">{new Date(r.fine).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="p-5">{r.giocatori?.join(" / ")}</td>
                    <td className="p-5 text-cyan-500 italic">{r.staff?.nome || "ADMIN"}</td>
                    <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] ${r.metodo_pagamento === 'pos' ? 'bg-blue-900/30 text-blue-400' : 'bg-green-900/30 text-green-400'}`}>
                            {r.metodo_pagamento}
                        </span>
                    </td>
                    <td className="p-5 text-right font-black text-white text-lg italic">€ {parseFloat(r.costo_totale).toFixed(2)}</td>
                    <td className="p-5 text-center">
                        <button 
                            onClick={() => richiedePin((staffId) => annullaTransazione(r.id, staffId), "Annullamento Transazione")}
                            className="bg-red-950 text-red-500 p-3 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                            STORNA
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* (Mantenere qui i blocchi PLANCIA, MAGAZZINO, SOCI, STAFF del codice precedente) */}
      {/* ... */}

      {/* PIN PAD */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/98 flex items-center justify-center p-4 z-[100] animate-in zoom-in-95">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-black text-cyan-500 mb-8 italic uppercase tracking-widest">{pendingAction?.descrizione}</h2>
            <div className="flex justify-center gap-6 mb-12">
              {[...Array(4)].map((_, i) => (<div key={i} className={`w-6 h-6 rounded-full border-2 border-cyan-500 ${pinBuffer.length > i ? 'bg-cyan-500 shadow-[0_0_15px_#06b6d4]' : 'bg-transparent'}`}></div>))}
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

      {/* MODALE RICARICA */}
      {isRechargeModalOpen && socioToRecharge && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50"><div className="bg-gray-900 border-4 border-green-600 p-10 rounded-[3rem] w-full max-w-lg text-center shadow-2xl"><h3 className="text-2xl font-black text-green-500 mb-2 uppercase">Ricarica Credito</h3><p className="text-3xl font-black text-white mb-8">{socioToRecharge.nome} {socioToRecharge.cognome}</p><input type="number" value={rechargeAmount} onChange={(e)=>setRechargeAmount(e.target.value)} placeholder="€" className="w-full bg-black border border-gray-800 p-6 rounded-2xl text-5xl text-center text-green-500 mb-8 font-black" /><button onClick={() => richiedePin((staffId) => salvaRicarica(staffId), `Ricarica ${socioToRecharge.nome}`)} className="w-full py-8 bg-green-600 text-black rounded-3xl font-black uppercase text-xl active:scale-95">CONFERMA CON PIN</button></div></div>)}

    </div>
  );
}