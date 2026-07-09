"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PlanciaCassaManager from "../../../../components/PlanciaCassaManager";

interface MovimentoSospeso {
  id: string;
  created_at: string;
  descrizione: string;
  importo: number;
}

export default function MovimentiContabiliPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

  const [tabAttivo, setTabAttivo] = useState("prima-nota");
  const [sospesi, setSospesi] = useState<MovimentoSospeso[]>([]);
  const [totaleSospesi, setTotaleSospesi] = useState(0);
  const [loading, setLoading] = useState(true);

  // PESCA I CREDITI DAL DATABASE
  const caricaSospesi = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("libro_mastro")
        .select("*")
        .eq("sala_id", salaId)
        .eq("tipo", "SOSPESO")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const records = data || [];
      setSospesi(records);
      
      const totale = records.reduce((acc, curr) => acc + Number(curr.importo), 0);
      setTotaleSospesi(totale);
    } catch (err: any) {
      console.error("Errore caricamento crediti sospesi:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaSospesi();
  }, [caricaSospesi]);

  // INCASSA IL CREDITO E LO TRASFERISCE NELLA PRIMA NOTA
  const incassaCredito = async (sospeso: MovimentoSospeso) => {
    if (!window.confirm(`Confermi di aver incassato € ${Number(sospeso.importo).toFixed(2)} per:\n${sospeso.descrizione}?`)) {
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      // 1. Archivia il debito come saldato
      const { error: updateError } = await supabase
        .from("libro_mastro")
        .update({ tipo: "SOSPESO_SALDATO" })
        .eq("id", sospeso.id);

      if (updateError) throw updateError;

      // 2. Inietta i soldi freschi nella cassa del turno corrente
      const { error: insertError } = await supabase
        .from("libro_mastro")
        .insert([{
          sala_id: salaId,
          manager_email: email,
          tipo: "ENTRATA",
          categoria: "Riscossione Credito",
          importo: sospeso.importo,
          descrizione: `[SALDATO] ${sospeso.descrizione}`,
          id_chiusura: null // Lo manda dritto alla Prima Nota attuale
        }]);

      if (insertError) throw insertError;

      await caricaSospesi();

    } catch (err: any) {
      alert("Errore durante la riscossione: " + err.message);
    }
  };

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
            onClick={() => { setTabAttivo("sospesi"); caricaSospesi(); }}
            className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
              tabAttivo === "sospesi" 
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]" 
                : "bg-[#11131a] text-gray-500 border border-gray-800 hover:border-amber-500/50 hover:text-amber-400"
            }`}
          >
            ⏳ Crediti Sospesi
            <span className="bg-black/50 text-white px-2 py-0.5 rounded-full text-[9px]">{sospesi.length}</span>
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
                <button className="bg-gray-800 hover:bg-gray-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                  📄 Stampa Prima Nota
                </button>
              </div>
              
              <PlanciaCassaManager salaId={salaId} />
            </div>
          )}

          {tabAttivo === "sospesi" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-end">
                <h2 className="text-xl font-black italic text-amber-500 uppercase">Gestione Crediti e Riscossioni</h2>
                
                <div className="flex items-stretch gap-4">
                  <button className="bg-gray-800 hover:bg-gray-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                    📄 Salva / Stampa PDF
                  </button>
                  <div className="bg-[#11131a] border border-gray-800 px-6 py-3 rounded-xl text-right">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Totale Sospesi</p>
                    <p className="text-2xl font-black text-amber-400">€ {totaleSospesi.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-[#11131a] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                      <th className="p-4">Data e Ora</th>
                      <th className="p-4">Dettaglio Credito</th>
                      <th className="p-4 text-right">Importo</th>
                      <th className="p-4 text-center">Azione</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-white divide-y divide-gray-800">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 font-black uppercase tracking-widest text-[10px] animate-pulse">
                          Ricerca crediti sospesi in corso...
                        </td>
                      </tr>
                    ) : sospesi.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-500 font-black uppercase tracking-widest text-[10px]">
                          Nessun credito in sospeso. Ottimo lavoro!
                        </td>
                      </tr>
                    ) : (
                      sospesi.map((mov) => (
                        <tr key={mov.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="p-4 text-gray-400">
                            {new Date(mov.created_at).toLocaleDateString("it-IT")} <span className="text-gray-600 ml-2">{new Date(mov.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                          </td>
                          <td className="p-4 uppercase text-gray-300">{mov.descrizione}</td>
                          <td className="p-4 text-right text-amber-400 text-lg">€ {Number(mov.importo).toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => incassaCredito(mov)}
                              className="bg-emerald-950/50 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                            >
                              ✓ Incassa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tabAttivo === "archivio" && (
            <div className="animate-fade-in space-y-6">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-xl font-black italic text-cyan-400 uppercase">Archivio Storico Turni</h2>
                <button className="bg-gray-800 hover:bg-gray-700 text-white font-black px-6 py-3 rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center gap-2">
                  📄 Esporta Report Completo
                </button>
              </div>
              
              <div className="bg-[#11131a] border border-gray-800 rounded-xl p-8 text-center">
                <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                  L'archivio mostra le chiusure di cassa già effettuate. 
                  <br />
                  <span className="text-cyan-500 mt-2 block">Modulo di consultazione storica in fase di finalizzazione.</span>
                </p>
              </div>
            </div>
          )}

        </main>

      </div>
    </div>
  );
}