"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface TabelloneProps {
  salaId: string;
  onMovimentoRegistrato: () => void; // Per aggiornare i totalizzatori della cassa in tempo reale
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

  // Inizializza o carica i 5 tavoli dal DB
  const caricaTavoli = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) return;

      // Legge i tavoli esistenti
      let { data, error } = await supabase
        .from("tavoli")
        .select("*")
        .eq("sala_id", salaId)
        .order("numero_tavolo", { ascending: true });

      if (error) throw error;

      // Se non ci sono tavoli, creiamo i 5 tavoli di default per questa sala
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

  // Timer per aggiornare i contatori dei minuti in tempo reale sullo schermo
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

  // AVVIA GIOCO (Accende le luci del tavolo)
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

  // FERMA GIOCO E INIETTA IN CASSA (Spegne le luci e fa il conto)
  const fermaGioco = async (tavolo: Tavolo) => {
    if (!tavolo.orario_inizio) return;

    const inizio = new Date(tavolo.orario_inizio).getTime();
    const adesso = new Date().getTime();
    const minutiPassati = Math.max(1, Math.round((adesso - inizio) / 60000)); // Minimo 1 minuto
    
    // Calcolo matematico della quota (9€/ora = 0.15€ al minuto)
    const costoGenerato = Number(((minutiPassati * TARIFFA_ORARIA) / 60).toFixed(2));

    if (!window.confirm(`🏁 Chiudere Tavolo ${tavolo.numero_tavolo}?\nTempo giocato: ${minutiPassati} min.\nConto totale automatico: € ${costoGenerato.toFixed(2)}`)) {
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;
      if (!email) throw new Error("Utente non autenticato");

      // 1. Iniezione automatica e silenziosa nel Libro Mastro
      const { error: mastroError } = await supabase.from("libro_mastro").insert([
        {
          sala_id: salaId,
          manager_email: email.toLowerCase(),
          tipo: "ENTRATA",
          categoria: "Gioco Biliardo",
          importo: costoGenerato,
          descrizione: `Incasso automatico Tavolo ${tavolo.numero_tavolo} (${minutiPassati} min)`,
          id_chiusura: null
        }
      ]);

      if (mastroError) throw mastroError;

      // 2. Libera il tavolo sul DB per la prossima partita
      const { error: tavoloError } = await supabase
        .from("tavoli")
        .update({
          stato: "DISPONIBILE",
          orario_inizio: null
        })
        .eq("id", tavolo.id);

      if (tavoloError) throw tavoloError;

      // 3. Notifica la plancia principale per rinfrescare istantaneamente i totalizzatori della cassa
      onMovimentoRegistrato();
      await caricaTavoli();

    } catch (err: any) {
      alert("Errore automazione cassa: " + err.message);
    }
  };

  if (loading) return <p className="text-xs font-black text-gray-600 animate-pulse uppercase tracking-widest">Sincronizzazione Biliardi...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {tavoli.map((t) => {
        const isOccupato = t.stato === "OCCUPATO";
        return (
          <div key={t.id} className={`border p-5 rounded-2xl flex flex-col justify-between transition-all ${isOccupato ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "bg-[#11131a] border-gray-800"}`}>
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
                <div className="bg-black/40 border border-gray-800/60 p-2.5 rounded-xl text-center">
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">Tempo Scorso</p>
                  <p className="font-mono text-md font-black text-white tracking-widest">{orariCorrenti[t.id] || "00:00:00"}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-1">Tariffa: 9,00 €/h</p>
                </div>
              )}

              <button
                type="button"
                onClick={() => isOccupato ? fermaGioco(t) : avviaGioco(t.id)}
                className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isOccupato ? "bg-amber-600 hover:bg-amber-500 text-black" : "bg-cyan-950/50 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-400"}`}
              >
                {isOccupato ? "🛑 STOP & CONTO" : "⚡ AVVIA GIOCO"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}