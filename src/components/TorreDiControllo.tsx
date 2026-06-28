"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TorreDiControllo({ salaId, setActiveView }: { salaId: string, setActiveView?: (view: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [salaInfo, setSalaInfo] = useState<any>(null);

  useEffect(() => {
    if (salaId) {
      fetchAdminData();
    }
  }, [salaId]);

  const fetchAdminData = async () => {
    // 1. Recupero info della sala corrente (Kill Switch, Scadenza)
    const { data: salaData, error: salaError } = await supabase
      .from('sale')
      .select('*')
      .eq('id', salaId)
      .single();
    
    if (salaData) setSalaInfo(salaData);
    if (salaError) console.error("Errore lettura table sale:", salaError);

    // 2. Recupero della Scatola Nera dalla table admin_logs (se esiste)
    const { data: logsData, error: logsError } = await supabase
      .from('admin_logs')
      .select('*')
      .eq('sala_id', salaId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (logsData) setLogs(logsData);
    if (logsError) console.error("La table admin_logs potrebbe non esistere ancora:", logsError);
  };

  return (
    <div className="min-h-screen bg-emerald-50 p-4 sm:p-8 md:p-12 flex flex-col items-center transition-colors duration-500">
      
      {/* SCHERMO NERO PRINCIPALE */}
      <div className="w-full max-w-[1400px] bg-[#050505] rounded-[3rem] p-8 sm:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-8 border-cyan-900/40 relative overflow-hidden">
        
        {/* HEADER CON PULSANTI APPARISCENTI */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-gray-800 pb-8 mb-10 gap-4">
          <div>
            <p className="text-[10px] text-cyan-500 font-black uppercase tracking-widest mb-1">Pannello Multi-Tenant (Isolamento Attivo)</p>
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tight">TORRE DI CONTROLLO</h2>
          </div>
          
          <button 
            onClick={() => setActiveView && setActiveView('hub')} 
            className="bg-gray-800 text-white hover:bg-gray-700 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all border-2 border-gray-600 shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-95 text-center"
          >
            ← Torna all'Hub
          </button>
        </div>

        {/* CONTENUTO AMMINISTRATIVO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* STATO OPERATIVO SALA */}
          <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
            <h3 className="text-xl text-white font-black uppercase tracking-widest border-b border-gray-700 pb-4">Stato Operativo</h3>
            {salaInfo ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-black p-4 rounded-xl border border-gray-800">
                  <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">ID Sala</span>
                  <span className="text-white font-mono text-xs">{salaInfo.id}</span>
                </div>
                <div className="flex justify-between items-center bg-black p-4 rounded-xl border border-gray-800">
                  <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Nome</span>
                  <span className="text-cyan-400 font-black uppercase">{salaInfo.name || 'SALA CAMPIONE'}</span>
                </div>
                <div className="flex justify-between items-center bg-black p-4 rounded-xl border border-gray-800">
                  <span className="text-gray-400 font-bold uppercase text-sm tracking-widest">Kill Switch</span>
                  <span className={`px-4 py-1 rounded-full font-black text-xs border ${salaInfo.is_active !== false ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500' : 'bg-red-900/50 text-red-400 border-red-500'}`}>
                    {salaInfo.is_active !== false ? 'SISTEMA ATTIVO' : 'SISTEMA SOSPESO'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">Recupero dati di amministrazione in corso...</p>
            )}
          </div>

          {/* SCATOLA NERA (LOGS) */}
          <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-2xl p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-gray-700 pb-4">
              <h3 className="text-xl text-white font-black uppercase tracking-widest">Scatola Nera</h3>
              <span className="text-xs text-red-500 font-black tracking-widest animate-pulse">● REC</span>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-2">
              {logs.length > 0 ? logs.map((log, index) => (
                <div key={index} className="bg-black p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">{log.azione || 'Attività'}</span>
                    <span className="text-gray-600 text-xs font-mono">{new Date(log.created_at).toLocaleString('it-IT')}</span>
                  </div>
                  <span className="text-gray-400 text-sm">{log.dettagli || 'Registrazione di sistema.'}</span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="text-4xl mb-4">🗄️</span>
                  <p className="text-gray-500 italic text-sm text-center">Nessun evento anomalo registrato.<br/>La table admin_logs è vuota o in attesa di dati.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}