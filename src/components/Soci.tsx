"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Soci({ salaId }: { salaId: string }) {
  const [soci, setSoci] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroTessera, setNumeroTessera] = useState('');
  const [scadenzaTessera, setScadenzaTessera] = useState('');
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);

  // STATI PER LA MODIFICA IN LINEA
  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modCognome, setModCognome] = useState('');
  const [modTelefono, setModTelefono] = useState('');
  const [modTessera, setModTessera] = useState('');
  const [modScadenza, setModScadenza] = useState('');

  // STATO PER FILTRO TESSERE SCADUTE
  const [filtroScaduti, setFiltroScaduti] = useState(false);

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
    if (!nome || !cognome || !numeroTessera || !scadenzaTessera) return;
    
    setLoading(true);
    
    const { error } = await supabase.from('soci').insert([{
      sala_id: salaId,
      nome,
      cognome,
      telefono,
      numero_tessera: numeroTessera.toUpperCase(),
      scadenza_tessera: scadenzaTessera
    }]);

    if (error) {
      alert("ERRORE DI SALVATAGGIO: " + error.message);
    } else {
      setSuccesso(`Tesserato "${cognome} ${nome}" registrato con successo.`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNome('');
      setCognome('');
      setTelefono('');
      setNumeroTessera('');
      setScadenzaTessera('');
      caricaSoci();
    }
    setLoading(false);
  }

  function avviaModifica(socio: any) {
    setIdInModifica(socio.id);
    setModNome(socio.nome);
    setModCognome(socio.cognome);
    setModTelefono(socio.telefono || '');
    setModTessera(socio.numero_tessera);
    setModScadenza(socio.scadenza_tessera);
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modCognome || !modTessera || !modScadenza) return;

    const { error } = await supabase
      .from('soci')
      .update({
        nome: modNome,
        cognome: modCognome,
        telefono: modTelefono,
        numero_tessera: modTessera.toUpperCase(),
        scadenza_tessera: modScadenza
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setSuccesso("Anagrafica aggiornata con successo.");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaSoci();
    }
  }

  async function eliminaSocio(id: string) {
    if (confirm("ATTENZIONE: Sei sicuro di voler eliminare definitivamente questo tesserato dall'anagrafica?")) {
      await supabase.from('soci').delete().eq('id', id);
      caricaSoci();
    }
  }

  const sociFiltrati = soci.filter(s => {
    const corrispondeRicerca = s.cognome.toLowerCase().includes(ricerca.toLowerCase()) || 
                               s.nome.toLowerCase().includes(ricerca.toLowerCase()) ||
                               s.numero_tessera.toLowerCase().includes(ricerca.toLowerCase());
    
    const isScaduta = new Date(s.scadenza_tessera) < new Date();
    const corrispondeScadenza = filtroScaduti ? isScaduta : true;

    return corrispondeRicerca && corrispondeScadenza;
  });

  const totaleSociScaduti = soci.filter(s => new Date(s.scadenza_tessera) < new Date()).length;

  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = sociFiltrati.map(s => {
      const dataScadenza = new Date(s.scadenza_tessera);
      const isScaduta = dataScadenza < new Date();
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 800;">${s.cognome} ${s.nome}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; font-weight: bold; color: #9333ea;">${s.numero_tessera}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-family: monospace; color: #666;">${s.telefono || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: ${isScaduta ? '#b91c1c' : '#15803d'}; text-align: center;">
            ${dataScadenza.toLocaleDateString('it-IT')} ${isScaduta ? '⚠️' : ''}
          </td>
        </tr>
      `;
    }).join('');

    if (sociFiltrati.length === 0) {
      righeTabella = `<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af; font-style: italic;">Nessun tesserato trovato.</td></tr>`;
    }

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Anagrafica Soci - Torre di Controllo</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid #9333ea; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
          .title { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #9333ea;}
          .summary { display: flex; gap: 30px; margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
          .summary div { text-align: center; flex: 1; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #9333ea; color: white; padding: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Registro Anagrafica Soci</h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase;">${filtroScaduti ? 'Filtro Attivo: Solo Tessere Scadute' : 'Tutti i Tesserati'}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0; font-weight:bold; font-size: 12px;">Data estrazione: ${dataCorrente}</p>
          </div>
        </div>
        
        <div class="summary">
          <div>
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Totale Estratto</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #0f172a;">${sociFiltrati.length}</p>
          </div>
          <div style="border-left: 1px solid #cbd5e1; padding-left: 30px;">
            <p style="margin: 0; font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase;">Tessere Scadute Complessive</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900; color: #b91c1c;">${totaleSociScaduti}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40%;">Nominativo</th>
              <th style="width: 20%;">Numero Tessera</th>
              <th style="width: 20%;">Telefono</th>
              <th style="width: 20%; text-align: center;">Scadenza</th>
            </tr>
          </thead>
          <tbody>
            ${righeTabella}
          </tbody>
        </table>
        
        <script>
          window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };
        </script>
      </body>
      </html>
    `);
    finestraStampa.document.close();
  };

  return (
    <div className="p-8 text-white font-sans w-full max-w-[1400px] mx-auto min-h-screen">
      
      {/* TITOLO MODULO PRINCIPALE */}
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-black text-purple-500 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
          GESTIONE SOCI
        </h2>
        <div className="h-1 w-48 bg-purple-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* FEEDBACK SUCCESSO */}
      {successo && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-4 rounded-2xl border border-green-400 shadow-2xl z-[100]">
           <span className="font-black uppercase tracking-widest text-sm">✅ {successo}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ========================================== */}
        {/* COLONNA SINISTRA: NUOVO TESSERAMENTO       */}
        {/* ========================================== */}
        <div className="lg:col-span-4 flex flex-col">
          
          <h3 className="text-2xl font-black text-purple-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            NUOVO TESSERAMENTO
          </h3>

          <div className="space-y-8">
            <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 shadow-2xl">
              
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Nome</label>
                <input 
                  type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Es. Roberto"
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-purple-500" 
                  required 
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Cognome</label>
                <input 
                  type="text" value={cognome} onChange={e => setCognome(e.target.value)}
                  placeholder="Es. Ferrari"
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-purple-500" 
                  required 
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Telefono (Opzionale)</label>
                <input 
                  type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                  placeholder="Es. 333 1234567"
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-purple-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">N° Tessera</label>
                  <input 
                    type="text" value={numeroTessera} onChange={e => setNumeroTessera(e.target.value)}
                    placeholder="T-001"
                    className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-sm uppercase text-purple-400 focus:outline-none focus:border-purple-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Scadenza</label>
                  <input 
                    type="date" value={scadenzaTessera} onChange={e => setScadenzaTessera(e.target.value)}
                    className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-purple-500" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                {loading ? 'Elaborazione...' : 'Salva Tesserato'}
              </button>
            </form>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLONNA DESTRA: ANAGRAFICA SOCI            */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col">
          
          <h3 className="text-2xl font-black text-purple-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            ANAGRAFICA SOCI
          </h3>

          <div className="flex flex-col gap-8">
            {/* BARRA CONTROLLO E FILTRI */}
            <div className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
              <div className="w-full md:w-1/2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                <input 
                  type="text" placeholder="Ricerca per nome, cognome o tessera..." value={ricerca} onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-black pl-12 pr-5 py-4 rounded-2xl border border-gray-800 text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Totale Soci</p>
                  {/* ECCO LA CORREZIONE DEL CONTATORE 👇 */}
                  <p className="text-2xl font-black text-purple-500 tabular-nums">{sociFiltrati.length}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => setFiltroScaduti(!filtroScaduti)}
                  className={`text-center border px-6 py-2 rounded-2xl transition-all active:scale-95 ${filtroScaduti ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-800 hover:border-red-900'}`}
                >
                  <p className="text-[10px] text-red-500/80 font-black uppercase tracking-widest">Tessere Scadute</p>
                  <p className={`text-2xl font-black tabular-nums ${totaleSociScaduti > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {totaleSociScaduti} {filtroScaduti ? '⏳' : ''}
                  </p>
                </button>

                <button onClick={stampaPDF} className="bg-purple-800/40 hover:bg-purple-700 border border-purple-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-3">
                  📄 Stampa
                </button>
              </div>
            </div>

            {/* REGISTRO TABELLARE */}
            <div className="bg-[#11131a] p-6 rounded-[40px] border border-gray-800 flex-1 shadow-2xl overflow-hidden flex flex-col">
              <div className="overflow-x-auto h-full max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#11131a] z-10">
                    <tr className="border-b border-gray-800">
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-purple-500">Nominativo</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-purple-500">Tessera</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-purple-500">Telefono</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-purple-500 text-center">Scadenza</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-purple-500 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {sociFiltrati.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-700 opacity-50">
                          <span className="text-6xl block mb-4">👥</span>
                          <p className="font-black text-lg uppercase tracking-widest">Nessun Tesserato Registrato</p>
                        </td>
                      </tr>
                    ) : (
                      sociFiltrati.map((s) => {
                        const dataScadenza = new Date(s.scadenza_tessera);
                        const isScaduta = dataScadenza < new Date();
                        
                        if (idInModifica === s.id) {
                          return (
                            <tr key={s.id} className="bg-purple-950/20 border-b border-purple-800/50">
                              <td className="py-3 px-2 flex gap-2">
                                <input type="text" value={modCognome} onChange={e => setModCognome(e.target.value)} placeholder="Cognome" className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-purple-500" />
                                <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} placeholder="Nome" className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-purple-500" />
                              </td>
                              <td className="py-3 px-2">
                                <input type="text" value={modTessera} onChange={e => setModTessera(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-24 uppercase text-white font-black outline-none focus:border-purple-500" />
                              </td>
                              <td className="py-3 px-2">
                                <input type="text" value={modTelefono} onChange={e => setModTelefono(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-mono outline-none focus:border-purple-500" />
                              </td>
                              <td className="py-3 px-2 text-center">
                                <input type="date" value={modScadenza} onChange={e => setModScadenza(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm text-white font-black outline-none focus:border-purple-500" />
                              </td>
                              <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
                                <button onClick={() => salvaModifica(s.id)} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Salva</button>
                                <button onClick={() => setIdInModifica(null)} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Annulla</button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={s.id} className={`hover:bg-gray-900/30 transition-colors group ${isScaduta ? 'bg-red-950/10' : ''}`}>
                            <td className="py-4 px-4 font-bold text-white">{s.cognome} {s.nome}</td>
                            <td className="py-4 px-4">
                              <span className="text-purple-400 font-black tracking-widest text-sm bg-purple-950/30 px-3 py-1 rounded-lg">
                                {s.numero_tessera}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{s.telefono || '-'}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-sm font-black uppercase tracking-widest ${isScaduta ? 'text-red-500' : 'text-emerald-500'}`}>
                                {dataScadenza.toLocaleDateString('it-IT')}
                                {isScaduta && <span className="block text-[9px] mt-1">Scaduta</span>}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center space-x-3">
                              <button 
                                onClick={() => avviaModifica(s)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-purple-950/20 text-purple-500/40 hover:bg-purple-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Modifica Socio"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => eliminaSocio(s.id)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-red-950/20 text-red-500/40 hover:bg-red-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Elimina Socio"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}