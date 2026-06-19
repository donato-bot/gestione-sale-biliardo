"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Tariffe({ salaId }: { salaId: string }) {
  const [tariffe, setTariffe] = useState<any[]>([]);
  const [nomeTariffa, setNomeTariffa] = useState('');
  const [tariffaOraria, setTariffaOraria] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);

  // STATI PER LA MODIFICA IN LINEA
  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modTariffa, setModTariffa] = useState('');
  const [modNote, setModNote] = useState('');

  useEffect(() => {
    caricaTariffe();
  }, [salaId]);

  async function caricaTariffe() {
    const { data, error } = await supabase
      .from('tariffe')
      .select('*')
      .eq('sala_id', salaId)
      .order('nome_tariffa', { ascending: true });
      
    if (error) {
      alert("ERRORE LETTURA DATABASE: " + error.message);
    } else if (data) {
      setTariffe(data);
    }
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeTariffa || !tariffaOraria) return;
    
    setLoading(true);
    
    const { error } = await supabase.from('tariffe').insert([{
      sala_id: salaId,
      nome_tariffa: nomeTariffa,
      tariffa_oraria: parseFloat(tariffaOraria.replace(',', '.')),
      note
    }]);

    if (error) {
      alert("ERRORE DI SALVATAGGIO: " + error.message);
    } else {
      setSuccesso(`Tariffa "${nomeTariffa}" registrata a listino.`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNomeTariffa('');
      setTariffaOraria('');
      setNote('');
      caricaTariffe();
    }
    setLoading(false);
  }

  function avviaModifica(tariffa: any) {
    setIdInModifica(tariffa.id);
    setModNome(tariffa.nome_tariffa);
    setModTariffa(tariffa.tariffa_oraria.toString());
    setModNote(tariffa.note || '');
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modTariffa) return;

    const { error } = await supabase
      .from('tariffe')
      .update({
        nome_tariffa: modNome,
        tariffa_oraria: parseFloat(modTariffa.replace(',', '.')),
        note: modNote
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setSuccesso("Tariffa aggiornata con successo.");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaTariffe();
    }
  }

  async function eliminaTariffa(id: string) {
    if (confirm("ATTENZIONE: Sei sicuro di voler eliminare questa tariffa dal listino prezzi?")) {
      await supabase.from('tariffe').delete().eq('id', id);
      caricaTariffe();
    }
  }

  const tariffeFiltrate = tariffe.filter(t => 
    t.nome_tariffa.toLowerCase().includes(ricerca.toLowerCase())
  );

  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = tariffeFiltrate.map(t => `
      <tr>
        <td style="padding: 15px 10px; border-bottom: 1px solid #eee; font-weight: 900; font-size: 14px; text-transform: uppercase;">${t.nome_tariffa}</td>
        <td style="padding: 15px 10px; border-bottom: 1px solid #eee; font-style: italic; color: #666;">${t.note || '-'}</td>
        <td style="padding: 15px 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: 900; font-size: 16px; color: #b45309;">€ ${Number(t.tariffa_oraria).toFixed(2)} / h</td>
      </tr>
    `).join('');

    if (tariffeFiltrate.length === 0) {
      righeTabella = `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #9ca3af; font-style: italic;">Nessuna voce a listino.</td></tr>`;
    }

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Listino Prezzi - Torre di Controllo</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid #f59e0b; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
          .title { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; color: #d97706;}
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #f59e0b; color: white; padding: 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">Listino Ufficiale Tariffe</h1>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px; font-weight: bold;">Valido per il Club / Sala Biliardi</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0; font-weight:bold; font-size: 12px;">Data di Stampa: ${dataCorrente}</p>
          </div>
        </div>
        <table>
          <thead><tr><th style="width: 40%;">Specialità / Servizio</th><th style="width: 40%;">Condizioni</th><th style="width: 20%; text-align: right;">Quota Oraria</th></tr></thead>
          <tbody>${righeTabella}</tbody>
        </table>
        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
          Documento generato dal sistema gestionale Torre di Controllo
        </div>
        <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
      </body>
      </html>
    `);
    finestraStampa.document.close();
  };

  return (
    <div className="p-8 text-white font-sans w-full max-w-[1400px] mx-auto min-h-screen">
      
      {/* TITOLO MODULO PRINCIPALE */}
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-black text-amber-500 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          TARIFFE BILIARDI
        </h2>
        <div className="h-1 w-48 bg-amber-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* FEEDBACK SUCCESSO */}
      {successo && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-4 rounded-2xl border border-green-400 shadow-2xl z-[100]">
           <span className="font-black uppercase tracking-widest text-sm">✅ {successo}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ========================================== */}
        {/* COLONNA SINISTRA: NUOVA TARIFFA            */}
        {/* ========================================== */}
        <div className="lg:col-span-4 flex flex-col">
          
          <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            NUOVA VOCE LISTINO
          </h3>

          <div className="space-y-8">
            <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 shadow-2xl">
              
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Nome Tariffa / Specialità</label>
                <input 
                  type="text" value={nomeTariffa} onChange={e => setNomeTariffa(e.target.value)}
                  placeholder="Es. Internazionale, Goriziana..."
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-amber-500" 
                  required 
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Costo Orario (€/Ora)</label>
                <input 
                  type="number" step="0.01" value={tariffaOraria} onChange={e => setTariffaOraria(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-3xl text-center text-amber-400 focus:outline-none focus:border-amber-500" 
                  required 
                />
              </div>

              <div className="mb-10">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Note e Condizioni</label>
                <textarea 
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Es. Tariffa feriale o riservata soci..."
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white h-28 resize-none focus:outline-none focus:border-amber-500" 
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                {loading ? 'Elaborazione...' : 'Aggiungi al Listino'}
              </button>
            </form>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLONNA DESTRA: ELENCO TARIFFE             */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col">
          
          <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            LISTINO UFFICIALE
          </h3>

          <div className="flex flex-col gap-8">
            {/* BARRA CONTROLLO */}
            <div className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
              <div className="w-full md:w-2/3 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                <input 
                  type="text" placeholder="Ricerca tariffa..." value={ricerca} onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-black pl-12 pr-5 py-4 rounded-2xl border border-gray-800 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Voci Attive</p>
                  <p className="text-2xl font-black text-amber-500 tabular-nums">{tariffeFiltrate.length}</p>
                </div>
                
                <button onClick={stampaPDF} className="ml-4 bg-amber-800/40 hover:bg-amber-700 border border-amber-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-3">
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
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500">Specialità</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500">Condizioni</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">Quota Oraria</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {tariffeFiltrate.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-gray-700 opacity-50">
                          <span className="text-6xl block mb-4">💰</span>
                          <p className="font-black text-lg uppercase tracking-widest">Listino Prezzi Vuoto</p>
                        </td>
                      </tr>
                    ) : (
                      tariffeFiltrate.map((t) => {
                        
                        if (idInModifica === t.id) {
                          return (
                            <tr key={t.id} className="bg-amber-950/20 border-b border-amber-800/50">
                              <td className="py-3 px-2">
                                <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-amber-500" />
                              </td>
                              <td className="py-3 px-2">
                                <input type="text" value={modNote} onChange={e => setModNote(e.target.value)} placeholder="Note..." className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-mono outline-none focus:border-amber-500" />
                              </td>
                              <td className="py-3 px-2 text-center">
                                <input type="number" step="0.01" value={modTariffa} onChange={e => setModTariffa(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-24 text-center text-amber-400 font-black outline-none focus:border-amber-500" />
                              </td>
                              <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
                                <button onClick={() => salvaModifica(t.id)} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Salva</button>
                                <button onClick={() => setIdInModifica(null)} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Annulla</button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={t.id} className="hover:bg-gray-900/30 transition-colors group">
                            <td className="py-5 px-4 font-black text-white text-lg uppercase tracking-wide">{t.nome_tariffa}</td>
                            <td className="py-5 px-4 text-gray-500 text-sm italic">{t.note || '-'}</td>
                            <td className="py-5 px-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-amber-500 tabular-nums tracking-tighter">
                                  € {Number(t.tariffa_oraria).toFixed(2)} <span className="text-sm text-gray-600 font-normal">/h</span>
                                </span>
                                <span className="text-[10px] text-gray-600 font-mono mt-1">
                                  (€ {(Number(t.tariffa_oraria) / 60).toFixed(4)}/min)
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-4 text-center space-x-3">
                              <button 
                                onClick={() => avviaModifica(t)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-amber-950/20 text-amber-500/40 hover:bg-amber-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Modifica Tariffa"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => eliminaTariffa(t.id)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-red-950/20 text-red-500/40 hover:bg-red-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Elimina Tariffa"
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