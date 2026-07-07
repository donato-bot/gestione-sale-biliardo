"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/tornei/page.tsx
// OBIETTIVO: Creazione, Gestione Tornei ed Esportazione PDF per Bacheca
// ==========================================

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from 'next/navigation';

interface Torneo {
  id: string;
  sala_id: string;
  nome: string;
  disciplina: string;
  max_iscritti: number;
  quota: number;
  formula: string;
  stato: string;
  data_inizio: string | null;
}

export default function GestioneTornei() {
  const [tornei, setTornei] = useState<Torneo[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);

  // Stati per il modulo di creazione
  const [nome, setNome] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [maxIscritti, setMaxIscritti] = useState("");
  const [quota, setQuota] = useState("");
  const [formula, setFormula] = useState("");
  const [dataInizio, setDataInizio] = useState("");
  const [inInvia, setInInvia] = useState(false);

  const params = useParams();
  const router = useRouter();
  const salaId = params.sala as string;

  useEffect(() => {
    caricaTornei();
  }, [salaId]);

  const caricaTornei = async () => {
    try {
      const { data, error } = await supabase
        .from('tornei')
        .select('*')
        .eq('sala_id', salaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setTornei(data);
    } catch (error) {
      console.error('Errore nel caricamento tornei:', error);
    } finally {
      setInCaricamento(false);
    }
  };

  const creaTorneo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInInvia(true);

    try {
      const { data, error } = await supabase
        .from('tornei')
        .insert([{
          sala_id: salaId,
          nome: nome.trim(),
          disciplina: disciplina.trim(),
          max_iscritti: parseInt(maxIscritti, 10),
          quota: parseFloat(quota.replace(',', '.')),
          formula: formula.trim(),
          stato: 'Iscrizioni Aperte',
          data_inizio: dataInizio === "" ? null : dataInizio
        }])
        .select();

      if (error) throw error;

      if (data) {
        setTornei([data[0], ...tornei]);
        
        setNome("");
        setDisciplina("");
        setMaxIscritti("");
        setQuota("");
        setFormula("");
        setDataInizio("");
        alert("Torneo creato e lanciato con successo!");
      }
    } catch (error) {
      console.error(error);
      alert('Errore di comunicazione col database.');
    } finally {
      setInInvia(false);
    }
  };

  // Funzione di attivazione PDF / Stampa bacheca
  const avviaStampaPdf = () => {
    window.print();
  };

  const formattaData = (dataString: string | null) => {
    if (!dataString) return "Da definire";
    const d = new Date(dataString);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (inCaricamento) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-xl font-bold text-purple-500 animate-pulse">Allestimento Tabelloni...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 print:bg-white print:p-0 relative">
      <header className="mb-8 border-b border-gray-800 print:border-black pb-4 flex justify-between items-end">
        <div>
          <button 
            onClick={() => router.push(`/dashboard/${salaId}`)}
            className="text-gray-500 hover:text-white uppercase text-xs font-bold mb-4 flex items-center gap-2 transition-colors print:hidden"
          >
            ← Torna alla Plancia Operativa
          </button>
          <h1 className="text-3xl font-black text-white print:text-black uppercase tracking-widest flex items-center gap-3">
            <span className="text-purple-500 print:hidden">🏆</span> Tabellone Tornei
          </h1>
          <p className="text-gray-400 print:text-gray-600 font-bold mt-2">Pianificazione Gare e Iscrizioni</p>
        </div>
        
        {/* SEZIONE DESTRA: TOTALI E TASTO PDF */}
        <div className="flex items-center gap-4">
          <button
            onClick={avviaStampaPdf}
            className="bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 font-black px-4 py-3 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg print:hidden"
          >
            📄 Salva / Stampa PDF
          </button>

          <div className="text-right bg-gray-900/50 print:bg-transparent p-4 rounded-xl border border-gray-800 print:border-none">
            <p className="text-gray-500 print:text-gray-600 text-xs font-bold uppercase mb-1">Eventi a Sistema</p>
            <p className="text-3xl font-black text-purple-500 print:text-black">{tornei.length}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl print:block">
        
        {/* COLONNA CREAZIONE (Scompare in stampa) */}
        <div className="bg-[#11131a] p-6 rounded-3xl border border-gray-800 h-fit shadow-xl print:hidden">
          <h2 className="text-xl font-black text-white uppercase mb-4 pb-2 border-b border-gray-800">
            Lancia Nuovo Torneo
          </h2>
          <form onSubmit={creaTorneo} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Nome Evento *</label>
              <input 
                type="text" required
                placeholder="Es. Trofeo d'Estate"
                value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Disciplina *</label>
                <input 
                  type="text" required
                  placeholder="Es. Goriziana"
                  value={disciplina} onChange={(e) => setDisciplina(e.target.value)}
                  className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Formula *</label>
                <input 
                  type="text" required
                  placeholder="Es. Dir. / Gironi"
                  value={formula} onChange={(e) => setFormula(e.target.value)}
                  className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Max Iscritti *</label>
                <input 
                  type="number" required
                  placeholder="Es. 32"
                  value={maxIscritti} onChange={(e) => setMaxIscritti(e.target.value)}
                  className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1 text-yellow-500">Quota (€) *</label>
                <input 
                  type="number" step="0.01" required
                  placeholder="Es. 15.00"
                  value={quota} onChange={(e) => setQuota(e.target.value)}
                  className="w-full bg-black text-yellow-500 font-black p-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Data Inizio (Opzionale)</label>
              <input 
                type="date"
                value={dataInizio} onChange={(e) => setDataInizio(e.target.value)}
                className="w-full bg-black text-purple-400 font-bold p-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button 
              type="submit"
              disabled={inInvia}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 text-white font-black py-4 rounded-xl uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] mt-4"
            >
              {inInvia ? "Creazione in corso..." : "📣 Pubblica Torneo"}
            </button>
          </form>
        </div>

        {/* COLONNA ELENCO TORNEI */}
        <div className="lg:col-span-2 bg-[#11131a] print:bg-white rounded-3xl border border-gray-800 print:border-black overflow-hidden shadow-2xl print:shadow-none">
          {tornei.length === 0 ? (
            <div className="p-12 text-center print:border-black">
              <p className="text-gray-500 print:text-black font-bold text-lg uppercase tracking-widest">Nessun Torneo Attivo</p>
              <p className="text-gray-600 print:text-gray-800 mt-2">Utilizza il modulo a sinistra per lanciare la tua prima competizione.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-6 print:p-0">
              {tornei.map((torneo) => (
                <div key={torneo.id} className="bg-black print:bg-white border border-gray-800 print:border-black rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-purple-500/50 transition-colors print:break-inside-avoid">
                  
                  <div className="flex-grow w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-green-900/50 text-green-400 print:border print:border-black print:bg-transparent print:text-black px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                        {torneo.stato}
                      </span>
                      <span className="text-gray-500 print:text-black text-sm font-bold flex items-center gap-1">
                        📅 {formattaData(torneo.data_inizio)}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white print:text-black uppercase tracking-wide">{torneo.nome}</h3>
                    <p className="text-gray-400 print:text-gray-700 font-bold mt-1 uppercase text-sm">
                      {torneo.disciplina} • {torneo.formula}
                    </p>
                  </div>

                  <div className="flex gap-4 w-full md:w-auto text-center md:text-right">
                    <div className="bg-gray-900 print:bg-gray-100 p-3 rounded-xl border border-gray-800 print:border-black min-w-[100px]">
                      <p className="text-gray-500 print:text-black text-[10px] font-black uppercase">Quota</p>
                      <p className="text-yellow-500 print:text-black font-black text-xl">€{Number(torneo.quota).toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900 print:bg-gray-100 p-3 rounded-xl border border-gray-800 print:border-black min-w-[100px]">
                      <p className="text-gray-500 print:text-black text-[10px] font-black uppercase">Max Iscritti</p>
                      <p className="text-white print:text-black font-black text-xl">{torneo.max_iscritti}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}