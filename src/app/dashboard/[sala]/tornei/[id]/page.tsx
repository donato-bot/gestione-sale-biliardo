"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useRouter, usePathname } from 'next/navigation';

export default function DettaglioTorneo() {
  const router = useRouter();
  const pathname = usePathname();

  const salaId = pathname.split('/')[2];
  const torneoId = pathname.split('/')[4];

  const [torneo, setTorneo] = useState<any>(null);
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [incontri, setIncontri] = useState<any[]>([]);
  const [tuttiSoci, setTuttiSoci] = useState<any[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  
  const [mostraModal, setMostraModal] = useState(false);
  const [mostraModalEsterno, setMostraModalEsterno] = useState(false);
  const [inSalvataggio, setInSalvataggio] = useState(false);
  
  const [selectedSoci, setSelectedSoci] = useState<string[]>([]);
  const [nuovoEsterno, setNuovoEsterno] = useState({ nome: '', cognome: '' });

  const caricaDati = useCallback(async () => {
    if (!torneoId || !salaId) {
      setInCaricamento(false); 
      return;
    }

    setInCaricamento(true);
    
    try {
      const { data: tData } = await supabase.from('tornei').select('*').eq('id', torneoId).single();
      setTorneo(tData);

      const { data: iData } = await supabase.from('iscrizioni').select('id, socio_id, pagato, soci(nome, cognome)').eq('torneo_id', torneoId);
      setIscritti(iData || []);

      const { data: mData } = await supabase.from('incontri').select('id').eq('torneo_id', torneoId);
      setIncontri(mData || []);

      const { data: sData } = await supabase.from('soci').select('id, nome, cognome').eq('sala_id', salaId);
      setTuttiSoci(sData || []);
    } catch (error) {
      console.error("Errore Lettura Database:", error);
    } finally {
      setInCaricamento(false);
    }
  }, [torneoId, salaId]);

  useEffect(() => {
    caricaDati();
  }, [caricaDati]);

  const toggleSocioSelection = (socioId: string) => {
    setSelectedSoci(prev => prev.includes(socioId) ? prev.filter(id => id !== socioId) : [...prev, socioId]);
  };

  const iscriviMultipli = async () => {
    if (selectedSoci.length === 0) { alert("Seleziona almeno un socio dalla lista!"); return; }
    if (torneo?.max_partecipanti && (iscritti.length + selectedSoci.length) > torneo.max_partecipanti) {
      alert(`Attenzione! Limite massimo di ${torneo.max_partecipanti} partecipanti superato.`); return;
    }

    setInSalvataggio(true);
    try {
      const dataToInsert = selectedSoci.map(socioId => ({
        torneo_id: torneoId, socio_id: socioId, sala_id: salaId, pagato: false
      }));
      const { error } = await supabase.from('iscrizioni').insert(dataToInsert);
      if (error) throw error;
      setSelectedSoci([]); setMostraModal(false); await caricaDati();
    } catch (error: any) { alert("Errore iscrizione: " + error.message); } 
    finally { setInSalvataggio(false); }
  };

  const aggiungiEsterno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (torneo?.max_partecipanti && iscritti.length >= torneo.max_partecipanti) { alert("Limite iscritti raggiunto!"); return; }
    setInSalvataggio(true);
    try {
      const { data: nuovoSocio, error: errSocio } = await supabase.from('soci').insert([{ sala_id: salaId, nome: nuovoEsterno.nome, cognome: nuovoEsterno.cognome }]).select().single();
      if (errSocio) throw errSocio;
      const { error: errIscrizione } = await supabase.from('iscrizioni').insert([{ torneo_id: torneoId, socio_id: nuovoSocio.id, sala_id: salaId, pagato: false }]);
      if (errIscrizione) throw errIscrizione;
      setMostraModalEsterno(false); setNuovoEsterno({ nome: '', cognome: '' }); await caricaDati();
    } catch (error: any) { alert("Errore inserimento ospite: " + error.message); } 
    finally { setInSalvataggio(false); }
  };

  const togglePagamento = async (idIscrizione: string, statoAttuale: boolean) => {
    const { error } = await supabase.from('iscrizioni').update({ pagato: !statoAttuale }).eq('id', idIscrizione);
    if (error) alert("Errore: " + error.message); else caricaDati();
  };

  const rimuoviIscritto = async (idIscrizione: string) => {
    if (!confirm("Rimuovere questo giocatore?")) return;
    await supabase.from('iscrizioni').delete().eq('id', idIscrizione); caricaDati();
  };

  const generaTabellone = async () => {
    if (iscritti.length < 2) { alert("Servono almeno 2 iscritti."); return; }
    const nonPagati = iscritti.filter(i => !i.pagato).length;
    if (nonPagati > 0 && !confirm(`Ci sono ${nonPagati} quote non versate. Generare lo stesso?`)) return;
    if (nonPagati === 0 && !confirm(`Generare il tabellone per ${iscritti.length} iscritti?`)) return;

    const shuffle = [...iscritti].sort(() => Math.random() - 0.5);
    const nuoviIncontri = [];
    
    const dataPartenza = torneo?.data_inizio ? new Date(torneo.data_inizio) : new Date();
    const biliardi = torneo?.numero_biliardi || 4;
    const durata = torneo?.durata_media || 60; 

    for (let i = 0; i < shuffle.length; i += 2) {
      const matchIndex = i / 2;
      const slot = Math.floor(matchIndex / biliardi);
      const minutiDaAggiungere = slot * durata;
      const dataPrevistaCalcolata = new Date(dataPartenza.getTime() + minutiDaAggiungere * 60000);
      const tavoloCalcolato = (matchIndex % biliardi) + 1;

      nuoviIncontri.push({ 
        torneo_id: torneoId, 
        sala_id: salaId, 
        giocatore_a_id: shuffle[i].socio_id, 
        giocatore_b_id: i + 1 < shuffle.length ? shuffle[i+1].socio_id : null,
        data_prevista: dataPrevistaCalcolata.toISOString(),
        numero_tavolo: tavoloCalcolato,
        fase: 1 // IL NUOVO CAMPO CHE IDENTIFICA IL PRIMO TURNO
      });
    }

    const { error } = await supabase.from('incontri').insert(nuoviIncontri);
    if (error) alert("Errore generazione: " + error.message);
    else { caricaDati(); router.push(`/dashboard/${salaId}/tornei/${torneoId}/tabellone`); }
  };

  const tornaAiBandi = () => {
    router.push(`/dashboard/${salaId}/tornei`);
  };

  if (inCaricamento) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-cyan-500 font-black animate-pulse uppercase tracking-widest">Sincronizzazione Torneo...</div>;

  const torneoPieno = torneo?.max_partecipanti && iscritti.length >= torneo.max_partecipanti;
  const incassoPotenziale = iscritti.length * (torneo?.quota_iscrizione || 0);
  const incassoReale = iscritti.filter(i => i.pagato).length * (torneo?.quota_iscrizione || 0);

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-gray-800 pb-6 flex justify-between items-end">
          <div>
            <button onClick={tornaAiBandi} className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-4 transition-colors">← Torna ai Bandi</button>
            <h1 className="text-4xl font-black italic uppercase text-white">{torneo?.titolo || "Torneo Non Trovato"}</h1>
          </div>
          <div className="bg-[#0f1117] border border-gray-800 rounded-2xl p-4 flex gap-6 shadow-xl">
            <div><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Quota</p><p className="text-xl font-black text-white">€ {torneo?.quota_iscrizione || 0}</p></div>
            <div className="w-px bg-gray-800"></div>
            <div><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Cassa (Versato / Totale)</p><p className="text-xl font-black"><span className="text-emerald-400">€ {incassoReale}</span> <span className="text-gray-600"> / € {incassoPotenziale}</span></p></div>
          </div>
        </header>

        {torneo ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4 bg-[#0f1117] p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6 self-start">
              <h2 className="text-lg font-black uppercase tracking-widest text-white border-b border-gray-800 pb-4">Aggiungi Giocatori</h2>
              {!torneoPieno ? (
                <div className="space-y-3">
                  <button onClick={() => setMostraModal(true)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-black py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/20">+ Iscrivi Dalla Lista</button>
                  <button onClick={() => setMostraModalEsterno(true)} className="w-full border border-gray-700 hover:border-cyan-500 text-cyan-400 py-4 rounded-xl font-black uppercase tracking-widest transition-all">+ Registra Ospite</button>
                </div>
              ) : (<div className="bg-red-950/30 border border-red-900 text-red-500 p-4 rounded-xl text-center font-black uppercase tracking-widest text-xs">Limite Iscritti Raggiunto ({torneo?.max_partecipanti})</div>)}
              <div className="pt-6 border-t border-gray-800 mt-6">
                {incontri.length === 0 ? (<button onClick={generaTabellone} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20">Avvia e Genera Tabellone</button>) : (<button onClick={() => router.push(`/dashboard/${salaId}/tornei/${torneoId}/tabellone`)} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition-all animate-pulse shadow-lg shadow-emerald-900/20">Vedi Tabellone Attivo →</button>)}
              </div>
            </div>

            <div className="md:col-span-8 bg-[#0f1117] p-6 rounded-3xl border border-gray-800 shadow-xl">
              <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6"><h2 className="text-lg font-black uppercase tracking-widest text-white">Elenco Iscritti <span className="text-cyan-500">({iscritti.length} / {torneo?.max_partecipanti || '∞'})</span></h2><span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paganti: {iscritti.filter(i => i.pagato).length} su {iscritti.length}</span></div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                {iscritti.map((i: any) => (
                  <div key={i.id} className="bg-black border border-gray-800 p-4 rounded-xl flex justify-between items-center group hover:border-gray-600 transition-colors">
                    <span className="font-bold uppercase tracking-wide text-white text-sm">{i.soci?.cognome} {i.soci?.nome}</span>
                    <div className="flex items-center gap-4">
                      <button onClick={() => togglePagamento(i.id, i.pagato)} className={`px-4 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest transition-all border ${i.pagato ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/20 border-red-900 text-red-500 hover:bg-red-900/40 hover:border-red-500'}`}>{i.pagato ? '✓ Pagato' : 'Da Pagare'}</button>
                      <button onClick={() => rimuoviIscritto(i.id)} className="text-[10px] text-gray-600 hover:text-red-500 font-black uppercase tracking-widest transition-colors" title="Rimuovi Iscrizione">✕</button>
                    </div>
                  </div>
                ))}
                {iscritti.length === 0 && <div className="text-center py-12 text-gray-600 font-black uppercase border-2 border-dashed border-gray-800 rounded-2xl">Nessun giocatore iscritto.</div>}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0f1117] border-2 border-dashed border-gray-800 rounded-3xl">
            <h3 className="text-xl font-black text-red-500 uppercase mb-2">Impossibile caricare il torneo</h3>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">L'ID richiesto non corrisponde a nessun dato attivo.</p>
          </div>
        )}
      </div>

      {mostraModal && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#11131a] p-8 rounded-3xl w-full max-w-lg border border-gray-800 max-h-[80vh] flex flex-col shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 text-cyan-500">Seleziona Soci ({selectedSoci.length})</h2>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2 scrollbar-hide">
              {tuttiSoci.filter(s => !iscritti.find(i => i.socio_id === s.id)).length === 0 ? (<div className="text-center p-6 text-gray-500 font-bold uppercase text-xs tracking-widest">Tutti i soci iscritti.</div>) : (tuttiSoci.filter(s => !iscritti.find(i => i.socio_id === s.id)).map(socio => (
                <div key={socio.id} onClick={() => toggleSocioSelection(socio.id)} className={`cursor-pointer p-4 rounded-xl font-bold uppercase text-xs flex items-center gap-4 border transition-colors ${selectedSoci.includes(socio.id) ? 'bg-cyan-900/40 border-cyan-500 text-cyan-400' : 'bg-black border-gray-800 hover:border-gray-600 text-gray-300'}`}>
                  <div className={`h-5 w-5 rounded-md border flex items-center justify-center ${selectedSoci.includes(socio.id) ? 'border-cyan-500 bg-cyan-500' : 'border-gray-600'}`}>{selectedSoci.includes(socio.id) && <span className="text-black text-xs">✓</span>}</div>
                  {socio.cognome} {socio.nome}
                </div>
              )))}
            </div>
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-800">
              <button onClick={() => {setMostraModal(false); setSelectedSoci([]);}} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-black uppercase text-xs transition-colors tracking-widest" disabled={inSalvataggio}>Chiudi</button>
              <button onClick={iscriviMultipli} className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-colors shadow-lg tracking-widest ${inSalvataggio ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-cyan-900/30'}`} disabled={inSalvataggio}>{inSalvataggio ? 'SALVATAGGIO...' : 'Iscrivi Selezionati'}</button>
            </div>
          </div>
        </div>
      )}

      {mostraModalEsterno && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#11131a] p-8 rounded-3xl w-full max-w-md border border-gray-800 shadow-2xl">
            <h2 className="text-xl font-black uppercase mb-6 text-cyan-500">Nuovo Ospite Esterno</h2>
            <form onSubmit={aggiungiEsterno} className="space-y-4">
              <div><label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Cognome</label><input placeholder="Es. Rossi" required className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-white outline-none focus:border-cyan-500 transition-colors" value={nuovoEsterno.cognome} onChange={(e) => setNuovoEsterno({...nuovoEsterno, cognome: e.target.value})} /></div>
              <div><label className="block text-[10px] font-black uppercase text-gray-500 mb-2 tracking-widest">Nome</label><input placeholder="Es. Mario" required className="w-full bg-black border border-gray-800 rounded-xl p-4 font-bold text-white outline-none focus:border-cyan-500 transition-colors" value={nuovoEsterno.nome} onChange={(e) => setNuovoEsterno({...nuovoEsterno, nome: e.target.value})} /></div>
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-800">
                <button type="button" onClick={() => setMostraModalEsterno(false)} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl font-black uppercase text-xs transition-colors tracking-widest" disabled={inSalvataggio}>Annulla</button>
                <button type="submit" className={`flex-1 py-4 rounded-xl font-black uppercase text-xs transition-colors shadow-lg tracking-widest ${inSalvataggio ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-black shadow-cyan-900/30'}`} disabled={inSalvataggio}>{inSalvataggio ? 'SALVATAGGIO...' : 'Salva e Iscrivi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}