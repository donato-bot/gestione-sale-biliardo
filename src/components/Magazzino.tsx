"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Soci({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [soci, setSoci] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [scadenzaCertificato, setScadenzaCertificato] = useState('');
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);
  const [linkCopiato, setLinkCopiato] = useState(false);

  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modCognome, setModCognome] = useState('');
  const [modTelefono, setModTelefono] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modScadenza, setModScadenza] = useState('');

  const [mostraSoloScaduti, setMostraSoloScaduti] = useState(false);

  useEffect(() => {
    caricaSoci();
  }, [salaId]);

  async function caricaSoci() {
    const { data, error } = await supabase
      .from('soci')
      .select('*')
      .eq('sala_id', salaId)
      .order('cognome', { ascending: true });
      
    if (error) {
      alert("ERRORE LETTURA DATABASE: " + error.message);
    } else if (data) {
      setSoci(data);
    }
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !cognome) return;
    
    setLoading(true);
    
    const { error } = await supabase.from('soci').insert([{
      sala_id: salaId,
      nome,
      cognome,
      telefono,
      email,
      scadenza_certificato: scadenzaCertificato || null
    }]);

    if (error) {
      alert("ERRORE DI SALVATAGGIO: " + error.message);
    } else {
      setSuccesso(`SOCIO "${nome} ${cognome}" REGISTRATO!`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNome(''); setCognome(''); setTelefono(''); setEmail(''); setScadenzaCertificato('');
      caricaSoci();
    }
    setLoading(false);
  }

  function avviaModifica(socio: any) {
    setIdInModifica(socio.id);
    setModNome(socio.nome);
    setModCognome(socio.cognome);
    setModTelefono(socio.telefono || '');
    setModEmail(socio.email || '');
    setModScadenza(socio.scadenza_certificato || '');
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modCognome) return;

    const { error } = await supabase
      .from('soci')
      .update({
        nome: modNome,
        cognome: modCognome,
        telefono: modTelefono,
        email: modEmail,
        scadenza_certificato: modScadenza || null
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setSuccesso("ANAGRAFICA AGGIORNATA!");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaSoci();
    }
  }

  async function eliminaSocio(id: string) {
    if (confirm("ATTENZIONE: Eliminare definitivamente questo socio dal registro?")) {
      await supabase.from('soci').delete().eq('id', id);
      caricaSoci();
    }
  }

  const certificatoScaduto = (dataScadenza: string) => {
    if (!dataScadenza) return false;
    return new Date(dataScadenza) < new Date();
  };

  const sociFiltrati = soci.filter(s => {
    const corrispondeRicerca = (s.nome + " " + s.cognome).toLowerCase().includes(ricerca.toLowerCase()) || 
                               (s.telefono && s.telefono.includes(ricerca));
    const corrispondeFiltroScadenza = mostraSoloScaduti ? certificatoScaduto(s.scadenza_certificato) : true;
    
    return corrispondeRicerca && corrispondeFiltroScadenza;
  });

  const totaleScaduti = soci.filter(s => certificatoScaduto(s.scadenza_certificato)).length;

  function copiaLinkPubblico() {
    if (typeof window !== "undefined") {
      const urlPubblico = `${window.location.origin}/prenota/${salaId}`;
      navigator.clipboard.writeText(urlPubblico);
      setLinkCopiato(true);
      setTimeout(() => setLinkCopiato(false), 3000);
    }
  }

  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = sociFiltrati.map(s => {
      const isScaduto = certificatoScaduto(s.scadenza_certificato);
      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-transform: uppercase;">${s.cognome} ${s.nome}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${s.telefono || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">${s.email || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${isScaduto ? '#b91c1c' : '#15803d'};">
          ${s.scadenza_certificato ? new Date(s.scadenza_certificato).toLocaleDateString('it-IT') : 'N/D'}
        </td>
      </tr>
    `}).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Registro Soci</title>
        <style>
          body { font-family: sans-serif; padding: 50px; color: #333; }
          .header { border-bottom: 4px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #0891b2; color: white; padding: 12px; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1 style="margin:0; font-size: 28px; color: #083344;">REGISTRO ANAGRAFICO SOCI</h1><p style="margin:0; color:#666;">Elenco Ufficiale</p></div>
          <div style="text-align:right;"><p style="margin:0; font-weight:bold;">Sistema Gestionale</p><p style="margin:0; font-size:12px;">Generato il: ${dataCorrente}</p></div>
        </div>
        <table>
          <thead><tr><th>Nominativo</th><th>Telefono</th><th>Email</th><th>Scadenza Cert.</th></tr></thead>
          <tbody>${righeTabella}</tbody>
        </table>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `);
    finestraStampa.document.close();
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-4 sm:p-8 md:p-12 lg:p-16 flex flex-col items-center transition-colors duration-500 font-sans">
      
      {successo && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-cyan-600 text-cyan-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] animate-bounce font-black uppercase tracking-widest text-xl">
          ✓ {successo}
        </div>
      )}

      {/* POPUP MODIFICA SOCIO */}
      {idInModifica && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-4 border-white p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <h2 className="text-3xl font-black mb-8 uppercase text-center text-white border-b-2 border-gray-600 pb-4">Modifica Anagrafica</h2>
            <div className="space-y-6 mb-10">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Nome</label>
                  <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-4 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500" />
                </div>
                <div className="flex-1">
                  <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Cognome</label>
                  <input type="text" value={modCognome} onChange={e => setModCognome(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-4 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Telefono</label>
                <input type="text" value={modTelefono} onChange={e => setModTelefono(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-4 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Email</label>
                <input type="email" value={modEmail} onChange={e => setModEmail(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-4 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Scadenza Certificato</label>
                <input type="date" value={modScadenza} onChange={e => setModScadenza(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-4 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIdInModifica(null)} className="w-1/3 bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-black uppercase border-2 border-gray-600">Annulla</button>
              <button onClick={() => salvaModifica(idInModifica)} className="w-2/3 bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black uppercase shadow-lg border-2 border-cyan-400">Salva Modifiche</button>
            </div>
          </div>
        </div>
      )}

      {/* SCHERMO NERO PRINCIPALE */}
      <div className="w-full max-w-[1600px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-8 border-emerald-100/60 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-800 pb-8 mb-10 gap-4">
          <div>
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Anagrafica e Tesseramento</p>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">REGISTRO SOCI</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={() => setActiveView && setActiveView('hub')}
              className="bg-cyan-600 text-white hover:bg-cyan-500 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 border-cyan-400 w-full sm:w-auto shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 text-center"
            >
              ← Torre di Controllo
            </button>
            <button 
              onClick={stampaPDF} 
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 border-zinc-600 w-full sm:w-auto shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 text-center"
            >
              📄 Stampa Registro
            </button>
          </div>
        </div>

        {/* ZONA LINK APP SOCI */}
        <div className="mb-10 p-8 rounded-[2rem] bg-black border-[3px] border-cyan-900 shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h4 className="font-black text-xl uppercase tracking-wider text-cyan-400 mb-2">Terminale Interattivo App Soci</h4>
            <p className="text-sm text-gray-400 font-bold max-w-2xl">Condividi questo link con i tesserati. Tramite l'App Web potranno prenotare i biliardi in autonomia, iscriversi ai tornei in programma e consultare gli avvisi in bacheca direttamente dal loro smartphone.</p>
          </div>
          <button 
            onClick={copiaLinkPubblico} 
            className="w-full md:w-auto bg-white hover:bg-gray-200 text-black px-10 py-5 rounded-xl font-black text-sm uppercase tracking-widest border-2 border-gray-400 transition-all shadow-lg active:scale-95"
          >
            {linkCopiato ? '✓ LINK APP COPIATO!' : '📋 COPIA LINK APP SOCI'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLONNA SINISTRA: ELENCO */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* BARRA DI RICERCA E SCADUTI */}
            <div className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="w-full md:w-1/2 relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                <input 
                  type="text" placeholder="Ricerca per nome o telefono..." value={ricerca} onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-gray-100 border-2 border-gray-400 p-5 pl-14 rounded-xl text-black font-black text-xl outline-none focus:border-cyan-500 placeholder-gray-500"
                />
              </div>
              <div className="flex gap-4 items-center w-full md:w-auto">
                <div className="text-center bg-gray-900 px-6 py-3 rounded-xl border-2 border-gray-700">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Totale Iscritti</p>
                  <p className="text-3xl font-black text-white tabular-nums">{sociFiltrati.length}</p>
                </div>
                <button 
                  onClick={() => setMostraSoloScaduti(!mostraSoloScaduti)} 
                  className={`text-center px-6 py-3 rounded-xl border-2 transition-all ${mostraSoloScaduti ? 'bg-red-600 border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-gray-900 border-gray-700 hover:border-red-500'}`}
                >
                  <p className={`text-[10px] font-black uppercase tracking-widest ${mostraSoloScaduti ? 'text-white' : 'text-red-500'}`}>Cert. Scaduti</p>
                  <p className={`text-3xl font-black tabular-nums ${mostraSoloScaduti ? 'text-white' : 'text-red-500'}`}>{totaleScaduti}</p>
                </button>
              </div>
            </div>

            {/* TABELLA SOCI */}
            <div className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex-1 overflow-hidden flex flex-col min-h-[500px]">
              <div className="overflow-x-auto h-full max-h-[600px] pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-black z-10">
                    <tr className="border-b-2 border-gray-600">
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500">Nominativo</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500">Recapiti</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-center">Scadenza Medica</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sociFiltrati.map((s) => {
                      const isScaduto = certificatoScaduto(s.scadenza_certificato);
                      return (
                        <tr key={s.id} className="hover:bg-gray-900 transition-colors group">
                          <td className="py-6 px-4 font-black text-white text-lg uppercase tracking-wide">{s.cognome} {s.nome}</td>
                          <td className="py-6 px-4">
                            <span className="block font-bold text-gray-300 mb-1">{s.telefono || '—'}</span>
                            <span className="block text-[10px] font-mono text-gray-500">{s.email || '—'}</span>
                          </td>
                          <td className="py-6 px-4 text-center">
                            {s.scadenza_certificato ? (
                              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black tracking-widest border-2 ${isScaduto ? 'bg-red-950 text-red-500 border-red-800' : 'bg-green-950 text-green-500 border-green-800'}`}>
                                {new Date(s.scadenza_certificato).toLocaleDateString('it-IT')}
                              </span>
                            ) : (
                              <span className="text-gray-600 font-bold italic text-xs uppercase">Nessun dato</span>
                            )}
                          </td>
                          <td className="py-6 px-4 text-center space-x-4">
                            <button onClick={() => avviaModifica(s)} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title="Modifica">✏️</button>
                            <button onClick={() => eliminaSocio(s.id)} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title="Elimina">🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                    {sociFiltrati.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-24 text-center text-gray-500 opacity-50">
                          <span className="text-6xl block mb-4">📇</span>
                          <p className="font-black text-xl uppercase tracking-widest">Nessun socio trovato</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* COLONNA DESTRA: INSERIMENTO HIGH-CONTRAST */}
          <div className="lg:col-span-4 flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">Nuova Iscrizione</h3>
            
            <form onSubmit={gestisciSubmit} className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Nome</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Mario" className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500 placeholder-gray-400" required />
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Cognome</label>
                <input type="text" value={cognome} onChange={e => setCognome(e.target.value)} placeholder="Es. Rossi" className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500 placeholder-gray-400" required />
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Telefono</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Cellulare..." className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-bold text-lg outline-none focus:border-cyan-500 placeholder-gray-400" />
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Indirizzo Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@esempio.it" className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-bold text-lg outline-none focus:border-cyan-500 placeholder-gray-400" />
              </div>

              <div className="mb-10">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Scadenza Cert. Medico</label>
                <input type="date" value={scadenzaCertificato} onChange={e => setScadenzaCertificato(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500" />
              </div>

              <button disabled={loading} type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] border-2 border-cyan-400 disabled:opacity-50">
                {loading ? 'Attendere...' : 'Registra Socio'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}