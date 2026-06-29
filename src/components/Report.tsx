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

  // Stati del Form Prima Nota
  const [tipoMovimento, setTipoMovimento] = useState<"ENTRATA" | "USCITA">("USCITA");
  const [importo, setImporto] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [isInviando, setIsInviando] = useState(false);

  // Stati per i Filtri
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("TUTTO");
  const [filtroComparto, setFiltroComparto] = useState<string>("TUTTO");

  // Funzione per caricare i movimenti contabili dal database
  const caricaMovimenti = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("movimenti_contabili")
        .select("*")
        .eq("sala_id", salaId)
        .order("data_operazione", { ascending: false });

      if (error) throw error;
      if (data) setMovimenti(data);
    } catch (error: any) {
      alert("Errore nel caricamento dei dati contabili: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salaId) {
      caricaMovimenti();
    }
  }, [salaId]);

  // Gestione inserimento manuale Prima Nota
  const handleInserisciPrimaNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importo || isNaN(parseFloat(importo)) || parseFloat(importo) <= 0) {
      return alert("Inserisci un importo valido e maggiore di zero.");
    }

    try {
      setIsInviando(true);
      const { error } = await supabase.from("movimenti_contabili").insert([
        {
          sala_id: salaId,
          tipo_movimento: tipoMovimento,
          causale_origine: "Prima Nota",
          importo: parseFloat(importo),
          descrizione: descrizione.trim() || "Movimento di Prima Nota",
        },
      ]);

      if (error) throw error;

      // Reset form e ricarica lista
      setImporto("");
      setDescrizione("");
      await caricaMovimenti();
    } catch (error: any) {
      alert("Errore durante l'inserimento: " + error.message);
    } finally {
      setIsInviando(false);
    }
  };

  // Applicazione dei Filtri Client-Side
  const now = new Date();
  const movimentiFiltrati = movimenti.filter((m) => {
    // 1. Filtro Comparto
    if (filtroComparto !== "TUTTO" && m.causale_origine !== filtroComparto) {
      return false;
    }

    // 2. Filtro Periodo
    const dataMov = new Date(m.data_operazione);
    if (filtroPeriodo === "OGGI") {
      if (dataMov.toDateString() !== now.toDateString()) return false;
    } else if (filtroPeriodo === "MESE") {
      if (
        dataMov.getMonth() !== now.getMonth() ||
        dataMov.getFullYear() !== now.getFullYear()
      ) {
        return false;
      }
    }
    
    return true;
  });

  // Calcolo dei totali basato ESCLUSIVAMENTE sui movimenti filtrati
  const totaleEntrate = movimentiFiltrati
    .filter((m) => m.tipo_movimento === "ENTRATA")
    .reduce((acc, m) => acc + Number(m.importo), 0);

  const totaleUscite = movimentiFiltrati
    .filter((m) => m.tipo_movimento === "USCITA")
    .reduce((acc, m) => acc + Number(m.importo), 0);

  const saldoNetto = totaleEntrate - totaleUscite;

  return (
    <div className="min-h-screen bg-[#E6F0EB] py-10 px-4 sm:px-6 lg:px-8 font-sans animate-in fade-in duration-300 flex items-start justify-center">
      <div className="w-full max-w-7xl bg-[#0B0D14] border border-[#1E222B] rounded-[2.5rem] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        {/* HEADER & PULSANTE RITORNO */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-[#1E222B] pb-6 gap-6">
          <div>
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Amministrazione Sala</p>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">Movimenti Contabili</h2>
          </div>
          <button 
            onClick={onBack}
            className="bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700/50 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            TORRE DI CONTROLLO
          </button>
        </div>

        {/* BARRA DEI FILTRI */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 block">Filtra per Periodo</label>
            <select 
              value={filtroPeriodo} 
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="w-full bg-[#1A1D24] text-white border border-[#2A2E39] p-3 rounded-xl focus:outline-none focus:border-[#00ADC6] transition-colors font-bold text-sm"
            >
              <option value="TUTTO">Tutto lo storico</option>
              <option value="OGGI">Solo Oggi</option>
              <option value="MESE">Questo Mese</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-wider mb-1 block">Filtra per Comparto</label>
            <select 
              value={filtroComparto} 
              onChange={(e) => setFiltroComparto(e.target.value)}
              className="w-full bg-[#1A1D24] text-white border border-[#2A2E39] p-3 rounded-xl focus:outline-none focus:border-[#00ADC6] transition-colors font-bold text-sm"
            >
              <option value="TUTTO">Tutti i comparti</option>
              <option value="Biliardi">Gioco (Biliardi)</option>
              <option value="Bar">Servizi Bar</option>
              <option value="Magazzino">Acquisti Magazzino</option>
              <option value="Prima Nota">Spese Varie (Prima Nota)</option>
              <option value="Incasso Sospeso">Incasso Sospeso (Debiti Saldati)</option>
            </select>
          </div>
        </div>

        {/* PANNELLO STATISTICHE IN ALTO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-[#1A1D24] border border-[#2A2E39] p-6 rounded-2xl transition-all">
            <p className="text-[10px] text-green-400 font-black uppercase tracking-widest mb-1">Totale Incassi</p>
            <p className="text-2xl font-black text-white">€ {totaleEntrate.toFixed(2)}</p>
          </div>
          <div className="bg-[#1A1D24] border border-[#2A2E39] p-6 rounded-2xl transition-all">
            <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">Totale Uscite</p>
            <p className="text-2xl font-black text-white">€ {totaleUscite.toFixed(2)}</p>
          </div>
          <div className="bg-[#1A1D24] border border-[#2A2E39] p-6 rounded-2xl transition-all">
            <p className="text-[10px] text-[#00E5FF] font-black uppercase tracking-widest mb-1">Saldo Netto</p>
            <p className={`text-2xl font-black ${saldoNetto >= 0 ? "text-green-400" : "text-red-400"}`}>
              € {saldoNetto.toFixed(2)}
            </p>
          </div>
        </div>

        {/* INTERFACCIA A DUE COLONNE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLONNA SINISTRA: CRONOLOGIA REGISTRO (8 Colonne) */}
          <div className="lg:col-span-8 bg-transparent border border-gray-700 rounded-2xl p-6 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00ADC6] animate-pulse"></span>
                Registro Giornale
              </h3>
              <span className="bg-[#00ADC6]/20 text-[#00ADC6] border border-[#00ADC6]/30 px-3 py-1 rounded-md text-[10px] font-black tracking-widest">
                {movimentiFiltrati.length} OPERAZIONI
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[600px]">
              {loading ? (
                <p className="text-center text-gray-500 text-sm font-bold uppercase py-10 tracking-wider">Caricamento in corso...</p>
              ) : movimentiFiltrati.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 py-10">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-gray-500 font-black text-sm uppercase tracking-widest">Nessun movimento registrato</p>
                </div>
              ) : (
                movimentiFiltrati.map((mov) => (
                  <div key={mov.id} className="bg-[#1A1D24] border border-[#2A2E39] p-4 rounded-xl flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-xl w-10 h-10 rounded-lg flex items-center justify-center font-bold ${mov.tipo_movimento === "ENTRATA" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                        {mov.tipo_movimento === "ENTRATA" ? "↓" : "↑"}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{mov.descrizione}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase">
                            {new Date(mov.data_operazione).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-[9px] bg-gray-800 text-gray-400 font-black uppercase px-2 py-0.5 rounded-sm">
                            {mov.causale_origine}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className={`font-black text-base whitespace-nowrap ${mov.tipo_movimento === "ENTRATA" ? "text-green-400" : "text-red-400"}`}>
                      {mov.tipo_movimento === "ENTRATA" ? "+" : "-"} € {Number(mov.importo).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* COLONNA DESTRA: INSERIMENTO MANUALE PRIMA NOTA (4 Colonne) */}
          <div className="lg:col-span-4 bg-transparent border border-gray-700 rounded-2xl p-6 h-fit sticky top-6">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-white border-b border-gray-800 pb-4">
              Scrittura Prima Nota
            </h3>

            <form onSubmit={handleInserisciPrimaNota} className="space-y-6">
              {/* Selezione Flusso */}
              <div className="flex gap-2 bg-[#1A1D24] p-1 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setTipoMovimento("USCITA")}
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoMovimento === "USCITA" ? "bg-red-500 text-white shadow-lg" : "bg-white text-black hover:bg-gray-200"}`}
                >
                  Uscita (Spesa)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMovimento("ENTRATA")}
                  className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoMovimento === "ENTRATA" ? "bg-green-500 text-white shadow-lg" : "bg-white text-black hover:bg-gray-200"}`}
                >
                  Entrata Extra
                </button>
              </div>

              {/* Input Dati */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Importo (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-white text-black font-bold p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors"
                    placeholder="0.00"
                    value={importo}
                    onChange={(e) => setImporto(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1.5 block">Descrizione Voce</label>
                  <textarea
                    className="w-full bg-white text-black font-medium p-3.5 rounded-lg border-2 border-transparent focus:outline-none focus:border-[#00ADC6] transition-colors h-24 resize-none"
                    placeholder="Es. Pagamento fornitura caffè bar, bolletta luce..."
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Bottone Registrazione */}
              <button
                type="submit"
                disabled={isInviando}
                className="w-full bg-[#00ADC6] hover:bg-[#008A9E] text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_5px_20px_rgba(0,173,198,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>{isInviando ? "Registrazione..." : "Registra Movimento"}</span>
                <span className="text-lg">📝</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}