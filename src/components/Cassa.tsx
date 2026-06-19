"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Cassa({ salaId }: { salaId: string }) {
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
      setSuccesso(`Movimento ${tipo} registrato con successo.`);
      setTimeout(() => setSuccesso(null), 3000);
      setDescrizione('');
      setImporto('');
      caricaTransazioni();
    }
    setLoading(false);
  }

  async function eliminaTransazione(id: string) {
    if (confirm("ATTENZIONE: Procedere con lo storno contabile di questa transazione?")) {
      await supabase.from('cassa').delete().eq('id', id);
      caricaTransazioni();
    }
  }

  // --- LOGICA DI FILTRAGGIO TEMPORALE ---
  const transazioniFiltrate = transazioni.filter((t) => {
    const dataTransazione = new Date(t.created_at);
    const oggi = new Date();

    if (filtroPeriodo === 'oggi') {
      return dataTransazione.toDateString() === oggi.toDateString();
    }
    if (filtroPeriodo === 'mese') {
      return dataTransazione.getMonth() === oggi.getMonth() && dataTransazione.getFullYear() === oggi.getFullYear();
    }
    return true; 
  });

  const totaleEntrate = transazioniFiltrate.filter(t => t.tipo === 'entrata').reduce((acc, curr) => acc + Number(curr.importo), 0);
  const totaleUscite = transazioniFiltrate.filter(t => t.tipo === 'uscita').reduce((acc, curr) => acc + Number(curr.importo), 0);
  const saldoNetto = totaleEntrate - totaleUscite;

  // --- FUNZIONE DI STAMPA PDF PROFESSIONALE ---
  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = transazioniFiltrate.map(t => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(t.created_at).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #0891b2;">${t.comparto || 'N/D'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${t.descrizione}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 800; color: ${t.tipo === 'entrata' ? '#15803d' : '#b91c1c'};">${t.tipo.toUpperCase()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€ ${Number(t.importo).toFixed(2)}</td>
      </tr>
    `).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Report Contabile - Galatina</title>
        <style>
          body { font-family: sans-serif; padding: 50px; color: #333; }
          .header { border-bottom: 4px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; background: #f8fafc; padding: 20px; border-radius: 15px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #0891b2; color: white; padding: 12px; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1 style="margin:0; font-size: 28px;">MOVIMENTI CONTABILI</h1><p style="margin:0; color:#666;">Estratto Periodo: ${filtroPeriodo.toUpperCase()}</p></div>
          <div style="text-align:right;"><p style="margin:0; font-weight:bold;">Torre di Controllo</p><p style="margin:0; font-size:12px;">Generato: ${dataCorrente}</p></div>
        </div>
        <div class="summary">
          <div><small>TOTALE ENTRATE</small><p style="color:#15803d; font-size:24px; font-weight:900; margin:0;">€ ${totaleEntrate.toFixed(2)}</p></div>
          <div><small>TOTALE USCITE</small><p style="color:#b91c1c; font-size:24px; font-weight:900; margin:0;">€ ${totaleUscite.toFixed(2)}</p></div>
          <div><small>SALDO NETTO</small><p style="color:#0891b2; font-size:24px; font-weight:900; margin:0;">€ ${saldoNetto.toFixed(2)}</p></div>
        </div>
        <table>
          <thead><tr><th>DATA</th><th>COMPARTO</th><th>DESCRIZIONE</th><th>TIPO</th><th style="text-align:right;">IMPORTO</th></tr></thead>
          <tbody>${righeTabella}</tbody>
        </table>
      </body>
      </html>
    `);
    finestraStampa.document.close();
    finestraStampa.print();
  };

  return (
    <div className="p-8 text-white font-sans w-full max-w-[1400px] mx-auto min-h-screen">
      
      {/* TITOLO MODULO - ACTION BRANDING */}
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-black text-cyan-500 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          MOVIMENTI CONTABILI
        </h2>
        <div className="h-1 w-48 bg-cyan-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* FEEDBACK SUCCESSO */}
      {successo && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-4 rounded-2xl border border-green-400 shadow-2xl z-[100] animate-pulse">
           <span className="font-black uppercase tracking-widest text-sm">✅ {successo}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ========================================== */}
        {/* COLONNA SINISTRA: INPUT E REGISTRAZIONE    */}
        {/* ========================================== */}
        <div className="lg:col-span-4 flex flex-col">
          
          <h3 className="text-2xl font-black text-cyan-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            INSERIMENTO MOVIMENTO
          </h3>

          <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 shadow-2xl">
            <h3 className="font-black text-xs mb-8 uppercase text-cyan-400 tracking-widest border-l-4 border-cyan-500 pl-4">Input Dati Finanziari</h3>
            
            <div className="flex gap-3 mb-6">
              <button type="button" onClick={() => setTipo('entrata')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${tipo === 'entrata' ? 'bg-green-700 text-white shadow-lg' : 'bg-black/50 border border-gray-800 text-gray-600'}`}>ENTRATA</button>
              <button type="button" onClick={() => setTipo('uscita')} className={`flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all ${tipo === 'uscita' ? 'bg-red-700 text-white shadow-lg' : 'bg-black/50 border border-gray-800 text-gray-600'}`}>USCITA</button>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Comparto Strategico</label>
              <select value={comparto} onChange={(e) => setComparto(e.target.value)} className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:border-cyan-500 appearance-none transition-all">
                <option value="Gioco">🎱 GIOCO</option>
                <option value="Bar">☕ BAR / FOOD</option>
                <option value="Servizi">🛠️ SERVIZI / QUOTE</option>
                <option value="Altro">📦 ALTRO / SPESE</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Importo Nominale (€)</label>
              <input type="number" step="0.01" value={importo} onChange={e => setImporto(e.target.value)} className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-3xl text-center text-cyan-400 focus:border-cyan-500" required />
            </div>

            <div className="mb-10">
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Causale Tecnica</label>
              <input type="text" placeholder="Dettaglio operazione..." value={descrizione} onChange={e => setDescrizione(e.target.value)} className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:border-cyan-500" required />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg">
              {loading ? 'Sincronizzazione...' : 'Esegui Registrazione'}
            </button>
          </form>
        </div>

        {/* ========================================== */}
        {/* COLONNA DESTRA: ANALYTICS E STORICO        */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <h3 className="text-2xl font-black text-cyan-400 uppercase tracking-widest mb-0 border-b-2 border-gray-800 pb-3">
            ESTRATTO CONTO
          </h3>
          
          <div className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
            <div className="flex bg-black p-1.5 rounded-2xl border border-gray-800">
              {['oggi', 'mese', 'tutto'].map(p => (
                <button key={p} onClick={() => setFiltroPeriodo(p as any)} className={`px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filtroPeriodo === p ? 'bg-cyan-900 text-cyan-400 shadow-inner' : 'text-gray-600 hover:text-white'}`}>{p}</button>
              ))}
            </div>
            
            <div className="flex gap-10 items-center">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Saldo Netto</p>
                <p className={`text-4xl font-black tabular-nums tracking-tighter ${saldoNetto >= 0 ? 'text-green-500' : 'text-red-500'}`}>€ {saldoNetto.toFixed(2)}</p>
              </div>
              <button onClick={stampaPDF} className="bg-cyan-800/40 hover:bg-cyan-700 border border-cyan-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-3">
                📄 Stampa Report
              </button>
            </div>
          </div>

          <div className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 flex-1 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
               <h3 className="font-black text-xs uppercase text-gray-400 tracking-widest italic">Timeline Transazioni</h3>
               <span className="text-[10px] font-black text-cyan-500 bg-cyan-900/30 px-3 py-1 rounded-full">{transazioniFiltrate.length} Records</span>
            </div>
            
            <div className="space-y-4 overflow-y-auto pr-4 custom-scrollbar flex-1 max-h-[500px]">
              {transazioniFiltrate.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-700 opacity-30">
                  <span className="text-8xl mb-4">📉</span>
                  <p className="font-black text-xl">SILENZIO CONTABILE</p>
                </div>
              ) : (
                transazioniFiltrate.map((t) => (
                  <div key={t.id} className="bg-black/40 p-5 rounded-3xl flex items-center justify-between border border-gray-800/50 hover:border-cyan-900 transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center font-black text-cyan-500 text-[10px] uppercase group-hover:bg-cyan-900 transition-all">
                        {t.comparto?.substring(0, 3) || 'ALT'}
                      </div>
                      <div>
                        <p className="font-black text-gray-200 text-sm tracking-tight uppercase">{t.descrizione}</p>
                        <p className="text-[10px] text-gray-600 font-bold tracking-widest mt-1">
                          {new Date(t.created_at).toLocaleTimeString('it-IT')} | {t.comparto || 'GENERALE'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className={`font-black text-2xl tabular-nums tracking-tighter ${t.tipo === 'entrata' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.tipo === 'entrata' ? '+' : '-'} €{Number(t.importo).toFixed(2)}
                      </span>
                      <button onClick={() => eliminaTransazione(t.id)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-950/20 text-red-500/40 hover:bg-red-900 hover:text-white transition-all opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}