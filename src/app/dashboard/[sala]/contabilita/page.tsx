"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
// import PlanciaCassaManager from "../../../../components/PlanciaCassaManager";

export default function MovimentiContabiliPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

  // Stato per gestire quale scheda (Tab) è attualmente visibile
  const [tabAttivo, setTabAttivo] = useState("sospesi");

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1400px] mx-auto space-y-8">
        
        {/* INTESTAZIONE GENERALE */}
        <header className="border-b border-gray-800 pb-6">
          <button 
            onClick={() => router.push(`/dashboard/${salaId}`)}
            className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-4 flex items-center gap-2"
          >
            ← Torna alla Plancia Operativa
          </button>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white italic">
            MOVIMENTI CONTABILI
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
            Gestione Finanziaria e Prima Nota
          </p>
        </header>

        {/* BARRA DI NAVIGAZIONE A SCHEDE (TABS) */}
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          <button
            onClick={() => setTabAttivo("prima-nota")}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              tabAttivo === "prima-nota" 
                ? "bg-cyan-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                : "bg-[#11131a] text-gray-500 border border-gray-800 hover:border-cyan-500/50 hover:text-cyan-400"
            }`}
          >
            📊 Prima Nota (Cassa)
          </button>
          
          <button
            onClick={() => setTabAttivo("sospesi")}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
              tabAttivo === "sospesi" 
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "bg-[#11131a] text-gray-500 border border-gray-800 hover:border-amber-500/50 hover:text-amber-400"
            }`}
          >
            ⏳ Crediti Sospesi
            <span className="bg-black/50 text-white px-2 py-0.5 rounded-full text-[9px]">3</span>
          </button>

          <button
            onClick={() => setTabAttivo("archivio")}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${
              tabAttivo === "archivio" 
                ? "bg-cyan-600 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                : "bg-[#11131a] text-gray-500 border border-gray-800 hover:border-cyan-500/50 hover:text-cyan-400"
            }`}
          >
            📚 Storico Libro Mastro
          </button>
        </div>

        {/* AREA CONTENUTO DINAMICO */}
        <main className="bg-[#0a0b0f] border border-gray-900/50 p-6 rounded-[2rem] shadow-2xl min-h-[500px]">
          
          {tabAttivo === "prima-nota" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-black italic text-cyan-400 uppercase">Cassa del Turno Corrente</h2>
                {/* Tasto stampa dedicato alla Prima Nota */}
                <button className="bg-gray-800 hover:bg-gray-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                  📄 Stampa Prima Nota
                </button>
              </div>
              <p className="text-gray-500 text-sm">Qui integreremo il componente PlanciaCassaManager che abbiamo creato per gestire entrate e uscite della giornata.</p>
              {/* <PlanciaCassaManager salaId={salaId} /> */}
            </div>
          )}

          {tabAttivo === "sospesi" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-black italic text-amber-500 uppercase">Gestione Crediti e Riscossioni</h2>
                
                {/* Blocco Allineato: Tasto Stampa + Totale Sospesi */}
                <div className="flex items-stretch gap-4">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                    📄 Salva / Stampa PDF
                  </button>
                  <div className="bg-[#11131a] border border-gray-800 px-6 py-3 rounded-xl text-right">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Totale Sospesi</p>
                    <p className="text-2xl font-black text-amber-400">€ 50.50</p>
                  </div>
                </div>
              </div>
              
              {/* Tabella Crediti */}
              <div className="w-full bg-[#11131a] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                      <th className="p-4">Data e Ora</th>
                      <th className="p-4">Nominativo</th>
                      <th className="p-4">Dettaglio</th>
                      <th className="p-4 text-right">Importo</th>
                      <th className="p-4 text-center">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-white divide-y divide-gray-800">
                    <tr className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-gray-400">23/06/2026, 08:02</td>
                      <td className="p-4 uppercase">Fernando</td>
                      <td className="p-4 text-gray-500 text-xs">Nessuna nota</td>
                      <td className="p-4 text-right text-amber-400 text-lg">€ 18.50</td>
                      <td className="p-4 text-center">
                        <button className="bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                          ✓ Incassa
                        </button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 text-gray-400">23/06/2026, 08:02</td>
                      <td className="p-4 uppercase">Giuseppe</td>
                      <td className="p-4 text-gray-500 text-xs">Nessuna nota</td>
                      <td className="p-4 text-right text-amber-400 text-lg">€ 8.00</td>
                      <td className="p-4 text-center">
                        <button className="bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors">
                          ✓ Incassa
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabAttivo === "archivio" && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-black italic text-cyan-400 uppercase">Archivio Storico</h2>
                {/* Tasto stampa dedicato allo Storico */}
                <button className="bg-gray-800 hover:bg-gray-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                  📄 Esporta Storico Mastro
                </button>
              </div>
              <p className="text-gray-500 text-sm">Qui visualizzeremo l'elenco dei turni passati già chiusi e saldati.</p>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}