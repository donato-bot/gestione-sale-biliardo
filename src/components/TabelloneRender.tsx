"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";

export default function TabelloneRender({ 
  partite, 
  vistaCompatta = false,
  onAggiorna
}: { 
  partite: any[], 
  vistaCompatta?: boolean,
  onAggiorna?: () => void 
}) {
  // Stati per il pop-up di arbitraggio
  const [partitaSelezionata, setPartitaSelezionata] = useState<any>(null);
  const [punti1, setPunti1] = useState<number | string>("");
  const [punti2, setPunti2] = useState<number | string>("");
  const [isSalvataggio, setIsSalvataggio] = useState(false);

  const getNomeTurno = (numPartite: number) => {
    if (numPartite === 1) return "Finale";
    if (numPartite === 2) return "Semifinali";
    if (numPartite === 4) return "Quarti di Finale";
    if (numPartite === 8) return "Ottavi di Finale";
    if (numPartite === 16) return "Sedicesimi";
    return `Turno Preliminare`;
  };

  const chiudiModal = () => {
    setPartitaSelezionata(null);
    setPunti1("");
    setPunti2("");
  };

  const salvaRisultato = async () => {
    if (!partitaSelezionata) return;
    
    const score1 = Number(punti1);
    const score2 = Number(punti2);

    if (score1 === score2) {
      alert("In un torneo ad eliminazione diretta non può esserci un pareggio!");
      return;
    }

    setIsSalvataggio(true);

    try {
      const isVincitore1 = score1 > score2;
      const vincitore_id = isVincitore1 ? partitaSelezionata.giocatore1_id : partitaSelezionata.giocatore2_id;
      const vincitore_nome = isVincitore1 ? partitaSelezionata.giocatore1_nome : partitaSelezionata.giocatore2_nome;

      // 1. CHIUUDIAMO LA PARTITA CORRENTE
      const { error: errUpdate } = await supabase
        .from('partite_torneo')
        .update({
          punteggio1: score1,
          punteggio2: score2,
          vincitore_id: vincitore_id,
          vincitore_nome: vincitore_nome,
          stato: 'conclusa'
        })
        .eq('id', partitaSelezionata.id);

      if (errUpdate) throw errUpdate;

      // 2. LOGICA DI AVANZAMENTO AUTOMATICO AL TURNO SUCCESSIVO
      const turniMap: Record<string, string> = {
        "Ottavi": "Quarti",
        "Quarti": "Semifinali",
        "Semifinali": "Finale",
        "Finale": "Vincitore Assoluto"
      };

      const prossimoTurno = turniMap[partitaSelezionata.turno];

      // Se non è la finale, avanziamo il giocatore
      if (prossimoTurno && prossimoTurno !== "Vincitore Assoluto") {
        // Calcola in quale slot deve andare il vincitore (Es. partita 1 e 2 vanno nella partita 1 del turno dopo)
        const proxPartitaNum = Math.ceil(partitaSelezionata.partita_num / 2);
        // Se la partita di provenienza è dispari va nello slot in alto (giocatore1), se è pari in basso (giocatore2)
        const isGiocatore1 = partitaSelezionata.partita_num % 2 !== 0;

        // Controlla se il "cassetto" della prossima partita esiste già
        const { data: proxPartita } = await supabase
          .from('partite_torneo')
          .select('*')
          .eq('torneo_id', partitaSelezionata.torneo_id)
          .eq('turno', prossimoTurno)
          .eq('partita_num', proxPartitaNum)
          .single();

        if (proxPartita) {
          // La partita esiste (es. c'è già l'altro sfidante in attesa), la aggiorniamo
          const updateData = isGiocatore1
            ? { giocatore1_id: vincitore_id, giocatore1_nome: vincitore_nome }
            : { giocatore2_id: vincitore_id, giocatore2_nome: vincitore_nome };

          await supabase
            .from('partite_torneo')
            .update(updateData)
            .eq('id', proxPartita.id);
        } else {
          // La partita non esiste ancora, la creiamo inserendo il primo vincitore
          const insertData: any = {
            sala_id: partitaSelezionata.sala_id,
            torneo_id: partitaSelezionata.torneo_id,
            turno: prossimoTurno,
            partita_num: proxPartitaNum,
            stato: 'da_giocare'
          };

          if (isGiocatore1) {
            insertData.giocatore1_id = vincitore_id;
            insertData.giocatore1_nome = vincitore_nome;
          } else {
            insertData.giocatore2_id = vincitore_id;
            insertData.giocatore2_nome = vincitore_nome;
          }

          await supabase.from('partite_torneo').insert([insertData]);
        }
      }

      chiudiModal();
      
      // Aggiorna i dati sulla pagina principale
      if (onAggiorna) {
        onAggiorna();
      } else {
        // Fallback robusto se il parent non ha passato la funzione di aggiornamento
        window.location.reload();
      }

    } catch (error: any) {
      alert("ERRORE SALVATAGGIO: " + error.message);
    } finally {
      setIsSalvataggio(false);
    }
  };

  return (
    <>
      <div className="flex gap-12 min-w-max h-full min-h-[600px] items-stretch pb-4">
        {[...new Set(partite.map(p => p.turno))].sort((a: any, b: any) => a - b).map(turnoNum => {
          const partiteTurno = partite.filter(p => p.turno === turnoNum);
          return (
            <div key={turnoNum} className="flex flex-col shrink-0" style={{ width: vistaCompatta ? '230px' : '320px' }}>
              <h3 className="text-center font-black uppercase tracking-widest text-[#00E5FF] bg-[#1A1D24] py-3 rounded-lg border border-[#2A2E39] text-sm mb-8 shadow-md">
                {getNomeTurno(partiteTurno.length)}
              </h3>
              <div className="flex-1 flex flex-col justify-around gap-4">
                {partiteTurno.map((p) => {
                  const isGiocabile = p.giocatore1_nome && p.giocatore2_nome && !p.giocatore1_nome.includes('In Attesa') && !p.giocatore2_nome.includes('In Attesa') && p.stato !== 'conclusa';
                  
                  return (
                    <div key={p.id} className={`bg-[#1A1D24] border ${p.stato === 'conclusa' ? 'border-[#00E676]/50 shadow-[0_0_15px_rgba(0,230,118,0.1)]' : 'border-[#2A2E39]'} rounded-xl p-4 shadow-lg transition-all`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Incontro #{p.partita_num}</span>
                        {p.stato === 'conclusa' && <span className="text-[9px] text-[#00E676] font-black uppercase tracking-widest bg-[#00E676]/10 px-2 py-0.5 rounded">Terminata</span>}
                      </div>
                      
                      <div className="space-y-2">
                        {/* Riga Giocatore 1 */}
                        <div className={`flex justify-between items-center bg-[#0B0D14] p-2.5 rounded-lg border ${p.vincitore_id === p.giocatore1_id && p.stato === 'conclusa' ? 'border-[#00E676]' : 'border-[#2A2E39]'}`}>
                          <span className={`font-bold truncate text-xs ${!p.giocatore1_nome || p.giocatore1_nome.includes('BYE') || p.giocatore1_nome === 'In Attesa' ? 'text-gray-600' : 'text-white'}`}>
                            {p.giocatore1_nome || 'In Attesa'}
                          </span>
                          {p.punteggio1 !== null && p.punteggio1 !== undefined && p.stato === 'conclusa' && (
                            <span className="text-white font-black text-sm ml-2">{p.punteggio1}</span>
                          )}
                        </div>

                        {/* Riga Giocatore 2 */}
                        <div className={`flex justify-between items-center bg-[#0B0D14] p-2.5 rounded-lg border ${p.vincitore_id === p.giocatore2_id && p.stato === 'conclusa' ? 'border-[#00E676]' : 'border-[#2A2E39]'}`}>
                          <span className={`font-bold truncate text-xs ${!p.giocatore2_nome || p.giocatore2_nome.includes('BYE') || p.giocatore2_nome === 'In Attesa' ? 'text-gray-600' : 'text-white'}`}>
                            {p.giocatore2_nome || 'In Attesa'}
                          </span>
                          {p.punteggio2 !== null && p.punteggio2 !== undefined && p.stato === 'conclusa' && (
                            <span className="text-white font-black text-sm ml-2">{p.punteggio2}</span>
                          )}
                        </div>
                      </div>

                      {/* TASTO ARBITRA */}
                      <button
                        onClick={() => setPartitaSelezionata(p)}
                        disabled={!isGiocabile}
                        className={`w-full mt-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border
                          ${p.stato === 'conclusa' 
                            ? 'bg-transparent border-[#2A2E39] text-gray-600 cursor-not-allowed' 
                            : isGiocabile 
                              ? 'bg-[#FF0055]/10 border-[#FF0055]/50 text-[#FF0055] hover:bg-[#FF0055] hover:text-white cursor-pointer active:scale-95'
                              : 'bg-transparent border-[#2A2E39] text-gray-600 cursor-not-allowed'}`}
                      >
                        {p.stato === 'conclusa' ? 'REFERTO CHIUSO' : 'ARBITRA'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* POP-UP DI ARBITRAGGIO */}
      {partitaSelezionata && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0B0D14] border border-[#2A2E39] rounded-[2rem] p-8 w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <h2 className="text-white font-black text-xl uppercase mb-1">Referto Partita</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Inserisci il punteggio finale</p>

            <div className="space-y-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-black uppercase tracking-wider">{partitaSelezionata.giocatore1_nome}</label>
                <input 
                  type="number" 
                  value={punti1}
                  onChange={(e) => setPunti1(e.target.value)}
                  placeholder="Es. 2"
                  className="bg-black border border-[#2A2E39] text-white text-2xl font-black p-4 rounded-xl focus:outline-none focus:border-[#00E5FF] text-center"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-sm font-black uppercase tracking-wider">{partitaSelezionata.giocatore2_nome}</label>
                <input 
                  type="number" 
                  value={punti2}
                  onChange={(e) => setPunti2(e.target.value)}
                  placeholder="Es. 0"
                  className="bg-black border border-[#2A2E39] text-white text-2xl font-black p-4 rounded-xl focus:outline-none focus:border-[#00E5FF] text-center"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={chiudiModal}
                className="flex-1 bg-transparent border border-[#2A2E39] hover:bg-[#1A1D24] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={salvaRisultato}
                disabled={isSalvataggio || punti1 === "" || punti2 === ""}
                className="flex-1 bg-[#00E676] hover:bg-[#00C853] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSalvataggio ? 'Salvataggio...' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
