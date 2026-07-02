"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Soci({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [soci, setSoci] = useState<any[]>([]);
  
  // Stati per i campi del form attivi
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [ricerca, setRicerca] = useState('');
  const [successo, setSuccesso] = useState<string | null>(null);
  const [linkCopiato, setLinkCopiato] = useState(false);

  // Stati per la modifica speculare
  const [idInModifica, setIdInModifica] = useState<string | null>(null);
  const [modNome, setModNome] = useState('');
  const [modCognome, setModCognome] = useState('');
  const [modTelefono, setModTelefono] = useState('');
  const [modEmail, setModEmail] = useState('');

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
      app_inviata: false
    }]);

    if (error) {
      alert("ERRORE DI SALVATAGGIO: " + error.message);
    } else {
      setSuccesso(`Socio "${cognome} ${nome}" registrato con successo.`);
      setTimeout(() => setSuccesso(null), 3000);
      
      setNome(''); setCognome(''); setTelefono(''); setEmail('');
      caricaSoci();
    }
    setLoading(false);
  }

  function avviaModifica(socio: any) {
    setIdInModifica(socio.id);
    setModNome(socio.nome || '');
    setModCognome(socio.cognome || '');
    setModTelefono(socio.telefono || '');
    setModEmail(socio.email || '');
  }

  async function salvaModifica(id: string) {
    if (!modNome || !modCognome) return;

    const { error } = await supabase
      .from('soci')
      .update({
        nome: modNome,
        cognome: modCognome,
        telefono: modTelefono,
        email: modEmail
      })
      .eq('id', id);

    if (error) {
      alert("ERRORE: " + error.message);
    } else {
      setSuccesso("Anagrafica aggiornata.");
      setTimeout(() => setSuccesso(null), 3000);
      setIdInModifica(null);
      caricaSoci();
    }
  }

  async function eliminaSocio(id: string) {
    if (confirm("ATTENZIONE: Eliminare definitivamente il socio?")) {
      await supabase.from('soci').delete().eq('id', id);
      caricaSoci();
    }
  }

  async function inviaLinkWhatsApp(socio: any) {
    if (!socio.telefono) {
      alert("ATTENZIONE: Il socio non ha un numero di telefono registrato.");
      return;
    }

    const { error } = await supabase
      .from('soci')
      .update({ app_inviata: true })
      .eq('id', socio.id);

    if (error) {
      alert("ERRORE DI SINCRONIZZAZIONE: " + error.message);
      return;
    }

    // UPDATE: URL corretto puntato al nuovo Hub del Socio
    const urlPubblico = `${window.location.origin}/club/${salaId}`;
    const messaggio = encodeURIComponent(`Ciao ${socio.nome}, ecco il link per accedere all'App del nostro club. Da qui potrai gestire le tue attività in autonomia:\n\n${urlPubblico}`);
    const telefonoPulito = socio.telefono.replace(/[^0-9]/g, '');

    window.open(`https://wa.me/${telefonoPulito}?text=${messaggio}`, '_blank');
    caricaSoci();
  }

  const sociFiltrati = soci.filter(s => {
    const ricercaLower = ricerca.toLowerCase();
    return s.cognome.toLowerCase().includes(ricercaLower) || 
           s.nome.toLowerCase().includes(ricercaLower) ||
           (s.telefono && s.telefono.includes(ricercaLower));
  });

  function copiaLinkPubblico() {
    if (typeof window !== "undefined") {
      // UPDATE: URL corretto puntato al nuovo Hub del Socio
      const urlPubblico = `${window.location.origin}/club/${salaId}`;
      navigator.clipboard.writeText(urlPubblico);
      setLinkCopiato(true);
      setTimeout(() => setLinkCopiato(false), 3000);
    }
  }

  const stampaPDF = () => {
    const finestraStampa = window.open('', '_blank');
    if (!finestraStampa) return;
    const dataCorrente = new Date().toLocaleString('it-IT');
    
    let righeTabella = sociFiltrati.map(s => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; text-transform: uppercase;">${s.cognome} ${s.nome}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${s.telefono || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${s.email || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${s.app_inviata ? 'INVIATA' : 'DA INVIARE'}</td>
      </tr>
    `).join('');

    finestraStampa.document.write(`
      <html>
      <head>
        <title>Registro Soci</title>
        <style>
          body { font-family: sans-serif; padding: 40px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { text-align: left; background: #0c4a26; color: white; padding: 10px; font-size: 12px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <h2>REGISTRO SOCI UFFICIALE</h2>
        <p>Data esportazione: ${dataCorrente}</p>
        <table>
          <thead><tr><th>Nominativo</th><th>Telefono</th><th>Email</th><th>Stato App</th></tr></thead>
          <tbody>${righeTabella}</tbody>
        </table>
        <script>window.onload = function() { window.print(); window.close(); };</script>
      </body>
      </html>
    `);
    finestraStampa.document.close();
  };

  return (
    <div className="min-h-screen bg-[#0a3a1e] p-4 sm:p-8 lg:p-12 flex items-center justify-center font-sans select-none">
      
      {/* NOTIFICA INTERNA */}
      {successo && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-cyan-600 text-white border-2 border-cyan-400 px-8 py-4 rounded-xl shadow-2xl z-[100] font-black uppercase text-sm tracking-widest animate-fade-in">
          ✓ {successo}
        </div>
      )}

      {/* MODALE DI MODIFICA BILANCIATO SU DUE COLONNE */}
      {idInModifica && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f0f0f] border-4 border-zinc-800 p-8 rounded-[2.5rem] w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <h2 className="text-2xl font-black mb-6 uppercase text-white border-b border-zinc-800 pb-3 italic">Modifica Anagrafica</h2>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-1 block mb-1">Nome</label>
                  <input type="text" value={modNome} onChange={e => setModNome(e.target.value)} className="w-full bg-white text-black p-4 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-1 block mb-1">Cognome</label>
                  <input type="text" value={modCognome} onChange={e => setModCognome(e.target.value)} className="w-full bg-white text-black p-4 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-1 block mb-1">Telefono</label>
                  <input type="text" value={modTelefono} onChange={e => setModTelefono(e.target.value)} className="w-full bg-white text-black p-4 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase ml-1 block mb-1">Indirizzo Email</label>
                  <input type="email" value={modEmail} onChange={e => setModEmail(e.target.value)} className="w-full bg-white text-black p-4 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIdInModifica(null)} className="w-1/3 bg-zinc-800 text-zinc-400 hover:text-white py-4 rounded-xl font-bold uppercase text-xs border border-zinc-700 transition-colors">Annulla</button>
              <button onClick={() => salvaModifica(idInModifica)} className="w-2/3 bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-wider border border-cyan-400 shadow-lg">Salva Modifiche</button>
            </div>
          </div>
        </div>
      )}

      {/* STRUTTURA TERMINALE */}
      <div className="w-full max-w-[1550px] bg-black rounded-[2.5rem] p-6 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-4 border-zinc-900/50 flex flex-col">
        
        {/* BARRA SUPERIORE */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-900 pb-6 mb-8 gap-4">
          <div>
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Anagrafica & Comunicazioni</p>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">REGISTRO SOCI</h2>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={() => setActiveView && setActiveView('hub')} className="bg-cyan-600/10 text-cyan-400 hover:bg-cyan-600 hover:text-white px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-cyan-500/30 flex-1 sm:flex-initial text-center">— TORRE DI CONTROLLO</button>
            <button onClick={stampaPDF} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-zinc-800 flex-1 sm:flex-initial text-center">📄 STAMPA REGISTRO</button>
          </div>
        </div>

        {/* INTERFACCIA WEB APP LINK */}
        <div className="mb-8 p-6 rounded-2xl bg-zinc-950/40 border border-cyan-950 flex flex-col md:flex-row justify-between items-center gap-6 shadow-inner">
          <div className="text-left">
            <h4 className="font-black text-sm uppercase tracking-wider text-cyan-500 mb-1">TERMINALE INTERATTIVO APP SOCI</h4>
            <p className="text-xs text-zinc-500 font-medium max-w-4xl">Distribuisci l'App Web ai membri del club. Ciascun utente tesserato potrà monitorare i propri record, iscriversi ai tornei in tabellone e prenotare i biliardi direttamente in autonomia.</p>
          </div>
          <button onClick={copiaLinkPubblico} className="w-full md:w-auto bg-white hover:bg-zinc-200 text-black px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap shadow-md">
            {linkCopiato ? '✓ COPIATO!' : '📋 COPIA LINK APP SOCI'}
          </button>
        </div>

        {/* CONTENUTO DIVISO IN DUE SEZIONI */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* GRIGLIA DATI E FILTRI (SINISTRA) */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-900">
              <div className="w-full md:w-2/3 relative">
                <input 
                  type="text" 
                  placeholder="Ricerca per nome, cognome o telefono..." 
                  value={ricerca} 
                  onChange={(e) => setRicerca(e.target.value)}
                  className="w-full bg-white text-black pl-5 pr-4 py-3.5 rounded-xl font-bold text-sm outline-none placeholder-zinc-400"
                />
              </div>
              <div className="flex gap-3 w-full md:w-auto justify-end">
                <div className="bg-zinc-900/50 border border-zinc-800 px-5 py-2.5 rounded-xl text-center min-w-[120px]">
                  <p className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">TOTALE ISCRITTI</p>
                  <p className="text-xl font-black text-white tabular-nums">{sociFiltrati.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/40 rounded-2xl border border-zinc-900 overflow-hidden min-h-[450px]">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] text-cyan-500 font-black uppercase tracking-widest bg-zinc-950/50">
                      <th className="py-4 px-5">NOMINATIVO</th>
                      <th className="py-4 px-5">TELEFONO</th>
                      <th className="py-4 px-5">EMAIL</th>
                      <th className="py-4 px-5 text-center">APP AVVIATA</th>
                      <th className="py-4 px-5 text-center">AZIONI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60">
                    {sociFiltrati.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-900/30 transition-colors group">
                        <td className="py-4 px-5 font-black text-white text-sm uppercase tracking-wide">{s.cognome} {s.nome}</td>
                        <td className="py-4 px-5 text-zinc-400 text-sm font-medium">{s.telefono || '—'}</td>
                        <td className="py-4 px-5 text-zinc-400 text-sm">{s.email || '—'}</td>
                        <td className="py-4 px-5 text-center">
                          {s.app_inviata ? (
                            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-900/60 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wide">
                              Inviato ✓
                            </span>
                          ) : (
                            <button 
                              onClick={() => inviaLinkWhatsApp(s)}
                              className="bg-zinc-900 hover:bg-emerald-600 text-emerald-500 hover:text-white p-2 rounded-xl inline-flex items-center justify-center transition-all border border-zinc-800 hover:border-emerald-500 shadow-md"
                              title="Invia credenziali tramite WhatsApp"
                            >
                              <span className="text-xs px-1">📱 Invia Link</span>
                            </button>
                          )}
                        </td>
                        <td className="py-4 px-5 text-center space-x-3 whitespace-nowrap">
                          <button onClick={() => avviaModifica(s)} className="text-base grayscale opacity-40 group-hover:opacity-100 hover:opacity-100 transition-opacity" title="Modifica">✏️</button>
                          <button onClick={() => eliminaSocio(s.id)} className="text-base grayscale opacity-40 group-hover:opacity-100 hover:opacity-100 transition-opacity" title="Elimina">🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {sociFiltrati.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-32 text-center text-zinc-600">
                          <p className="font-black text-xs uppercase tracking-widest">Nessun record in elenco</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* FORM ISCRIZIONE COMPATTO AD ALTA EFFICIENZA (DESTRA) */}
          <div className="xl:col-span-4">
            <form 
              onSubmit={gestisciSubmit} 
              noValidate 
              className="bg-zinc-950/40 p-6 rounded-2xl border border-zinc-900 flex flex-col shadow-inner"
            >
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 border-b border-zinc-900 pb-2 italic">NUOVA ISCRIZIONE</h3>
              
              {/* RIGA 1: NOME / COGNOME */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1 ml-1">NOME</label>
                  <input type="text" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-white text-black p-3 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" required />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1 ml-1">COGNOME</label>
                  <input type="text" value={cognome} onChange={e => setCognome(e.target.value)} className="w-full bg-white text-black p-3 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" required />
                </div>
              </div>

              {/* RIGA 2: TELEFONO / EMAIL */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1 ml-1">TELEFONO</label>
                  <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full bg-white text-black p-3 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block mb-1 ml-1">EMAIL</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white text-black p-3 rounded-xl font-bold text-sm outline-none border border-zinc-300 focus:border-cyan-500" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-md border border-cyan-400"
              >
                {loading ? 'SALVATAGGIO...' : 'SALVA SOCIO'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}