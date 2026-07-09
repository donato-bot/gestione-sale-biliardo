"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface Movimento {
  id: string;
  tipo: "ENTRATA" | "USCITA" | "SOSPESO";
  categoria: string;
  importo: number;
  descrizione: string;
  created_at: string;
}

interface PlanciaCassaProps {
  salaId: string;
}

export default function PlanciaCassaManager({ salaId }: PlanciaCassaProps) {
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [totaleEntrate, setTotaleEntrate] = useState(0);
  const [totaleUscite, setTotaleUscite] = useState(0);
  const [loading, setLoading] = useState(true);

  const [mostraForm, setMostraForm] = useState(false);
  const [tipo, setTipo] = useState<"ENTRATA" | "USCITA">("ENTRATA");
  const [isSospeso, setIsSospeso] = useState(false);
  const [nominativo, setNominativo] = useState("");
  const [categoria, setCategoria] = useState("Bar / Consumazioni");
  const [importo, setImporto] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [salvataggio, setSalvataggio] = useState(false);

  const caricaMovimenti = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("libro_mastro")
        .select("*")
        .eq("sala_id", salaId)
        .is("id_chiusura", null)
        .in("tipo", ["ENTRATA", "USCITA"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const movs = data || [];
      setMovimenti(movs);

      let entrate = 0;
      let uscite = 0;
      movs.forEach((m) => {
        if (m.tipo === "ENTRATA") entrate += Number(m.importo);
        if (m.tipo === "USCITA") uscite += Number(m.importo);
      });

      setTotaleEntrate(entrate);
      setTotaleUscite(uscite);
    } catch (err: any) {
      console.error("Errore caricamento cassa:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaMovimenti();
  }, [caricaMovimenti]);

  const registraMovimento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importo || isNaN(Number(importo)) || Number(importo) <= 0) {
      alert("Inserisci un importo valido.");
      return;
    }
    if (isSospeso && !nominativo.trim()) {
      alert("Inserisci il nominativo del cliente per il sospeso.");
      return;
    }

    setSalvataggio(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      const tipoFinale = isSospeso ? "SOSPESO" : tipo;
      const descFinale = isSospeso 
        ? `[SOSPESO] ${nominativo.toUpperCase()} - ${descrizione}` 
        : descrizione;

      const { error } = await supabase.from("libro_mastro").insert([
        {
          sala_id: salaId,
          manager_email: email,
          tipo: tipoFinale,
          categoria: categoria,
          importo: Number(importo),
          descrizione: descFinale,
          id_chiusura: isSospeso ? null : null, // Manteniamo null, i sospesi vengono filtrati per tipo=SOSPESO
        },
      ]);

      if (error) throw error;

      setImporto("");
      setDescrizione("");
      setNominativo("");
      setIsSospeso(false);
      setMostraForm(false); 
      await caricaMovimenti();
    } catch (err: any) {
      alert("Errore salvataggio: " + err.message);
    } finally {
      setSalvataggio(false);
    }
  };

  const chiudiTurno = async () => {
    if (!window.confirm("⚠️ Chiudere il turno di cassa?")) return;
    setLoading(true);
    try {
      const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14);
      const idTurno = `TURNO-${timestamp}`;
      await supabase.from("libro_mastro").update({ id_chiusura: idTurno }).eq("sala_id", salaId).is("id_chiusura", null).in("tipo", ["ENTRATA", "USCITA"]);
      await caricaMovimenti();
    } catch (err: any) { alert("Errore: " + err.message); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* TOTALIZZATORI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Totale Entrate Turno</p>
          <p className="text-3xl font-black text-emerald-400">€ {totaleEntrate.toFixed(2)}</p>
        </div>
        <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Totale Uscite Turno</p>
          <p className="text-3xl font-black text-red-400">€ {totaleUscite.toFixed(2)}</p>
        </div>
        <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Fondo Cassa Attuale</p>
          <p className="text-3xl font-black text-cyan-400">€ {(totaleEntrate - totaleUscite).toFixed(2)}</p>
        </div>
      </div>

      {/* FORM E LISTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-cyan-500">Operazioni Manuali</h3>
              {mostraForm && <button onClick={() => setMostraForm(false)} className="text-gray-500 hover:text-red-400 text-[10px] uppercase font-black tracking-widest">✖ ANNULLA</button>}
            </div>

            {!mostraForm ? (
              <button onClick={() => setMostraForm(true)} className="w-full py-8 rounded-xl border-2 border-dashed border-gray-800 hover:border-cyan-500 text-gray-500 hover:text-cyan-400 font-black text-xs uppercase transition-all">+ Registra Spesa / Extra</button>
            ) : (
              <form onSubmit={registraMovimento} className="space-y-4 animate-fade-in">
                {tipo === "ENTRATA" && (
                  <label className="flex items-center gap-3 p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={isSospeso} onChange={(e) => setIsSospeso(e.target.checked)} className="accent-amber-500 w-4 h-4" />
                    <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Registra come Credito Sospeso</span>
                  </label>
                )}
                {isSospeso && (
                  <input type="text" placeholder="Nominativo Cliente..." value={nominativo} onChange={(e) => setNominativo(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm uppercase" />
                )}
                <select value={tipo} onChange={(e) => { setTipo(e.target.value as any); setIsSospeso(false); }} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm">
                  <option value="ENTRATA">🟢 ENTRATA</option>
                  <option value="USCITA">🔴 USCITA</option>
                </select>
                <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm">
                  {tipo === "ENTRATA" ? (
                    <><option value="Bar / Consumazioni">Bar / Consumazioni</option><option value="Quota Associativa">Quota Associativa</option><option value="Altra Entrata">Altra Entrata</option></>
                  ) : (
                    <><option value="Fornitori Bar">Fornitori Bar</option><option value="Spese Manutenzione">Spese Manutenzione</option><option value="Utenze">Utenze</option></>
                  )}
                </select>
                <input type="number" step="0.01" required value={importo} onChange={(e) => setImporto(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm" placeholder="Importo €" />
                <input type="text" required value={descrizione} onChange={(e) => setDescrizione(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-sm" placeholder="Note..." />
                <button type="submit" disabled={salvataggio} className="w-full bg-cyan-600 py-4 rounded-xl font-black text-[10px] uppercase text-black">Conferma</button>
              </form>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#11131a] border border-gray-800 p-6 rounded-2xl h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Movimenti Turno Corrente</h3>
              <button onClick={chiudiTurno} disabled={movimenti.length === 0} className="bg-red-950/40 border border-red-500/30 text-white text-[9px] px-4 py-2 rounded-lg font-black uppercase tracking-widest">🔒 Chiudi Turno</button>
            </div>
            {/* ... [Lista movimenti invariata] ... */}
          </div>
        </div>
      </div>
    </div>
  );
}