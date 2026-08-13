// ==========================================
// FILE: src/components/TavoliManager.tsx
// OBIETTIVO: Gestione Tavoli con Registratore di Cassa, Contabilità, Ordini Bar e Controlli Ordinati
// ==========================================
"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

interface Consumazione {
  id: string;
  nome: string;
  prezzo: number;
  quantita: number;
}

interface Tavolo {
  id: string;
  nome: string;
  stato: string;
  manager_email?: string;
  ora_inizio?: string | null;
  tariffa_specifica?: number | null;
  consumazioni?: Consumazione[] | null;
}

interface ProdottoMagazzino {
  id: string;
  nome_prodotto: string;
  prezzo_vendita: number;
}

export default function TavoliManager(props: any) {
  const [salaId, setSalaId] = useState<string | null>(props.salaId || props.id || null);
  const [managerEmail, setManagerEmail] = useState<string>(""); 
  
  const [tariffaBase, setTariffaBase] = useState<number>(0);
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [prodottiBar, setProdottiBar] = useState<ProdottoMagazzino[]>([]);
  
  const [nuovoNome, setNuovoNome] = useState("");
  const [maxTavoli, setMaxTavoli] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [errore, setErrore] = useState<string | null>(null);
  
  // Stati per le Consumazioni
  const [tavoloOrdine, setTavoloOrdine] = useState<Tavolo | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!salaId && typeof window !== "undefined") {
      const pathArray = window.location.pathname.split("/");
      const urlId = pathArray[pathArray.length - 1];
      
      if (urlId && urlId.length > 10) { 
        setSalaId(urlId);
      } else {
        setErrore("⚠️ Errore di Sistema: Identificativo della sala non trovato nell'URL.");
        setLoading(false);
      }
      return; 
    }

    if (!salaId) return;

    const inizializzaPlancia = async () => {
      setLoading(true);
      try {
        const { data: salaData, error: salaError } = await supabase
          .from("sale")
          .select("numero_biliardi, manager_email, tariffa_base") 
          .eq("id", salaId)
          .single();

        if (salaError) throw salaError;
        if (salaData) {
          setMaxTavoli(salaData.numero_biliardi);
          setManagerEmail(salaData.manager_email || "");
          setTariffaBase(salaData.tariffa_base || 0);
        }

        await caricaTavoli();
        await caricaMagazzino();
      } catch (error: any) {
        console.error("Errore Plancia:", error);
        setErrore(`ERRORE DATABASE: ${error.message || "Sconosciuto"}`);
      } finally {
        setLoading(false);
      }
    };

    inizializzaPlancia();
  }, [salaId]);

  const caricaTavoli = async () => {
    const { data, error } = await supabase
      .from("tavoli")
      .select("*")
      .eq("sala_id", salaId)
      .order("nome", { ascending: true });

    if (error) throw error;
    if (data) setTavoli(data);
  };

  const caricaMagazzino = async () => {
    const { data, error } = await supabase
      .from("magazzino")
      .select("id, nome_prodotto, prezzo_vendita")
      .eq("sala_id", salaId)
      .not("prezzo_vendita", "is", null) 
      .order("nome_prodotto", { ascending: true });

    if (!error && data) {
      setProdottiBar(data);
    }
  };

  const handleAggiungiTavolo = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeTrimmed = nuovoNome.trim();
    if (!nomeTrimmed) return;
    
    // 1. CONTROLLO DUPLICATO: Verifichiamo prima se il nome esiste già
    const esisteGia = tavoli.some(t => t.nome.toLowerCase() === nomeTrimmed.toLowerCase());
    if (esisteGia) {
      alert(`⚠️ ATTENZIONE: Esiste già un tavolo chiamato "${nomeTrimmed.toUpperCase()}".`);
      return;
    }

    // 2. CONTROLLO LICENZA: Se è un nome nuovo, verifichiamo il limite massimo
    if (maxTavoli !== null && tavoli.length >= maxTavoli) {
      alert(`⚠️ BLOCCO SISTEMA: Limite licenza raggiunto (${maxTavoli} biliardi). Impossibile aggiungere nuovi tavoli.`);
      return;
    }
    
    try {
      const { error } = await supabase
        .from("tavoli")
        .insert([{ 
          nome: nomeTrimmed.toUpperCase(), 
          sala_id: salaId, 
          stato: 'libero',
          manager_email: managerEmail,
          consumazioni: []
        }]);
      if (error) throw error;
      setNuovoNome("");
      await caricaTavoli();
    } catch (error: any) {
      alert("Errore aggiunta tavolo: " + error.message);
    }
  };

  const handleEliminaTavolo = async (id: string, nome: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare il tavolo "${nome}"?`)) return;
    try {
      const { error } = await supabase.from("tavoli").delete().eq("id", id);
      if (error) throw error;
      setTavoli(tavoli.filter(t => t.id !== id));
    } catch (error: any) {
      alert("Errore eliminazione tavolo: " + error.message);
    }
  };

  const handleApriTavolo = async (id: string) => {
    try {
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from("tavoli")
        .update({ stato: 'in uso', ora_inizio: timestamp, consumazioni: [] })
        .eq("id", id);
      if (error) throw error;
      await caricaTavoli();
    } catch (error: any) {
      alert("Errore apertura tavolo: " + error.message);
    }
  };

  const aggiungiProdottoAlTavolo = async (prodotto: ProdottoMagazzino) => {
    if (!tavoloOrdine) return;

    const consumazioniAttuali = tavoloOrdine.consumazioni || [];
    const indexEsistente = consumazioniAttuali.findIndex(c => c.id === prodotto.id);
    
    let nuoveConsumazioni = [...consumazioniAttuali];

    if (indexEsistente >= 0) {
      nuoveConsumazioni[indexEsistente].quantita += 1;
    } else {
      nuoveConsumazioni.push({
        id: prodotto.id,
        nome: prodotto.nome_prodotto,
        prezzo: prodotto.prezzo_vendita,
        quantita: 1
      });
    }

    try {
      const { error } = await supabase
        .from("tavoli")
        .update({ consumazioni: nuoveConsumazioni })
        .eq("id", tavoloOrdine.id);
      
      if (error) throw error;

      setTavoloOrdine({ ...tavoloOrdine, consumazioni: nuoveConsumazioni });
      setTavoli(tavoli.map(t => t.id === tavoloOrdine.id ? { ...t, consumazioni: nuoveConsumazioni } : t));
    } catch (error: any) {
      alert("Errore aggiunta consumazione: " + error.message);
    }
  };

  const handleChiudiTavolo = async (tavolo: Tavolo) => {
    if (!tavolo.ora_inizio) {
      liberaTavolo(tavolo.id);
      return;
    }
    
    const inizio = new Date(tavolo.ora_inizio).getTime();
    const fine = new Date().getTime();
    const diffMs = fine - inizio;
    const diffMinuti = Math.max(0, Math.floor(diffMs / 60000));
    const oreGiocate = Math.floor(diffMinuti / 60);
    const minutiGiocati = diffMinuti % 60;
    
    const tariffaApplicata = tavolo.tariffa_specifica || tariffaBase || 0;
    const costoTempo = (diffMinuti / 60) * tariffaApplicata;
    
    const consumazioni = tavolo.consumazioni || [];
    const totaleConsumazioni = consumazioni.reduce((acc, c) => acc + (c.prezzo * c.quantita), 0);
    
    const totaleDaPagare = (costoTempo + totaleConsumazioni).toFixed(2);
    
    let testoConsumazioni = "";
    if (consumazioni.length > 0) {
      testoConsumazioni = "\n🍹 Consumazioni Bar:\n" + consumazioni.map(c => `- ${c.quantita}x ${c.nome} (€ ${(c.prezzo * c.quantita).toFixed(2)})`).join("\n") + `\nTotale Bar: € ${totaleConsumazioni.toFixed(2)}\n`;
    }

    const scontrino = `🧾 SCONTRINO VIRTURALE - ${tavolo.nome}\n\n⏱️ Tempo di gioco: ${oreGiocate}h e ${minutiGiocati}m\n💰 Costo Biliardo: € ${costoTempo.toFixed(2)}\n${testoConsumazioni}\n👉 TOTALE DA INCASSARE: € ${totaleDaPagare}\n\nClicca OK per confermare l'incasso e liberare il tavolo.`;
    
    if (!window.confirm(scontrino)) return;
    
    try {
      const { error: errorScontrino } = await supabase
        .from("scontrini")
        .insert([{
          sala_id: salaId,
          manager_email: managerEmail,
          tavolo_nome: tavolo.nome,
          ora_inizio: tavolo.ora_inizio,
          ora_fine: new Date().toISOString(),
          minuti_giocati: diffMinuti,
          tariffa_applicata: tariffaApplicata,
          importo_totale: parseFloat(totaleDaPagare),
          consumazioni: consumazioni,
          totale_consumazioni: totaleConsumazioni
        }]);
      
      if (errorScontrino) throw errorScontrino;

      alert("✅ Scontrino salvato con successo!");
      await liberaTavolo(tavolo.id);
    } catch (error: any) {
      alert("Errore chiusura: " + error.message);
    }
  };

  const liberaTavolo = async (id: string) => {
    try {
      const { error } = await supabase
        .from("tavoli")
        .update({ stato: 'libero', ora_inizio: null, consumazioni: [] })
        .eq("id", id);
      if (error) throw error;
      await caricaTavoli();
    } catch (error: any) {
      alert("Errore chiusura tavolo: " + error.message);
    }
  };

  const formattaCronometro = (oraInizio: string) => {
    const inizio = new Date(oraInizio).getTime();
    const diff = now.getTime() - inizio;
    if (diff < 0) return "00:00:00";
    const ore = Math.floor(diff / (1000 * 60 * 60));
    const minuti = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondi = Math.floor((diff % (1000 * 60)) / 1000);
    return `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center p-10 text-cyan-500 font-black uppercase tracking-widest animate-pulse">Inizializzazione Plancia...</div>;
  if (errore) return <div className="text-center p-10 text-red-500 font-black uppercase tracking-widest">{errore}</div>;

  return (
    <div className="space-y-8 relative">
      {/* HEADER PLANCIA */}
      <div className="bg-[#0b0e14] border-2 border-gray-800 p-6 rounded-2xl flex flex-col xl:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="w-full xl:w-auto">
          <h2 className="text-lg font-black uppercase tracking-widest text-white">PLANCIA TAVOLI & BILIARDI</h2>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Gestisci l'occupazione in tempo reale.</p>
          <div className="flex flex-wrap gap-4 mt-4 items-center">
            {maxTavoli !== null && (
              <span className="text-cyan-400 text-[10px] uppercase font-black bg-cyan-900/20 px-3 py-1.5 rounded border border-cyan-800/50 tracking-widest">
                Licenza: {tavoli.length} / {maxTavoli} Biliardi
              </span>
            )}
            <span className="text-emerald-400 text-[10px] uppercase font-black bg-emerald-900/20 px-3 py-1.5 rounded border border-emerald-800/50 tracking-widest">
              Tariffa in vigore: € {tariffaBase}/h
            </span>
          </div>
        </div>
        
        <form onSubmit={handleAggiungiTavolo} className="flex w-full xl:w-auto gap-3">
          <input 
            type="text" 
            placeholder="NOME TAVOLO (es. Biliardo 1)" 
            value={nuovoNome} 
            onChange={(e) => setNuovoNome(e.target.value)} 
            className="bg-[#151926] border-2 border-gray-700 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase w-full sm:w-64 focus:outline-none focus:border-cyan-500 transition-colors" 
          />
          <button 
            type="submit" 
            className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg whitespace-nowrap"
          >
            + Aggiungi
          </button>
        </form>
      </div>

      {/* GRIGLIA TAVOLI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {tavoli.map((tavolo) => {
          const inUso = tavolo.stato === 'in uso';
          const tariffaAttiva = tavolo.tariffa_specifica || tariffaBase || 0;
          
          const totaleParzialeConsumazioni = (tavolo.consumazioni || []).reduce((acc, c) => acc + (c.prezzo * c.quantita), 0);

          return (
            <div key={tavolo.id} className={`bg-[#0b0e14] border-2 ${inUso ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-gray-800 shadow-xl'} rounded-2xl p-5 relative flex flex-col justify-between transition-all`}>
              <button onClick={() => handleEliminaTavolo(tavolo.id, tavolo.nome)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500 font-black text-lg transition-colors">×</button>
              
              <div>
                <h3 className="text-white font-black uppercase text-lg mb-1 tracking-wider">{tavolo.nome}</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-4 tracking-widest">Tariffa Applicata: € {tariffaAttiva}/h</p>
                
                <div className="mb-4 flex flex-col justify-center items-start">
                  {inUso ? (
                    <>
                      <span className="bg-cyan-900/30 text-cyan-400 border border-cyan-800/50 px-3 py-1 rounded-md text-[10px] font-black uppercase mb-2 tracking-widest">IN USO</span>
                      <span className="text-4xl text-white font-mono font-black">{tavolo.ora_inizio ? formattaCronometro(tavolo.ora_inizio) : "00:00:00"}</span>
                      
                      {/* Box Consumazioni Rapido */}
                      <div className="w-full mt-4 bg-[#151926] p-3 rounded-xl border border-gray-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Ordini Bar</span>
                          <span className="text-[10px] font-black text-emerald-400">€ {totaleParzialeConsumazioni.toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => setTavoloOrdine(tavolo)}
                          className="w-full bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          + Aggiungi Consumazione
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="bg-emerald-900/30 text-emerald-500 border border-emerald-800/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">LIBERO</span>
                  )}
                </div>
              </div>
              
              {inUso ? (
                <button onClick={() => handleChiudiTavolo(tavolo)} className="w-full mt-2 bg-red-900/20 hover:bg-red-900/40 border-2 border-red-900/50 text-red-500 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                  ⏹ CHIUDI E INCASSA
                </button>
              ) : (
                <button onClick={() => handleApriTavolo(tavolo.id)} className="w-full mt-2 bg-[#151926] hover:bg-[#1e2433] border-2 border-emerald-900/30 text-emerald-500 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors">
                  ▶ APRI TAVOLO
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* POPUP MODAL: ORDINI BAR */}
      {tavoloOrdine && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 rounded-2xl w-full max-w-lg shadow-2xl shadow-black relative flex flex-col max-h-[80vh]">
            
            <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black italic text-cyan-400 uppercase tracking-tight">Ordini Bar - {tavoloOrdine.nome}</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Seleziona i prodotti da aggiungere al conto</p>
              </div>
              <button onClick={() => setTavoloOrdine(null)} className="text-gray-500 hover:text-red-500 font-black text-xl transition-colors">✖</button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-2">
              {prodottiBar.length === 0 ? (
                <p className="text-center text-gray-500 text-xs font-bold uppercase">Nessun prodotto disponibile nel magazzino.</p>
              ) : (
                prodottiBar.map(prodotto => {
                  const qtaOrdinata = tavoloOrdine.consumazioni?.find(c => c.id === prodotto.id)?.quantita || 0;
                  
                  return (
                    <div key={prodotto.id} className="flex justify-between items-center bg-[#1e293b] border border-gray-700/50 p-3 rounded-xl hover:border-cyan-500/30 transition-colors">
                      <div>
                        <p className="text-sm font-black uppercase text-gray-200">{prodotto.nome_prodotto}</p>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase">€ {prodotto.prezzo_vendita.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {qtaOrdinata > 0 && <span className="bg-cyan-900/40 text-cyan-400 px-2 py-1 rounded text-[10px] font-black">{qtaOrdinata}x</span>}
                        <button 
                          onClick={() => aggiungiProdottoAlTavolo(prodotto)}
                          className="w-10 h-10 rounded-full bg-cyan-900/30 text-cyan-400 hover:bg-cyan-500 hover:text-black flex items-center justify-center font-black transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-6 border-t border-gray-700/50 bg-[#0b0e14]/50 rounded-b-2xl">
              <button onClick={() => setTavoloOrdine(null)} className="w-full bg-gray-800 hover:bg-gray-700 text-white font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all">
                CHIUDI MENU
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}