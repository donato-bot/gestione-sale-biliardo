"use client";

import { useState, useEffect } from "react";
import { supabase } from "../app/lib/supabase";

interface ReportProps {
  salaId: string;
  onBack: () => void;
}

interface Movimento {
  id: string;
  data_operazione: string;
  tipo_movimento: "ENTRATA" | "USCITA";
  causale_origine: "Biliardi" | "Bar" | "Magazzino" | "Prima Nota" | "Incasso Sospeso";
  importo: number;
  descrizione: string;
}

export default function Report({ salaId, onBack }: ReportProps) {
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipoMovimento, setTipoMovimento] = useState<"ENTRATA" | "USCITA">("USCITA");
  const [importo, setImporto] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [isInviando, setIsInviando] = useState(false);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("TUTTO");
  const [filtroComparto, setFiltroComparto] = useState<string>("TUTTO");

  const caricaMovimenti = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("movimenti_contabili").select("*").eq("sala_id", salaId).order("data_operazione", { ascending: false });
      if (error) throw error;
      if (data) setMovimenti(data);
    } catch (error: any) { alert("Errore: " + error.message); } finally { setLoading(false); }
  };

  useEffect(() => { if (salaId) caricaMovimenti(); }, [salaId]);

  const handleInserisciPrimaNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importo || isNaN(parseFloat(importo)) || parseFloat(importo) <= 0) return;
    try {
      setIsInviando(true);
      await supabase.from("movimenti_contabili").insert([{
        sala_id: salaId,
        tipo_movimento: tipoMovimento,
        causale_origine: "Prima Nota",
        importo: parseFloat(importo),
        descrizione: descrizione.trim() || "Movimento di Prima Nota",
      }]);
      setImporto(""); setDescrizione("");
      await caricaMovimenti();
    } catch (error: any) { alert("Errore: " + error.message); } finally { setIsInviando(false); }
  };

  const movimentiFiltrati = movimenti.filter((m) => {
    if (filtroComparto !== "TUTTO" && m.causale_origine !== filtroComparto) return false;
    const dataMov = new Date(m.data_operazione);
    const now = new Date();
    if (filtroPeriodo === "OGGI" && dataMov.toDateString() !== now.toDateString()) return false;
    if (filtroPeriodo === "MESE" && (dataMov.getMonth() !== now.getMonth() || dataMov.getFullYear() !== now.getFullYear())) return false;
    return true;
  });

  const totaleEntrate = movimentiFiltrati.filter((m) => m.tipo_movimento === "ENTRATA").reduce((acc, m) => acc + Number(m.importo), 0);
  const totaleUscite = movimentiFiltrati.filter((m) => m.tipo_movimento === "USCITA").reduce((acc, m) => acc + Number(m.importo), 0);
  const saldoNetto = totaleEntrate - totaleUscite;

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 flex items-start justify-center">
      <div className="w-full max-w-7xl bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Amministrazione Sala</p>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Movimenti Contabili</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">🖨️ ANTEPRIMA STAMPA</button>
            <button onClick={onBack} className="bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700/50 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">TORRE DI CONTROLLO</button>
          </div>
        </div>

        {/* FILTRI E STATISTICHE (omessi per brevità, mantieni quelli che avevi) */}
        
        {/* TABELLA CONTABILE (Sostituisce il Registro Giornale) */}
        <div className="bg-transparent border border-gray-700 rounded-2xl p-6 min-h-[400px]">
          <h3 className="text-sm font-black uppercase text-white mb-6 border-b border-gray-800 pb-4">Registro Giornale</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 text-[10px] uppercase font-black">
                  <th className="pb-4">Data</th>
                  <th className="pb-4">Descrizione</th>
                  <th className="pb-4">Comparto</th>
                  <th className="pb-4 text-right">Entrata</th>
                  <th className="pb-4 text-right">Uscita</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {movimentiFiltrati.map((m) => (
                  <tr key={m.id} className="border-b border-gray-800/50 hover:bg-[#1A1D24]">
                    <td className="py-4 text-gray-300">{new Date(m.data_operazione).toLocaleDateString()}</td>
                    <td className="py-4 font-bold text-white">{m.descrizione}</td>
                    <td className="py-4 text-gray-400">{m.causale_origine}</td>
                    <td className="py-4 text-right text-green-400">{m.tipo_movimento === 'ENTRATA' ? `+€${Number(m.importo).toFixed(2)}` : '-'}</td>
                    <td className="py-4 text-right text-red-400">{m.tipo_movimento === 'USCITA' ? `€${Number(m.importo).toFixed(2)}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FORM PRIMA NOTA (omesso per brevità, mantieni quello che avevi) */}
      </div>
    </div>
  );
}