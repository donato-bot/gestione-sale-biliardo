"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Staff({ salaId }: { salaId: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);

  // STATI PER LA MODIFICA IN LINEA
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
      setSuccesso(`Membro Staff "${nome}" registrato con successo.`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNome('');
      setEmail('');
      setPin('');
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
      setSuccesso("Dati operatore aggiornati.");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaStaff();
    }
  }

  async function eliminaMembro(id: string) {
    if (confirm("ATTENZIONE: Sei sicuro di voler revocare l'accesso ed eliminare questo operatore?")) {
      await supabase.from('staff').delete().eq('id', id);
      caricaStaff();
    }
  }

  const staffFiltrato = staff.filter(s => 
    s.nome.toLowerCase().includes(ricerca.toLowerCase()) || 
    s.email.toLowerCase().includes(ricerca.toLowerCase())
  );

  return (
    <div className="p-8 text-white font-sans w-full max-w-[1400px] mx-auto min-h-screen">
      
      {/* TITOLO MODULO PRINCIPALE */}
      <div className="mb-12 text-center">
        <h2 className="text-6xl font-black text-amber-500 uppercase tracking-tighter italic drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
          ORGANICO STAFF
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
        {/* COLONNA SINISTRA: NUOVO INSERIMENTO        */}
        {/* ========================================== */}
        <div className="lg:col-span-4 flex flex-col">
          
          <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            NUOVO OPERATORE
          </h3>

          <div className="space-y-8">
            <form onSubmit={gestisciSubmit} className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 shadow-2xl">
              
              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Nominativo</label>
                <input 
                  type="text" value={nome} onChange={e => setNome(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-amber-500" 
                  required 
                />
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Indirizzo Email</label>
                <input 
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="mario@email.com"
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-amber-500" 
                  required 
                />
              </div>

              <div className="mb-10">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">PIN di Accesso Operativo</label>
                <input 
                  type="text" value={pin} onChange={e => setPin(e.target.value)}
                  placeholder="Es. 1234"
                  maxLength={6}
                  className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-2xl text-center tracking-[1em] text-amber-400 focus:outline-none focus:border-amber-500" 
                  required 
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg"
              >
                {loading ? 'Elaborazione...' : 'Crea Accesso'}
              </button>
            </form>
          </div>
        </div>

        {/* ========================================== */}
        {/* COLONNA DESTRA: REGISTRO STAFF             */}
        {/* ========================================== */}
        <div className="lg:col-span-8 flex flex-col">
          
          <h3 className="text-2xl font-black text-amber-400 uppercase tracking-widest mb-6 border-b-2 border-gray-800 pb-3">
            ELENCO AUTORIZZATI
          </h3>

          <div className="flex flex-col gap-8">
            {/* BARRA CONTROLLO */}
            <div className="bg-[#11131a] p-8 rounded-[40px] border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
              <div className="w-full md:w-2/3 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                <input 
                  type="text" placeholder="Ricerca operatore per nome o email..." value={ricerca} onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-black pl-12 pr-5 py-4 rounded-2xl border border-gray-800 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div className="flex gap-6 items-center">
                <div className="text-center">
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Totale Staff</p>
                  <p className="text-2xl font-black text-amber-500 tabular-nums">{staffFiltrato.length}</p>
                </div>
              </div>
            </div>

            {/* REGISTRO TABELLARE */}
            <div className="bg-[#11131a] p-6 rounded-[40px] border border-gray-800 flex-1 shadow-2xl overflow-hidden flex flex-col">
              <div className="overflow-x-auto h-full max-h-[600px] custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-[#11131a] z-10">
                    <tr className="border-b border-gray-800">
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500">Nominativo</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500">Email Recapito</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">PIN Assegnato</th>
                      <th className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {staffFiltrato.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-gray-700 opacity-50">
                          <span className="text-6xl block mb-4">🧑‍🍳</span>
                          <p className="font-black text-lg uppercase tracking-widest">Nessun Operatore Autorizzato</p>
                        </td>
                      </tr>
                    ) : (
                      staffFiltrato.map((s) => {
                        if (idInModifica === s.id) {
                          return (
                            <tr key={s.id} className="bg-amber-950/20 border-b border-amber-800/50">
                              <td className="py-3 px-2">
                                <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-bold outline-none focus:border-amber-500" />
                              </td>
                              <td className="py-3 px-2">
                                <input type="email" value={modEmail} onChange={e => setModEmail(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-full text-white font-mono outline-none focus:border-amber-500" />
                              </td>
                              <td className="py-3 px-2 text-center">
                                <input type="text" value={modPin} onChange={e => setModPin(e.target.value)} className="bg-black border border-gray-700 p-3 rounded-xl text-sm w-24 text-center tracking-widest text-amber-400 font-black outline-none focus:border-amber-500" />
                              </td>
                              <td className="py-3 px-2 text-center space-x-2 whitespace-nowrap">
                                <button onClick={() => salvaModifica(s.id)} className="bg-green-700 hover:bg-green-600 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Salva</button>
                                <button onClick={() => setIdInModifica(null)} className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest">Annulla</button>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={s.id} className="hover:bg-gray-900/30 transition-colors group">
                            <td className="py-4 px-4 font-bold text-white text-lg">{s.nome}</td>
                            <td className="py-4 px-4 text-gray-400 font-mono text-sm">{s.email}</td>
                            <td className="py-4 px-4 text-center">
                              <span className="text-amber-400 font-black tracking-[0.5em] text-sm bg-amber-950/30 px-4 py-2 rounded-lg border border-amber-900/50">
                                {s.pin}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center space-x-3">
                              <button 
                                onClick={() => avviaModifica(s)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-amber-950/20 text-amber-500/40 hover:bg-amber-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Modifica Dati Operatore"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => eliminaMembro(s.id)} 
                                className="w-8 h-8 inline-flex items-center justify-center rounded-xl bg-red-950/20 text-red-500/40 hover:bg-red-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                title="Revoca Accesso (Elimina)"
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