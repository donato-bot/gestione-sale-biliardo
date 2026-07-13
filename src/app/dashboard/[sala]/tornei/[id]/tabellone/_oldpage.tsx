"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useRouter, usePathname } from 'next/navigation';

export default function TabelloneTorneo() {
  const router = useRouter();
  const pathname = usePathname() || "";

  const salaId = pathname.split('/')[2];
  const torneoId = pathname.split('/')[4];

  const [torneo, setTorneo] = useState<any>(null);
  const [incontri, setIncontri] = useState<any[]>([]);
  const [soci, setSoci] = useState<any[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);

  const [incontroSelezionato, setIncontroSelezionato] = useState<any>(null);
  const [vincitoreId, setVincitoreId] = useState<string>('');
  const [dataPrevista, setDataPrevista] = useState<string>('');
  const [numeroTavolo, setNumeroTavolo] = useState<number | ''>(''); 
  const [punteggioA, setPunteggioA] = useState<number | ''>('');
  const [punteggioB, setPunteggioB] = useState<number | ''>('');
  const [aTavolino, setATavolino] = useState<boolean>(false);

  const [faseAttiva, setFaseAttiva] = useState<number | null>(null);

  const caricaDati = useCallback(async () => {
    if (!torneoId || !salaId) {
      setInCaricamento(false);
      return;
    }

    setInCaricamento(true);

    try {
      const { data: tData } = await supabase.from('tornei').select('*').eq('id', torneoId).single();
      setTorneo(tData);

      const { data: iData } = await supabase.from('incontri').select('*').eq('torneo_id', torneoId).order('id', { ascending: true });
      setIncontri(iData || []);

      const { data: sData } = await supabase.from('soci').select('id, nome, cognome').eq('sala_id', salaId);
      setSoci(sData || []);
    } catch (error) {
      console.error("Errore Lettura Database:", error);
    } finally {
      setInCaricamento(false);
    }
  }, [torneoId, salaId]);

  useEffect(() => { caricaDati(); }, [caricaDati]);

  const getNomeSocio = (id: string | null) => {
    if (!id) return "AVANZAMENTO AUTOMATICO (BYE)";
    const socio = soci.find(s => s.id === id);
    return socio ? `${socio.cognome} ${socio.nome}` : "GIOCATORE SCONOSCIUTO";
  };

  const formattaDataPerInput = (isoString: string) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const anno = d.getFullYear();
    const mese = String(d.getMonth() + 1).padStart(2, '0');
    const giorno = String(d.getDate()).padStart(2, '0');
    const ore = String(d.getHours()).padStart(2, '0');
    const minuti = String(d.getMinutes()).padStart(2, '0');
    return `${anno}-${mese}-${giorno}T${ore}:${minuti}`;
  };

  const apriModaleGestione = (incontro: any) => {
    setIncontroSelezionato(incontro);
    setVincitoreId(incontro.vincitore_id || (!incontro.giocatore_b_id ? incontro.giocatore_a_id : ''));
    setPunteggioA(incontro.punteggio_a !== null ? incontro.punteggio_a : '');
    setPunteggioB(incontro.punteggio_b !== null ? incontro.punteggio_b : '');
    setATavolino(incontro.a_tavolino || !incontro.giocatore_b_id);
    setNumeroTavolo(incontro.numero_tavolo || ''); 
    setDataPrevista(incontro.data_prevista ? formattaDataPerInput(incontro.data_prevista) : '');
  };

  const salvaModifiche = async () => {
    if (!vincitoreId) { alert("Seleziona il vincitore!"); return; }
    
    const updateData: any = { 
      vincitore_id: vincitoreId, 
      punteggio_a: punteggioA === '' ? null : punteggioA, 
      punteggio_b: punteggioB === '' ? null : punteggioB, 
      a_tavolino: aTavolino,
      numero_tavolo: numeroTavolo === '' ? null : numeroTavolo
    };
    
    if (dataPrevista) {
      updateData.data_prevista = new Date(dataPrevista).toISOString();
    }
    
    const { error } = await supabase.from('incontri').update(updateData).eq('id', incontroSelezionato.id);
    if (error) alert("Errore: " + error.message); else { setIncontroSelezionato(null); caricaDati(); }
  };

  // IL NUOVO MOTORE DI RAGGRUPPAMENTO (LEGGE DIRETTAMENTE LA COLONNA FASE)
  const raggruppaPerTurno = () => {
    const turni: { [key: number]: any[] } = {};
    incontri.forEach(inc => { 
      const f = inc.fase || 1; // Sicurezza: se nullo, lo mette al turno 1
      if (!turni[f]) turni[f] = []; 
      turni[f].push(inc); 
    });
    return turni;
  };

  const turniRaggruppati = raggruppaPerTurno();
  const turniKeys = Object.keys(turniRaggruppati).map(Number).sort((a, b) => a - b);

  useEffect(() => { if (turniKeys.length > 0 && faseAttiva === null) setFaseAttiva(turniKeys[turniKeys.length - 1]); }, [turniKeys.length, faseAttiva, turniKeys]);

  const getNomeTurnoEsteso = (numIncontri: number, indiceTurno: number) => {
    if (numIncontri === 1) return "🏆 Finale"; if (numIncontri === 2) return "Semifinali"; if (numIncontri === 4) return "Quarti di Finale"; if (numIncontri === 8) return "Ottavi di Finale"; if (numIncontri === 16) return "Sedicesimi di Finale"; return `Turno ${indiceTurno}`;
  };

  const partiteAperte = incontri.length > 0 ? incontri.filter(i => !i.vincitore_id) : [];
  const tuttiIncontriFiniti = incontri.length > 0 && partiteAperte.length === 0;
  
  const vincitoriDaAccoppiare = soci.filter(socio => {
    const volteGiocatore = incontri.filter(i => i.giocatore_a_id === socio.id || i.giocatore_b_id === socio.id).length;
    const volteVincitore = incontri.filter(i => i.vincitore_id === socio.id).length;
    return volteGiocatore > 0 && volteGiocatore === volteVincitore;
  });

  const puoGenerareProssimoTurno = tuttiIncontriFiniti && vincitoriDaAccoppiare.length >= 2;
  const torneoConcluso = tuttiIncontriFiniti && vincitoriDaAccoppiare.length === 1;
  const campione = torneoConcluso ? vincitoriDaAccoppiare[0] : null;

  const generaProssimoTurno = async () => {
    if (!confirm("Generare gli abbinamenti del prossimo turno?")) return;

    // Ordine di chi passa: peschiamo l'ultima partita di ogni vincitore e manteniamo l'ordine del DB
    const ultimiIncontriVinti = vincitoriDaAccoppiare.map(v => {
      const vinti = incontri.filter(i => i.vincitore_id === v.id);
      return vinti.sort((a, b) => a.fase - b.fase)[vinti.length - 1]; // Prende la partita della fase più alta
    });
    
    // Ordiniamo per data_prevista della partita precedente in modo che gli accoppiamenti seguano il flusso logico del tabellone
    ultimiIncontriVinti.sort((a, b) => new Date(a.data_prevista || 0).getTime() - new Date(b.data_prevista || 0).getTime());
    const giocatoriOrdinati = ultimiIncontriVinti.map(i => i.vincitore_id);

    // Calcolo della fase matematica (+1 rispetto all'ultima fase trovata nel DB)
    const ultimaFase = Math.max(...incontri.map(i => i.fase || 1));
    const nuovaFase = ultimaFase + 1;

    // Calcolo orari e biliardi
    const durata = torneo?.durata_media || 60;
    const biliardi = torneo?.numero_biliardi || 4;
    const ultimoMatchPassato = incontri.sort((a, b) => new Date(a.data_prevista || 0).getTime() - new Date(b.data_prevista || 0).getTime()).pop();
    
    const basePartenzaNuovoTurno = ultimoMatchPassato && ultimoMatchPassato.data_prevista 
      ? new Date(new Date(ultimoMatchPassato.data_prevista).getTime() + (durata * 60000))
      : new Date();

    const nuoviIncontri = [];
    for (let i = 0; i < giocatoriOrdinati.length; i += 2) {
      const matchIndex = i / 2;
      const slot = Math.floor(matchIndex / biliardi);
      const dataPrevistaCalcolata = new Date(basePartenzaNuovoTurno.getTime() + (slot * durata * 60000));
      const tavoloCalcolato = (matchIndex % biliardi) + 1;

      nuoviIncontri.push({
        torneo_id: torneoId,
        sala_id: salaId,
        giocatore_a_id: giocatoriOrdinati[i],
        giocatore_b_id: i + 1 < giocatoriOrdinati.length ? giocatoriOrdinati[i+1] : null,
        data_prevista: dataPrevistaCalcolata.toISOString(),
        numero_tavolo: tavoloCalcolato,
        fase: nuovaFase // <-- IL SISTEMA ORA DICHIARA ESATTAMENTE LA FASE
      });
    }

    const { error } = await supabase.from('incontri').insert(nuoviIncontri);
    if (error) alert("Errore generazione: " + error.message);
    else { setFaseAttiva(nuovaFase); caricaDati(); }
  };

  const tornaAlDettaglio = () => {
    router.push(`/dashboard/${salaId}/tornei/${torneoId}`);
  };

  if (inCaricamento) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-cyan-500 font-black animate-pulse uppercase tracking-widest">Caricamento Tabellone...</div>;
  if (!torneo) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 font-black uppercase tracking-widest p-8 text-center border-2 border-dashed border-gray-800 rounded-3xl m-8">Impossibile caricare il tabellone. Dati torneo assenti.</div>;

  const incontriDelTurnoAttivo = faseAttiva ? turniRaggruppati[faseAttiva] || [] : [];

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans print:bg-white print:text-black print:p-0">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="border-b border-gray-800 print:border-gray-300 pb-6 flex justify-between items-end">
          <div>
            <button onClick={tornaAlDettaglio} className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors print:hidden">← Torna al Dettaglio Torneo</button>
            <h1 className="text-4xl font-black italic uppercase text-white print:text-black">Tabellone: {torneo?.titolo || torneo?.nome}</h1>
          </div>
          <div className="flex flex-col items-end gap-3"><button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 font-black uppercase text-[10px] tracking-widest transition-colors print:hidden">🖨️ Stampa Tabellone</button></div>
        </header>

        {torneoConcluso && (<div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(234,179,8,0.2)] print:border-none print:shadow-none"><div className="text-6xl mb-4 print:hidden">🏆</div><h2 className="text-3xl font-black uppercase text-yellow-500 mb-2">Torneo Concluso!</h2><p className="text-white font-bold text-xl uppercase tracking-widest print:text-black">Il Campione è <span className="text-yellow-400 border-b-2 border-yellow-400 print:text-black print:border-black pb-1">{campione?.cognome} {campione?.nome}</span></p></div>)}

        {puoGenerareProssimoTurno && (<div className="bg-cyan-900/20 border-2 border-cyan-500 rounded-3xl p-6 text-center shadow-[0_0_30px_rgba(6,182,212,0.2)] print:hidden"><h2 className="text-xl font-black uppercase text-cyan-400 mb-2">Fase Completata!</h2><button onClick={generaProssimoTurno} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 mt-2 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/50">Genera Abbinamenti Prossimo Turno</button></div>)}

        {incontri.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-gray-800 pb-px print:hidden scrollbar-hide">
            {turniKeys.map(key => (<button key={key} onClick={() => setFaseAttiva(key)} className={`px-6 py-4 rounded-t-xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${faseAttiva === key ? 'bg-cyan-900/40 text-cyan-400 border-b-4 border-cyan-400 shadow-[0_-10px_15px_rgba(6,182,212,0.1)]' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 border-b-4 border-transparent'}`}>{getNomeTurnoEsteso(turniRaggruppati[key].length, key)}</button>))}
          </div>
        )}

        {incontri.length === 0 ? (<div className="text-center py-16 text-gray-500 font-black uppercase bg-[#0f1117] rounded-3xl border border-gray-800 shadow-inner print:bg-transparent print:border-none"><p className="text-xl mb-2">Il tabellone non è stato ancora generato.</p><p className="text-[10px] tracking-widest">Torna alla schermata precedente per avviare il torneo.</p></div>) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {incontriDelTurnoAttivo.map((incontro: any, index: number) => {
              const partitaConclusa = !!incontro.vincitore_id;
              // Ricalcola il numero progressivo dell'incontro in modo visivo, basato sulla data
              const indexGlobale = incontri.findIndex(i => i.id === incontro.id) + 1;
              return (
                <div key={incontro.id} className={`bg-[#0f1117] print:bg-white p-5 rounded-2xl border-2 flex flex-col justify-center relative overflow-hidden group transition-all duration-300 shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] border-emerald-600 hover:border-emerald-400 print:border-gray-400 print:shadow-none`}>
                  <div className="flex justify-between items-start mb-4 border-b border-gray-800 print:border-gray-300 pb-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 print:text-black flex items-center">
                        Match {index + 1} 
                        {incontro.numero_tavolo && <span className="ml-2 px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-md text-[8px] print:bg-transparent print:text-black print:border-black">🎱 TAV. {incontro.numero_tavolo}</span>}
                      </span>
                      <span className="text-[9px] text-gray-400 uppercase mt-1 print:text-gray-600">🗓 {incontro.data_prevista ? new Date(incontro.data_prevista).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'Orario da definire'}</span>
                    </div>
                    {!partitaConclusa ? (<span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)] print:hidden"></span>) : (<span className="text-emerald-500 font-bold text-xs print:text-black">✓</span>)}
                  </div>
                  <div className={`p-4 rounded-xl flex justify-between items-center transition-colors border print:border-gray-300 print:text-black print:bg-gray-50 ${incontro.vincitore_id === incontro.giocatore_a_id ? 'bg-emerald-900/50 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#1c1f29] border-gray-700 text-white shadow-lg'}`}><div className="flex flex-col"><span className="font-black uppercase text-sm">{getNomeSocio(incontro.giocatore_a_id)}</span>{incontro.vincitore_id === incontro.giocatore_a_id && <span className="text-[9px] mt-1 text-emerald-400 tracking-widest print:text-gray-500">VINCITORE</span>}</div>{incontro.punteggio_a !== null && <span className="font-mono text-xl font-black">{incontro.punteggio_a}</span>}</div>
                  <div className="flex justify-center -my-3 relative z-10"><span className={`font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest border transition-colors shadow-xl print:border-gray-400 print:bg-white print:text-black ${partitaConclusa ? 'bg-[#050505] text-gray-500 border-gray-800' : 'bg-[#050505] text-emerald-400 border-emerald-900 group-hover:border-emerald-500 group-hover:text-emerald-300'}`}>{incontro.a_tavolino ? 'A TAV.' : 'VS'}</span></div>
                  <div className={`p-4 rounded-xl flex justify-between items-center transition-colors border print:border-gray-300 print:text-black print:bg-gray-50 ${incontro.vincitore_id === incontro.giocatore_b_id ? 'bg-emerald-900/50 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#1c1f29] border-gray-700 text-white shadow-lg'}`}><div className="flex flex-col"><span className="font-black uppercase text-sm">{getNomeSocio(incontro.giocatore_b_id)}</span>{incontro.vincitore_id === incontro.giocatore_b_id && <span className="text-[9px] mt-1 text-emerald-400 tracking-widest print:text-gray-500">VINCITORE</span>}</div>{incontro.punteggio_b !== null && <span className="font-mono text-xl font-black">{incontro.punteggio_b}</span>}</div>
                  <button onClick={() => apriModaleGestione(incontro)} className={`mt-6 w-full py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md border print:hidden ${partitaConclusa ? 'bg-transparent border-gray-800 text-gray-500 hover:border-gray-500 hover:text-white' : 'bg-emerald-950/30 border-emerald-900 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 text-emerald-500'}`}>{partitaConclusa ? 'Modifica Incontro' : 'Gestisci Incontro'}</button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {incontroSelezionato && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-[#11131a] p-8 rounded-3xl w-full max-w-lg border border-gray-800 shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 text-center border-b border-gray-800 pb-4">Gestione Incontro</h2>
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">Data e Ora</label>
                <input type="datetime-local" className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-white focus:border-emerald-500 outline-none transition-colors" value={dataPrevista} onChange={(e) => setDataPrevista(e.target.value)} />
              </div>
              <div className="w-1/3">
                <label className="block text-[10px] font-black uppercase text-cyan-500 mb-2 tracking-widest">Biliardo</label>
                <input type="number" placeholder="N." min="1" className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-cyan-400 focus:border-cyan-500 outline-none transition-colors text-center" value={numeroTavolo} onChange={(e) => setNumeroTavolo(e.target.value ? parseInt(e.target.value) : '')} />
              </div>
            </div>

            <label className="block text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest text-center border-t border-gray-800 pt-6">Dettagli Partita</label>
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${vincitoreId === incontroSelezionato.giocatore_a_id ? 'bg-emerald-900/40 border-emerald-400' : 'bg-black border-gray-800'}`}>
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setVincitoreId(incontroSelezionato.giocatore_a_id)}><div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${vincitoreId === incontroSelezionato.giocatore_a_id ? 'border-emerald-400' : 'border-gray-600'}`}>{vincitoreId === incontroSelezionato.giocatore_a_id && <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>}</div><span className={`font-black uppercase text-sm ${vincitoreId === incontroSelezionato.giocatore_a_id ? 'text-emerald-400' : 'text-white'}`}>{getNomeSocio(incontroSelezionato.giocatore_a_id)}</span></div>
                {!aTavolino && <input type="number" placeholder="Pt." className="w-20 bg-[#0f1117] border border-gray-700 rounded-lg p-2 text-center font-bold text-white outline-none focus:border-cyan-500" value={punteggioA} onChange={(e) => setPunteggioA(e.target.value ? parseInt(e.target.value) : '')} />}
              </div>
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${vincitoreId === incontroSelezionato.giocatore_b_id ? 'bg-emerald-900/40 border-emerald-400' : 'bg-black border-gray-800'}`}>
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setVincitoreId(incontroSelezionato.giocatore_b_id)}><div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${vincitoreId === incontroSelezionato.giocatore_b_id ? 'border-emerald-400' : 'border-gray-600'}`}>{vincitoreId === incontroSelezionato.giocatore_b_id && <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>}</div><span className={`font-black uppercase text-sm ${vincitoreId === incontroSelezionato.giocatore_b_id ? 'text-emerald-400' : 'text-white'}`}>{getNomeSocio(incontroSelezionato.giocatore_b_id)}</span></div>
                {incontroSelezionato.giocatore_b_id && !aTavolino && <input type="number" placeholder="Pt." className="w-20 bg-[#0f1117] border border-gray-700 rounded-lg p-2 text-center font-bold text-white outline-none focus:border-cyan-500" value={punteggioB} onChange={(e) => setPunteggioB(e.target.value ? parseInt(e.target.value) : '')} />}
              </div>
            </div>
            <div className="mt-6 flex items-center gap-3 cursor-pointer p-4 bg-[#0f1117] rounded-xl border border-gray-800 hover:border-gray-600 transition-all" onClick={() => { setATavolino(!aTavolino); if (!aTavolino) { setPunteggioA(''); setPunteggioB(''); } }}>
              <input type="checkbox" checked={aTavolino} readOnly className="h-4 w-4 accent-emerald-500 cursor-pointer" /><span className="font-bold text-xs uppercase text-gray-400">Vittoria a tavolino / Bye</span>
            </div>
            <div className="flex gap-3 mt-8 border-t border-gray-800 pt-6">
              <button onClick={() => setIncontroSelezionato(null)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-black uppercase text-xs transition-colors">Annulla</button>
              <button onClick={salvaModifiche} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-black rounded-xl font-black uppercase text-xs transition-colors shadow-lg shadow-emerald-900/50">Conferma Dati</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}