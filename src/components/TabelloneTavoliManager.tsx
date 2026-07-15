"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface TabelloneProps {
  salaId: string;
  onMovimentoRegistrato: () => void;
}

interface Tavolo {
  id: string;
  numero_tavolo: number;
  stato: "DISPONIBILE" | "OCCUPATO";
  orario_inizio: string | null;
}

const TARIFFA_ORARIA = 9.00;

export default function TabelloneTavoliManager({ salaId, onMovimentoRegistrato }: TabelloneProps) {
  const [tavoli, setTavoli] = useState<Tavolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [orariCorrenti, setOrariCorrenti] = useState<{ [key: string]: string }>({});

  // Stati per la gestione del Pop-up di chiusura
  const [tavoloInChiusura, setTavoloInChiusura] = useState<Tavolo | null>(null);
  const [datiChiusura, setDatiChiusura] = useState({ minuti: 0, costo: 0 });
  const [modalitaPagamento, setModalitaPagamento] = useState<"SCELTA" | "SUBITO" | "SOSPESO">("SCELTA");
  const [nominativoSospeso, setNominativoSospeso] = useState("");
  const [salvataggioInCorso, setSalvataggioInCorso] = useState(false);

  const caricaTavoli = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) return;

      let { data, error } = await supabase
        .from("tavoli")
        .select("*")
        .eq("sala_id", salaId)
        .order("numero_tavolo", { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        const nuoviTavoli = Array.from({ length: 5 }, (_, i) => ({
          sala_id: salaId,
          manager_email: email.toLowerCase(),
          numero_tavolo: i + 1,
          stato: "DISPONIBILE",
          orario_inizio: null
        }));

        const { data: inseriti, error: insertError } = await supabase
          .from("tavoli")
          .insert(nuoviTavoli)
          .select();

        if (insertError) throw insertError;
        data = inseriti;
      }

      setTavoli(data || []);
    } catch (err: any) {
      console.error("Errore caricamento tavoli:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaTavoli();
  }, [caricaTavoli]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nuoviOrari: { [key: string]: string } = {};
      tavoli.forEach(t => {
        if (t.stato === "OCCUPATO" && t.orario_inizio) {
          const inizio = new Date(t.orario_inizio).getTime();
          const adesso = new Date().getTime();
          const diffMs = adesso - inizio;
          
          const ore = Math.floor(diffMs / 3600000);
          const minuti = Math.floor((diffMs % 3600000) / 60000);
          const secondi = Math.floor((diffMs % 60000) / 1000);
          
          nuoviOrari[t.id] = `${ore.toString().padStart(2, '0')}:${minuti.toString().padStart(2, '0')}:${secondi.toString().padStart(2, '0')}`;
        }
      });
      setOrariCorrenti(nuoviOrari);
    }, 1000);

    return () => clearInterval(interval);
  }, [tavoli]);

  const avviaGioco = async (tavoloId: string) => {
    try {
      const { error } = await supabase
        .from("tavoli")
        .update({
          stato: "OCCUPATO",
          orario_inizio: new Date().toISOString()
        })
        .eq("id", tavoloId);

      if (error) throw error;
      await caricaTavoli();
    } catch (err: any) {
      alert("Errore avvio gioco: " + err.message);
    }
  };

  // 1. APRE IL POPUP DI CHIUSURA INVECE DI SALVARE SUBITO
  const apriPannelloChiusura = (tavolo: Tavolo) => {
    if (!tavolo.orario_inizio) return;

    const inizio = new Date(tavolo.orario_inizio).getTime();
    const adesso = new Date().getTime();
    const minutiPassati = Math.max(1, Math.round((adesso - inizio) / 60000)); 
    const costoGenerato = Number(((minutiPassati * TARIFFA_ORARIA) / 60).toFixed(2));

    setDatiChiusura({ minuti: minutiPassati, costo: costoGenerato });
    setTavoloInChiusura(tavolo);
    setModalitaPagamento("SCELTA");
    setNominativoSospeso("");
  };

  // 2. CONFERMA E SALVA NEL DATABASE IN BASE ALLA SCELTA
  const confermaChiusura = async () => {
    if (!tavoloInChiusura) return;
    
    if (modalitaPagamento === "SOSPESO" && nominativoSospeso.trim() === "") {
      alert("Inserisci il nominativo del cliente per il conto sospeso.");
      return;
    }

    setSalvataggioInCorso(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      
      const tipoMovimento = modalitaPagamento === "SUBITO" ? "ENTRATA" : "SOSPESO";
      const descrizioneMovimento = modalitaPagamento === "SUBITO" 
        ? `Incasso Tavolo ${tavoloInChiusura.numero_tavolo} (${datiChiusura.minuti} min)`
        : `Credito Tavolo ${tavoloInChiusura.numero_tavolo} - Nominativo: ${nominativoSospeso.toUpperCase()}`;

      // Iniezione nel Libro Mastro
      const { error: mastroError } = await supabase.from("libro_mastro").insert([
        {
          sala_id: salaId,
          manager_email: email,
          tipo: tipoMovimento,
          categoria: modalitaPagamento === "SUBITO" ? "Gioco Biliardo" : "Credito Sospeso",
          importo: datiChiusura.costo,
          descrizione: descrizioneMovimento,
          id_chiusura: null
        }
      ]);

      if (mastroError) throw mastroError;

      // Libera il tavolo
      const { error: tavoloError } = await supabase
        .from("tavoli")
        .update({
          stato: "DISPONIBILE",
          orario_inizio: null
        })
        .eq("id", tavoloInChiusura.id);

      if (tavoloError) throw tavoloError;

      // Resetta gli stati e rinfresca
      setTavoloInChiusura(null);
      onMovimentoRegistrato();
      await caricaTavoli();

    } catch (err: any) {
      alert("Errore automazione cassa: " + err.message);
    } finally {
      setSalvataggioInCorso(false);
    }
  };

  if (loading) return <p className="text-xs font-black text-gray-600 animate-pulse uppercase tracking-widest">Sincronizzazione Biliardi...</p>;

  return (
    <>
      {/* GRIGLIA DEI 5 TAVOLI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {tavoli.map((t) => {
          const isOccupato = t.stato === "OCCUPATO";
          return (
            <div key={t.id} className={`border p-5 rounded-2xl flex flex-col justify-between transition-all ${isOccupato ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "bg-black border-gray-800"}`}>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Biliardo</span>
                  <span className={`w-2 h-2 rounded-full ${isOccupato ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                </div>
                <h3 className="text-2xl font-black italic tracking-tight text-white mb-1">TAVOLO {t.numero_tavolo}</h3>
                <p className={`text-[10px] font-black tracking-wider uppercase mb-4 ${isOccupato ? "text-amber-400" : "text-emerald-400"}`}>
                  {isOccupato ? "🔴 In Gioco" : "🟢 Libero"}
                </p>
              </div>

              <div className="space-y-3">
                {isOccupato && (
                  <div className="bg-[#0a0b0f] border border-gray-800/60 p-2.5 rounded-xl text-center">
                    <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Tempo Scorso</p>
                    <p className="font-mono text-md font-black text-white tracking-widest">{orariCorrenti[t.id] || "00:00:00"}</p>
                    <p className="text-[9px] text-gray-400 font-bold mt-1">Tariffa: 9,00 €/h</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => isOccupato ? apriPannelloChiusura(t) : avviaGioco(t.id)}
                  className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isOccupato ? "bg-amber-600 hover:bg-amber-500 text-black" : "bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400"}`}
                >
                  {isOccupato ? "🛑 STOP & CONTO" : "⚡ AVVIA GIOCO"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* POP-UP (MODAL) DI CHIUSURA TAVOLO */}
      {tavoloInChiusura && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#11131a] border border-gray-800 rounded-[2rem] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black uppercase italic text-white">TAVOLO {tavoloInChiusura.numero_tavolo}</h3>
                <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase mt-1">Riepilogo Partita</p>
              </div>
              <button onClick={() => setTavoloInChiusura(null)} className="text-gray-500 hover:text-red-500 font-black">✖</button>
            </div>

            <div className="bg-black border border-gray-800 rounded-2xl p-6 mb-8 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Tempo Giocato</p>
                <p className="text-xl font-bold text-white">{datiChiusura.minuti} Minuti</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Totale da Pagare</p>
                <p className="text-3xl font-black text-amber-400">€ {datiChiusura.costo.toFixed(2)}</p>
              </div>
            </div>

            {/* FASE 1: SCELTA PAGAMENTO */}
            {modalitaPagamento === "SCELTA" && (
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setModalitaPagamento("SUBITO")}
                  className="bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  💰 Pagato
                </button>
                <button 
                  onClick={() => setModalitaPagamento("SOSPESO")}
                  className="bg-gray-800 hover:bg-gray-700 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border border-gray-700"
                >
                  📝 In Conto
                </button>
              </div>
            )}

            {/* FASE 2A: CONFERMA INCASSO SUBITO */}
            {modalitaPagamento === "SUBITO" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-bold text-center">
                  Il movimento verrà registrato immediatamente come ENTRATA nella Cassa di questo turno.
                </div>
                <button 
                  onClick={confermaChiusura}
                  disabled={salvataggioInCorso}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  {salvataggioInCorso ? "Registrazione..." : "✓ Conferma Incasso"}
                </button>
              </div>
            )}

            {/* FASE 2B: INSERIMENTO NOMINATIVO PER CREDITO SOSPESO */}
            {modalitaPagamento === "SOSPESO" && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Nominativo Cliente</label>
                  <input 
                    type="text" 
                    value={nominativoSospeso}
                    onChange={(e) => setNominativoSospeso(e.target.value)}
                    placeholder="Es. Fernando..."
                    className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-amber-500 text-sm uppercase"
                  />
                </div>
                <button 
                  onClick={confermaChiusura}
                  disabled={salvataggioInCorso}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all mt-4"
                >
                  {salvataggioInCorso ? "Registrazione..." : "✓ Conferma Conto Sospeso"}
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}