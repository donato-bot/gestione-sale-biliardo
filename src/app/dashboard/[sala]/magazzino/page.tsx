"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

interface Prodotto {
  id: string;
  nome_prodotto: string;
  categoria: string;
  quantita_disponibile: number;
  scorta_minima: number;
  prezzo_vendita: number | null;
}

export default function MagazzinoPage() {
  const router = useRouter();
  const urlParams = useParams();
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string;

  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [loading, setLoading] = useState(true);

  // Stati per il Modal (Popup Form)
  const [mostraForm, setMostraForm] = useState(false);
  const [salvataggio, setSalvataggio] = useState(false);
  const [prodottoInModificaId, setProdottoInModificaId] = useState<string | null>(null);
  
  // Campi Form
  const [nomeProdotto, setNomeProdotto] = useState("");
  const [categoria, setCategoria] = useState("Bar (Bevande/Snack)");
  const [quantita, setQuantita] = useState<number>(0);
  const [scortaMinima, setScortaMinima] = useState<number>(5);
  const [prezzoVendita, setPrezzoVendita] = useState<string>("");

  const caricaProdotti = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("magazzino")
        .select("*")
        .eq("sala_id", salaId)
        .order("categoria", { ascending: true })
        .order("nome_prodotto", { ascending: true });

      if (error) throw error;
      setProdotti(data || []);
    } catch (err: any) {
      console.error("Errore caricamento magazzino:", err.message);
    } finally {
      setLoading(false);
    }
  }, [salaId]);

  useEffect(() => {
    caricaProdotti();
  }, [caricaProdotti]);

  // Reset Form
  const svuotaForm = () => {
    setProdottoInModificaId(null);
    setNomeProdotto(""); setCategoria("Bar (Bevande/Snack)"); setQuantita(0); setScortaMinima(5); setPrezzoVendita("");
  };

  // Apre Modal per Nuovo Prodotto
  const apriNuovoProdotto = () => {
    svuotaForm();
    setMostraForm(true);
  };

  // Apre Modal per Modifica
  const apriModificaProdotto = (prodotto: Prodotto) => {
    setProdottoInModificaId(prodotto.id);
    setNomeProdotto(prodotto.nome_prodotto);
    setCategoria(prodotto.categoria);
    setQuantita(prodotto.quantita_disponibile);
    setScortaMinima(prodotto.scorta_minima);
    setPrezzoVendita(prodotto.prezzo_vendita ? prodotto.prezzo_vendita.toString() : "");
    setMostraForm(true);
  };

  // Elimina Prodotto
  const eliminaProdotto = async (id: string) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo prodotto dal magazzino?")) return;
    try {
      const { error } = await supabase.from("magazzino").delete().eq("id", id);
      if (error) throw error;
      await caricaProdotti();
    } catch (err: any) {
      alert("Errore durante l'eliminazione: " + err.message);
    }
  };

  // Aggiornamento Rapido Quantità (+1 / -1)
  const aggiornaQuantitaVeloce = async (id: string, quantitaAttuale: number, variazione: number) => {
    const nuovaQuantita = Math.max(0, quantitaAttuale + variazione); // Evita numeri negativi
    
    // Aggiorna subito la UI per un feedback istantaneo
    setProdotti(prodotti.map(p => p.id === id ? { ...p, quantita_disponibile: nuovaQuantita } : p));

    try {
      const { error } = await supabase
        .from("magazzino")
        .update({ quantita_disponibile: nuovaQuantita })
        .eq("id", id);
        
      if (error) throw error;
    } catch (err: any) {
      alert("Errore aggiornamento quantità: " + err.message);
      await caricaProdotti(); // Ricarica se fallisce
    }
  };

  // Salvataggio (Insert o Update)
  const salvaProdotto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeProdotto.trim()) {
      alert("Il Nome del Prodotto è obbligatori.");
      return;
    }

    setSalvataggio(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userEmail = sessionData.session?.user?.email;

      const prezzoNum = parseFloat(prezzoVendita.replace(',', '.'));

      const datiProdotto = {
        sala_id: salaId,
        manager_email: userEmail,
        nome_prodotto: nomeProdotto.toUpperCase(),
        categoria: categoria,
        quantita_disponibile: quantita,
        scorta_minima: scortaMinima,
        prezzo_vendita: isNaN(prezzoNum) ? null : prezzoNum
      };

      if (prodottoInModificaId) {
        // MODIFICA (Update)
        const { error } = await supabase.from("magazzino").update(datiProdotto).eq("id", prodottoInModificaId);
        if (error) throw error;
      } else {
        // NUOVO (Insert)
        const { error } = await supabase.from("magazzino").insert([datiProdotto]);
        if (error) throw error;
      }

      setMostraForm(false);
      await caricaProdotti();
    } catch (err: any) {
      alert("Errore salvataggio prodotto: " + err.message);
    } finally {
      setSalvataggio(false);
    }
  };

  const formattatoreEuro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 font-sans">
      <div className="w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800 pb-4 gap-4">
          <div>
            <button 
              onClick={() => router.push(`/dashboard/${salaId}`)}
              className="text-gray-500 hover:text-cyan-400 text-[10px] font-black uppercase tracking-widest transition-colors mb-2 flex items-center gap-2"
            >
              ← Torna alla Plancia
            </button>
            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mb-1 mt-2">Inventario e Consumazioni</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-white italic">
              MAGAZZINO E BAR
            </h1>
          </div>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={apriNuovoProdotto}
              className="bg-cyan-600 hover:bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              + Aggiungi Prodotto
            </button>
          </div>
        </header>

        {/* TABELLONE UNICO */}
        <div className="bg-[#0a0b0f] border border-gray-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#11131a]">
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Giacenze Attuali</h2>
            <div className="bg-gray-900 border border-gray-700 text-[10px] font-black text-cyan-400 px-4 py-1.5 rounded-lg flex gap-4">
              <span className="flex gap-2"><span className="text-gray-500">PRODOTTI:</span> <span>{prodotti.length}</span></span>
              <span className="flex gap-2"><span className="text-gray-500">IN ESAURIMENTO:</span> <span className="text-red-500">{prodotti.filter(p => p.quantita_disponibile <= p.scorta_minima).length}</span></span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-black/40 border-b border-gray-800 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                  <th className="p-5 w-[25%]">Nome Prodotto</th>
                  <th className="p-5 w-[20%]">Categoria</th>
                  <th className="p-5 w-[15%] text-center">Prezzo</th>
                  <th className="p-5 w-[20%] text-center">Giacenza / Scorta</th>
                  <th className="p-5 w-[20%] text-right">Azioni Rapide</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-white divide-y divide-gray-800/40">
                {loading ? (
                  <tr><td colSpan={5} className="p-10 text-center text-cyan-500 font-black uppercase tracking-widest text-[10px] animate-pulse">Caricamento in corso...</td></tr>
                ) : prodotti.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-gray-600 font-black uppercase tracking-widest text-[10px]">Nessun prodotto in magazzino.</td></tr>
                ) : (
                  prodotti.map((prodotto) => {
                    const inEsaurimento = prodotto.quantita_disponibile <= prodotto.scorta_minima;
                    
                    return (
                      <tr key={prodotto.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="p-5">
                          <p className="text-base font-black uppercase text-gray-200 flex items-center gap-2">
                            {inEsaurimento && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Sotto scorta minima"></span>}
                            {prodotto.nome_prodotto}
                          </p>
                        </td>
                        <td className="p-5">
                          <span className="text-[10px] text-gray-400 uppercase tracking-widest border border-gray-700 px-2 py-1 rounded bg-black/50">
                            {prodotto.categoria}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className="text-emerald-400 font-black">
                            {prodotto.prezzo_vendita ? formattatoreEuro.format(prodotto.prezzo_vendita) : "—"}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-4">
                            <button 
                              onClick={() => aggiornaQuantitaVeloce(prodotto.id, prodotto.quantita_disponibile, -1)}
                              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-400 flex items-center justify-center font-black transition-colors"
                            >
                              -
                            </button>
                            <div className="flex flex-col items-center">
                              <span className={`text-xl font-black ${inEsaurimento ? 'text-red-500' : 'text-white'}`}>
                                {prodotto.quantita_disponibile}
                              </span>
                              <span className="text-[8px] text-gray-500 uppercase tracking-widest">Min {prodotto.scorta_minima}</span>
                            </div>
                            <button 
                              onClick={() => aggiornaQuantitaVeloce(prodotto.id, prodotto.quantita_disponibile, 1)}
                              className="w-8 h-8 rounded-full bg-gray-800 hover:bg-emerald-900/50 text-gray-400 hover:text-emerald-400 flex items-center justify-center font-black transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => apriModificaProdotto(prodotto)} 
                              className="text-gray-500 hover:text-cyan-400 px-2 py-1 transition-colors text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-cyan-500/30 rounded"
                            >
                              ✏️ Modifica
                            </button>
                            <button 
                              onClick={() => eliminaProdotto(prodotto.id)} 
                              className="text-gray-600 hover:text-red-500 px-2 py-1 transition-colors text-[10px] font-black uppercase tracking-widest border border-transparent hover:border-red-500/30 rounded"
                            >
                              🗑️ Elimina
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP MODAL: FORM PRODOTTO (Sovrimpressione) */}
      {mostraForm && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0a0b0f] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setMostraForm(false)} className="absolute top-6 right-6 text-gray-500 hover:text-red-500 font-black text-xl z-10 transition-colors">✖</button>
            <div className="p-8">
              <h2 className="text-xl font-black italic text-cyan-400 uppercase mb-6">
                {prodottoInModificaId ? "✏️ Modifica Prodotto" : "📦 Nuovo Prodotto"}
              </h2>
              
              <form onSubmit={salvaProdotto} className="space-y-5">
                
                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Nome Prodotto *</label>
                  <input type="text" placeholder="Es. Caffè Espresso, Gesso Master..." required value={nomeProdotto} onChange={(e) => setNomeProdotto(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Categoria</label>
                  <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors">
                    <option value="Bar (Bevande/Snack)">☕ Bar (Bevande/Snack)</option>
                    <option value="Accessori Biliardo">🎱 Accessori Biliardo (Gessi, Cuoi...)</option>
                    <option value="Manutenzione e Pulizia">🧹 Manutenzione e Pulizia</option>
                    <option value="Altro">📦 Altro</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Quantità Attuale</label>
                    <input type="number" min="0" required value={quantita} onChange={(e) => setQuantita(parseInt(e.target.value) || 0)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Scorta Minima (Alert)</label>
                    <input type="number" min="0" required value={scortaMinima} onChange={(e) => setScortaMinima(parseInt(e.target.value) || 0)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1.5">Prezzo di Vendita (€)</label>
                  <input type="number" step="0.01" placeholder="Es. 1.50" value={prezzoVendita} onChange={(e) => setPrezzoVendita(e.target.value)} className="w-full bg-black border border-gray-800 p-3 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>

                <div className="pt-4">
                  <button type="submit" disabled={salvataggio} className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${prodottoInModificaId ? "bg-amber-600 hover:bg-amber-500 text-black" : "bg-cyan-600 hover:bg-cyan-500 text-black"}`}>
                    {salvataggio ? "SALVATAGGIO..." : (prodottoInModificaId ? "AGGIORNA PRODOTTO" : "INSERISCI IN MAGAZZINO")}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}