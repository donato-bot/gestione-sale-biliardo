"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";

interface PlanciaCassaProps {
  salaId: string;
}

interface Movimento {
  id: string;
  created_at: string;
  tipo: "ENTRATA" | "USCITA";
  categoria: string;
  importo: number;
  descrizione: string;
  id_chiusura: string | null;
}

export default function PlanciaCassaManager({ salaId }: PlanciaCassaProps) {
  // Stati per i movimenti e i conteggi
  const [movimentiCorrenti, setMovimentiCorrenti] = useState<Movimento[]>([]);
  const [totaleEntrate, setTotaleEntrate] = useState(0);
  const [totaleUscite, setTotaleUscite] = useState(0);
  const [saldoAttuale, setSaldoAttuale] = useState(0);

  // Stati del Form Nuovo Movimento
  const [tipo, setTipo] = useState<"ENTRATA" | "USCITA">("ENTRATA");
  const [categoria, setCategoria] = useState("Gioco Biliardo");
  const [importo, setImporto] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [loadingMovimento, setLoadingMovimento] = useState(false);

  // Stati della Chiusura di Cassa
  const [noteChiusura, setNoteChiusura] = useState("");
  const [loadingChiusura, setLoadingChiusura] = useState(false);

  // Caricamento dei movimenti non ancora chiusi (id_chiusura IS NULL)
  const caricaCassaCorrente = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      if (!email) return;

      const { data, error } = await supabase
        .from("libro_mastro")
        .select("*")
        .eq("sala_id", salaId)
        .eq("manager_email", email)
        .is("id_chiusura", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const movs: Movimento[] = data;
        setMovimentiCorrenti(movs);

        // Calcolo totali
        let entrate = 0;
        let uscite = 0;
        movs.forEach((m) => {
          if (m.tipo === "ENTRATA") entrate += Number(m.importo);
          if (m.tipo === "USCITA") uscite += Number(m.importo);
        });

        setTotaleEntrate(entrate);
        setTotaleUscite(uscite);
        setSaldoAttuale(entrate - uscite);
      }
    } catch (err: any) {
      console.error("Errore caricamento cassa:", err.message);
    }
  }, [salaId]);

  useEffect(() => {
    caricaCassaCorrente();
  }, [caricaCassaCorrente]);

  // Inserimento nuovo movimento nel Libro Mastro
  const handleAggiungiMovimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importo || Number(importo) <= 0) return;

    setLoadingMovimento(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      if (!email) throw new Error("Utente non autenticato");

      const { error } = await supabase.from("libro_mastro").insert([
        {
          sala_id: salaId,
          manager_email: email.toLowerCase(),
          tipo,
          categoria,
          importo: Number(importo),
          descrizione: descrizione.trim(),
          id_chiusura: null,
        },
      ]);

      if (error) throw error;

      // Reset form e ricarica
      setImporto("");
      setDescrizione("");
      await caricaCassaCorrente();
    } catch (err: any) {
      alert("Errore inserimento movimento: " + err.message);
    } finally {
      setLoadingMovimento(false);
    }
  };

  // Esecuzione Chiusura di Cassa (Transazione con congelamento)
  const handleEseguiChiusura = async () => {
    if (movimentiCorrenti.length === 0) {
      alert("Nessun movimento presente. Impossibile eseguire una chiusura vuota.");
      return;
    }

    if (!window.confirm("⚠️ Confermi la chiusura di cassa del turno attuale?\nI movimenti correnti verranno contabilizzati e archiviati nel Libro Mastro.")) {
      return;
    }

    setLoadingChiusura(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      if (!email) throw new Error("Utente non autenticato");

      // 1. Crea il record di riepilogo nella tabella 'chiusure_cassa'
      const { data: nuovaChiusura, error: errorChiusura } = await supabase
        .from("chiusure_cassa")
        .insert([
          {
            sala_id: salaId,
            manager_email: email.toLowerCase(),
            totale_entrate: totaleEntrate,
            totale_uscite: totaleUscite,
            saldo_finale: saldoAttuale,
            note: noteChiusura.trim(),
          },
        ])
        .select()
        .single();

      if (errorChiusura) throw errorChiusura;

      // 2. Aggiorna tutti i movimenti correnti inserendo l'id della chiusura appena nata
      const { error: errorCongelamento } = await supabase
        .from("libro_mastro")
        .update({ id_chiusura: nuovaChiusura.id })
        .eq("sala_id", salaId)
        .eq("manager_email", email)
        .is("id_chiusura", null);

      if (errorCongelamento) throw errorCongelamento;

      alert("🏁 Chiusura di Cassa completata con successo! Turno azzerato.");
      setNoteChiusura("");
      await caricaCassaCorrente();
    } catch (err: any) {
      alert("Errore durante la chiusura di cassa: " + err.message);
    } finally {
      setLoadingChiusura(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* CARD TOTALI IN TEMPO REALE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-[#11131a] border border-emerald-500/20 p-6 rounded-2xl">
          <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Totale Entrate Turno</p>
          <p className="text-3xl font-black text-emerald-400">€ {totaleEntrate.toFixed(2)}</p>
        </div>
        <div className="bg-[#11131a] border border-red-500/20 p-6 rounded-2xl">
          <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Totale Uscite Turno</p>
          <p className="text-3xl font-black text-red-400">€ {totaleUscite.toFixed(2)}</p>
        </div>
        <div className={`bg-[#11131a] border p-6 rounded-2xl transition-all ${saldoAttuale >= 0 ? "border-cyan-500/30" : "border-amber-500/30"}`}>
          <p className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1">Fondo Cassa Attuale</p>
          <p className={`text-3xl font-black ${saldoAttuale >= 0 ? "text-cyan-400" : "text-amber-400"}`}>
            € {saldoAttuale.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FORM REGISTRAZIONE MOVIMENTO */}
        <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl lg:col-span-1 h-fit">
          <h2 className="text-md font-black uppercase tracking-widest mb-4 text-cyan-400">Nuovo Movimento</h2>
          <form onSubmit={handleAggiungiMovimento} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Tipo</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value as "ENTRATA" | "USCITA")} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500">
                <option value="ENTRATA">🟢 ENTRATA (Incasso)</option>
                <option value="USCITA">🔴 USCITA (Spesa)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500">
                {tipo === "ENTRATA" ? (
                  <>
                    <option value="Gioco Biliardo">Gioco Biliardo</option>
                    <option value="Bar / Ristorazione">Bar / Ristorazione</option>
                    <option value="Tesseramento">Tesseramento</option>
                    <option value="Altro Incasso">Altro Incasso</option>
                  </>
                ) : (
                  <>
                    <option value="Fornitori Bar">Fornitori Bar</option>
                    <option value="Manutenzione Biliardi">Manutenzione Biliardi</option>
                    <option value="Utenze / Spese">Utenze / Spese</option>
                    <option value="Altra Spesa">Altra Spesa</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Importo (€)</label>
              <input type="number" step="0.01" required placeholder="0.00" value={importo} onChange={(e) => setImporto(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500" />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Descrizione / Note</label>
              <textarea placeholder="Dettagli movimento..." value={descrizione} onChange={(e) => setDescrizione(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-cyan-500 h-20 resize-none" />
            </div>

            <button type="submit" disabled={loadingMovimento} className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-black uppercase tracking-widest py-3 rounded-xl text-[10px] transition-all">
              {loadingMovimento ? "REGISTRAZIONE IN CORSO..." : "REGISTRA MOVIMENTO"}
            </button>
          </form>
        </div>

        {/* LISTA MOVIMENTI CORRENTI */}
        <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-md font-black uppercase tracking-widest text-white">Movimenti Turno Corrente</h2>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">Cassa Aperta</span>
            </div>

            <div className="overflow-y-auto max-h-[320px] divide-y divide-gray-800/60 pr-1">
              {movimentiCorrenti.map((m) => (
                <div key={m.id} className="py-3 flex justify-between items-center text-xs font-bold">
                  <div>
                    <p className="text-white uppercase tracking-wide font-black">{m.categoria}</p>
                    {m.descrizione && <p className="text-gray-500 text-[11px] font-medium normal-case">{m.descrizione}</p>}
                    <p className="text-[10px] text-gray-600 font-mono mt-0.5">{new Date(m.created_at).toLocaleTimeString("it-IT")}</p>
                  </div>
                  <span className={`font-mono font-black text-sm ${m.tipo === "ENTRATA" ? "text-emerald-400" : "text-red-400"}`}>
                    {m.tipo === "ENTRATA" ? "+" : "-"} € {Number(m.importo).toFixed(2)}
                  </span>
                </div>
              ))}
              {movimentiCorrenti.length === 0 && (
                <p className="text-center text-gray-600 font-black py-12 text-xs uppercase tracking-widest">Nessun movimento registrato in questo turno.</p>
              )}
            </div>
          </div>

          {/* SEZIONE CHIUSURA DI CASSA */}
          {movimentiCorrenti.length > 0 && (
            <div className="border-t border-gray-800/80 pt-4 mt-6 space-y-3">
              <div>
                <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Note Chiusura di Cassa</label>
                <input type="text" placeholder="es. Cassa regolare, manca resto bar..." value={noteChiusura} onChange={(e) => setNoteChiusura(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white text-xs font-bold focus:outline-none focus:border-cyan-500" />
              </div>
              <button type="button" onClick={handleEseguiChiusura} disabled={loadingChiusura} className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 text-black font-black uppercase tracking-widest py-3 rounded-xl text-[10px] transition-all">
                {loadingChiusura ? "CONGELAMENTO E CHIUSURA IN CORSO..." : "🛑 EFFETTUA CHIUSURA DI CASSA (AZZERA TURNO)"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}