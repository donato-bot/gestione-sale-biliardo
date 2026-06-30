"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

export default function Plancia({ 
  salaId, 
  userRole, 
  userEmail, 
  setActiveView 
}: { 
  salaId: string, 
  userRole?: string, 
  userEmail?: string,
  setActiveView?: (view: string) => void 
}) {
  const [tables, setTables] = useState<any[]>([]);
  const [prodotti, setProdotti] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());
  const [successo, setSuccesso] = useState<string | null>(null);

  // STATI PER IL BAR SUL TAVOLO
  const [tavoloBar, setTavoloBar] = useState<any | null>(null);
  const [carrelloBar, setCarrelloBar] = useState<any[]>([]);
  
  // STATI PER LA VOCE MANUALE NEL BAR
  const [voceManualeDescrizione, setVoceManualeDescrizione] = useState("");
  const [voceManualeImporto, setVoceManualeImporto] = useState("");

  // STATI PER LA CHIUSURA
  const [tavoloDaChiudere, setTavoloDaChiudere] = useState<any | null>(null);
  const [dettagliChiusura, setDettagliChiusura] = useState<any | null>(null);
  const [mostraInputSospeso, setMostraInputSospeso] = useState(false);
  const [notaSospeso, setNotaSospeso] = useState("");
  const [giocatori, setGiocatori] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    fetchData();
    caricaMagazzino();
    return () => clearInterval(timer);
  }, [salaId]);

  const fetchData = async () => {
    const { data } = await supabase.from("tavoli").select("*").eq("sala_id", salaId).order("numero");
    if (data) setTables(data);
  };

  const caricaMagazzino = async () => {
    const { data } = await supabase.from("magazzino").select("*").eq("sala_id", salaId).order("nome_prodotto");
    if (data) setProdotti(data);
  };

  // --- LOGICA GESTIONE BAR TAVOLO ---
  const apriBarTavolo = (tavolo: any) => {
    setTavoloBar(tavolo);
    setCarrelloBar([]);
    setVoceManualeDescrizione("");
    setVoceManualeImporto("");
  };

  const aggiungiProdotto = (prodotto: any) => {
    setCarrelloBar((prev) => {
      const esiste = prev.find((v) => v.prodotto.id === prodotto.id);
      if (esiste) {
        return prev.map((v) => v.prodotto.id === prodotto.id ? { ...v, quantita: v.quantita + 1 } : v);
      }
      return [...prev, { prodotto, quantita: 1 }];
    });
  };

  const aggiungiVoceManuale = () => {
    const imp = parseFloat(voceManualeImporto);
    if (!voceManualeDescrizione.trim() || isNaN(imp) || imp <= 0) {
      return alert("Inserisci una descrizione e un importo valido.");
    }

    // Creiamo un "prodotto virtuale" per la voce manuale
    const prodottoManuale = {
      id: `manuale-${Date.now()}`,
      nome_prodotto: voceManualeDescrizione.trim(),
      prezzo_vendita: imp,
      giacenza: 0, // Ininfluente per la voce manuale
      isManuale: true
    };

    setCarrelloBar((prev) => [...prev, { prodotto: prodottoManuale, quantita: 1 }]);
    setVoceManualeDescrizione("");
    setVoceManualeImporto("");
  };

  const rimuoviVoceBar = (id: string) => {
    setCarrelloBar((prev) => prev.filter((v) => v.prodotto.id !== id));
  };

  const confermaOrdineBar = async () => {
    if (carrelloBar.length === 0) return setTavoloBar(null);

    const totaleOrdine = carrelloBar.reduce((acc, v) => acc + (v.prodotto.prezzo_vendita * v.quantita), 0);
    const dettaglioVoci = carrelloBar.map(v => `${v.quantita}x ${v.prodotto.nome_prodotto}`).join(", ");
    
    const nuovoConto = parseFloat(tavoloBar.conto_bar || 0) + totaleOrdine;
    const nuovoDettaglio = tavoloBar.dettagli_bar ? `${tavoloBar.dettagli_bar}, ${dettaglioVoci}` : dettaglioVoci;

    try {
      await supabase.from("tavoli").update({ conto_bar: nuovoConto, dettagli_bar: nuovoDettaglio }).eq("id", tavoloBar.id);
      
      // Scaliamo dal magazzino SOLO i prodotti reali, non le voci manuali
      for (const voce of carrelloBar) {
        if (!voce.prodotto.isManuale) {
          const nuovaGiacenza = voce.prodotto.giacenza - voce.quantita;
          await supabase.from("magazzino").update({ giacenza: nuovaGiacenza }).eq("id", voce.prodotto.id);
        }
      }

      setSuccesso("ORDINAZIONE ADDEBITATA AL TAVOLO!");
      setTimeout(() => setSuccesso(null), 3000);
      setTavoloBar(null);
      setCarrelloBar([]);
      fetchData();
      caricaMagazzino();
    } catch (e: any) {
      alert("Errore registrazione bar: " + e.message);
    }
  };

  // --- LOGICA GESTIONE GIOCO ---
  const gestisciTavolo = async (tavolo: any) => {
    if (tavolo.stato === 'libero') {
      await supabase.from('tavoli').update({ 
        stato: 'occupato', 
        ora_inizio: new Date().toISOString(),
        conto_bar: 0,
        dettagli_bar: ''
      }).eq('id', tavolo.id);
      fetchData();
    } else {
      const inizio = new Date(tavolo.ora_inizio).getTime();
      const diff = new Date().getTime() - inizio;
      const durataOre = diff / (1000 * 60 * 60);
      const costoGioco = parseFloat((durataOre * 8.00).toFixed(2)); // Tariffa base 8€/h
      const costoBar = parseFloat(tavolo.conto_bar || 0);

      const ore = Math.floor(diff / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      const durataFormattata = `${ore.toString().padStart(2, '0')}h ${min.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;

      setDettagliChiusura({ 
        durata: durataFormattata, 
        totaleGioco: costoGioco.toFixed(2),
        totaleBar: costoBar.toFixed(2),
        totaleComplessivo: (costoGioco + costoBar).toFixed(2),
        dettagliBar: tavolo.dettagli_bar
      });
      setGiocatori(1);
      setTavoloDaChiudere(tavolo);
      setMostraInputSospeso(false);
      setNotaSospeso("");
    }
  };

  const processaChiusura = async (modalita: 'INCASSO' | 'SOSPESO') => {
    if (!tavoloDaChiudere || !dettagliChiusura) return;

    if (modalita === 'SOSPESO' && !mostraInputSospeso) {
      setMostraInputSospeso(true);
      return;
    }

    if (modalita === 'SOSPESO' && notaSospeso.trim() === "") {
      alert("Rilevazione Sospeso: Inserire il riferimento del cliente.");
      return;
    }

    const tGioco = parseFloat(dettagliChiusura.totaleGioco);
    const tBar = parseFloat(dettagliChiusura.totaleBar);
    const descBaseGioco = `${tavoloDaChiudere.nome_tavolo} (Durata: ${dettagliChiusura.durata})`;

    try {
      if (modalita === 'INCASSO') {
        // Scrittura Scorporata per Report Pulito
        if (tGioco > 0) {
          await supabase.from('movimenti_contabili').insert({ sala_id: salaId, importo: tGioco, descrizione: descBaseGioco, tipo_movimento: 'ENTRATA', causale_origine: 'Biliardi' });
        }
        if (tBar > 0) {
          await supabase.from('movimenti_contabili').insert({ sala_id: salaId, importo: tBar, descrizione: `Consumazioni ${tavoloDaChiudere.nome_tavolo}: ${dettagliChiusura.dettagliBar}`, tipo_movimento: 'ENTRATA', causale_origine: 'Bar' });
        }
      } else {
        // Scrittura Unificata per il Sospeso
        const descSospeso = `[SOSPESO - RIF: ${notaSospeso.trim().toUpperCase()}] ${descBaseGioco}${tBar > 0 ? ` + Consumazioni Bar` : ''}`;
        await supabase.from('movimenti_contabili').insert({ sala_id: salaId, importo: parseFloat(dettagliChiusura.totaleComplessivo), descrizione: descSospeso, tipo_movimento: 'ENTRATA', causale_origine: 'Incasso Sospeso' });
      }

      await supabase.from('tavoli').update({ stato: 'libero', ora_inizio: null, conto_bar: 0, dettagli_bar: '' }).eq('id', tavoloDaChiudere.id);
      
      setSuccesso(modalita === 'INCASSO' ? "SESSIONE CHIUSA E INCASSATA!" : "IMPORTO REGISTRATO COME SOSPESO!");
      setTimeout(() => setSuccesso(null), 3500);

      setTavoloDaChiudere(null);
      setDettagliChiusura(null);
      setMostraInputSospeso(false);
      setNotaSospeso("");
      fetchData();
    } catch (e: any) {
      alert(`ERRORE DI REGISTRAZIONE: ${e.message}`);
    }
  };

  const getTempoTrascorso = (inizio: string) => {
    const diff = now.getTime() - new Date(inizio).getTime();
    const ore = Math.floor(diff / 3600000);
    const min = Math.floor((diff % 3600000) / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${ore.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-4 sm:p-8 md:p-12 lg:p-16 flex flex-col items-center">
      
      {successo && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-emerald-600 text-emerald-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] font-black uppercase text-xl animate-bounce">
          ✓ {successo}
        </div>
      )}

      {/* MODALE: ORDINAZIONE BAR SUL TAVOLO */}
      {tavoloBar && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0B0D14] border-4 border-cyan-500 p-8 rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[95vh]">
            <h2 className="text-3xl font-black mb-6 uppercase text-white border-b-2 border-gray-800 pb-4 text-center">
              Servizio Bar ➔ {tavoloBar.nome_tavolo}
            </h2>
            
            <div className="flex flex-col lg:flex-row gap-6 overflow-hidden flex-1">
              
              {/* ZONA SINISTRA: PRODOTTI + INSERIMENTO MANUALE */}
              <div className="w-full lg:w-2/3 flex flex-col overflow-hidden gap-4">
                {/* PRODOTTI DA MAGAZZINO */}
                <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 content-start pb-4 border-b border-gray-800">
                  {prodotti.map(p => (
                    <button key={p.id} onClick={() => aggiungiProdotto(p)} className="bg-[#1A1D24] border-2 border-gray-700 hover:border-cyan-500 rounded-xl p-4 flex flex-col items-center transition-all active:scale-95 h-24 justify-center">
                      <span className="text-white font-bold text-xs uppercase text-center mb-1 leading-tight">{p.nome_prodotto}</span>
                      <span className="text-cyan-400 font-black text-sm">€ {p.prezzo_vendita.toFixed(2)}</span>
                    </button>
                  ))}
                </div>

                {/* INSERIMENTO VOCE MANUALE (CUSTOM) */}
                <div className="bg-cyan-950/30 border border-cyan-900 rounded-xl p-4 mt-auto shrink-0">
                  <span className="block text-cyan-400 font-black uppercase text-xs mb-2 tracking-widest">Aggiungi Voce Libera</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Descrizione..." 
                      value={voceManualeDescrizione}
                      onChange={(e) => setVoceManualeDescrizione(e.target.value)}
                      className="flex-1 bg-white text-black px-3 py-2 rounded-lg font-bold uppercase text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <input 
                      type="number" 
                      placeholder="€ 0.00" 
                      value={voceManualeImporto}
                      onChange={(e) => setVoceManualeImporto(e.target.value)}
                      className="w-24 bg-white text-black px-3 py-2 rounded-lg font-black text-xs outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    <button 
                      onClick={aggiungiVoceManuale}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-black uppercase text-xs"
                    >
                      AGGIUNGI
                    </button>
                  </div>
                </div>
              </div>
              
              {/* ZONA DESTRA: CONTO CORRENTE */}
              <div className="w-full lg:w-1/3 bg-gray-100 rounded-2xl p-4 flex flex-col">
                <h3 className="text-black font-black uppercase text-center mb-4 border-b-2 border-gray-300 pb-2">Conto Corrente</h3>
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {carrelloBar.length === 0 ? (
                    <p className="text-center text-gray-400 font-bold text-xs uppercase mt-4">Nessun ordine</p>
                  ) : (
                    carrelloBar.map(v => (
                      <div key={v.prodotto.id} className="bg-white p-2 rounded-lg border flex justify-between items-center text-xs group relative">
                        <div className="flex flex-col">
                          <span className="font-bold text-black uppercase">{v.quantita}x {v.prodotto.nome_prodotto}</span>
                          <span className="font-black text-emerald-600">€{(v.prodotto.prezzo_vendita * v.quantita).toFixed(2)}</span>
                        </div>
                        <button 
                          onClick={() => rimuoviVoceBar(v.prodotto.id)} 
                          className="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase hover:bg-red-200"
                        >
                          Rimuovi
                        </button>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="bg-black text-white p-3 rounded-xl flex justify-between items-center mb-4">
                  <span className="font-bold text-xs uppercase">Totale</span>
                  <span className="font-black text-xl text-cyan-400">
                    € {carrelloBar.reduce((acc, v) => acc + (v.prodotto.prezzo_vendita * v.quantita), 0).toFixed(2)}
                  </span>
                </div>

                <button onClick={confermaOrdineBar} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black uppercase mb-2 text-sm shadow-md">Conferma Ordine</button>
                <button onClick={() => setTavoloBar(null)} className="w-full bg-gray-800 text-white py-3 rounded-xl font-black uppercase text-xs">Annulla</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE: CHIUSURA TAVOLO E DIVISORE QUOTE */}
      {tavoloDaChiudere && dettagliChiusura && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-4 border-white p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <h2 className="text-3xl font-black mb-6 uppercase text-center text-white border-b-2 border-gray-600 pb-4">Scontrino Finale</h2>
            
            <div className="space-y-3 mb-6 text-white bg-gray-900 p-6 rounded-2xl border border-gray-700">
              <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase text-sm">Tempo ({dettagliChiusura.durata})</span><span className="font-black text-lg">€ {dettagliChiusura.totaleGioco}</span></div>
              <div className="flex justify-between border-b border-gray-700 pb-3"><span className="text-gray-400 font-bold uppercase text-sm">Consumazioni Bar</span><span className="font-black text-lg">€ {dettagliChiusura.totaleBar}</span></div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="font-black uppercase text-2xl text-emerald-400">Totale</span>
                <span className="text-4xl font-black text-emerald-400">€ {dettagliChiusura.totaleComplessivo}</span>
              </div>
            </div>

            <div className="bg-cyan-950/50 p-4 rounded-2xl border border-cyan-800 mb-8 flex items-center justify-between">
              <span className="text-cyan-400 font-black uppercase tracking-widest text-xs">Divisione Quote</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setGiocatori(Math.max(1, giocatori - 1))} className="bg-cyan-900 text-white w-8 h-8 rounded-full font-black">-</button>
                <span className="text-white font-black text-xl">{giocatori} {giocatori === 1 ? 'Giocatore' : 'Giocatori'}</span>
                <button onClick={() => setGiocatori(giocatori + 1)} className="bg-cyan-900 text-white w-8 h-8 rounded-full font-black">+</button>
              </div>
              <div className="text-right">
                <span className="block text-white font-black text-2xl">€ {(parseFloat(dettagliChiusura.totaleComplessivo) / giocatori).toFixed(2)}</span>
                <span className="block text-gray-400 font-bold text-[10px] uppercase">a testa</span>
              </div>
            </div>

            {mostraInputSospeso && (
              <div className="flex flex-col gap-2 bg-amber-500/10 border-2 border-amber-500 p-4 rounded-xl mb-6">
                <label className="text-amber-400 font-black uppercase text-xs tracking-widest">Nominativo Cliente per Sospeso</label>
                <input 
                  type="text" 
                  value={notaSospeso}
                  onChange={(e) => setNotaSospeso(e.target.value)}
                  placeholder="ES: MARIO ROSSI" 
                  className="w-full bg-white text-black p-3 rounded-lg font-bold uppercase outline-none"
                  autoFocus
                />
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => { setTavoloDaChiudere(null); setMostraInputSospeso(false); }} className="w-1/3 bg-gray-800 text-white py-4 rounded-xl font-black uppercase text-sm">Annulla</button>
              {!mostraInputSospeso ? (
                <>
                  <button onClick={() => processaChiusura('INCASSO')} className="w-1/3 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase shadow-lg text-sm">INCASSA</button>
                  <button onClick={() => processaChiusura('SOSPESO')} className="w-1/3 bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-black uppercase shadow-lg text-sm">SOSPESO</button>
                </>
              ) : (
                <button onClick={() => processaChiusura('SOSPESO')} className="w-2/3 bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-black uppercase text-sm shadow-lg">CONFERMA SOSPESO</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-[1600px] bg-[#050505] rounded-[3rem] p-8 border-8 border-emerald-100/60">
        <div className="flex justify-between items-center border-b-2 border-gray-800 pb-8 mb-10">
          <div><p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest">Pannello</p><h2 className="text-4xl font-black text-white uppercase italic">PLANCIA OPERATIVA</h2></div>
          <button onClick={() => setActiveView && setActiveView('hub')} className="bg-gray-800/50 text-gray-400 hover:text-white px-8 py-4 rounded-xl font-black uppercase text-xs">← TORRE DI CONTROLLO</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
          {tables.map((t) => {
            const isOccupied = t.stato === 'occupato';
            const contoBarCorrente = parseFloat(t.conto_bar || 0);

            return (
              <div key={t.id} className="p-8 rounded-[2rem] bg-black border-2 border-gray-700 flex flex-col gap-6 relative">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-white">{t.nome_tavolo}</h3>
                  <div className={`px-4 py-2 rounded-full text-xs font-black ${isOccupied ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                    {isOccupied ? 'IN USO' : 'DISPONIBILE'}
                  </div>
                </div>
                
                <div className="py-8 bg-gray-100 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                  <span className="text-6xl font-mono font-black text-black">
                    {isOccupied && t.ora_inizio ? getTempoTrascorso(t.ora_inizio) : "PRONTO"}
                  </span>
                  {isOccupied && contoBarCorrente > 0 && (
                    <div className="absolute top-2 right-2 bg-amber-200 text-amber-900 px-3 py-1 rounded-lg font-black text-xs uppercase border border-amber-400">
                      Bar: €{contoBarCorrente.toFixed(2)}
                    </div>
                  )}
                </div>

                {isOccupied ? (
                  <div className="flex gap-4">
                    <button onClick={() => apriBarTavolo(t)} className="w-1/3 py-5 rounded-2xl font-black text-sm uppercase bg-cyan-900 hover:bg-cyan-800 text-cyan-100 border border-cyan-700 transition-all">
                      + BAR
                    </button>
                    <button onClick={() => gestisciTavolo(t)} className="w-2/3 py-5 rounded-2xl font-black text-xl uppercase bg-red-600 hover:bg-red-500 text-white transition-all">
                      CHIUDI TAVOLO
                    </button>
                  </div>
                ) : (
                  <button onClick={() => gestisciTavolo(t)} className="w-full py-5 rounded-2xl font-black text-xl uppercase bg-[#0f172a] text-white hover:bg-gray-800 transition-all">
                    APRI SESSIONE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}