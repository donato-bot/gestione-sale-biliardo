// ==========================================
// FILE: src/components/Magazzino.tsx
// OBIETTIVO: Gestione Inventario e Prodotti (Design Premium + Stampa PDF)
// ==========================================
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../app/lib/supabase";

interface Articolo {
  id: string;
  nome_articolo: string;
  giacenza: number;
  prezzo: number;
  categoria: string;
}

export default function Magazzino(props: any) {
  const [salaId, setSalaId] = useState<string | null>(props.salaId || props.id || null);
  const [managerEmail, setManagerEmail] = useState<string>(props.managerEmail || "");

  const [articoli, setArticoli] = useState<Articolo[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Nuovo Articolo
  const [nomeArticolo, setNomeArticolo] = useState("");
  const [giacenza, setGiacenza] = useState("10");
  const [prezzo, setPrezzo] = useState("2.50");
  const [salvataggio, setSalvataggio] = useState(false);

  useEffect(() => {
    if (!salaId && typeof window !== "undefined") {
      const pathArray = window.location.pathname.split("/");
      const urlId = pathArray[pathArray.length - 1];
      if (urlId && urlId.length > 10) setSalaId(urlId);
    }
  }, [salaId]);

  const caricaMagazzino = useCallback(async () => {
    if (!salaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("magazzino")
        .select("*")
        .eq("sala_id", salaId)
        .order("nome_articolo", { ascending: true });

      if (error) throw error;
      setArticoli(data || []);
    } catch (err: any) {
      console.error("Errore caricamento magazzino:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaMagazzino();
  }, [caricaMagazzino]);

  const handleAggiungiArticolo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvataggio(true);

    let currentEmail = managerEmail;
    if (!currentEmail) {
      const { data } = await supabase.auth.getSession();
      currentEmail = data.session?.user?.email || "";
    }

    try {
      const giacenzaNum = parseInt(giacenza) || 0;
      const prezzoNum = parseFloat(prezzo.replace(",", ".")) || 0;

      const { error } = await supabase.from("magazzino").insert([{
        sala_id: salaId,
        manager_email: currentEmail,
        nome_articolo: nomeArticolo.toUpperCase(),
        giacenza: giacenzaNum,
        prezzo: prezzoNum,
        categoria: "BAR / ACCESSORI"
      }]);

      if (error) throw error;

      setNomeArticolo("");
      setGiacenza("10");
      setPrezzo("2.50");
      alert("✅ Articolo aggiunto al magazzino!");
      await caricaMagazzino();
    } catch (err: any) {
      alert("Errore salvataggio articolo: " + err.message);
    } finally {
      setSalvataggio(false);
    }
  };

  const eliminaArticolo = async (id: string) => {
    if (!confirm("Sei sicuro di voler rimuovere questo articolo?")) return;
    try {
      const { error } = await supabase.from("magazzino").delete().eq("id", id);
      if (error) throw error;
      setArticoli(articoli.filter(a => a.id !== id));
    } catch (err: any) {
      alert("Errore eliminazione: " + err.message);
    }
  };

  const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

  if (loading) return <div className="text-center p-10 text-cyan-500 font-black uppercase tracking-widest animate-pulse">Caricamento Magazzino...</div>;

  return (
    <div className="space-y-8">
      
      {/* STILI PER LA STAMPA PDF */}
      <style>{`
        @media print {
          @page { size: portrait; margin: 10mm; }
          body { background-color: white !important; color: black !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-bg-white { background-color: white !important; color: black !important; border: 1px solid #cbd5e1 !important; box-shadow: none !important; }
          .print-text-black { color: black !important; }
          .print-title { font-size: 20pt !important; color: black !important; text-align: center; margin-bottom: 20px; font-weight: 900; }
        }
      `}</style>

      {/* HEADER DELLA SEZIONE CON PULSANTE STAMPA PDF */}
      <div className="flex justify-between items-center bg-[#111827] border border-gray-700/70 p-6 rounded-2xl shadow-xl print-bg-white">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-emerald-400 print-title">Inventario Magazzino & Bar</h2>
          <p className="text-xs text-gray-400 uppercase tracking-widest print-hidden">Gestione scorte e prodotti attivi</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="no-print bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
          title="Stampa o salva l'inventario in PDF"
        >
          🖨️ Stampa / PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM NUOVO ARTICOLO (Nascosto in stampa) */}
        <div className="lg:col-span-1 no-print">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-cyan-500 rounded-2xl shadow-2xl shadow-black/60 p-6">
            <h2 className="text-lg font-black uppercase tracking-widest text-cyan-400 mb-6">Nuovo Articolo</h2>
            
            <form onSubmit={handleAggiungiArticolo} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Nome Prodotto *</label>
                <input 
                  type="text" 
                  required
                  placeholder="Es. Caffè / Acqua / Gessetti"
                  value={nomeArticolo} 
                  onChange={(e) => setNomeArticolo(e.target.value)} 
                  className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 transition-colors" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Giacenza *</label>
                  <input 
                    type="number" 
                    required
                    value={giacenza} 
                    onChange={(e) => setGiacenza(e.target.value)} 
                    className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-white font-black text-xs focus:outline-none focus:border-cyan-500 transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Prezzo (€) *</label>
                  <input 
                    type="text" 
                    required
                    value={prezzo} 
                    onChange={(e) => setPrezzo(e.target.value)} 
                    className="w-full bg-[#1e293b] border-2 border-gray-700 p-3 rounded-xl text-emerald-400 font-black text-xs focus:outline-none focus:border-cyan-500 transition-colors" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={salvataggio}
                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-black font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all shadow-lg mt-6"
              >
                {salvataggio ? "REGISTRAZIONE..." : "+ AGGIUNGI AL MAGAZZINO"}
              </button>
            </form>
          </div>
        </div>

        {/* TABELLA INVENTARIO (Ottimizzata anche per la stampa PDF) */}
        <div className="lg:col-span-2">
          <div className="bg-[#111827] border border-gray-700/70 border-t-4 border-t-emerald-500 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden h-full print-bg-white">
            <div className="p-6 border-b border-gray-700/50 bg-[#0b0e14]/50 flex justify-between items-center print-bg-white">
              <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400 print-text-black">Inventario Attivo</h2>
              <span className="bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest print-text-black">
                {articoli.length} Prodotti
              </span>
            </div>
            
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] text-gray-400 font-black uppercase tracking-widest print-text-black">
                    <th className="pb-3">Prodotto</th>
                    <th className="pb-3 text-center">Giacenza</th>
                    <th className="pb-3 text-right">Prezzo Unitario</th>
                    <th className="pb-3 text-right no-print">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {articoli.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500 uppercase tracking-widest text-xs font-bold">
                        Nessun articolo registrato in magazzino.
                      </td>
                    </tr>
                  ) : (
                    articoli.map(art => (
                      <tr key={art.id} className="hover:bg-[#1e293b]/50 transition-colors">
                        <td className="py-4 text-white font-black uppercase text-sm tracking-wider print-text-black">{art.nome_articolo}</td>
                        <td className="py-4 text-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-black print-text-black ${art.giacenza <= 5 ? 'bg-red-900/30 text-red-400 border border-red-800/50' : 'bg-[#1e293b] text-cyan-400'}`}>
                            {art.giacenza} pz
                          </span>
                        </td>
                        <td className="py-4 text-right text-emerald-400 font-mono font-bold print-text-black">{euro.format(art.prezzo)}</td>
                        <td className="py-4 text-right no-print">
                          <button 
                            onClick={() => eliminaArticolo(art.id)}
                            className="text-gray-500 hover:text-red-400 text-xs font-black uppercase tracking-widest border border-gray-700 hover:border-red-500/30 rounded-lg px-3 py-1.5 bg-[#0b0e14] transition-colors"
                          >
                            Elimina
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}