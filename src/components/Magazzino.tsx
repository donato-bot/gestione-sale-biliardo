"use client";

// ==========================================
// FILE: src/components/Magazzino.tsx
// OBIETTIVO: Componente motore per la gestione Inventario, Bar e Stampa PDF
// ==========================================

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useRouter } from 'next/navigation';

interface Prodotto {
  id: string;
  sala_id: string;
  nome_prodotto: string;
  categoria: string | null;
  costo_acquisto: number | null;
  prezzo_vendita: number;
  giacenza: number | null;
}

interface MagazzinoProps {
  salaId: string;
}

export default function Magazzino({ salaId }: MagazzinoProps) {
  const [prodotti, setProdotti] = useState<Prodotto[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);

  // Stati per il modulo di inserimento
  const [nomeProdotto, setNomeProdotto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [costoAcquisto, setCostoAcquisto] = useState("");
  const [prezzoVendita, setPrezzoVendita] = useState("");
  const [giacenza, setGiacenza] = useState("");
  const [inInvia, setInInvia] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (salaId) {
      caricaInventario();
    }
  }, [salaId]);

  const caricaInventario = async () => {
    try {
      const { data, error } = await supabase
        .from('magazzino')
        .select('*')
        .eq('sala_id', salaId)
        .order('nome_prodotto', { ascending: true });

      if (error) throw error;
      if (data) setProdotti(data);
    } catch (error) {
      console.error('Errore nel caricamento magazzino:', error);
    } finally {
      setInCaricamento(false);
    }
  };

  const aggiungiProdotto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (nomeProdotto.trim() === "" || prezzoVendita.trim() === "") {
      alert("Attenzione: Nome Prodotto e Prezzo di Vendita sono campi obbligatori.");
      return;
    }

    setInInvia(true);

    try {
      const { data, error } = await supabase
        .from('magazzino')
        .insert([{
          sala_id: salaId,
          nome_prodotto: nomeProdotto.trim(),
          categoria: categoria.trim() === "" ? null : categoria.trim(),
          costo_acquisto: costoAcquisto === "" ? null : parseFloat(costoAcquisto.replace(',', '.')),
          prezzo_vendita: parseFloat(prezzoVendita.replace(',', '.')),
          giacenza: giacenza === "" ? 0 : parseInt(giacenza, 10)
        }])
        .select();

      if (error) throw error;

      if (data) {
        setProdotti([...prodotti, data[0]].sort((a, b) => a.nome_prodotto.localeCompare(b.nome_prodotto)));
        
        setNomeProdotto("");
        setCategoria("");
        setCostoAcquisto("");
        setPrezzoVendita("");
        setGiacenza("");
        alert("Prodotto registrato nel Magazzino!");
      }
    } catch (error) {
      console.error(error);
      alert('Errore di connessione: impossibile salvare il prodotto.');
    } finally {
      setInInvia(false);
    }
  };

  const avviaStampaPdf = () => {
    window.print();
  };

  if (inCaricamento) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-xl font-bold text-blue-500 animate-pulse">Caricamento Magazzino...</p>
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
            <span className="text-blue-500 print:hidden">📦</span> Magazzino e Bar
          </h1>
          <p className="text-gray-400 print:text-gray-600 font-bold mt-2">Inventario, Scorte e Prezzario</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={avviaStampaPdf}
            className="bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 font-black px-4 py-3 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg print:hidden"
          >
            📄 Salva PDF
          </button>

          <div className="text-right bg-gray-900/50 print:bg-transparent p-4 rounded-xl border border-gray-800 print:border-none">
            <p className="text-gray-500 print:text-gray-600 text-xs font-bold uppercase mb-1">Referenze a Listino</p>
            <p className="text-3xl font-black text-blue-500 print:text-black">{prodotti.length}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl print:block">
        <div className="bg-[#11131a] p-6 rounded-3xl border border-gray-800 h-fit shadow-xl print:hidden">
          <h2 className="text-xl font-black text-white uppercase mb-4 pb-2 border-b border-gray-800">
            Nuovo Articolo
          </h2>
          <form onSubmit={aggiungiProdotto} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Nome Prodotto *</label>
              <input 
                type="text" required placeholder="Es. Coca Cola in vetro" value={nomeProdotto}
                onChange={(e) => setNomeProdotto(e.target.value)}
                className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Categoria</label>
              <input 
                type="text" placeholder="Es. Bibite, Snack, Amari..." value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1 text-red-400">Costo Acquisto (€)</label>
                <input 
                  type="number" step="0.01" placeholder="Es. 0.80" value={costoAcquisto}
                  onChange={(e) => setCostoAcquisto(e.target.value)}
                  className="w-full bg-black text-white font-bold p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-bold uppercase mb-1 text-green-400">Prezzo Vendita *</label>
                <input 
                  type="number" step="0.01" required placeholder="Es. 2.50" value={prezzoVendita}
                  onChange={(e) => setPrezzoVendita(e.target.value)}
                  className="w-full bg-black text-green-400 font-black p-3 rounded-lg border border-gray-700 focus:border-green-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold uppercase mb-1">Giacenza Iniziale (Q.tà)</label>
              <input 
                type="number" placeholder="Es. 24" value={giacenza}
                onChange={(e) => setGiacenza(e.target.value)}
                className="w-full bg-black text-blue-400 font-bold p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button 
              type="submit" disabled={inInvia}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-black py-4 rounded-xl uppercase tracking-wider transition-all shadow-lg mt-4"
            >
              {inInvia ? "Salvataggio..." : "📥 Carica a Magazzino"}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-[#11131a] print:bg-white rounded-3xl border border-gray-800 print:border-black overflow-hidden shadow-2xl print:shadow-none">
          {prodotti.length === 0 ? (
            <div className="p-12 text-center print:border-black">
              <p className="text-gray-500 print:text-black font-bold text-lg uppercase tracking-widest">Magazzino Vuoto</p>
              <p className="text-gray-600 print:text-gray-800 mt-2">Utilizza il modulo a sinistra per caricare la prima fornitura.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900 print:bg-gray-100 border-b border-gray-800 print:border-black">
                  <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider">Prodotto</th>
                  <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider">Categoria</th>
                  <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider text-center">Giacenza</th>
                  <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider text-right">Prezzo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 print:divide-gray-300">
                {prodotti.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 print:hover:bg-transparent transition-colors">
                    <td className="p-4 text-white print:text-black font-bold uppercase tracking-wide">{item.nome_prodotto}</td>
                    <td className="p-4 text-gray-500 print:text-gray-700 text-sm uppercase">{item.categoria || "-"}</td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${
                        (item.giacenza ?? 0) <= 5 ? 'bg-red-900/50 text-red-400 print:bg-transparent print:text-black' : 'bg-gray-800 text-blue-400 print:bg-transparent print:text-black'
                      }`}>
                        {item.giacenza ?? 0} pz.
                      </span>
                    </td>
                    <td className="p-4 text-green-400 print:text-black font-black text-lg text-right">€ {Number(item.prezzo_vendita).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}