"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Prenotazioni({ salaId }: { salaId: string }) {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [tavoloNumero, setTavoloNumero] = useState('');
  const [dataOra, setDataOra] = useState('');
  const [note, setNote] = useState('');
  const [sorgente, setSorgente] = useState('telefono');
  const [loading, setLoading] = useState(false);
  const [erroreDiagnostica, setErroreDiagnostica] = useState<string | null>(null);
  const [linkCopiato, setLinkCopiato] = useState(false);
  const [successo, setSuccesso] = useState<string | null>(null);

  // STATI PER LA MODIFICA IN LINEA
  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modTavolo, setModTavolo] = useState('');
  const [modDataOra, setModDataOra] = useState('');
  const [modNote, setModNote] = useState('');

  useEffect(() => {
    caricaPrenotazioni();
  }, [salaId]);

  async function caricaPrenotazioni() {
    try {
      setErroreDiagnostica(null);
      const { data, error } = await supabase
        .from('prenotazioni')
        .select('*')
        .eq('sala_id', salaId)
        .order('data_ora', { ascending: true });
        
      if (error) {
        setErroreDiagnostica(error.message);
      } else if (data) {
        setPrenotazioni(data);
      }
    } catch (err: any) {
      setErroreDiagnostica(err.message);
    }
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeCliente || !dataOra) return;
    
    setLoading(true);
    const notaFormattata = `[${sorgente.toUpperCase()}] ${note}`.trim();

    try {
      const { error } = await supabase.from('prenotazioni').insert([{
        sala_id: salaId,
        nome_cliente: nomeCliente,
        tavolo_numero: tavoloNumero,
        data_ora: new Date(dataOra).toISOString(), 
        note: notaFormattata
      }]);

      if (error) {
        alert("ERRORE DI SALVATAGGIO: " + error.message);
      } else {
        setSuccesso(`Prenotazione per "${nomeCliente}" confermata.`);
        setTimeout(() => setSuccesso(null), 3000);

        setNomeCliente('');
        setTavoloNumero('');
        setDataOra('');
        setNote('');
        setSorgente('telefono');
        caricaPrenotazioni();
      }
    } catch (err: any) {
      alert("Errore di rete: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  function avviaModifica(prenotazione: any) {
    setIdInModifica(prenotazione.id);
    setModNome(prenotazione.nome_cliente);
    setModTavolo(prenotazione.tavolo_numero || '');
    
    const dataLocal = new Date(prenotazione.data_ora);
    dataLocal.setMinutes(dataLocal.getMinutes() - dataLocal.getTimezoneOffset());
    setModDataOra(dataLocal.toISOString().slice(0,16));
    setModNote(prenotazione.note || '');
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modDataOra) return;

    const { error } = await supabase
      .from('prenotazioni')
      .update({
        nome_cliente: modNome,
        tavolo_numero: modTavolo,
        data_ora: new Date(modDataOra).toISOString(),
        note: modNote
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setSuccesso("Prenotazione aggiornata.");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaPrenotazioni();
    }
  }

  async function annullaPrenotazione(id: string) {
    if (confirm("ATTENZIONE: Sei sicuro di voler annullare questa prenotazione?")) {
      await supabase.from('prenotazioni').delete().eq('id', id);
      caricaPrenotazioni();
    }
  }

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
    
    let righeTabella = prenotazioni.map(p => {
      const data = new Date(p.data_ora);
      let origineTesto = "App Soci";
      if (p.note?.includes("[TELEFONO]")) origineTesto = "Telefono";
      if (p.note?.includes("[WHATSAPP]")) origineTesto = "WhatsApp";
      if (p.note?.includes("[SOCIAL]")) origineTesto = "Social";
      if (p.note?.includes("[DI_PERSONA]")) origineTesto = "In Sala";

      const notaPulita = p.note ? p.note.replace(/^\[(TELEFONO|WHATSAPP|SOCIAL|DI_PERSONA)\]/, '').replace('(App Soci)', '').trim() : '';

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">
            ${data.toLocaleDateString('it-IT')} - ${data.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 900; text-transform: uppercase;">${p.nome_cliente}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #047857;">${p.tavolo_numero || '-'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 10px; text-transform: uppercase; color: #6b7280;">${origineTesto}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-style: italic; font-size: 11px;">${notaPulita}</td>
        </tr>
      `;
    }).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Tabellone Prenotazioni</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid #10b981; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #10b981; color: white; padding: 10px; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1 style="margin:0; color:#047857;">Foglio Turni Sala</h1><p style="margin:5px 0 0 0; font-size:12px; font-weight:bold;">Estratto al: ${dataCorrente}</p></div>
        </div>
        <table>
          <thead><tr><th>Orario</th><th>Cliente</th><th>Tavolo</th><th>Canale</th><th>Note</th></tr></thead>
          <tbody>${righeTabella}</tbody>
        </table>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `);
    finestraStampa.document.close();
  };

  return (
    <div className="p-8 text-white font-sans w-full max-w-[1400px] mx-auto min-h-screen">
      
      {/* TITOLO MODULO PRINCIPALE */}
      <div className="mb-8 text-center">
        <h2 className="text-6xl font-black text-emerald-500 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          PRENOTAZIONI SALA
        </h2>
        <div className="h-1 w-48 bg-emerald-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* SEZIONE CONDIVISIONE LINK PUBBLICO */}
      <div className="mb-10 max-w-4xl mx-auto bg-[#11131a] p-6 rounded-3xl border border-emerald-900/50 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400">Terminale Clienti / Soci</h4>
          <p className="text-xs text-gray-400 mt-1">Copia questo link e invialo ai tuoi clienti per permettere la prenotazione autonoma da smartphone.</p>
        </div>
        <button 
          onClick={copiaLinkPubblico}
          className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 ${linkCopiato ? 'bg-green-600 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'}`}
        >
          {linkCopiato ? '✓ LINK COPIATO NEGLI APPUNTI!' : '📋 COPIA LINK PRENOTAZIONE'}
        </button>
      </div>

      {/* FEEDBACK SUCCESSO E DIAGNOSTICA */}
      {successo && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-4 rounded-2xl border border-green-400 shadow-2xl z-[100]">
           <span className="font-black uppercase tracking-widest text-sm">✅ {successo}</span>
        </div>
      )}
      {erroreDiagnostica && (
        <div className="mb-6 bg-red-950/50 border border-red-700 text-red-400 p-4 rounded-2xl text-xs font-mono">
          <strong>ALLARME DATABASE:</strong> {erroreDiagnostica}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ========================================== */}
        {/* COLONNA SINISTRA: INSERIMENTO MANUALE      */}
        {/* ========================================== */}
        <div className="lg:col-span-4 flex flex-col">
          <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            RICEZIONE MANUALE
          </h3>

          <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 shadow-2xl">
            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Sorgente Contatto</label>
              <select 
                value={sorgente} onChange={e => setSorgente(e.target.value)}
                className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-emerald-500 appearance-none"
              >
                <option value="telefono">📞 Chiamata Telefonica</option>
                <option value="whatsapp">💬 Messaggio WhatsApp</option>
                <option value="social">📱 Social Network</option>
                <option value="di_persona">👤 Presenza in Sala</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Nominativo Cliente</label>
              <input 
                type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)}
                placeholder="Es. Mario Rossi"
                className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Tavolo o Specialità</label>
              <input 
                type="text" value={tavoloNumero} onChange={e => setTavoloNumero(e.target.value)}
                placeholder="Es. Tavolo 3"
                className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-emerald-400 focus:outline-none focus:border-emerald-500" 
              />
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Data e Ora Prevista</label>
              <input 
                type="datetime-local" value={dataOra} onChange={e => setDataOra(e.target.value)}
                className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-sm text-white focus:outline-none focus:border-emerald-500" 
                required 
              />
            </div>

            <div className="mb-10">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Note Aggiuntive</label>
              <textarea 
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Es. Richiede stecca personale..."
                className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white h-24 resize-none focus:outline-none focus:border-emerald-500" 
              />
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
            >
              {loading ? 'Elaborazione...' : 'Conferma Ricezione'}
            </button>
          </form>
        </div>

        {/* ========================================== */}
        {/* COLONNA DESTRA: AGENDA PRENOTAZIONI TAB.   */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b-2 border-gray-800 pb-3">
            <h3 className="text-2xl font-black text-emerald-400 uppercase tracking-widest">
              TABELLONE ATTIVO
            </h3>
            <div className="flex gap-4 items-center">
              <span className="text-sm font-black text-gray-400 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800 tabular-nums">
                RECORDS: <span className="text-emerald-400">{prenotazioni.length}</span>
              </span>
              <button onClick={stampaPDF} className="bg-emerald-800/40 hover:bg-emerald-700 border border-emerald-600 px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-2">
                📄 Stampa Foglio Turni
              </button>
            </div>
          </div>

          {/* TABELLONE IN LINEA STILE AGENDA/AEROPORTO */}
          <div className="bg-[#11131a] p-4 rounded-[40px] border border-gray-800 flex-1 shadow-2xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto h-full max-h-[650px] custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#11131a] z-10">
                  <tr className="border-b border-gray-800">
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[18%]">Orario / Data</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[35%]">Anagrafica Cliente</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[20%]">Biliardo</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[17%]">Canale</th>
                    <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center w-[10%]">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {prenotazioni.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center text-gray-700 opacity-50">
                        <span className="text-6xl block mb-4">📅</span>
                        <p className="font-black text-lg uppercase tracking-widest">Nessun Turno Prenotato</p>
                      </td>
                    </tr>
                  ) : (
                    prenotazioni.map((p) => {
                      const data = new Date(p.data_ora);
                      let origineTesto = "App Soci";
                      let badgeColor = "bg-gray-900 text-gray-400 border border-gray-800";

                      if (p.note?.includes("[TELEFONO]")) { badgeColor = "bg-blue-950/40 text-blue-400 border border-blue-900/30"; origineTesto = "📞 Telefono"; }
                      if (p.note?.includes("[WHATSAPP]")) { badgeColor = "bg-green-950/40 text-green-400 border border-green-900/30"; origineTesto = "💬 WhatsApp"; }
                      if (p.note?.includes("[SOCIAL]")) { badgeColor = "bg-purple-950/40 text-purple-400 border border-purple-900/30"; origineTesto = "📱 Social"; }
                      if (p.note?.includes("[DI_PERSONA]")) { badgeColor = "bg-amber-950/40 text-amber-400 border border-amber-900/30"; origineTesto = "👤 In Sala"; }

                      const notaPulita = p.note ? p.note.replace(/^\[(TELEFONO|WHATSAPP|SOCIAL|DI_PERSONA)\]/, '').replace('(App Soci)', '').trim() : '';

                      // MODALITÀ IN LINEA: EDITING RETE
                      if (idInModifica === p.id) {
                        return (
                          <tr key={p.id} className="bg-emerald-950/20 border-b border-emerald-800/50">
                            <td className="py-3 px-2">
                              <input type="datetime-local" value={modDataOra} onChange={e => setModDataOra(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-black outline-none focus:border-emerald-500" />
                            </td>
                            <td className="py-3 px-2">
                              <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-emerald-500 mb-1" />
                              <input type="text" value={modNote} onChange={e => setModNote(e.target.value)} placeholder="Modifica nota..." className="bg-black border border-gray-800 p-2 rounded-lg text-xs w-full text-gray-400 font-mono outline-none focus:border-emerald-500" />
                            </td>
                            <td className="py-3 px-2">
                              <input type="text" value={modTavolo} onChange={e => setModTavolo(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-emerald-500" />
                            </td>
                            <td className="py-3 px-2 text-center text-xs text-gray-500 italic">
                              In Modifica
                            </td>
                            <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
                              <button onClick={() => salvaModifica(p.id)} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Salva</button>
                              <button onClick={() => setIdInModifica(null)} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Annulla</button>
                            </td>
                          </tr>
                        );
                      }

                      // MAPPATURA STANDARD STRISCIA AGENDA AEROPORTO
                      return (
                        <tr key={p.id} className="hover:bg-gray-900/30 transition-colors group">
                          {/* 1. DATA E ORA (IN LINEA ORIZZONTALE) */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="text-xl font-black text-emerald-400 tracking-tighter tabular-nums mr-2">
                              {data.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}
                            </span>
                            <span className="text-xs font-bold text-gray-500 block sm:inline-block">
                              {data.toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit'})}
                            </span>
                          </td>

                          {/* 2. NOMINATIVO + NOTA COMPATTA SOTTOSTANTE */}
                          <td className="py-4 px-4">
                            <span className="block font-black text-gray-200 text-base uppercase tracking-wide leading-tight group-hover:text-white transition-colors">
                              {p.nome_cliente}
                            </span>
                            {notaPulita && (
                              <span className="block text-xs font-medium text-gray-500 italic font-sans mt-0.5 tracking-normal">
                                {notaPulita}
                              </span>
                            )}
                          </td>

                          {/* 3. RISORSA TAVOLO ASSEGNATO */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-bold text-sm text-emerald-500 uppercase tracking-tight">
                              {p.tavolo_numero ? `📌 ${p.tavolo_numero}` : '—'}
                            </span>
                          </td>

                          {/* 4. SORGENTE CANALE INGRESSO */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                              {origineTesto}
                            </span>
                          </td>

                          {/* 5. AZIONI RAPIDE */}
                          <td className="py-4 px-4 text-center space-x-2 whitespace-nowrap">
                            <button 
                              onClick={() => avviaModifica(p)} 
                              className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-emerald-950/20 text-emerald-500/40 hover:bg-emerald-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Modifica Prenotazione"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => annullaPrenotazione(p.id)} 
                              className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-red-950/20 text-red-500/40 hover:bg-red-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Annulla Prenotazione"
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
  );
}