"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Cassa({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [transazioni, setTransazioni] = useState<any[]>([]);
  const [descrizione, setDescrizione] = useState('');
  const [importo, setImporto] = useState('');
  const [tipo, setTipo] = useState<'entrata' | 'uscita'>('entrata');
  const [comparto, setComparto] = useState('Gioco');
  const [loading, setLoading] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'oggi' | 'mese' | 'tutto'>('oggi');
  const [successo, setSuccesso] = useState<string | null>(null);

  useEffect(() => {
    caricaTransazioni();
  }, [salaId]);

  async function caricaTransazioni() {
    const { data } = await supabase
      .from('cassa')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false });
      
    if (data) setTransazioni(data);
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descrizione || !importo) return;
    
    setLoading(true);
    const { error } = await supabase.from('cassa').insert([{
      sala_id: salaId,
      descrizione,
      importo: parseFloat(importo.replace(',', '.')), 
      tipo,
      comparto 
    }]);
    
    if (!error) {
      setSuccesso(`MOVIMENTO "${tipo.toUpperCase()}" REGISTRATO!`);
      setTimeout(() => setSuccesso(null), 3000);
      setDescrizione('');
      setImporto('');
      caricaTransazioni();
    }
    setLoading(false);
  }

  async function eliminaTransazione(id: string) {
    if (confirm("ATTENZIONE: Procedere con lo storno contabile?")) {
      await supabase.from('cassa').delete().eq('id', id);
      caricaTransazioni();
    }
  }

  const transazioniFiltrate = transazioni.filter((t) => {
    const dataTransazione = new Date(t.created_at);
    const oggi = new Date();
    if (filtroPeriodo === 'oggi') return dataTransazione.toDateString() === oggi.toDateString();
    if (filtroPeriodo === 'mese') return dataTransazione.getMonth() === oggi.getMonth() && dataTransazione.getFullYear() === oggi.getFullYear();
    return true; 
  });

  const totaleEntrate = transazioniFiltrate.filter(t => t.tipo === 'entrata').reduce((acc, curr) => acc + Number(curr.importo), 0);
  const totaleUscite = transazioniFiltrate.filter(t => t.tipo === 'uscita').reduce((acc, curr) => acc + Number(curr.importo), 0);
  const saldoNetto = totaleEntrate - totaleUscite;

  // FUNZIONE DI STAMPA PDF DEL REPORT
  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = transazioniFiltrate.map(t => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(t.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #0891b2;">${t.comparto || 'N/D'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-transform: uppercase;">${t.descrizione}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 800; color: ${t.tipo === 'entrata' ? '#15803d' : '#b91c1c'};">${t.tipo.toUpperCase()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€ ${Number(t.importo).toFixed(2)}</td>
      </tr>
    `).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Report Contabile</title>
        <style>
          body { font-family: sans-serif; padding: 50px; color: #333; }
          .header { border-bottom: 4px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 15px; border: 1px solid #e2e8f0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #0891b2; color: white; padding: 12px; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1 style="margin:0; font-size: 28px; color: #083344;">MOVIMENTI CONTABILI</h1><p style="margin:0; color:#666;">Estratto Periodo: ${filtroPeriodo.toUpperCase()}</p></div>
          <div style="text-align:right;"><p style="margin:0; font-weight:bold;">Sistema Gestionale</p><p style="margin:0; font-size:12px;">Generato il: ${dataCorrente}</p></div>
        </div>
        <div class="summary">
          <div><small>TOTALE ENTRATE</small><p style="color:#15803d; font-size:24px; font-weight:900; margin:0;">€ ${totaleEntrate.toFixed(2)}</p></div>
          <div><small>TOTALE USCITE</small><p style="color:#b91c1c; font-size:24px; font-weight:900; margin:0;">€ ${totaleUscite.toFixed(2)}</p></div>
          <div><small>SALDO NETTO</small><p style="color:#0891b2; font-size:24px; font-weight:900; margin:0;">€ ${saldoNetto.toFixed(2)}</p></div>
        </div>
        <table>
          <thead><tr><th>Data / Ora</th><th>Comparto</th><th>Causale</th><th>Tipo</th><th style="text-align:right;">Importo</th></tr></thead>
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
      
      {/* POPUP SUCCESSO HIGH-CONTRAST */}
      {successo && (
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-cyan-600 text-cyan-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] animate-bounce font-black uppercase tracking-widest text-xl">
          ✓ {successo}
        </div>
      )}

      {/* SCHERMO NERO PRINCIPALE */}
      <div className="w-full max-w-[1600px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-8 border-emerald-100/60 relative overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-800 pb-8 mb-10 gap-4">
          <div>
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Gestione Finanziaria</p>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">MOVIMENTI CONTABILI</h2>
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
              📄 Stampa Report
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLONNA SINISTRA: ESTRATTO CONTO E TIMELINE */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* PANNELLO FILTRI E SALDO */}
            <div className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex bg-gray-100 p-2 rounded-2xl border-2 border-gray-300">
                {['oggi', 'mese', 'tutto'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => setFiltroPeriodo(p as any)} 
                    className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      filtroPeriodo === p ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-500 hover:text-black hover:bg-gray-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="text-right bg-gray-900 px-8 py-4 rounded-xl border-2 border-gray-700">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Saldo Netto</p>
                <p className={`text-5xl font-black tabular-nums tracking-tighter ${saldoNetto >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  € {saldoNetto.toFixed(2)}
                </p>
              </div>
            </div>

            {/* TABELLA TIMELINE */}
            <div className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex-1 overflow-hidden flex flex-col min-h-[500px]">
              <div className="flex justify-between items-center mb-6 border-b-2 border-gray-800 pb-4">
                <h3 className="font-black text-xl text-white uppercase tracking-widest">Storico Movimenti</h3>
                <span className="text-[10px] font-black text-cyan-500 bg-cyan-950/40 border border-cyan-800 px-4 py-2 rounded-lg tracking-widest uppercase">
                  {transazioniFiltrate.length} Records
                </span>
              </div>
              
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
                {transazioniFiltrate.length === 0 ? (
                  <div className="py-24 text-center text-gray-600 opacity-50">
                    <span className="text-6xl block mb-4">📉</span>
                    <p className="font-black text-xl uppercase tracking-widest">Silenzio Contabile</p>
                  </div>
                ) : (
                  transazioniFiltrate.map((t) => (
                    <div key={t.id} className="bg-gray-900 p-6 rounded-2xl flex items-center justify-between border-2 border-gray-800 hover:border-cyan-700 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-xl bg-black border-2 border-gray-700 flex items-center justify-center font-black text-cyan-400 text-[10px] uppercase shadow-inner">
                          {t.comparto?.substring(0, 3)}
                        </div>
                        <div>
                          <p className="font-black text-white text-lg uppercase tracking-wide">{t.descrizione}</p>
                          <p className="text-xs text-gray-500 font-bold mt-1 tracking-widest">
                            {new Date(t.created_at).toLocaleDateString('it-IT')} - {new Date(t.created_at).toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <span className={`font-black text-3xl tabular-nums ${t.tipo === 'entrata' ? 'text-green-500' : 'text-red-500'}`}>
                          {t.tipo === 'entrata' ? '+' : '-'} €{Number(t.importo).toFixed(2)}
                        </span>
                        <button onClick={() => eliminaTransazione(t.id)} className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-950/40 text-red-500/50 hover:bg-red-600 hover:text-white border border-red-900/50 opacity-0 group-hover:opacity-100 transition-all" title="Storno">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* COLONNA DESTRA: INSERIMENTO HIGH-CONTRAST */}
          <div className="lg:col-span-4 flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">Inserimento Dati</h3>
            
            <form onSubmit={gestisciSubmit} className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
              
              <div className="flex gap-4 mb-8">
                <button type="button" onClick={() => setTipo('entrata')} className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${tipo === 'entrata' ? 'bg-green-600 text-white border-green-400 shadow-[0_0_15px_rgba(22,163,74,0.4)]' : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'}`}>
                  Entrata
                </button>
                <button type="button" onClick={() => setTipo('uscita')} className={`flex-1 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${tipo === 'uscita' ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(220,38,38,0.4)]' : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'}`}>
                  Uscita
                </button>
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Comparto</label>
                <select value={comparto} onChange={(e) => setComparto(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-sm outline-none focus:border-cyan-500 appearance-none">
                  <option>Gioco</option>
                  <option>Bar</option>
                  <option>Servizi</option>
                  <option>Altro</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Importo Nominale (€)</label>
                <input type="number" step="0.01" value={importo} onChange={e => setImporto(e.target.value)} placeholder="0.00" className="w-full bg-gray-100 border-2 border-gray-400 p-6 rounded-xl text-black font-black text-4xl text-center outline-none focus:border-cyan-500 placeholder-gray-300" required />
              </div>

              <div className="mb-10">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Causale Tecnica</label>
                <input type="text" placeholder="Dettaglio operazione..." value={descrizione} onChange={e => setDescrizione(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-lg outline-none focus:border-cyan-500 placeholder-gray-400" required />
              </div>

              <button disabled={loading} type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] border-2 border-cyan-400 disabled:opacity-50">
                {loading ? 'Attendere...' : 'Esegui Registrazione'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}