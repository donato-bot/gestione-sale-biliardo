"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PlanciaCassaManager from "../../../../components/PlanciaCassaManager";

interface MovimentoRE {
  id: string;
  created_at: string;
  tipo: "ENTRATA" | "USCITA" | "SOSPESO" | "SOSPESO_SALDATO";
  categoria: string;
  importo: number;
  descrizione: string;
  id_chiusura: string | null;
}

export default function MovimentiContabiliPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

  // Stati per i dati
  const [tuttiMovimenti, setTuttiMovimenti] = useState<MovimentoRE[]>([]);
  const [movimentiFiltrati, setMovimentiFiltrati] = useState<MovimentoRE[]>([]);
  const [loading, setLoading] = useState(true);

  // Stato per la cernita del blocco: "TUTTI", "CASSA_APERTA", "SOSPESI", "ARCHIVIO"
  const [bloccoSelezionato, setBloccoSelezionato] = useState("TUTTI");

  // CARICAMENTO DI TUTTI I MOVIMENTI SENZA FILTRI PREVENTIVI
  const caricaRegistroContabile = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("libro_mastro")
        .select("*")
        .eq("sala_id", salaId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const records = data || [];
      setTuttiMovimenti(records);
      setMovimentiFiltrati(records); // Di default mostra tutto
    } catch (err: any) {
      console.error("Errore caricamento registro contabile:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaRegistroContabile();
  }, [caricaRegistroContabile]);

  // FUNZIONE PER CERNERE IL BLOCCO DESIDERATO
  useEffect(() => {
    let filtrati = [...tuttiMovimenti];

    if (bloccoSelezionato === "CASSA_APERTA") {
      // Solo entrate e uscite del turno corrente (non ancora sigillate)
      filtrati = tuttiMovimenti.filter(m => m.id_chiusura === null && (m.tipo === "ENTRATA" || m.tipo === "USCITA"));
    } else if (bloccoSelezionato === "SOSPESI") {
      // Solo i crediti ancora da riscuotere
      filtrati = tuttiMovimenti.filter(m => m.tipo === "SOSPESO");
    } else if (bloccoSelezionato === "ARCHIVIO") {
      // Solo i movimenti appartenenti a turni già chiusi e sigillati
      filtrati = tuttiMovimenti.filter(m => m.id_chiusura !== null && m.id_chiusura !== "CREDITO_APERTO");
    }

    setMovimentiFiltrati(filtrati);
  }, [bloccoSelezionato, tuttiMovimenti]);

  // RISCOSSIONE DI UN CREDITO SOSPESO DALLA LISTA UNIFICATA
  const eseguiRiscossione = async (mov: MovimentoRE) => {
    if (!window.confirm(`Confermi l'incasso di € ${Number(mov.importo).toFixed(2)} da questo sospeso?`)) return;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      const { error: updError } = await supabase
        .from("libro_mastro")
        .update({ tipo: "SOSPESO_SALDATO" })
        .eq("id", mov.id);

      if (updError) throw updError;

      const { error: insError } = await supabase
        .from("libro_mastro")
        .insert([{
          sala_id: salaId,
          manager_email: email,
          tipo: "ENTRATA",
          categoria: "Riscossione Credito",
          importo: mov.importo,
          descrizione: `[SALDATO] ${mov.descrizione}`,
          id_chiusura: null
        }]);

      if (insError) throw insError;

      await caricaRegistroContabile();
    } catch (err: any) {
      alert("Errore riscossione: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1600px] mx-auto space-y-8">
        
        {/* INTESTAZIONE */}
        <header className="border-b border-gray-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-4 flex items-center gap-2"
            >
              ← Torna alla Plancia Operativa
            </button>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white italic">
              REGISTRO MOVIMENTI CONTABILI
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              Prima Nota Generale e Strumenti di Cernita
            </p>
          </div>

          <button 
            onClick={() => caricaRegistroContabile()} 
            className="bg-cyan-950/40 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400 font-black px-5 py-2.5 rounded-xl uppercase tracking-widest text-[10px] transition-all"
          >
            🔄 Aggiorna Registro
          </button>
        </header>

        {/* PANNELLO DI INSERIMENTO RAPIDO PRIMA NOTA */}
        <section className="bg-[#0a0b0f] border border-gray-950 p-6 rounded-[2rem] shadow-xl">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4 px-2">
            📥 Pannello Operazioni Veloci (Prima Nota del Turno)
          </h2>
          <PlanciaCassaManager salaId={salaId} />
        </section>

        {/* STRUTTURA DI CERNITA E VISUALIZZAZIONE REGISTRO */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
          
          {/* COLONNA SELEZIONE BLOCCHI (CERNITA) */}
          <aside className="xl:col-span-1 space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 px-2">
              🔍 Cerna del Blocco
            </h2>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setBloccoSelezionato("TUTTI")}
                className={`w-full text-left p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                  bloccoSelezionato === "TUTTI"
                    ? "bg-cyan-600 text-black border-cyan-500 shadow-lg"
                    : "bg-[#11131a] text-gray-400 border-gray-800 hover:border-gray-700"
                }`}
              >
                📋 Tutto il Registro ({tuttiMovimenti.length})
              </button>

              <button
                onClick={() => setBloccoSelezionato("CASSA_APERTA")}
                className={`w-full text-left p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                  bloccoSelezionato === "CASSA_APERTA"
                    ? "bg-emerald-600 text-black border-emerald-500 shadow-lg"
                    : "bg-[#11131a] text-gray-400 border-gray-800 hover:border-gray-700"
                }`}
              >
                📊 Solo Cassa Attuale ({tuttiMovimenti.filter(m => m.id_chiusura === null && (m.tipo === "ENTRATA" || m.tipo === "USCITA")).length})
              </button>

              <button
                onClick={() => setBloccoSelezionato("SOSPESI")}
                className={`w-full text-left p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                  bloccoSelezionato === "SOSPESI"
                    ? "bg-amber-500 text-black border-amber-500 shadow-lg"
                    : "bg-[#11131a] text-gray-400 border-gray-800 hover:border-gray-700"
                }`}
              >
                ⏳ Solo Crediti Sospesi ({tuttiMovimenti.filter(m => m.tipo === "SOSPESO").length})
              </button>

              <button
                onClick={() => setBloccoSelezionato("ARCHIVIO")}
                className={`w-full text-left p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border ${
                  bloccoSelezionato === "ARCHIVIO"
                    ? "bg-purple-600 text-black border-purple-500 shadow-lg"
                    : "bg-[#11131a] text-gray-400 border-gray-800 hover:border-gray-700"
                }`}
              >
                📚 Solo Turni Sigillati ({tuttiMovimenti.filter(m => m.id_chiusura !== null && m.id_chiusura !== "CREDITO_APERTO").length})
              </button>
            </div>
          </aside>

          {/* COLONNA VISUALIZZAZIONE FLUSSO DATI (IL REGISTRO EFFETTIVO) */}
          <main className="xl:col-span-3 bg-[#0a0b0f] border border-gray-900/40 rounded-[2rem] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">
                📄 Risultanze della cernita
              </h2>
              <span className="text-[10px] font-mono text-gray-600 uppercase font-black">
                Voci Trovate: {movimentiFiltrati.length}
              </span>
            </div>

            <div className="w-full bg-[#11131a] border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                    <th className="p-4">Data e Ora</th>
                    <th className="p-4">Blocco / Tipo</th>
                    <th className="p-4">Categoria e Descrizione</th>
                    <th className="p-4 text-right">Importo</th>
                    <th className="p-4 text-center">Stato / Azione</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-white divide-y divide-gray-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-cyan-500 font-black uppercase tracking-widest text-[10px] animate-pulse">
                        Interrogazione Registro Contabile in corso...
                      </td>
                    </tr>
                  ) : movimentiFiltrati.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-600 font-black uppercase tracking-widest text-[10px]">
                        Nessun movimento contabile presente in questo blocco.
                      </td>
                    </tr>
                  ) : (
                    movimentiFiltrati.map((mov) => {
                      // Colori dinamici dei badge per il riconoscimento visivo immediato
                      let badgeColore = "bg-gray-900 text-gray-400";
                      if (mov.tipo === "ENTRATA") badgeColore = "bg-emerald-950/50 text-emerald-400 border border-emerald-500/20";
                      if (mov.tipo === "USCITA") badgeColore = "bg-red-950/50 text-red-400 border border-red-500/20";
                      if (mov.tipo === "SOSPESO") badgeColore = "bg-amber-950/50 text-amber-400 border border-amber-500/20";
                      if (mov.tipo === "SOSPESO_SALDATO") badgeColore = "bg-blue-950/50 text-blue-400 border border-blue-500/20";

                      return (
                        <tr key={mov.id} className="hover:bg-gray-800/20 transition-colors">
                          <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(mov.created_at).toLocaleDateString("it-IT")}{" "}
                            <span className="text-gray-600 ml-1">
                              {new Date(mov.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`text-[9px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider ${badgeColore}`}>
                              {mov.tipo}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{mov.categoria}</p>
                            <p className="text-sm font-bold text-white mt-0.5 uppercase tracking-tight">{mov.descrizione}</p>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <p className={`text-base font-black ${mov.tipo === "USCITA" ? "text-red-400" : mov.tipo === "SOSPESO" ? "text-amber-400" : "text-emerald-400"}`}>
                              {mov.tipo === "USCITA" ? "-" : "+"} € {Number(mov.importo).toFixed(2)}
                            </p>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            {mov.tipo === "SOSPESO" ? (
                              <button 
                                onClick={() => eseguiRiscossione(mov)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                              >
                                ✓ Incassa
                              </button>
                            ) : mov.id_chiusura ? (
                              <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">
                                🔒 {mov.id_chiusura.slice(0, 14)}
                              </span>
                            ) : (
                              <span className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest animate-pulse">
                                🔓 Aperto
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}