"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminDashboard() {
  const [sale, setSale] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Stati per il Varo del Nuovo Club
  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovaEmail, setNuovaEmail] = useState("");
  const [nuovaPass, setNuovaPass] = useState("");
  const [loadingVaro, setLoadingVaro] = useState(false);

  // Stati per la Ricevuta Amministrativa
  const [ricevutaModal, setRicevutaModal] = useState<any>(null);
  const [importoRicevuta, setImportoRicevuta] = useState("50.00");
  const [numeroRicevuta, setNumeroRicevuta] = useState("");

  useEffect(() => {
    caricaDati();
  }, []);

  const caricaDati = async () => {
    const { data: saleData } = await supabase.from('sale').select('*').order('created_at', { ascending: false });
    const { data: logsData } = await supabase.from('admin_logs').select('*').limit(15).order('timestamp', { ascending: false });
    if (saleData) setSale(saleData);
    if (logsData) setLogs(logsData);
  };

  const varoNuovoClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVaro(true);

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeClub: nuovoNome, emailManager: nuovaEmail, password: nuovaPass })
      });

      if (res.ok) {
        alert("SALA VARATA! Utente creato ed email inviata con successo.");
        setNuovoNome(""); setNuovaEmail(""); setNuovaPass("");
        caricaDati();
      } else {
        alert("Errore durante il varo del club.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVaro(false);
    }
  };

  const toggleKillSwitch = async (sala: any) => {
    const nuovoStato = !sala.is_active;
    const { error } = await supabase.from('sale').update({ is_active: nuovoStato }).eq('id', sala.id);
    if (!error) {
      await supabase.from('admin_logs').insert({ azione: nuovoStato ? 'ATTIVAZIONE' : 'SOSPENSIONE', target_email: sala.manager_email });
      caricaDati();
    }
  };

  const aggiornaScadenza = async (salaId: string, nuovaData: string) => {
    if (!nuovaData) return;
    const { error } = await supabase.from('sale').update({ scadenza_contributo: nuovaData, is_active: true }).eq('id', salaId);
    if (!error) {
      const salaTarget = sale.find(s => s.id === salaId);
      await supabase.from('admin_logs').insert({ azione: 'RINNOVO_CONTRIBUTO', target_email: salaTarget?.manager_email });
      caricaDati();
    } else {
      alert("Errore nell'aggiornamento della data.");
    }
  };

  const apriGeneratoreRicevuta = (sala: any) => {
    const oggi = new Date();
    // Genera un numero ricevuta fittizio basato su Anno-Mese-IDRandom
    const num = `${oggi.getFullYear()}-${(oggi.getMonth()+1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    setNumeroRicevuta(num);
    setRicevutaModal(sala);
  };

  const stampaPdf = () => {
    window.print();
  };

  const totaleSale = sale.length;
  const saleAttive = sale.filter(s => s.is_active).length;
  const saleSospese = totaleSale - saleAttive;
  const percentualeAttive = totaleSale > 0 ? Math.round((saleAttive / totaleSale) * 100) : 0;

  return (
    <>
      {/* LA PLANCIA PRINCIPALE (Si nasconde durante la stampa grazie a "print:hidden") */}
      <div className="min-h-screen bg-black text-white p-6 md:p-10 font-sans print:hidden">
        <div className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-purple-900/50 pb-8 gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-purple-500 uppercase tracking-tighter">Torre di Controllo 🛰️</h1>
              <p className="text-zinc-500 font-mono text-xs mt-2 italic">Comando Centrale Operativo Multi-Tenant [cite: 2026-02-10]</p>
            </div>
            <div className="bg-purple-900/20 border border-purple-500/30 px-6 py-3 rounded-xl">
              <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Stato Rete</p>
              <p className="text-xl font-mono text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                Sistemi Online
              </p>
            </div>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Totale Club</p>
              <p className="text-4xl font-black text-white">{totaleSale}</p>
            </div>
            <div className="bg-emerald-950/20 border border-emerald-900/50 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-2">Sale Attive</p>
              <p className="text-4xl font-black text-emerald-500">{saleAttive}</p>
            </div>
            <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-2">Sale Sospese</p>
              <p className="text-4xl font-black text-red-500">{saleSospese}</p>
            </div>
            <div className="bg-purple-950/20 border border-purple-900/50 p-6 rounded-3xl">
              <p className="text-[10px] font-black text-purple-500/70 uppercase tracking-widest mb-2">Operatività Rete</p>
              <p className="text-4xl font-black text-purple-400">{percentualeAttive}%</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="bg-zinc-900 border border-purple-500/20 rounded-3xl p-8 shadow-2xl shadow-purple-900/10 h-fit">
              <h2 className="text-xs font-black text-purple-400 uppercase mb-6 tracking-widest">Varo Nuovo Club</h2>
              <form onSubmit={varoNuovoClub} className="space-y-4">
                <div><label className="text-[9px] text-zinc-500 uppercase font-black ml-1 mb-1 block">Nome Struttura</label><input type="text" required value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} placeholder="es. Billiards Club Roma" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-sm focus:border-purple-500 outline-none text-white" /></div>
                <div><label className="text-[9px] text-zinc-500 uppercase font-black ml-1 mb-1 block">Email Manager</label><input type="email" required value={nuovaEmail} onChange={(e) => setNuovaEmail(e.target.value)} placeholder="manager@club.it" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-sm focus:border-purple-500 outline-none text-white" /></div>
                <div><label className="text-[9px] text-zinc-500 uppercase font-black ml-1 mb-1 block">Password Iniziale</label><input type="password" required value={nuovaPass} onChange={(e) => setNuovaPass(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-zinc-800 p-3 rounded-xl text-sm focus:border-purple-500 outline-none text-white" /></div>
                <button disabled={loadingVaro} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all transform active:scale-95 disabled:opacity-50 mt-2">{loadingVaro ? "VARO IN CORSO..." : "VARO IMMEDIATO 🚀"}</button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
              <h2 className="text-xs font-black text-zinc-500 uppercase mb-6 tracking-widest">Stato della Flotta</h2>
              <div className="space-y-3">
                {sale.length === 0 ? <p className="text-zinc-600 font-mono text-sm italic py-4">Nessuna sala rilevata sui radar.</p> : sale.map((s) => (
                  <div key={s.id} className={`flex flex-col sm:flex-row justify-between sm:items-center bg-black/40 p-4 rounded-2xl border transition-all gap-4 ${s.is_active ? 'border-zinc-800 hover:border-emerald-500/30' : 'border-red-900/30 bg-red-950/10'}`}>
                    <div>
                      <p className={`font-bold text-lg ${s.is_active ? 'text-white' : 'text-red-400'}`}>{s.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono">{s.manager_email}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between w-full sm:w-auto">
                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <label className="text-[9px] font-black text-zinc-500 uppercase block mb-1">Scadenza</label>
                        <input type="date" value={s.scadenza_contributo ? s.scadenza_contributo.split('T')[0] : ''} onChange={(e) => aggiornaScadenza(s.id, e.target.value)} className="bg-black border border-zinc-700 text-zinc-300 text-[10px] font-mono p-2 rounded-lg outline-none focus:border-purple-500 cursor-pointer w-full sm:w-auto" />
                      </div>
                      
                      {/* BOTTONE RICEVUTA PDF */}
                      <button 
                        onClick={() => apriGeneratoreRicevuta(s)}
                        className="px-4 py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-md active:scale-95 w-full sm:w-auto text-center bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                        title="Emetti Ricevuta PDF"
                      >
                        📄 Ricevuta
                      </button>

                      <button onClick={() => toggleKillSwitch(s)} className={`px-5 py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-md active:scale-95 w-full sm:w-24 text-center ${s.is_active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-red-600 text-white hover:bg-red-500'}`}>
                        {s.is_active ? "Attivo" : "Sospeso"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-3 bg-zinc-800/30 border border-zinc-800 rounded-3xl p-6 mt-4">
              <h2 className="text-xs font-black text-zinc-600 uppercase mb-4 tracking-widest flex items-center gap-2">Admin Logs 📜 <span className="text-[9px] font-normal lowercase tracking-normal italic">(Scatola Nera)</span></h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {logs.length === 0 ? <p className="text-zinc-600 font-mono text-sm italic">Nessun evento registrato.</p> : logs.map((l) => (
                  <div key={l.id} className="text-[9px] font-mono bg-black/60 p-3 rounded-xl border border-zinc-800/50">
                    <span className={`font-bold ${l.azione === 'ATTIVAZIONE' || l.azione === 'RINNOVO_CONTRIBUTO' ? 'text-emerald-500' : l.azione === 'SOSPENSIONE' || l.azione === 'SOSPENSIONE AUTOMATICA' ? 'text-red-500' : 'text-purple-500'}`}>[{l.azione}]</span><br/>
                    <span className="text-zinc-400 mt-1 block break-all">{l.target_email}</span>
                    <span className="text-zinc-600 text-[8px] mt-2 block">{new Date(l.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODALE GENERATORE RICEVUTA (Visibile a schermo e ottimizzato per la stampa) */}
      {ricevutaModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 print:block print:static print:bg-white print:p-0">
          
          {/* CONTENITORE RICEVUTA - Layout A4 */}
          <div className="bg-white text-black rounded-lg shadow-2xl w-full max-w-2xl relative overflow-hidden print:shadow-none print:w-full print:max-w-none print:h-screen">
            
            {/* INTESTAZIONE STAMPABILE */}
            <div className="bg-slate-100 p-8 border-b border-slate-300 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Comando Centrale</h2>
                <p className="text-xs text-slate-500 font-mono mt-1">Gestione Multi-Tenant Platform [cite: 2026-02-10]</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-800 uppercase">Ricevuta</p>
                <p className="text-sm font-mono text-slate-500">N° {numeroRicevuta}</p>
                <p className="text-xs font-mono text-slate-400 mt-1">Data: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* CORPO RICEVUTA */}
            <div className="p-8 space-y-8">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Rilasciata a:</p>
                <p className="text-xl font-black text-slate-800">{ricevutaModal.name}</p>
                <p className="text-sm font-mono text-slate-600">{ricevutaModal.manager_email}</p>
              </div>

              <div className="border-t border-b border-slate-200 py-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-slate-700 uppercase text-sm">Causale</span>
                  <span className="font-bold text-slate-700 uppercase text-sm">Importo (€)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Contributo utilizzo piattaforma gestionale</span>
                  {/* L'input scompare in stampa, sostituito dal testo puro */}
                  <div className="print:hidden">
                    <input 
                      type="number" 
                      step="0.10" 
                      value={importoRicevuta} 
                      onChange={(e) => setImportoRicevuta(e.target.value)}
                      className="w-24 border border-slate-300 rounded p-1 text-right font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <span className="hidden print:inline text-lg font-mono text-slate-800">{Number(importoRicevuta).toFixed(2)}</span>
                </div>
                {ricevutaModal.scadenza_contributo && (
                  <div className="mt-4 text-xs text-slate-500">
                    * Validità copertura fino al: <span className="font-mono font-bold text-slate-700">{new Date(ricevutaModal.scadenza_contributo).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end">
                <p className="text-[10px] text-slate-400 italic max-w-xs">Documento generato elettronicamente. Non valido ai fini fiscali se non accompagnato da regolare fattura elettronica (se prevista).</p>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Totale Versato</p>
                  <p className="text-3xl font-black text-emerald-600 font-mono">€ {Number(importoRicevuta).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* BOTTONI DI COMANDO (Nascosti durante la stampa) */}
            <div className="bg-slate-50 p-6 flex justify-end gap-4 border-t border-slate-200 print:hidden">
              <button 
                onClick={() => setRicevutaModal(null)} 
                className="px-6 py-3 rounded-lg font-bold text-slate-500 hover:bg-slate-200 transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={stampaPdf} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                Stampa / PDF
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}