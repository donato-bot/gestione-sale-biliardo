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
  const [now, setNow] = useState(new Date());
  const [mode, setMode] = useState<'operativa' | 'configurazione'>('operativa');
  
  const [tavoloDaChiudere, setTavoloDaChiudere] = useState<any | null>(null);
  const [dettagliChiusura, setDettagliChiusura] = useState<{ durata: string, totale: string } | null>(null);
  const [successo, setSuccesso] = useState<string | null>(null);

  // Stati per il Form del Sospeso
  const [mostraFormSospeso, setMostraFormSospeso] = useState(false);
  const [tipologiaUtente, setTipologiaUtente] = useState<'SOCIO' | 'CASUALE'>('CASUALE');
  const [identificativoUtente, setIdentificativoUtente] = useState('');
  const [importoSospesoModificato, setImportoSospesoModificato] = useState('');

  // Stati per l'autocompletamento dei Soci
  const [listaSociSuggeriti, setListaSociSuggeriti] = useState<any[]>([]);
  const [socioSelezionatoId, setSocioSelezionatoId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    fetchData();
    return () => clearInterval(timer);
  }, [salaId]);

  // Cerca i soci in tempo reale verificando SIA il cognome SIA il nome
  useEffect(() => {
    const cercaSoci = async () => {
      if (tipologiaUtente === 'SOCIO' && identificativoUtente.trim().length > 1) {
        const queryTerm = `%${identificativoUtente}%`;
        
        const { data, error } = await supabase
          .from("soci")
          .select("id, nome, cognome")
          .eq("sala_id", salaId)
          .or(`cognome.ilike.${queryTerm},nome.ilike.${queryTerm}`);
        
        if (data) setListaSociSuggeriti(data);
      } else {
        setListaSociSuggeriti([]);
      }
    };

    const delayDebounce = setTimeout(() => {
      cercaSoci();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [identificativoUtente, tipologiaUtente, salaId]);

  const fetchData = async () => {
    const { data } = await supabase.from("tavoli").select("*").eq("sala_id", salaId).order("numero");
    if (data) setTables(data);
  };

  const gestisciTavolo = async (tavolo: any) => {
    if (tavolo.stato === 'libero') {
      await supabase.from('tavoli').update({ stato: 'occupato', ora_inizio: new Date().toISOString() }).eq('id', tavolo.id);
      fetchData();
    } else {
      const inizio = new Date(tavolo.ora_inizio).getTime();
      const diff = new Date().getTime() - inizio;
      const durataOre = diff / (1000 * 60 * 60);
      const totaleCalcolato = (durataOre * 8.00).toFixed(2);

      const ore = Math.floor(diff / 3600000);
      const min = Math.floor((diff % 3600000) / 60000);
      const sec = Math.floor((diff % 60000) / 1000);
      const durataFormattata = `${ore.toString().padStart(2, '0')}h ${min.toString().padStart(2, '0')}m ${sec.toString().padStart(2, '0')}s`;

      setDettagliChiusura({ durata: durataFormattata, totale: totaleCalcolato });
      setImportoSospesoModificato(totaleCalcolato);
      setTavoloDaChiudere(tavolo);
    }
  };

  const processaChiusura = async (modalita: 'INCASSO' | 'SOSPESO') => {
    if (!tavoloDaChiudere || !dettagliChiusura) return;

    let descrizioneFinale = `${tavoloDaChiudere.nome_tavolo} (Durata: ${dettagliChiusura.durata})`;
    let causale = 'Biliardi';
    let importoDaRegistrare = parseFloat(dettagliChiusura.totale);

    if (modalita === 'SOSPESO') {
      if (!identificativoUtente.trim()) {
        alert("Inserire il nome del Socio o del Cliente Casuale!");
        return;
      }
      causale = 'Incasso Sospeso';
      importoDaRegistrare = parseFloat(importoSospesoModificato) || 0;
      descrizioneFinale = `[SOSPESO - ${tipologiaUtente}] A: ${identificativoUtente.trim().toUpperCase()} | ${tavoloDaChiudere.nome_tavolo} (Durata: ${dettagliChiusura.durata})`;
    }

    const { error: reportError } = await supabase.from('movimenti_contabili').insert({ 
      sala_id: salaId, 
      importo: importoDaRegistrare,
      descrizione: descrizioneFinale,
      tipo_movimento: 'ENTRATA',
      causale_origine: causale
    });

    if (reportError) { alert(`ERRORE DI SCRITTURA REPORT: ${reportError.message}`); return; }

    await supabase.from('tavoli').update({ stato: 'libero', ora_inizio: null }).eq('id', tavoloDaChiudere.id);
    
    setSuccesso(modalita === 'INCASSO' ? "INCASSO REGISTRATO!" : "SOSPESO ASSEGNATO E REGISTRATO!");
    setTimeout(() => setSuccesso(null), 3500);

    setTavoloDaChiudere(null);
    setDettagliChiusura(null);
    setMostraFormSospeso(false);
    setIdentificativoUtente('');
    setSocioSelezionatoId(null);
    fetchData();
  };

  const salvaModifica = async (id: string, nuovoNome: string) => {
    const { error } = await supabase.from('tavoli').update({ nome_tavolo: nuovoNome }).eq('id', id);
    if (!error) { alert("Nome aggiornato!"); fetchData(); }
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
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-emerald-600 text-emerald-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] animate-bounce font-black uppercase tracking-widest text-xl">
          ✓ {successo}
        </div>
      )}

      {tavoloDaChiudere && dettagliChiusura && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-4 border-white p-8 rounded-3xl w-full max-w-xl shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            
            {!mostraFormSospeso ? (
              <>
                <h2 className="text-3xl font-black mb-8 uppercase text-center text-white border-b-2 border-gray-600 pb-4">Chiudi Sessione</h2>
                <div className="space-y-6 mb-10 text-white">
                  <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase">Tavolo</span><span className="font-black text-xl">{tavoloDaChiudere.nome_tavolo}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400 font-bold uppercase">Durata</span><span className="font-black text-xl text-red-500">{dettagliChiusura.durata}</span></div>
                  <div className="flex justify-between items-center bg-gray-100 p-6 rounded-xl text-black">
                    <span className="font-black uppercase text-xl">Totale Dovuto</span>
                    <span className="text-4xl font-black">€ {dettagliChiusura.totale}</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setTavoloDaChiudere(null)} className="w-1/3 bg-gray-800 text-white py-4 rounded-xl font-black uppercase">Annulla</button>
                  <button onClick={() => processaChiusura('INCASSO')} className="w-1/3 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-wider">INCASSA</button>
                  <button onClick={() => setMostraFormSospeso(true)} className="w-1/3 bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-black uppercase tracking-wider">SOSPESO</button>
                </div>
              </>
            ) : (
              <div className="space-y-6 text-white relative">
                <h2 className="text-2xl font-black uppercase text-center text-amber-500 border-b-2 border-amber-600 pb-4">Configurazione Sospeso</h2>
                
                <div className="flex gap-4 justify-center">
                  <button 
                    type="button"
                    onClick={() => { setTipologiaUtente('CASUALE'); setIdentificativoUtente(''); setSocioSelezionatoId(null); }}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase border-2 transition-all ${tipologiaUtente === 'CASUALE' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700'}`}
                  >
                    Cliente Casuale
                  </button>
                  <button 
                    type="button"
                    onClick={() => { setTipologiaUtente('SOCIO'); setIdentificativoUtente(''); }}
                    className={`flex-1 py-3 rounded-xl font-black text-xs uppercase border-2 transition-all ${tipologiaUtente === 'SOCIO' ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-700'}`}
                  >
                    Socio Club
                  </button>
                </div>

                <div className="flex flex-col gap-2 relative">
                  <label className="text-gray-400 font-black uppercase text-xs tracking-wider">
                    {tipologiaUtente === 'SOCIO' ? 'Digita Nome o Cognome (Ricerca Automatica)' : 'Riferimento Cliente Casuale'}
                  </label>
                  <input 
                    type="text" 
                    value={identificativoUtente}
                    onChange={(e) => setIdentificativoUtente(e.target.value)}
                    placeholder={tipologiaUtente === 'SOCIO' ? "Inizia a digitare nome o cognome..." : "Es. CLIENTE BANCONE ROSSI"}
                    className="w-full bg-zinc-900 border-2 border-gray-600 p-4 rounded-xl text-white font-bold uppercase outline-none focus:border-amber-500"
                  />

                  {/* MENU DI SCELTA AUTOMATICA DEI SOCI (NOME E COGNOME) */}
                  {tipologiaUtente === 'SOCIO' && listaSociSuggeriti.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-zinc-900 border-2 border-amber-500 rounded-xl mt-1 max-h-48 overflow-y-auto z-[110] shadow-2xl">
                      {listaSociSuggeriti.map((s) => (
                        <div 
                          key={s.id}
                          onClick={() => {
                            setIdentificativoUtente(`${s.cognome} ${s.nome}`);
                            setSocioSelezionatoId(s.id);
                            setListaSociSuggeriti([]);
                          }}
                          className="p-3 hover:bg-amber-600 hover:text-white cursor-pointer font-bold text-sm border-b border-zinc-800 uppercase"
                        >
                          👤 {s.cognome} {s.nome}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-gray-400 font-black uppercase text-xs tracking-wider">Importo da mandare in Sospeso (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={importoSospesoModificato}
                    onChange={(e) => setImportoSospesoModificato(e.target.value)}
                    className="w-full bg-zinc-900 border-2 border-gray-600 p-4 rounded-xl text-white font-black text-2xl outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-800">
                  <button type="button" onClick={() => setMostraFormSospeso(false)} className="w-1/3 bg-gray-800 text-gray-400 hover:text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider">Indietro</button>
                  <button type="button" onClick={() => processaChiusura('SOSPESO')} className="w-2/3 bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider">Conferma e Salva Sospeso</button>
                </div>
              </div>
            )}

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
            return (
              <div key={t.id} className="p-8 rounded-[2rem] bg-black border-2 border-gray-700 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-white">{t.nome_tavolo}</h3>
                  <div className={`px-4 py-2 rounded-full text-xs font-black ${isOccupied ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{isOccupied ? 'IN USO' : 'DISPONIBILE'}</div>
                </div>
                <div className="py-8 bg-gray-100 rounded-2xl text-center text-6xl font-mono font-black">
                  {isOccupied && t.ora_inizio ? getTempoTrascorso(t.ora_inizio) : "PRONTO"}
                </div>
                <button onClick={() => gestisciTavolo(t)} className={`w-full py-6 rounded-2xl font-black text-xl uppercase ${isOccupied ? 'bg-red-600' : 'bg-[#0f172a]'}`}>
                  {isOccupied ? 'ARRESTA E CHIUDI' : 'APRI SESSIONE'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}