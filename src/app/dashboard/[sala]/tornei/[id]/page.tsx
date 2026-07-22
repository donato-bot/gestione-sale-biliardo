"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function DettaglioTorneoPage() {
  const params = useParams();
  const router = useRouter();
  const salaId = (params?.sala || Object.values(params)[0]) as string;
  const torneoId = (params?.id || Object.values(params)[1]) as string;

  const [torneo, setTorneo] = useState<any>(null);
  const [iscritti, setIscritti] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerando, setIsGenerando] = useState(false);

  // Form Nuovo Iscritto
  const [tipoIscritto, setTipoIscritto] = useState<'SOCIO' | 'ESTERNO'>('SOCIO');
  const [nomeEsterno, setNomeEsterno] = useState("");
  const [quotaVersata, setQuotaVersata] = useState(false);

  useEffect(() => {
    if (salaId && torneoId) {
      caricaDatiTorneo();
    }
  }, [salaId, torneoId]);

  const caricaDatiTorneo = async () => {
    // 1. Carica info Torneo
    const { data: dataTorneo } = await supabase
      .from('tornei')
      .select('*')
      .eq('id', torneoId)
      .single();
      
    if (dataTorneo) setTorneo(dataTorneo);

    // 2. Carica Iscritti
    const { data: dataIscritti } = await supabase
      .from('iscritti_torneo')
      .select('*')
      .eq('torneo_id', torneoId)
      .order('created_at', { ascending: true });

    if (dataIscritti) setIscritti(dataIscritti);
  };

  // ==========================================
  // LA FUNZIONE CHE GENERA IL TABELLONE
  // ==========================================
  const generaTabellone = async () => {
    setIsGenerando(true);

    try {
      if (iscritti.length !== 16) {
        alert("Devono esserci esattamente 16 iscritti per generare gli Ottavi di Finale!");
        setIsGenerando(false);
        return;
      }

      const partite = [];
      let partitaNum = 1;

      // Accoppiamo i giocatori a 2 a 2 per gli Ottavi
      for (let i = 0; i < 16; i += 2) {
        partite.push({
          sala_id: torneo.sala_id,   // <--- FIX BLINDATO: PRENDE L'ID DIRETTAMENTE DAL TORNEO SCARICATO!
          torneo_id: torneoId,
          turno: "Ottavi",
          partita_num: partitaNum,
          giocatore1_id: iscritti[i].giocatore_id || iscritti[i].id,
          giocatore1_nome: iscritti[i].nome_giocatore,
          giocatore2_id: iscritti[i+1].giocatore_id || iscritti[i+1].id,
          giocatore2_nome: iscritti[i+1].nome_giocatore,
          stato: "da_giocare"
        });
        partitaNum++;
      }

      // Salviamo le partite nel database
      const { error: insertError } = await supabase
        .from('partite_torneo')
        .insert(partite);

      if (insertError) throw insertError;

      // Aggiorniamo lo stato del torneo
      const { error: updateError } = await supabase
        .from('tornei')
        .update({ stato: 'IN CORSO' })
        .eq('id', torneoId);

      if (updateError) throw updateError;

      alert("✅ Tabellone generato con successo!");
      caricaDatiTorneo(); // Ricarica la pagina con il nuovo stato

    } catch (error: any) {
      alert("ERRORE DATABASE (Generazione Tabellone): " + error.message);
    } finally {
      setIsGenerando(false);
    }
  };

  if (!torneo) return <div className="p-10 text-white font-black uppercase text-xl">Caricamento torneo...</div>;

  const maxIscritti = torneo.max_iscritti || 16;
  const isCompleto = iscritti.length >= maxIscritti;

  return (
    <div className="max-w-7xl mx-auto bg-[#0B0D14] rounded-[2rem] border border-[#1E222B] p-8 shadow-2xl text-white">
      
      {/* HEADER TORNEO */}
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-start gap-4 border-b border-[#1E222B] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${torneo.stato === 'IN CORSO' ? 'bg-yellow-500' : 'bg-[#00E676] animate-pulse'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${torneo.stato === 'IN CORSO' ? 'text-yellow-500' : 'text-[#00E676]'}`}>
              {torneo.stato || "ISCRIZIONI APERTE"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">{torneo.nome || "Torneo"}</h1>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-[#2A2E39] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
            ⚙️ Modifica Bando
          </button>
          <button className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/50 text-blue-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
            🔗 Condividi Club
          </button>
          <button onClick={() => router.back()} className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-[#2A2E39] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors">
            ← Torna ai Tornei
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNA SINISTRA: ELENCO GIOCATORI */}
        <div className="lg:col-span-8 bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-6 h-fit">
          <div className="flex justify-between items-center mb-6 border-b border-[#2A2E39] pb-4">
            <h3 className="text-sm font-black uppercase tracking-widest">Elenco Giocatori</h3>
            <span className="bg-black border border-[#2A2E39] text-gray-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
              ISCRITTI: {iscritti.length} / {maxIscritti}
            </span>
          </div>

          <div className="space-y-2">
            {iscritti.map((iscritto, index) => (
              <div key={iscritto.id} className="bg-black border border-[#2A2E39] p-4 rounded-xl flex justify-between items-center group hover:border-gray-600 transition-colors">
                <span className="font-black uppercase text-sm text-gray-300">
                  <span className="text-gray-600 mr-4">{index + 1}.</span> 
                  {iscritto.nome_giocatore}
                </span>
                <span className={`text-[10px] font-black px-3 py-1 rounded border uppercase tracking-widest ${iscritto.pagato ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676]' : 'bg-red-500/10 border-red-500 text-red-500'}`}>
                  {iscritto.pagato ? '✓ PAGATO' : 'DA PAGARE'}
                </span>
              </div>
            ))}

            {iscritti.length === 0 && (
              <div className="text-center py-8 text-gray-500 font-bold uppercase tracking-widest text-xs">
                Nessun giocatore ancora iscritto.
              </div>
            )}
          </div>
        </div>

        {/* COLONNA DESTRA: INSERIMENTO / GENERAZIONE TABELLONE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-6 sticky top-6">
            <h3 className="text-sm font-black text-[#FF0055] uppercase tracking-widest mb-6 border-b border-[#2A2E39] pb-4">
              Nuovo Iscritto
            </h3>
            
            {torneo.stato === 'IN CORSO' ? (
               <div className="bg-black border border-[#2A2E39] p-6 rounded-xl text-center">
                 <p className="text-yellow-500 font-black uppercase text-sm mb-2">TORNEO IN CORSO</p>
                 <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Il tabellone è già stato generato.</p>
               </div>
            ) : (
              <>
                <div className="flex gap-2 p-1 bg-black rounded-xl border border-[#2A2E39] mb-6">
                  <button onClick={() => setTipoIscritto('SOCIO')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoIscritto === 'SOCIO' ? 'bg-[#FF0055] text-white' : 'text-gray-500 hover:text-white'}`}>SOCIO CLUB</button>
                  <button onClick={() => setTipoIscritto('ESTERNO')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${tipoIscritto === 'ESTERNO' ? 'bg-[#2A2E39] text-white' : 'text-gray-500 hover:text-white'}`}>ESTERNO</button>
                </div>

                {tipoIscritto === 'SOCIO' ? (
                  <div className="mb-4">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2 block">Seleziona dal Database</label>
                    <select className="w-full bg-black text-white font-bold p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#FF0055] appearance-none">
                      <option>-- Clicca per cercare --</option>
                      {/* Qui mappa i soci */}
                    </select>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2 block">Nome Giocatore Esterno</label>
                    <input 
                      type="text" 
                      value={nomeEsterno}
                      onChange={(e) => setNomeEsterno(e.target.value)}
                      placeholder="Es. Mario Rossi" 
                      className="w-full bg-black text-white font-bold p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#FF0055]" 
                    />
                  </div>
                )}

                <div className="mb-6 bg-black border border-[#2A2E39] p-4 rounded-xl flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={quotaVersata}
                    onChange={(e) => setQuotaVersata(e.target.checked)}
                    className="w-5 h-5 accent-[#FF0055] rounded" 
                  />
                  <label className="text-xs font-black uppercase tracking-widest text-white">Quota Versata (€ {torneo.quota_iscrizione || 25})</label>
                </div>

                {!isCompleto ? (
                  <button className="w-full bg-[#2A2E39] hover:bg-gray-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg">
                    ISCRIVI GIOCATORE
                  </button>
                ) : (
                  <button disabled className="w-full bg-black border border-[#2A2E39] text-gray-500 py-4 rounded-xl font-black uppercase tracking-widest text-xs mb-4">
                    TORNEO COMPLETO
                  </button>
                )}

                {/* BOTTONE GENERAZIONE TABELLONE - APPARE SOLO QUANDO IL TORNEO E' PIENO */}
                {isCompleto && (
                  <button 
                    onClick={generaTabellone}
                    disabled={isGenerando}
                    className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white py-5 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse border border-blue-400"
                  >
                    {isGenerando ? "ELABORAZIONE..." : "GENERA TABELLONE"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}