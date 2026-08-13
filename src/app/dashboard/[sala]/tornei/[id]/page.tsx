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
  const [sociList, setSociList] = useState<any[]>([]);
  const [isGenerando, setIsGenerando] = useState(false);

  // Nuovi Stati per Gestione Iscrizioni
  const [tabIscrizioni, setTabIscrizioni] = useState<'ONLINE' | 'DIRETTE'>('DIRETTE');
  const [ricercaSocio, setRicercaSocio] = useState("");
  const [isIscrivendo, setIsIscrivendo] = useState(false);
  
  // Array per gestire selezioni multiple: { id, nome, cognome, pagato }
  const [selezioniMultiple, setSelezioniMultiple] = useState<any[]>([]);

  useEffect(() => {
    if (salaId && torneoId) {
      caricaDatiTorneo();
    }
  }, [salaId, torneoId]);

  const caricaDatiTorneo = async () => {
    const { data: dataTorneo } = await supabase
      .from('tornei')
      .select('*')
      .eq('id', torneoId)
      .single();
      
    if (dataTorneo) setTorneo(dataTorneo);

    const { data: dataIscritti } = await supabase
      .from('iscritti_torneo')
      .select('*')
      .eq('torneo_id', torneoId)
      .order('created_at', { ascending: true });

    if (dataIscritti) setIscritti(dataIscritti);

    const { data: dataSoci } = await supabase
      .from('soci')
      .select('id, nome, cognome')
      .eq('sala_id', salaId)
      .order('cognome', { ascending: true });
      
    if (dataSoci) setSociList(dataSoci);
  };

  // ==========================================
  // LOGICA SELEZIONE MULTIPLA SOCI
  // ==========================================
  const toggleSocio = (socio: any) => {
    const giaSelezionato = selezioniMultiple.find(s => s.id === socio.id);
    if (giaSelezionato) {
      // Rimuovi se già presente
      setSelezioniMultiple(prev => prev.filter(s => s.id !== socio.id));
    } else {
      // Aggiungi nuovo socio (di default non pagato)
      setSelezioniMultiple(prev => [...prev, { ...socio, pagato: false }]);
    }
  };

  const togglePagamentoSocio = (id: string, pagato: boolean) => {
    setSelezioniMultiple(prev => 
      prev.map(s => s.id === id ? { ...s, pagato } : s)
    );
  };

  // ==========================================
  // SALVATAGGIO ISCRIZIONI IN BLOCCO
  // ==========================================
  const confermaIscrizioniMultiple = async () => {
    const maxIscritti = torneo?.max_iscritti || 16;
    const postiDisponibili = maxIscritti - iscritti.length;

    if (selezioniMultiple.length === 0) {
      alert("Seleziona almeno un giocatore da iscrivere.");
      return;
    }

    if (selezioniMultiple.length > postiDisponibili) {
      alert(`Attenzione: Stai tentando di iscrivere ${selezioniMultiple.length} giocatori, ma ci sono solo ${postiDisponibili} posti disponibili.`);
      return;
    }

    setIsIscrivendo(true);

    try {
      const arrayInserimento = selezioniMultiple.map(s => ({
        sala_id: salaId,
        torneo_id: torneoId,
        giocatore_id: s.id,
        nome_giocatore: `${s.cognome} ${s.nome}`,
        pagato: s.pagato
      }));

      const { error } = await supabase
        .from('iscritti_torneo')
        .insert(arrayInserimento);

      if (error) throw error;

      // Svuota le selezioni, resetta la ricerca e ricarica i dati
      setSelezioniMultiple([]);
      setRicercaSocio("");
      caricaDatiTorneo();
      
    } catch (error: any) {
      alert("ERRORE SALVATAGGIO ISCRIZIONI: " + error.message);
    } finally {
      setIsIscrivendo(false);
    }
  };

  // ==========================================
  // GENERAZIONE TABELLONE
  // ==========================================
  const generaTabellone = async () => {
    const maxIscritti = torneo?.max_iscritti || 16;
    
    if (iscritti.length !== maxIscritti) {
      alert(`Devono esserci esattamente ${maxIscritti} iscritti per generare il tabellone!`);
      return;
    }

    if (!confirm("Sei sicuro di voler chiudere le iscrizioni e generare il tabellone? Questa operazione non è reversibile.")) {
      return;
    }

    setIsGenerando(true);

    try {
      const urlParts = window.location.pathname.split('/');
      const safeSalaId = urlParts[2]; 
      const safeTorneoId = urlParts[4] || torneoId;

      if (!safeSalaId) {
        alert("Errore di sistema: Impossibile leggere il codice sala dall'indirizzo.");
        return;
      }

      const iscrittiMescolati = [...iscritti].sort(() => Math.random() - 0.5);
      const partite = [];
      let partitaNum = 1;

      let nomeTurno = "Ottavi";
      if (maxIscritti === 32) nomeTurno = "Sedicesimi";
      if (maxIscritti === 8) nomeTurno = "Quarti";

      for (let i = 0; i < maxIscritti; i += 2) {
        partite.push({
          sala_id: safeSalaId,
          torneo_id: safeTorneoId,
          turno: nomeTurno,
          partita_num: partitaNum,
          giocatore1_id: iscrittiMescolati[i].giocatore_id || iscrittiMescolati[i].id,
          giocatore1_nome: iscrittiMescolati[i].nome_giocatore,
          giocatore2_id: iscrittiMescolati[i+1].giocatore_id || iscrittiMescolati[i+1].id,
          giocatore2_nome: iscrittiMescolati[i+1].nome_giocatore,
          stato: "da_giocare"
        });
        partitaNum++;
      }

      const { error: insertError } = await supabase.from('partite_torneo').insert(partite);
      if (insertError) throw insertError;

      const { error: updateError } = await supabase.from('tornei').update({ stato: 'IN CORSO' }).eq('id', safeTorneoId);
      if (updateError) throw updateError;

      alert("✅ Tabellone generato e sorteggiato con successo!");
      caricaDatiTorneo(); 

    } catch (error: any) {
      alert("ERRORE DATABASE (Generazione Tabellone): " + error.message);
    } finally {
      setIsGenerando(false);
    }
  };

  if (!torneo) return <div className="p-10 text-white font-black uppercase tracking-widest animate-pulse">Caricamento torneo...</div>;

  const maxIscritti = torneo.max_iscritti || 16;
  const isCompleto = iscritti.length >= maxIscritti;
  const quota = Number(torneo.quota_iscrizione || 0).toFixed(2);

  // Filtra i soci: solo quelli NON ancora iscritti
  const sociDisponibili = sociList.filter(s => !iscritti.find(i => i.giocatore_id === s.id));
  const sociFiltratiRicerca = sociDisponibili.filter(s => (s.cognome + ' ' + s.nome).toLowerCase().includes(ricercaSocio.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto bg-[#0B0D14] rounded-[2rem] border border-[#1E222B] p-8 shadow-2xl text-white">
      
      {/* HEADER TORNEO */}
      <div className="mb-10 flex flex-col md:flex-row justify-between md:items-start gap-4 border-b border-[#1E222B] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${torneo.stato === 'IN CORSO' ? 'bg-yellow-500 animate-pulse' : 'bg-[#00E676]'}`}></div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${torneo.stato === 'IN CORSO' ? 'text-yellow-500' : 'text-[#00E676]'}`}>
              {torneo.stato || "ISCRIZIONI APERTE"}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight">{torneo.titolo || torneo.nome || "Torneo"}</h1>
        </div>
        <div className="flex gap-3">
          {torneo.stato === 'IN CORSO' && (
            <button onClick={() => router.push(`/dashboard/${salaId}/tornei/${torneoId}/tabellone`)} className="bg-[#FF0055] hover:bg-[#FF0055]/80 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,0,85,0.4)]">
              🏆 APRI TABELLONE
            </button>
          )}
          <button className="bg-[#1A1D24] hover:bg-[#2A2E39] border border-[#2A2E39] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors">
            ⚙️ Modifica Bando
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
            <span className={`border text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isCompleto ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676]' : 'bg-black border-[#2A2E39] text-gray-400'}`}>
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

        {/* COLONNA DESTRA: GESTIONE ISCRIZIONI (NUOVO DESIGN) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-6 sticky top-6 shadow-xl">
            <h3 className="text-sm font-black text-[#FF0055] uppercase tracking-widest mb-6 border-b border-[#2A2E39] pb-4 text-center">
              GESTIONE ISCRIZIONI
            </h3>
            
            {torneo.stato === 'IN CORSO' ? (
               <div className="bg-black border border-[#2A2E39] p-6 rounded-xl text-center">
                 <p className="text-yellow-500 font-black uppercase text-sm mb-2">TORNEO IN CORSO</p>
                 <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">Le iscrizioni sono chiuse e il tabellone è operativo.</p>
               </div>
            ) : (
              <>
                {/* TASTI SUPERIORI: ON LINE / DIRETTE */}
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setTabIscrizioni('ONLINE')} 
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 
                      ${tabIscrizioni === 'ONLINE' ? 'bg-transparent border-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'bg-black border-[#2A2E39] text-gray-500 hover:border-gray-500 hover:text-white'}`}
                  >
                    ON LINE
                  </button>
                  <button 
                    onClick={() => setTabIscrizioni('DIRETTE')} 
                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all border-2 
                      ${tabIscrizioni === 'DIRETTE' ? 'bg-transparent border-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.3)]' : 'bg-black border-[#2A2E39] text-gray-500 hover:border-gray-500 hover:text-white'}`}
                  >
                    DIRETTE
                  </button>
                </div>

                {/* BOX CONTENUTI GRIGIO SCURO */}
                <div className="bg-[#11131A] border border-[#2A2E39] rounded-xl p-4 mb-6 min-h-[300px] flex flex-col">
                  
                  {/* VISTA ONLINE */}
                  {tabIscrizioni === 'ONLINE' && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                      <div className="w-12 h-12 rounded-full border-4 border-red-900 border-t-red-500 animate-spin mb-4"></div>
                      <p className="text-red-500 font-black uppercase tracking-widest text-sm mb-2">In Attesa di Dati App</p>
                      <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Le iscrizioni pervenute tramite link ai giocatori compariranno qui in attesa di approvazione.</p>
                    </div>
                  )}

                  {/* VISTA DIRETTE */}
                  {tabIscrizioni === 'DIRETTE' && (
                    <div className="flex-1 flex flex-col">
                      <input 
                        type="text"
                        placeholder="Cerca socio da iscrivere..."
                        value={ricercaSocio}
                        onChange={(e) => setRicercaSocio(e.target.value)}
                        className="w-full bg-black border border-[#2A2E39] rounded-lg p-3 text-xs text-white font-bold mb-4 focus:outline-none focus:border-green-600 transition-colors"
                      />
                      
                      <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2 pr-2 scrollbar-thin scrollbar-thumb-[#2A2E39] scrollbar-track-transparent">
                        {sociFiltratiRicerca.length === 0 ? (
                          <div className="text-center text-gray-600 text-[10px] font-black uppercase tracking-widest py-8">Nessun socio trovato.</div>
                        ) : (
                          sociFiltratiRicerca.map(socio => {
                            const socioSelezionato = selezioniMultiple.find(s => s.id === socio.id);
                            const isSelected = !!socioSelezionato;
                            const isPagato = socioSelezionato?.pagato || false;

                            return (
                              <div key={socio.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-green-900/20 border-green-700/50' : 'bg-black border-[#2A2E39]'}`}>
                                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleSocio(socio)}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-green-600 border-green-500' : 'bg-[#1A1D24] border-gray-600'}`}>
                                    {isSelected && <span className="text-black text-[10px] font-black">✓</span>}
                                  </div>
                                  <span className={`text-xs font-black uppercase ${isSelected ? 'text-green-400' : 'text-gray-300'}`}>
                                    {socio.cognome} {socio.nome}
                                  </span>
                                </div>
                                
                                {isSelected && (
                                  <div className="flex items-center gap-2 bg-black px-2 py-1.5 rounded-lg border border-[#2A2E39]">
                                    <input 
                                      type="checkbox" 
                                      checked={isPagato}
                                      onChange={(e) => togglePagamentoSocio(socio.id, e.target.checked)}
                                      className="w-3 h-3 accent-green-500 cursor-pointer"
                                    />
                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Pagato</span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* TASTO ISCRIZIONE MULTIPLA */}
                      <button 
                        onClick={confermaIscrizioniMultiple}
                        disabled={selezioniMultiple.length === 0 || isIscrivendo || isCompleto}
                        className={`w-full mt-4 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all border 
                          ${selezioniMultiple.length > 0 && !isCompleto ? 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_15px_rgba(22,163,74,0.4)] active:scale-95 border-green-500' : 'bg-[#1A1D24] border-[#2A2E39] text-gray-600 cursor-not-allowed'}`}
                      >
                        {isIscrivendo ? 'Elaborazione...' : selezioniMultiple.length > 0 ? `Iscrivi ${selezioniMultiple.length} Giocatori` : 'Nessun Socio Selezionato'}
                      </button>
                    </div>
                  )}
                </div>

                {/* BOTTONE GENERAZIONE TABELLONE (SEMPRE IN BASSO) */}
                <div className="pt-2">
                  <button 
                    onClick={generaTabellone}
                    disabled={isGenerando || !isCompleto}
                    className={`w-full py-5 rounded-xl font-black uppercase tracking-widest text-sm transition-all border ${isCompleto ? 'bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-pulse border-blue-400 active:scale-95' : 'bg-[#0B0D14] border-[#1E222B] text-gray-700 cursor-not-allowed'}`}
                  >
                    {isGenerando ? "ELABORAZIONE..." : "GENERA TABELLONE"}
                  </button>
                  {!isCompleto && (
                    <p className="text-center text-[9px] text-gray-500 font-bold uppercase mt-3 tracking-widest">
                      Richiede {maxIscritti} giocatori per l'attivazione
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}