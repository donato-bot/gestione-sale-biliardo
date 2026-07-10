"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PlanciaCassaManager from "../../../../components/PlanciaCassaManager";

interface Movimento {
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

  // Dati
  const [movimenti, setMovimenti] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);

  // Stati per la UI
  const [mostraFiltri, setMostraFiltri] = useState(false);
  const [mostraCassa, setMostraCassa] = useState(false); // Per il popup della Nuova Registrazione

  // Stati dei Filtri
  const [filtroDaData, setFiltroDaData] = useState("");
  const [filtroAData, setFiltroAData] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  // Estraiamo le categorie e i turni unici per popolare le select dei filtri dinamicamente
  const categorieUniche = useMemo(() => Array.from(new Set(movimenti.map(m => m.categoria))).filter(Boolean), [movimenti]);
  const turniUnici = useMemo(() => Array.from(new Set(movimenti.map(m => m.id_chiusura))).filter(Boolean), [movimenti]);

  // 1. CARICAMENTO DATI (ANNO IN CORSO DI DEFAULT)
  const caricaDati = useCallback(async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const inizioAnno = `${currentYear}-01-01T00:00:00.000Z`;
      const fineAnno = `${currentYear}-12-31T23:59:59.999Z`;

      const { data, error } = await supabase
        .from("libro_mastro")
        .select("*")
        .eq("sala_id", salaId)
        .gte("created_at", inizioAnno)
        .lte("created_at", fineAnno)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMovimenti(data || []);
    } catch (err: any) {
      console.error("Errore caricamento:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaDati();
  }, [caricaDati]);

  // 2. MOTORE DI RICERCA COMBINATA (Filtra i dati in tempo reale in base alle scelte)
  const movimentiFiltrati = useMemo(() => {
    return movimenti.filter((m) => {
      let match = true;
      
      if (filtroDaData) {
        match = match && m.created_at >= filtroDaData;
      }
      if (filtroAData) {
        // Aggiungiamo fine giornata per includere tutto il giorno selezionato
        match = match && m.created_at <= filtroAData + "T23:59:59.999Z";
      }
      if (filtroTipo) {
        match = match && m.tipo === filtroTipo;
      }
      if (filtroCategoria) {
        match = match && m.categoria === filtroCategoria;
      }
      if (filtroTurno) {
        if (filtroTurno === "APERTO") match = match && m.id_chiusura === null;
        else match = match && m.id_chiusura === filtroTurno;
      }

      return match;
    });
  }, [movimenti, filtroDaData, filtroAData, filtroTipo, filtroCategoria, filtroTurno]);

  // 3. FUNZIONE AZZERAMENTO FILTRI
  const azzeraFiltri = () => {
    setFiltroDaData("");
    setFiltroAData("");
    setFiltroTipo("");
    setFiltroCategoria("");
    setFiltroTurno("");
  };

  // 4. RISCOSSIONE CREDITI (Direttamente dalla tabella)
  const incassaSospeso = async (mov: Movimento) => {
    if (!window.confirm("Confermi l'incasso di questo sospeso?")) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user?.email;

      await supabase.from("libro_mastro").update({ tipo: "SOSPESO_SALDATO" }).eq("id", mov.id);
      
      await supabase.from("libro_mastro").insert([{
        sala_id: salaId,
        manager_email: email,
        tipo: "ENTRATA",
        categoria: "Riscossione Credito",
        importo: mov.importo,
        descrizione: `[SALDATO] ${mov.descrizione}`,
        id_chiusura: null
      }]);

      await caricaDati();
    } catch (err: any) { alert("Errore: " + err.message); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex justify-between items-end border-b border-gray-800 pb-4">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-2 flex items-center gap-2"
            >
              ← Torna alla Plancia
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white italic">
              MOVIMENTI CONTABILI PRIMA NOTA
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Archivio Anno in Corso: {new Date().getFullYear()}
            </p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setMostraFiltri(!mostraFiltri)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${mostraFiltri ? "bg-cyan-900 border-cyan-500 text-cyan-100" : "bg-[#11131a] border-gray-800 text-gray-400 hover:border-cyan-500/50 hover:text-cyan-400"}`}
            >
              🔍 Ricerca Avanzata
            </button>
            <button 
              onClick={() => setMostraCassa(true)}
              className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              + Nuova Registrazione / Cassa
            </button>
          </div>
        </header>

        {/* BOX A BANDIERA (PANNELLO FILTRI) */}
        {mostraFiltri && (
          <div className="bg-[#0a0b0f] border border-gray-800 rounded-2xl p-6 animate-fade-in shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              
              <div>
                <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Da Data</label>
                <input type="date" value={filtroDaData} onChange={(e) => setFiltroDaData(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none custom-calendar-icon" />
              </div>
              
              <div>
                <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">A Data</label>
                <input type="date" value={filtroAData} onChange={(e) => setFiltroAData(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none custom-calendar-icon" />
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Entrate/Uscite</label>
                <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none">
                  <option value="">TUTTI I TIPI</option>
                  <option value="ENTRATA">SOLO ENTRATE</option>
                  <option value="USCITA">SOLO USCITE</option>
                  <option value="SOSPESO">CREDITI SOSPESI</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">X Categoria</label>
                <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none uppercase">
                  <option value="">TUTTE LE CATEGORIE</option>
                  {categorieUniche.map((cat, i) => <option key={i} value={cat as string}>{cat as string}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">X Turno</label>
                <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)} className="w-full bg-black border border-gray-800 p-2.5 rounded-lg text-white text-xs focus:border-cyan-500 focus:outline-none">
                  <option value="">TUTTI I TURNI</option>
                  <option value="APERTO">SOLO CASSA APERTA</option>
                  {turniUnici.filter(t => t !== null && t !== "CREDITO_APERTO").map((t, i) => (
                    <option key={i} value={t as string}>{t as string}</option>
                  ))}
                </select>
              </div>

            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={azzeraFiltri} className="bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-red-400 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                ✖ Azzera Ricerca
              </button>
            </div>
          </div>
        )}

        {/* TABELLA DATI (IL REGISTRO) */}
        <div className="bg-[#11131a] border border-gray-800/80 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/50 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                <th className="p-4 w-[15%]">Data e Ora</th>
                <th className="p-4 w-[10%] text-center">Tipo</th>
                <th className="p-4 w-[40%]">Categoria e Descrizione</th>
                <th className="p-4 w-[15%] text-right">Importo</th>
                <th className="p-4 w-[20%] text-right">Rif. Turno</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-white divide-y divide-gray-800/40">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-cyan-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Caricamento in corso...</td></tr>
              ) : movimentiFiltrati.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-600 font-black uppercase tracking-widest text-[10px]">Nessun movimento trovato per i criteri selezionati.</td></tr>
              ) : (
                movimentiFiltrati.map((mov) => {
                  const dataObj = new Date(mov.created_at);
                  const isEntrata = mov.tipo === "ENTRATA";
                  const isUscita = mov.tipo === "USCITA";
                  const isSospeso = mov.tipo === "SOSPESO";

                  return (
                    <tr key={mov.id} className="hover:bg-gray-800/30 transition-colors group">
                      {/* DATA E ORA */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="text-gray-300 text-xs">{dataObj.toLocaleDateString("it-IT", { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                        <span className="text-gray-600 text-xs ml-2">{dataObj.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      
                      {/* TIPO (BADGE) */}
                      <td className="p-4 text-center">
                        <span className={`text-[8px] px-2 py-1 rounded border font-black uppercase tracking-widest
                          ${isEntrata ? "bg-emerald-950/30 text-emerald-500 border-emerald-500/20" : 
                            isUscita ? "bg-red-950/30 text-red-500 border-red-500/20" : 
                            "bg-amber-950/30 text-amber-500 border-amber-500/20"}`}
                        >
                          {mov.tipo.replace('_SALDATO', ' SALD.')}
                        </span>
                      </td>

                      {/* DESCRIZIONE */}
                      <td className="p-4">
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-wider mb-0.5">{mov.categoria}</p>
                        <p className="text-sm font-bold text-gray-200 uppercase">{mov.descrizione}</p>
                      </td>

                      {/* IMPORTO */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className={`text-base font-black ${isUscita ? "text-red-400" : isSospeso ? "text-amber-400" : "text-emerald-400"}`}>
                          {isUscita ? "- " : "+ "}€ {Number(mov.importo).toFixed(2)}
                        </span>
                      </td>

                      {/* TURNO / AZIONE */}
                      <td className="p-4 text-right whitespace-nowrap flex flex-col items-end justify-center">
                        {isSospeso ? (
                           <button onClick={() => incassaSospeso(mov)} className="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-black px-3 py-1.5 rounded font-black uppercase tracking-widest transition-all opacity-0 group-hover:opacity-100">
                             Incassa
                           </button>
                        ) : mov.id_chiusura && mov.id_chiusura !== "CREDITO_APERTO" ? (
                          <span className="text-[10px] text-gray-600 font-black uppercase tracking-wider flex items-center gap-1.5">
                            🔒 {mov.id_chiusura.replace('TURNO-', 'T-')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500/50 font-black uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                            🔓 Cassa Aperta
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* TOTALIZZATORI A PIE DI PAGINA (Basati sui filtri attuali) */}
          <div className="bg-black/80 border-t border-gray-800 p-4 flex justify-end gap-8">
             <div className="text-right">
               <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">Totale Entrate FiltratE</span>
               <span className="text-emerald-400 font-black text-lg">€ {movimentiFiltrati.filter(m => m.tipo === 'ENTRATA').reduce((acc, curr) => acc + Number(curr.importo), 0).toFixed(2)}</span>
             </div>
             <div className="text-right">
               <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest block mb-1">Totale Uscite FiltratE</span>
               <span className="text-red-400 font-black text-lg">€ {movimentiFiltrati.filter(m => m.tipo === 'USCITA').reduce((acc, curr) => acc + Number(curr.importo), 0).toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: CASSA E NUOVA REGISTRAZIONE */}
      {mostraCassa && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
          <div className="bg-[#050505] border border-gray-800 rounded-[2rem] w-full max-w-5xl shadow-2xl relative mt-auto mb-auto">
            <button onClick={() => { setMostraCassa(false); caricaDati(); }} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 font-black text-xl z-10">✖</button>
            <div className="p-8">
               <h2 className="text-2xl font-black italic text-cyan-400 uppercase mb-6">Gestione Cassa e Registrazioni</h2>
               <PlanciaCassaManager salaId={salaId} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}