"use client";

// ==========================================
// FILE: src/components/Prenotazioni.tsx
// OBIETTIVO: Componente motore Gestione Agenda (Sbloccato e Validato)
// ==========================================

import React, { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useRouter } from 'next/navigation';

export default function Prenotazioni({ salaId }: { salaId: string }) {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [nomeCliente, setNomeCliente] = useState('');
  const [tavoloNumero, setTavoloNumero] = useState('');
  const [dataOra, setDataOra] = useState('');
  const [note, setNote] = useState('');
  const [sorgente, setSorgente] = useState('telefono');
  const [loading, setLoading] = useState(false);
  const [erroreDiagnostica, setErroreDiagnostica] = useState<string | null>(null);
  const [successo, setSuccesso] = useState<string | null>(null);

  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modTavolo, setModTavolo] = useState('');
  const [modDataOra, setModDataOra] = useState('');
  const [modNote, setModNote] = useState('');

  const router = useRouter();

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
    
    if (!nomeCliente.trim() || !dataOra) {
      alert("⚠️ Attenzione: Compila il Nome Cliente e la Data/Ora per confermare la prenotazione.");
      return;
    }
    
    setLoading(true);
    const notaFormattata = `[${sorgente.toUpperCase()}] ${note}`.trim();

    try {
      const { error } = await supabase.from('prenotazioni').insert([{
        sala_id: salaId,
        nome_cliente: nomeCliente.trim(),
        tavolo_numero: tavoloNumero.trim(),
        data_ora: new Date(dataOra).toISOString(), 
        note: notaFormattata
      }]);

      if (error) {
        setErroreDiagnostica(error.message);
      } else {
        setSuccesso(`PRENOTAZIONE "${nomeCliente}" CONFERMATA!`);
        setTimeout(() => setSuccesso(null), 3000);

        setNomeCliente(''); 
        setTavoloNumero(''); 
        setDataOra(''); 
        setNote(''); 
        setSorgente('telefono');
        
        caricaPrenotazioni();
      }
    } catch (err: any) {
      setErroreDiagnostica(err.message);
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
      setErroreDiagnostica(error.message);
    } else {
      setSuccesso("PRENOTAZIONE AGGIORNATA!");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaPrenotazioni();
    }
  }

  async function annullaPrenotazione(id: string) {
    if (confirm("ATTENZIONE: Sei sicuro di voler annullare questa prenotazione?")) {
      try {
        const { error } = await supabase
          .from('prenotazioni')
          .delete()
          .eq('id', id);

        if (error) {
          setErroreDiagnostica(error.message);
        } else {
          setSuccesso("PRENOTAZIONE ELIMINATA CON SUCCESSO!");
          setTimeout(() => setSuccesso(null), 3000);
          caricaPrenotazioni();
        }
      } catch (err: any) {
        setErroreDiagnostica(err.message);
      }
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
    <div className="min-h-screen bg-[#050505] p-4 sm:p-8 flex flex-col items-center transition-colors duration-500 font-sans">
      
      {successo && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-emerald-600 text-emerald-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] animate-bounce font-black uppercase tracking-widest text-xl">
          ✓ {successo}
        </div>
      )}

      {erroreDiagnostica && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-red-600 border-4 border-white text-white px-10 py-5 rounded-2xl shadow-2xl z-[100] font-black uppercase tracking-widest text-sm flex items-center justify-between gap-4">
          <span>ERRORE DB: {erroreDiagnostica}</span>
          <button onClick={() => setErroreDiagnostica(null)} className="text-white hover:text-gray-300">✖</button>
        </div>
      )}

      <div className="w-full max-w-[1600px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border border-gray-800 relative">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-8 mb-10 gap-4">
          <div>
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-1">Gestione Agenda</p>
            <h2 className="text-4xl font-black text-white uppercase tracking-widest">PRENOTAZIONI SALA</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              type="button"
              onClick={() => router.push(`/dashboard/${salaId}`)} 
              className="bg-cyan-600/20 text-cyan-500 hover:bg-cyan-500 hover:text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-cyan-500/50 w-full sm:w-auto text-center"
            >
              ← Torna alla Plancia
            </button>
            <button 
              type="button"
              onClick={stampaPDF} 
              className="bg-zinc-800 hover:bg-zinc-700 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border border-zinc-600 w-full sm:w-auto shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 text-center"
            >
              📄 Stampa Foglio Turni
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLONNA SINISTRA: TABELLONE PRENOTAZIONI */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
              <h3 className="text-2xl font-black text-white uppercase tracking-widest">Tabellone Attivo</h3>
              <div className="bg-gray-900 px-6 py-2 rounded-xl border border-gray-700 text-center">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Records</span>
                <span className="text-2xl font-black text-emerald-400 tabular-nums">{prenotazioni.length}</span>
              </div>
            </div>

            <div className="p-8 rounded-[2rem] bg-[#11131a] border border-gray-800 shadow-xl flex-1 flex flex-col min-h-[500px]">
              <div className="overflow-x-auto h-full max-h-[650px] pr-2 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#11131a] z-10">
                    <tr className="border-b border-gray-600">
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[18%]">Orario / Data</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[35%]">Anagrafica Cliente</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[20%]">Biliardo</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 w-[17%]">Canale</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-emerald-500 text-center w-[10%]">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {prenotazioni.map((p) => {
                      const data = new Date(p.data_ora);
                      let origineTesto = "App Soci";
                      let badgeColor = "bg-gray-800 text-gray-300 border-gray-600";
                      
                      if (p.note?.includes("[TELEFONO]")) { badgeColor = "bg-blue-900/50 text-blue-400 border-blue-500/50"; origineTesto = "📞 Telefono"; }
                      if (p.note?.includes("[WHATSAPP]")) { badgeColor = "bg-green-900/50 text-green-400 border-green-500/50"; origineTesto = "💬 WhatsApp"; }
                      if (p.note?.includes("[SOCIAL]")) { badgeColor = "bg-purple-900/50 text-purple-400 border-purple-500/50"; origineTesto = "📱 Social"; }
                      if (p.note?.includes("[DI_PERSONA]")) { badgeColor = "bg-amber-900/50 text-amber-400 border-amber-500/50"; origineTesto = "👤 In Sala"; }
                      
                      const notaPulita = p.note ? p.note.replace(/^\[(TELEFONO|WHATSAPP|SOCIAL|DI_PERSONA)\]/, '').replace('(App Soci)', '').trim() : '';

                      if (idInModifica === p.id) return (
                        <tr key={p.id} className="bg-gray-900 border-b border-gray-700">
                          <td className="py-4 px-2"><input type="datetime-local" value={modDataOra} onChange={e => setModDataOra(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-xs w-full text-white font-black outline-none focus:border-emerald-500" /></td>
                          <td className="py-4 px-2">
                            <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-xs w-full text-white font-bold outline-none focus:border-emerald-500 mb-2" />
                            <input type="text" value={modNote} onChange={e => setModNote(e.target.value)} placeholder="Modifica nota..." className="bg-black border border-gray-700 p-2 rounded-lg text-xs w-full text-white font-mono outline-none focus:border-emerald-500" />
                          </td>
                          <td className="py-4 px-2"><input type="text" value={modTavolo} onChange={e => setModTavolo(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-xs w-full text-white font-bold outline-none focus:border-emerald-500" /></td>
                          <td className="py-4 px-2 text-center text-[10px] text-gray-400 italic font-bold uppercase">In Modifica</td>
                          <td className="py-4 px-2 text-center space-y-2">
                            <button type="button" onClick={() => salvaModifica(p.id)} className="w-full bg-emerald-600 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase border border-emerald-400">Salva</button>
                            <button type="button" onClick={() => setIdInModifica(null)} className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase border border-gray-500">Annulla</button>
                          </td>
                        </tr>
                      );

                      return (
                        <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-6 px-4 whitespace-nowrap">
                            <span className="text-xl font-black text-emerald-400 tabular-nums block mb-1">{data.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}</span>
                            <span className="text-xs font-bold text-gray-400">{data.toLocaleDateString('it-IT', {day: '2-digit', month: '2-digit'})}</span>
                          </td>
                          <td className="py-6 px-4">
                            <span className="block font-black text-white text-lg uppercase tracking-wide">{p.nome_cliente}</span>
                            {notaPulita && <span className="block text-xs font-bold text-gray-500 italic mt-1">{notaPulita}</span>}
                          </td>
                          <td className="py-6 px-4 font-black text-emerald-500 text-lg">
                            {p.tavolo_numero ? `📌 ${p.tavolo_numero}` : '—'}
                          </td>
                          <td className="py-6 px-4 whitespace-nowrap">
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${badgeColor}`}>
                              {origineTesto}
                            </span>
                          </td>
                          <td className="py-6 px-4 text-center space-x-3 whitespace-nowrap">
                            <button type="button" onClick={() => avviaModifica(p)} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title="Modifica">✏️</button>
                            <button type="button" onClick={() => annullaPrenotazione(p.id)} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title="Annulla">🗑️</button>
                          </td>
                        </tr>
                      );
                    })}
                    {prenotazioni.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-gray-500 opacity-50">
                          <span className="text-6xl block mb-4">📅</span>
                          <p className="font-black text-xl uppercase tracking-widest">Nessun Turno Prenotato</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: INSERIMENTO MANUALE */}
          <div className="lg:col-span-4 flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6 border-b border-gray-800 pb-3">Ricezione Manuale</h3>
            
            <form onSubmit={gestisciSubmit} className="p-8 rounded-[2rem] bg-[#11131a] border border-gray-800 shadow-xl flex flex-col">
              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Sorgente Contatto</label>
                <select value={sorgente} onChange={e => setSorgente(e.target.value)} className="w-full bg-black border border-gray-700 p-5 rounded-xl text-white font-black text-sm outline-none focus:border-emerald-500 appearance-none">
                  <option value="telefono">📞 Chiamata Telefonica</option>
                  <option value="whatsapp">💬 Messaggio WhatsApp</option>
                  <option value="social">📱 Social Network</option>
                  <option value="di_persona">👤 Presenza in Sala</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Nominativo Cliente *</label>
                <input type="text" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} placeholder="Es. Mario Rossi" className="w-full bg-black border border-gray-700 p-5 rounded-xl text-white font-black text-lg outline-none focus:border-emerald-500 placeholder-gray-600" required />
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Tavolo o Specialità</label>
                <input type="text" value={tavoloNumero} onChange={e => setTavoloNumero(e.target.value)} placeholder="Es. Tavolo 3" className="w-full bg-black border border-gray-700 p-5 rounded-xl text-white font-black text-lg outline-none focus:border-emerald-500 placeholder-gray-600" />
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Data e Ora Prevista *</label>
                <input type="datetime-local" value={dataOra} onChange={e => setDataOra(e.target.value)} className="w-full bg-black border border-gray-700 p-5 rounded-xl text-white font-black text-lg outline-none focus:border-emerald-500" required />
              </div>

              <div className="mb-10">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Note Aggiuntive</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Es. Richiede stecca personale..." className="w-full bg-black border border-gray-700 p-5 rounded-xl text-white font-bold text-sm h-24 resize-none outline-none focus:border-emerald-500 placeholder-gray-600" />
              </div>

              <button disabled={loading} type="submit" className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-lg disabled:opacity-50">
                {loading ? 'Attendere...' : 'Salva Prenotazione'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}