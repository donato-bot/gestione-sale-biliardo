"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Magazzino({ salaId }: { salaId: string }) {
  const [articoli, setArticoli] = useState<any[]>([]);
  const [nomeArticolo, setNomeArticolo] = useState('');
  const [categoria, setCategoria] = useState('Bar');
  const [quantita, setQuantita] = useState('');
  const [prezzoVendita, setPrezzoVendita] = useState('');
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);

  // STATI PER LA MODIFICA IN LINEA
  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modCategoria, setModCategoria] = useState('Bar');
  const [modQuantita, setModQuantita] = useState('');
  const [modPrezzo, setModPrezzo] = useState('');

  // STATO PER FILTRO SOTTO SCORTA
  const [filtroSottoScorta, setFiltroSottoScorta] = useState(false);

  useEffect(() => {
    caricaArticoli();
  }, [salaId]);

  async function caricaArticoli() {
    const { data, error } = await supabase
      .from('magazzino')
      .select('*')
      .eq('sala_id', salaId)
      .order('nome_articolo', { ascending: true });
      
    if (error) {
      alert("ERRORE LETTURA DATABASE: " + error.message);
    } else if (data) {
      setArticoli(data);
    }
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nomeArticolo || !quantita || !prezzoVendita) return;
    
    setLoading(true);
    
    const { error } = await supabase.from('magazzino').insert([{
      sala_id: salaId,
      nome_articolo: nomeArticolo,
      categoria,
      quantita: parseInt(quantita),
      prezzo_vendita: parseFloat(prezzoVendita.replace(',', '.'))
    }]);

    if (error) {
      alert("ERRORE DI SALVATAGGIO: " + error.message);
    } else {
      setSuccesso(`Articolo "${nomeArticolo}" registrato a magazzino.`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNomeArticolo('');
      setQuantita('');
      setPrezzoVendita('');
      setCategoria('Bar');
      caricaArticoli();
    }
    setLoading(false);
  }

  function avviaModifica(articolo: any) {
    setIdInModifica(articolo.id);
    setModNome(articolo.nome_articolo);
    setModCategoria(articolo.categoria);
    setModQuantita(articolo.quantita.toString());
    setModPrezzo(articolo.prezzo_vendita.toString());
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modQuantita || !modPrezzo) return;

    const { error } = await supabase
      .from('magazzino')
      .update({
        nome_articolo: modNome,
        categoria: modCategoria,
        quantita: parseInt(modQuantita),
        prezzo_vendita: parseFloat(modPrezzo.replace(',', '.'))
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setSuccesso("Articolo aggiornato con successo.");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaArticoli();
    }
  }

  async function eliminaArticolo(id: string) {
    if (confirm("ATTENZIONE: Sei sicuro di voler eliminare definitivamente questo articolo dalla distinta base?")) {
      await supabase.from('magazzino').delete().eq('id', id);
      caricaArticoli();
    }
  }

  const articoliFiltrati = articoli.filter(a => {
    const corrispondeRicerca = a.nome_articolo.toLowerCase().includes(ricerca.toLowerCase()) ||
                              a.categoria.toLowerCase().includes(ricerca.toLowerCase());
    
    const corrispondeScorta = filtroSottoScorta ? a.quantita <= 5 : true;

    return corrispondeRicerca && corrispondeScorta;
  });

  const totaleArticoliSottoScorta = articoli.filter(a => a.quantita <= 5).length;

  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = articoliFiltrati.map(a => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 800;">${a.nome_articolo}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #0891b2; font-weight: bold; text-transform: uppercase; font-size: 10px;">${a.categoria}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold; font-family: monospace; font-size: 14px; color: ${a.quantita <= 5 ? '#b91c1c' : '#15803d'};">
          ${a.quantita} pz ${a.quantita <= 5 ? '⚠️' : ''}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">€ ${Number(a.prezzo_vendita).toFixed(2)}</td>
      </tr>
    `).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Inventario Magazzino - Torre di Controllo</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 4px solid #0891b2; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; background: #0891b2; color: white; padding: 10px; font-size: 10px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1>Inventario Magazzino ${filtroSottoScorta ? '[SOLO SOTTO SCORTA]' : ''}</h1></div>
          <div><p>Data: ${dataCorrente}</p></div>
        </div>
        <table>
          <thead><tr><th>Nome Articolo</th><th>Reparto</th><th style="text-align:center;">Giacenza</th><th style="text-align:right;">Prezzo Unit.</th></tr></thead>
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
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-black text-cyan-500 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          GIACENZE MAGAZZINO
        </h2>
        <div className="h-1 w-48 bg-cyan-500 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* FEEDBACK SUCCESSO */}
      {successo && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-green-600 px-10 py-4 rounded-2xl border border-green-400 shadow-2xl z-[100]">
           <span className="font-black uppercase tracking-widest text-sm">✅ {successo}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ========================================== */}
        {/* COLONNA SINISTRA: INSERIMENTO ARTICOLI     */}
        {/* ========================================== */}
        <div className="lg:col-span-4 flex flex-col">
          
          {/* TITOLAZIONE SEZIONE SINISTRA */}
          <h3 className="text-2xl font-black text-cyan-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            INSERIMENTO ARTICOLI
          </h3>

          <div className="space-y-8">
            <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 shadow-2xl">
              
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Nome Articolo</label>
                <input 
                  type="text" value={nomeArticolo} onChange={e => setNomeArticolo(e.target.value)}
                  placeholder="Es. Stecca Fibra, Coca Cola..."
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-cyan-500" 
                  required 
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Reparto / Categoria</label>
                <select 
                  value={categoria} onChange={e => setCategoria(e.target.value)}
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-cyan-500 appearance-none"
                >
                  <option value="Bar">☕ Reparto Bar / Snack</option>
                  <option value="Tecnico">🎱 Materiale Tecnico Sala</option>
                  <option value="Altro">📦 Altro / Vario</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Scorta Iniziale</label>
                  <input 
                    type="number" value={quantita} onChange={e => setQuantita(e.target.value)}
                    placeholder="0" min="0"
                    className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-2xl text-center text-cyan-400 focus:outline-none focus:border-cyan-500" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Prezzo (€)</label>
                  <input 
                    type="number" step="0.01" value={prezzoVendita} onChange={e => setPrezzoVendita(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-2xl text-center text-green-500 focus:outline-none focus:border-cyan-500" 
                    required 
                  />
                </div>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                {loading ? 'Elaborazione...' : 'Inserisci in Distinta'}
              </button>
            </form>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLONNA DESTRA: ELENCO ARTICOLI            */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col">
          
          {/* TITOLAZIONE SEZIONE DESTRA */}
          <h3 className="text-2xl font-black text-cyan-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            ELENCO ARTICOLI
          </h3>

          <div className="flex flex-col gap-8">
            {/* BARRA CONTROLLO E FILTRI */}
            <div className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
              <div className="w-full md:w-1/2 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                <input 
                  type="text" placeholder="Ricerca per nome o reparto..." value={ricerca} onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-black pl-12 pr-5 py-4 rounded-2xl border border-gray-800 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Referenze</p>
                  <p className="text-2xl font-black text-cyan-500 tabular-nums">{articoliFiltrati.length}</p>
                </div>

                <button 
                  type="button"
                  onClick={() => setFiltroSottoScorta(!filtroSottoScorta)}
                  className={`text-center border px-6 py-2 rounded-2xl transition-all active:scale-95 ${filtroSottoScorta ? 'bg-red-950/40 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-gray-800 hover:border-red-900'}`}
                >
                  <p className="text-[10px] text-red-500/80 font-black uppercase tracking-widest">Sotto Scorta</p>
                  <p className={`text-2xl font-black tabular-nums ${totaleArticoliSottoScorta > 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {totaleArticoliSottoScorta} {filtroSottoScorta ? '⏳' : ''}
                  </p>
                </button>

                <button onClick={stampaPDF} className="bg-cyan-800/40 hover:bg-cyan-700 border border-cyan-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-3">
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
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500">Articolo</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500">Reparto</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-center">Giacenza</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-right">Listino</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {articoliFiltrati.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-gray-700 opacity-50">
                          <span className="text-6xl block mb-4">📦</span>
                          <p className="font-black text-lg uppercase tracking-widest">Nessuna Referenza Trovata</p>
                        </td>
                      </tr>
                    ) : (
                      articoliFiltrati.map((a) => {
                        const sottoScorta = a.quantita <= 5;
                        
                        if (idInModifica === a.id) {
                          return (
                            <tr key={a.id} className="bg-cyan-950/20 border-b border-cyan-800/50">
                              <td className="py-3 px-2">
                                <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-cyan-500" />
                              </td>
                              <td className="py-3 px-2">
                                <select value={modCategoria} onChange={e => setModCategoria(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm text-white font-bold outline-none focus:border-cyan-500">
                                  <option value="Bar">Bar</option>
                                  <option value="Tecnico">Tecnico</option>
                                  <option value="Altro">Altro</option>
                                </select>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <input type="number" value={modQuantita} onChange={e => setModQuantita(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-20 text-center text-white font-black outline-none focus:border-cyan-500" />
                              </td>
                              <td className="py-3 px-2 text-right">
                                <input type="text" value={modPrezzo} onChange={e => setModPrezzo(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-24 text-right text-green-400 font-black outline-none focus:border-cyan-500" />
                              </td>
                              <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
                                <button onClick={() => salvaModifica(a.id)} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Salva</button>
                                <button onClick={() => setIdInModifica(null)} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Annulla</button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={a.id} className={`hover:bg-gray-900/30 transition-colors group ${sottoScorta ? 'bg-red-950/10' : ''}`}>
                            <td className="py-4 px-4 font-bold text-white">{a.nome_articolo}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${a.categoria === 'Bar' ? 'bg-amber-950/40 text-amber-500' : a.categoria === 'Tecnico' ? 'bg-cyan-950/40 text-cyan-500' : 'bg-gray-800 text-gray-400'}`}>
                                {a.categoria}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`text-xl font-black tabular-nums tracking-tighter ${sottoScorta ? 'text-red-500 font-extrabold' : 'text-gray-300'}`}>
                                {a.quantita} <span className="text-xs text-gray-600 font-normal">pz</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <span className="text-lg font-black text-green-500 tabular-nums tracking-tighter">
                                € {Number(a.prezzo_vendita).toFixed(2)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center space-x-3">
                              <button 
                                onClick={() => avviaModifica(a)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-cyan-950/20 text-cyan-500/40 hover:bg-cyan-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Modifica Articolo"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => eliminaArticolo(a.id)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-red-950/20 text-red-500/40 hover:bg-red-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Elimina Articolo"
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