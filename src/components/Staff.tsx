"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Staff({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);

  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modEmail, setModEmail] = useState('');
  const [modPin, setModPin] = useState('');

  useEffect(() => {
    caricaStaff();
  }, [salaId]);

  async function caricaStaff() {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('sala_id', salaId)
      .order('nome', { ascending: true });
      
    if (error) {
      alert("ERRORE LETTURA DATABASE: " + error.message);
    } else if (data) {
      setStaff(data);
    }
  }

  async function gestisciSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email || !pin) return;
    
    setLoading(true);
    
    const { error } = await supabase.from('staff').insert([{
      sala_id: salaId,
      nome,
      email,
      pin
    }]);

    if (error) {
      alert("ERRORE DI SALVATAGGIO: " + error.message);
    } else {
      setSuccesso(`OPERATORE "${nome}" REGISTRATO!`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNome(''); setEmail(''); setPin('');
      caricaStaff();
    }
    setLoading(false);
  }

  function avviaModifica(membro: any) {
    setIdInModifica(membro.id);
    setModNome(membro.nome);
    setModEmail(membro.email);
    setModPin(membro.pin);
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modEmail || !modPin) return;

    const { error } = await supabase
      .from('staff')
      .update({
        nome: modNome,
        email: modEmail,
        pin: modPin
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE DURANTE LA MODIFICA: " + error.message);
    } else {
      setSuccesso("DATI OPERATORE AGGIORNATI!");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaStaff();
    }
  }

  async function eliminaMembro(id: string) {
    if (confirm("ATTENZIONE: Revocare l'accesso ed eliminare questo operatore?")) {
      await supabase.from('staff').delete().eq('id', id);
      caricaStaff();
    }
  }

  const staffFiltrato = staff.filter(s => 
    s.nome.toLowerCase().includes(ricerca.toLowerCase()) || 
    s.email.toLowerCase().includes(ricerca.toLowerCase())
  );

  // FUNZIONE DI STAMPA PDF
  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = staffFiltrato.map(s => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; font-weight: bold; text-transform: uppercase;">${s.nome}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; color: #555;">${s.email}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; font-family: monospace; font-weight: bold; text-align: center; letter-spacing: 2px;">${s.pin}</td>
      </tr>
    `).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Organico Staff</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #111; }
          .header { border-bottom: 4px solid #059669; padding-bottom: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end;}
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #059669; color: white; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          td { font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><h1 style="margin:0; color:#064e3b; text-transform: uppercase;">Organico Operatori</h1><p style="margin:5px 0 0 0; font-size:12px; font-weight:bold; color: #666;">Estratto al: ${dataCorrente}</p></div>
        </div>
        <table>
          <thead><tr><th>Nominativo</th><th>Email</th><th style="text-align: center;">PIN Operativo</th></tr></thead>
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
        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 bg-white border-4 border-emerald-600 text-emerald-700 px-10 py-5 rounded-2xl shadow-2xl z-[100] animate-bounce font-black uppercase tracking-widest text-xl">
          ✓ {successo}
        </div>
      )}

      {/* POPUP MODIFICA OPERATORE */}
      {idInModifica && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-4 border-white p-8 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(255,255,255,0.2)]">
            <h2 className="text-3xl font-black mb-8 uppercase text-center text-white border-b-2 border-gray-600 pb-4">Modifica Operatore</h2>
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Nominativo</label>
                <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-xl outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Email (Accesso)</label>
                <input type="email" value={modEmail} onChange={e => setModEmail(e.target.value)} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-xl outline-none focus:border-cyan-500" />
              </div>
              <div>
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Pin Cassa</label>
                <input type="text" value={modPin} onChange={e => setModPin(e.target.value)} maxLength={6} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-2xl tracking-[0.5em] text-center outline-none focus:border-cyan-500" />
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
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Pannello di Controllo</p>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">ORGANICO STAFF</h2>
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
              📄 Stampa Elenco
            </button>
          </div>
        </div>

        {/* LAYOUT A COLONNE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLONNA SINISTRA: ELENCO E RICERCA */}
          <div className="lg:col-span-8 flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">Elenco Autorizzati</h3>

            <div className="flex flex-col gap-8">
              
              {/* BARRA DI RICERCA */}
              <div className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="w-full md:w-2/3 relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
                  <input 
                    type="text" placeholder="Ricerca operatore..." value={ricerca} onChange={(e) => setRicerca(e.target.value)}
                    className="w-full bg-gray-100 border-2 border-gray-400 p-5 pl-14 rounded-xl text-black font-black text-xl outline-none focus:border-cyan-500 placeholder-gray-500"
                  />
                </div>
                <div className="text-center w-full md:w-1/3 bg-gray-900 py-4 rounded-xl border-2 border-gray-700">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Totale Staff</p>
                  <p className="text-4xl font-black text-white tabular-nums">{staffFiltrato.length}</p>
                </div>
              </div>

              {/* TABELLA OPERATORI */}
              <div className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex-1 overflow-hidden flex flex-col min-h-[500px]">
                <div className="overflow-x-auto h-full max-h-[600px] pr-2">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-black z-10">
                      <tr className="border-b-2 border-gray-600">
                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500">Nominativo</th>
                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500">Email</th>
                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-center">PIN</th>
                        <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-cyan-500 text-center">Azioni</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {staffFiltrato.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-900 transition-colors group">
                          <td className="py-6 px-4 font-black text-white text-xl uppercase">{s.nome}</td>
                          <td className="py-6 px-4 text-gray-400 font-bold text-lg">{s.email}</td>
                          <td className="py-6 px-4 text-center">
                            <span className="text-black bg-gray-100 font-black tracking-[0.3em] text-lg px-4 py-2 rounded-lg border-2 border-gray-400 shadow-inner">
                              {s.pin}
                            </span>
                          </td>
                          <td className="py-6 px-4 text-center space-x-4">
                            <button onClick={() => avviaModifica(s)} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title="Modifica">✏️</button>
                            <button onClick={() => eliminaMembro(s.id)} className="text-2xl opacity-50 hover:opacity-100 transition-opacity" title="Elimina">🗑️</button>
                          </td>
                        </tr>
                      ))}
                      {staffFiltrato.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest">Nessun operatore trovato</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* COLONNA DESTRA: NUOVO OPERATORE */}
          <div className="lg:col-span-4 flex flex-col">
            <h3 className="text-2xl font-black text-white uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">Nuovo Accesso</h3>
            
            <form onSubmit={gestisciSubmit} className="p-8 rounded-[2rem] bg-black border-[3px] border-gray-400 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Nominativo</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Mario Rossi" className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-xl outline-none focus:border-cyan-500 placeholder-gray-400" required />
              </div>
              
              <div className="mb-6">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Email (Login)</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mario@sala.it" className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-xl outline-none focus:border-cyan-500 placeholder-gray-400" required />
              </div>

              <div className="mb-10">
                <label className="text-gray-400 font-black uppercase text-xs tracking-widest ml-2 mb-1 block">Codice PIN Cassa</label>
                <input type="text" value={pin} onChange={e => setPin(e.target.value)} placeholder="1234" maxLength={6} className="w-full bg-gray-100 border-2 border-gray-400 p-5 rounded-xl text-black font-black text-3xl text-center tracking-[0.5em] outline-none focus:border-cyan-500 placeholder-gray-300" required />
              </div>

              <button disabled={loading} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] border-2 border-emerald-400 disabled:opacity-50">
                {loading ? 'Attendere...' : 'Crea Operatore'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}