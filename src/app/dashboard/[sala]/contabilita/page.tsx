"use client";

// ==========================================
// FILE: src/app/dashboard/[sala]/contabilita/page.tsx
// OBIETTIVO: Libro Mastro - Lettura sospesi e Riscossione crediti
// ==========================================

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useParams, useRouter } from 'next/navigation';

interface Debito {
  id: string;
  sala_id: string;
  nominativo: string;
  importo: number;
  descrizione: string;
  stato: string;
  created_at: string;
}

export default function LibroMastro() {
  const [sospesi, setSospesi] = useState<Debito[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);

  const params = useParams();
  const router = useRouter();
  const salaId = params.sala as string;

  useEffect(() => {
    caricaSospesi();
  }, [salaId]);

  // 1. Funzione di LETTURA: Prende solo i debiti 'aperti' della sala corrente
  const caricaSospesi = async () => {
    try {
      const { data, error } = await supabase
        .from('debiti_clienti')
        .select('*')
        .eq('sala_id', salaId)
        .eq('stato', 'aperto')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setSospesi(data);
    } catch (error) {
      console.error('Errore nel caricamento dei sospesi:', error);
    } finally {
      setInCaricamento(false);
    }
  };

  // 2. Funzione di SCRITTURA: Cambia lo stato da 'aperto' a 'saldato'
  const saldaDebito = async (idDebito: string, nominativo: string, importo: number) => {
    const conferma = window.confirm(`Stai per incassare €${importo.toFixed(2)} da ${nominativo}. Confermi l'operazione?`);
    
    if (!conferma) return;

    try {
      const { error } = await supabase
        .from('debiti_clienti')
        .update({ stato: 'saldato' })
        .eq('id', idDebito)
        .eq('sala_id', salaId); // Doppia sicurezza per isolamento

      if (error) throw error;

      // Aggiorna la vista rimuovendo la riga appena saldata
      setSospesi(sospesi.filter(debito => debito.id !== idDebito));
      alert(`[INCASSO REGISTRATO]\nConto di ${nominativo} saldato con successo.`);

    } catch (error) {
      console.error('Errore durante la riscossione:', error);
      alert('Errore di comunicazione col database.');
    }
  };

  const formattaData = (dataIso: string) => {
    const data = new Date(dataIso);
    return data.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calcolaTotaleSospeso = () => {
    return sospesi.reduce((tot, debito) => tot + Number(debito.importo), 0).toFixed(2);
  };

  if (inCaricamento) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <p className="text-xl font-bold text-yellow-500 animate-pulse">Caricamento Libro Mastro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 relative">
      <header className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
        <div>
          <button 
            onClick={() => router.push(`/dashboard/${salaId}`)}
            className="text-gray-500 hover:text-white uppercase text-xs font-bold mb-4 flex items-center gap-2 transition-colors"
          >
            ← Torna alla Plancia Operativa
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <span className="text-yellow-500">📖</span> Libro Mastro
          </h1>
          <p className="text-gray-400 font-bold mt-2">Gestione Crediti e Riscossioni</p>
        </div>
        
        <div className="text-right bg-gray-900/50 p-4 rounded-xl border border-gray-800">
          <p className="text-gray-500 text-xs font-bold uppercase mb-1">Totale Crediti da Riscuotere</p>
          <p className="text-3xl font-black text-yellow-500">€ {calcolaTotaleSospeso()}</p>
        </div>
      </header>

      {sospesi.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-green-500/20 rounded-3xl p-12 text-center">
          <p className="text-green-500 font-bold text-xl uppercase tracking-widest">Nessun conto in sospeso</p>
          <p className="text-gray-500 mt-2">Tutti i clienti hanno saldato i loro debiti.</p>
        </div>
      ) : (
        <div className="bg-[#11131a] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-800">
                <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider">Data e Ora</th>
                <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider">Nominativo</th>
                <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider">Dettaglio</th>
                <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider text-right">Importo</th>
                <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider text-center">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {sospesi.map((debito) => (
                <tr key={debito.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 text-gray-400 text-sm font-mono">{formattaData(debito.created_at)}</td>
                  <td className="p-4 text-white font-bold uppercase">{debito.nominativo}</td>
                  <td className="p-4 text-gray-500 text-sm">{debito.descrizione || "Nessuna nota"}</td>
                  <td className="p-4 text-yellow-500 font-black text-lg text-right">€ {Number(debito.importo).toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => saldaDebito(debito.id, debito.nominativo, debito.importo)}
                      className="bg-green-600/20 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/50 font-black px-4 py-2 rounded-lg text-sm uppercase tracking-wider transition-all"
                    >
                      ✓ Incassa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}