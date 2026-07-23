"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter, usePathname } from 'next/navigation';

export default function TabelloneTorneo() {
  const params = useParams() || {};
  const router = useRouter();
  const pathname = usePathname() || "";

  const segments = pathname.split('/').filter(Boolean);
  const idxDash = segments.indexOf('dashboard');
  const idxTornei = segments.indexOf('tornei');
  
  const salaId = (params.sala as string) || (idxDash !== -1 ? segments[idxDash + 1] : "");
  const torneoId = (params.id as string) || (params.torneo as string) || (params.torneoId as string) || (idxTornei !== -1 ? segments[idxTornei + 1] : "");

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
  const [foglioAttivo, setFoglioAttivo] = useState<number>(0);

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
    setVincitoreId(incontro.vincitore_id || '');
    setPunteggioA(incontro.punteggio_a !== null ? incontro.punteggio_a : '');
    setPunteggioB(incontro.punteggio_b !== null ? incontro.punteggio_b : '');
    setATavolino(incontro.a_tavolino || !incontro.giocatore_b_id);
    setNumeroTavolo(incontro.numero_tavolo || ''); 
    setDataPrevista(incontro.data_prevista ? formattaDataPerInput(incontro.data_prevista) : '');
  };

  const salvaModifiche = async () => {
    let finalVincitoreId = vincitoreId;

    // CALCOLO AUTOMATICO DEL VINCITORE IN BASE AI PUNTI
    if (!aTavolino) {
      if (punteggioA === '' || punteggioB === '') {
        alert("Inserisci entrambi i punteggi per decretare il vincitore, oppure spunta 'Vittoria a tavolino'.");
        return;
      }
      const scoreA = Number(punteggioA);
      const scoreB = Number(punteggioB);

      if (scoreA === scoreB) {
        alert("In un torneo ad eliminazione diretta non può esserci un pareggio!");
        return;
      }
      finalVincitoreId = scoreA > scoreB ? incontroSelezionato.giocatore_a_id : incontroSelezionato.giocatore_b_id;
    }

    if (!finalVincitoreId) {
      alert("Seleziona il vincitore (richiesto per vittorie a tavolino)!");
      return;
    }
    
    const updateData: any = { 
      vincitore_id: finalVincitoreId, 
      punteggio_a: punteggioA === '' ? null : punteggioA, 
      punteggio_b: punteggioB === '' ? null : punteggioB, 
      a_tavolino: aTavolino,
      numero_tavolo: numeroTavolo === '' ? null : numeroTavolo
    };
    
    if (dataPrevista) {
      updateData.data_prevista = new Date(dataPrevista).toISOString();
    }
    
    const { error } = await supabase.from('incontri').update(updateData).eq('id', incontroSelezionato.id);
    if (error) alert("Errore: " + error.message); 
    else { 
      setIncontroSelezionato(null); 
      caricaDati(); 
    }
  };

  const raggruppaPerTurno = () => {
    const turni: { [key: number]: any[] } = {};
    incontri.forEach(inc => { 
      const f = inc.fase || 1; 
      if (!turni[f]) turni[f] = []; 
      turni[f].push(inc); 
    });
    Object.keys(turni).forEach(fase => {
      turni[Number(fase)].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
    return turni;
  };

  const turniRaggruppati = raggruppaPerTurno();
  const turniKeys = Object.keys(turniRaggruppati).map(Number).sort((a, b) => a - b);
  const incontriOrdinatiGlobali = [...incontri].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  useEffect(() => { 
    if (turniKeys.length > 0 && faseAttiva === null) {
      setFaseAttiva(turniKeys[turniKeys.length - 1]);
      setFoglioAttivo(0);
    } 
  }, [turniKeys.length, faseAttiva, turniKeys]);

  const getNomeTurnoEsteso = (numIncontri: number, indiceTurno: number) => {
    if (numIncontri === 1) return "🏆 Finale"; 
    if (numIncontri === 2) return "Semifinali"; 
    if (numIncontri === 4) return "Quarti di Finale"; 
    if (numIncontri === 8) return "Ottavi di Finale"; 
    if (numIncontri === 16) return "Sedicesimi di Finale"; 
    return `Turno ${indiceTurno}`;
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
    if (!confirm("Avviare il sorteggio per il prossimo turno?")) return;

    const ultimiIncontriVinti = vincitoriDaAccoppiare.map(v => {
      const vinti = incontri.filter(i => i.vincitore_id === v.id);
      return vinti.sort((a, b) => a.fase - b.fase)[vinti.length - 1]; 
    });
    
    let giocatoriPerSorteggio = ultimiIncontriVinti.map(i => i.vincitore_id);
    giocatoriPerSorteggio = giocatoriPerSorteggio.sort(() => Math.random() - 0.5);

    const ultimaFase = Math.max(...incontri.map(i => i.fase || 1));
    const nuovaFase = ultimaFase + 1;
    const durata = torneo?.durata_media || 60;
    const biliardi = torneo?.numero_biliardi || 4;
    const ultimoMatchPassato = incontriOrdinatiGlobali.slice().sort((a, b) => new Date(a.data_prevista || 0).getTime() - new Date(b.data_prevista || 0).getTime()).pop();
    
    const basePartenzaNuovoTurno = ultimoMatchPassato && ultimoMatchPassato.data_prevista 
      ? new Date(new Date(ultimoMatchPassato.data_prevista).getTime() + (durata * 60000))
      : new Date();

    const nuoviIncontri = [];
    for (let i = 0; i < giocatoriPerSorteggio.length; i += 2) {
      const matchIndex = i / 2;
      const slot = Math.floor(matchIndex / biliardi);
      const dataPrevistaCalcolata = new Date(basePartenzaNuovoTurno.getTime() + (slot * durata * 60000));
      const tavoloCalcolato = (matchIndex % biliardi) + 1;

      nuoviIncontri.push({
        torneo_id: torneoId,
        sala_id: salaId,
        giocatore_a_id: giocatoriPerSorteggio[i],
        giocatore_b_id: i + 1 < giocatoriPerSorteggio.length ? giocatoriPerSorteggio[i+1] : null,
        data_prevista: dataPrevistaCalcolata.toISOString(),
        numero_tavolo: tavoloCalcolato,
        fase: nuovaFase 
      });
    }

    const { error } = await supabase.from('incontri').insert(nuoviIncontri);
    if (error) alert("Errore generazione: " + error.message);
    else { 
      setFaseAttiva(nuovaFase); 
      setFoglioAttivo(0);
      caricaDati(); 
    }
  };

  const tornaAlDettaglio = () => {
    router.push(`/dashboard/${salaId}/tornei/${torneoId}`);
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  if (inCaricamento) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-cyan-500 font-black animate-pulse uppercase tracking-widest">Caricamento Tabellone...</div>;
  if (!torneo) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-gray-500 font-black uppercase tracking-widest p-8 text-center border-2 border-dashed border-gray-800 rounded-3xl m-8">Impossibile caricare il tabellone. Dati torneo assenti.</div>;

  const incontriFaseAttiva = faseAttiva ? turniRaggruppati[faseAttiva] || [] : [];
  const fogliA4 = chunkArray(incontriFaseAttiva, 4);
  const incontriFoglioAttivo = fogliA4[foglioAttivo] || [];

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans print:bg-white print:text-black print:p-0 print:m-0">
      <div className="max-w-5xl mx-auto space-y-6 print:max-w-full">
        <header className="border-b border-gray-800 print:border-gray-300 pb-6 flex justify-between items-end print:hidden">
          <div>
            <button onClick={tornaAlDettaglio} className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors">← Torna al Dettaglio Torneo</button>
            <h1 className="text-4xl font-black italic uppercase text-white">Tabellone: {torneo?.titolo || torneo?.nome}</h1>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-gray-900 border border-gray-700 px-4 py-2 rounded-xl text-cyan-400 hover:text-white hover:bg-gray-800 font-black uppercase text-[10px] tracking-widest transition-colors shadow-lg shadow-cyan-900/20">🖨️ Stampa Foglio A4 Attuale</button>
          </div>
        </header>

        {torneoConcluso && (
          <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-3xl p-8 text-center shadow-[0_0_40px_rgba(234,179,8,0.2)] print:border-none print:shadow-none print:py-4">
            <div className="text-6xl mb-4 print:hidden">🏆</div>
            <h2 className="text-3xl font-black uppercase text-yellow-500 mb-2">Torneo Concluso!</h2>
            <p className="text-white font-bold text-xl uppercase tracking-widest print:text-black">Il Campione è <span className="text-yellow-400 border-b-2 border-yellow-400 print:text-black print:border-black pb-1">{campione?.cognome} {campione?.nome}</span></p>
          </div>
        )}

        {puoGenerareProssimoTurno && (
          <div className="bg-cyan-900/20 border-2 border-cyan-500 rounded-3xl p-6 text-center shadow-[0_0_30px_rgba(6,182,212,0.2)] print:hidden">
            <h2 className="text-xl font-black uppercase text-cyan-400 mb-2">Fase Completata!</h2>
            <button onClick={generaProssimoTurno} className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 mt-2 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/50">🎲 Sorteggia e Genera Prossimo Turno</button>
          </div>
        )}

        {incontri.length > 0 && (
          <div className="print:hidden space-y-4">
            <div className="flex gap-2 overflow-x-auto border-b border-gray-800 pb-px scrollbar-hide">
              {turniKeys.map(key => (
                <button key={key} onClick={() => { setFaseAttiva(key); setFoglioAttivo(0); }} className={`px-6 py-4 rounded-t-xl font-black uppercase text-xs tracking-widest transition-all whitespace-nowrap ${faseAttiva === key ? 'bg-[#0f1117] text-white border-t border-l border-r border-gray-700' : 'text-gray-500 hover:text-gray-300'}`}>
                  {getNomeTurnoEsteso(turniRaggruppati[key].length, key)}
                </button>
              ))}
            </div>

            {fogliA4.length > 1 && (
              <div className="flex gap-2 bg-[#0a0c10] p-2 rounded-xl border border-gray-800 overflow-x-auto scrollbar-hide">
                {fogliA4.map((_, idx) => (
                  <button key={idx} onClick={() => setFoglioAttivo(idx)} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest transition-colors whitespace-nowrap ${foglioAttivo === idx ? 'bg-cyan-600 text-black shadow-lg shadow-cyan-900/30' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>
                    📄 Foglio {idx + 1} di {fogliA4.length}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {incontri.length === 0 ? (
          <div className="text-center py-16 text-gray-500 font-black uppercase bg-[#0f1117] rounded-3xl border border-gray-800 shadow-inner print:bg-transparent print:border-none">
            <p className="text-xl mb-2">Il tabellone non è stato ancora generato.</p>
          </div>
        ) : (
          <div className="bg-[#0f1117] border border-gray-700 rounded-2xl p-8 mx-auto shadow-2xl print:bg-white print:border-none print:shadow-none print:p-0 min-h-[800px] flex flex-col">
            
            <div className="text-center mb-10 border-b border-gray-800 pb-6 print:border-gray-300 print:mb-6">
              <h2 className="text-2xl font-black uppercase tracking-widest text-cyan-400 print:text-black">{torneo?.titolo || torneo?.nome}</h2>
              <p className="text-gray-400 font-bold uppercase text-xs mt-2 print:text-gray-600">{getNomeTurnoEsteso(incontriFaseAttiva.length, faseAttiva as number)} - {fogliA4.length > 1 ? `Girone ${foglioAttivo + 1}` : 'Tabellone'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 flex-1 content-start">
              {incontriFoglioAttivo.map((incontro: any) => {
                const partitaConclusa = !!incontro.vincitore_id;
                const indexGlobale = incontriOrdinatiGlobali.findIndex(i => i.id === incontro.id) + 1;
                
                return (
                  <div key={incontro.id} className="bg-[#0a0c10] print:bg-white p-6 rounded-2xl border-2 flex flex-col justify-center relative overflow-hidden group border-gray-800 print:border-gray-400">
                    <div className="flex justify-between items-start mb-6 border-b border-gray-800 print:border-gray-300 pb-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-black uppercase tracking-widest text-emerald-500 print:text-black flex items-center">
                          Incontro {indexGlobale} 
                          {incontro.numero_tavolo && <span className="ml-2 px-2 py-1 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-md text-[9px] print:bg-transparent print:text-black print:border-black">🎱 TAV. {incontro.numero_tavolo}</span>}
                        </span>
                        <span className="text-[10px] text-gray-400 uppercase mt-1 print:text-gray-600">🗓 {incontro.data_prevista ? new Date(incontro.data_prevista).toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' }) : 'Orario da definire'}</span>
                      </div>
                      {!partitaConclusa ? (<span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse print:hidden"></span>) : (<span className="text-emerald-500 font-bold text-sm print:text-black">✓ CONCLUSO</span>)}
                    </div>
                    
                    <div className={`p-5 rounded-xl flex justify-between items-center transition-colors border print:border-gray-300 print:text-black print:bg-gray-50 ${incontro.vincitore_id === incontro.giocatore_a_id ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-inner' : 'bg-black border-gray-800 text-white'}`}>
                      <div className="flex flex-col"><span className="font-black uppercase text-base truncate max-w-[200px]">{getNomeSocio(incontro.giocatore_a_id)}</span>{incontro.vincitore_id === incontro.giocatore_a_id && <span className="text-[10px] mt-1 text-emerald-400 tracking-widest print:text-gray-500">VINCITORE</span>}</div>
                      {incontro.punteggio_a !== null && <span className="font-mono text-2xl font-black">{incontro.punteggio_a}</span>}
                    </div>
                    
                    <div className="flex justify-center -my-3 relative z-10">
                      <span className={`font-black text-[11px] px-4 py-1.5 rounded-full uppercase tracking-widest border print:border-gray-400 print:bg-white print:text-black ${partitaConclusa ? 'bg-[#050505] text-gray-500 border-gray-800' : 'bg-[#050505] text-emerald-400 border-emerald-900'}`}>{incontro.a_tavolino ? 'A TAV.' : 'VS'}</span>
                    </div>
                    
                    <div className={`p-5 rounded-xl flex justify-between items-center transition-colors border print:border-gray-300 print:text-black print:bg-gray-50 ${incontro.vincitore_id === incontro.giocatore_b_id ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400 shadow-inner' : 'bg-black border-gray-800 text-white'}`}>
                      <div className="flex flex-col"><span className="font-black uppercase text-base truncate max-w-[200px]">{getNomeSocio(incontro.giocatore_b_id)}</span>{incontro.vincitore_id === incontro.giocatore_b_id && <span className="text-[10px] mt-1 text-emerald-400 tracking-widest print:text-gray-500">VINCITORE</span>}</div>
                      {incontro.punteggio_b !== null && <span className="font-mono text-2xl font-black">{incontro.punteggio_b}</span>}
                    </div>
                    
                    {/* TASTO INTELLIGENTE: Cambia se l'incontro è già chiuso */}
                    <button onClick={() => apriModaleGestione(incontro)} className={`mt-6 w-full py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all border print:hidden ${partitaConclusa ? 'bg-blue-900/20 border-blue-800 text-blue-500 hover:bg-blue-600 hover:text-white' : 'bg-emerald-950/30 border-emerald-900 hover:bg-emerald-500 hover:text-black text-emerald-500'}`}>{partitaConclusa ? 'Modifica Referto' : 'Compila Referto'}</button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center border-t border-gray-800 pt-6 text-[10px] text-gray-600 font-bold uppercase tracking-widest print:border-gray-300 print:text-gray-400">
              Direzione Gara - Il Campione V2
            </div>
          </div>
        )}
      </div>

      {incontroSelezionato && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden">
          <div className="bg-[#11131a] p-8 rounded-3xl w-full max-w-lg border border-gray-800 shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 text-center border-b border-gray-800 pb-4">Referto Incontro</h2>
            
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

            <label className="block text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest text-center border-t border-gray-800 pt-6">
              {aTavolino ? 'Dichiara il Vincitore a Tavolino' : 'Inserisci Punti (Vincitore Automatico)'}
            </label>
            
            <div className="space-y-4 mt-4">
              {/* Box Giocatore A */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${(!aTavolino && Number(punteggioA) > Number(punteggioB)) || (aTavolino && vincitoreId === incontroSelezionato.giocatore_a_id) ? 'bg-emerald-900/40 border-emerald-400' : 'bg-black border-gray-800'}`}>
                <div 
                  className={`flex items-center gap-3 flex-1 ${aTavolino ? 'cursor-pointer' : ''}`} 
                  onClick={() => { if (aTavolino) setVincitoreId(incontroSelezionato.giocatore_a_id) }}
                >
                  {aTavolino && (
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${vincitoreId === incontroSelezionato.giocatore_a_id ? 'border-emerald-400' : 'border-gray-600'}`}>
                      {vincitoreId === incontroSelezionato.giocatore_a_id && <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>}
                    </div>
                  )}
                  <span className={`font-black uppercase text-sm ${(!aTavolino && Number(punteggioA) > Number(punteggioB)) || (aTavolino && vincitoreId === incontroSelezionato.giocatore_a_id) ? 'text-emerald-400' : 'text-white'}`}>
                    {getNomeSocio(incontroSelezionato.giocatore_a_id)}
                  </span>
                </div>
                {!aTavolino && (
                  <input 
                    type="number" 
                    placeholder="Pt." 
                    className="w-24 bg-[#0f1117] border border-gray-700 rounded-lg p-3 text-center font-black text-white text-xl outline-none focus:border-cyan-500" 
                    value={punteggioA} 
                    onChange={(e) => setPunteggioA(e.target.value !== '' ? parseInt(e.target.value) : '')} 
                  />
                )}
              </div>

              {/* Box Giocatore B */}
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${(!aTavolino && incontroSelezionato.giocatore_b_id && Number(punteggioB) > Number(punteggioA)) || (aTavolino && vincitoreId === incontroSelezionato.giocatore_b_id) ? 'bg-emerald-900/40 border-emerald-400' : 'bg-black border-gray-800'}`}>
                <div 
                  className={`flex items-center gap-3 flex-1 ${aTavolino ? 'cursor-pointer' : ''}`} 
                  onClick={() => { if (aTavolino && incontroSelezionato.giocatore_b_id) setVincitoreId(incontroSelezionato.giocatore_b_id) }}
                >
                  {aTavolino && incontroSelezionato.giocatore_b_id && (
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${vincitoreId === incontroSelezionato.giocatore_b_id ? 'border-emerald-400' : 'border-gray-600'}`}>
                      {vincitoreId === incontroSelezionato.giocatore_b_id && <div className="h-2.5 w-2.5 rounded-full bg-emerald-400"></div>}
                    </div>
                  )}
                  <span className={`font-black uppercase text-sm ${(!aTavolino && incontroSelezionato.giocatore_b_id && Number(punteggioB) > Number(punteggioA)) || (aTavolino && vincitoreId === incontroSelezionato.giocatore_b_id) ? 'text-emerald-400' : 'text-white'}`}>
                    {getNomeSocio(incontroSelezionato.giocatore_b_id)}
                  </span>
                </div>
                {incontroSelezionato.giocatore_b_id && !aTavolino && (
                  <input 
                    type="number" 
                    placeholder="Pt." 
                    className="w-24 bg-[#0f1117] border border-gray-700 rounded-lg p-3 text-center font-black text-white text-xl outline-none focus:border-cyan-500" 
                    value={punteggioB} 
                    onChange={(e) => setPunteggioB(e.target.value !== '' ? parseInt(e.target.value) : '')} 
                  />
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3 cursor-pointer p-4 bg-[#0f1117] rounded-xl border border-gray-800 hover:border-gray-600 transition-all" onClick={() => { setATavolino(!aTavolino); if (!aTavolino) { setPunteggioA(''); setPunteggioB(''); } }}>
              <input type="checkbox" checked={aTavolino} readOnly className="h-4 w-4 accent-emerald-500 cursor-pointer" />
              <span className="font-bold text-xs uppercase text-gray-400">Vittoria a tavolino / Forfait</span>
            </div>
            
            <div className="flex gap-3 mt-8 border-t border-gray-800 pt-6">
              <button onClick={() => setIncontroSelezionato(null)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-black uppercase text-xs transition-colors">Annulla</button>
              <button onClick={salvaModifiche} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-black rounded-xl font-black uppercase text-xs transition-colors shadow-lg shadow-emerald-900/50">Salva Referto</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}