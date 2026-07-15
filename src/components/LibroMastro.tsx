"use client";

// ==========================================
// FILE: src/components/LibroMastro.tsx
// OBIETTIVO: Componente isolato per il Libro Mastro (Logica e UI)
// ==========================================

import { useState, useEffect } from 'react';
import { supabase } from "@/app/lib/supabase";
import { useRouter } from 'next/navigation';

interface Debito {
  id: string;
  sala_id: string;
  nominativo: string;
  importo: number;
  descrizione: string;
  stato: string;
  created_at: string;
}

interface LibroMastroProps {
  salaId: string;
}

export default function LibroMastro({ salaId }: LibroMastroProps) {
  const [sospesi, setSospesi] = useState<Debito[]>([]);
  const [inCaricamento, setInCaricamento] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (salaId) {
      caricaSospesi();
    }
  }, [salaId]);

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

  const saldaDebito = async (idDebito: string, nominativo: string, importo: number) => {
    const conferma = window.confirm(`Stai per incassare €${importo.toFixed(2)} da ${nominativo}. Confermi l'operazione?`);
    
    if (!conferma) return;

    try {
      const { error } = await supabase
        .from('debiti_clienti')
        .update({ stato: 'saldato' })
        .eq('id', idDebito)
        .eq('sala_id', salaId);

      if (error) throw error;

      setSospesi(sospesi.filter(debito => debito.id !== idDebito));
      alert(`[INCASSO REGISTRATO]\nConto di ${nominativo} saldato con successo.`);

    } catch (error) {
      console.error('Errore durante la riscossione:', error);
      alert('Errore di comunicazione col database.');
    }
  };

  const avviaStampaPdf = () => {
    window.print();
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
            <span className="text-yellow-500 print:hidden">📖</span> Libro Mastro
          </h1>
          <p className="text-gray-400 print:text-gray-600 font-bold mt-2">Gestione Crediti e Riscossioni</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={avviaStampaPdf}
            className="bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 font-black px-4 py-3 rounded-xl transition-all uppercase tracking-wider text-xs flex items-center gap-2 shadow-lg print:hidden"
          >
            📄 Salva / Stampa PDF
          </button>

          <div className="text-right bg-gray-900/50 print:bg-transparent p-4 rounded-xl border border-gray-800 print:border-none">
            <p className="text-gray-500 print:text-gray-600 text-xs font-bold uppercase mb-1">Totale Sospesi</p>
            <p className="text-3xl font-black text-yellow-500 print:text-black">€ {calcolaTotaleSospeso()}</p>
          </div>
        </div>
      </header>

      {sospesi.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-green-500/20 rounded-3xl p-12 text-center print:border-black">
          <p className="text-green-500 font-bold text-xl uppercase tracking-widest">Nessun conto in sospeso</p>
          <p className="text-gray-500 mt-2">Tutti i clienti hanno saldato i loro debiti.</p>
        </div>
      ) : (
        <div className="bg-[#11131a] print:bg-white rounded-3xl border border-gray-800 print:border-black overflow-hidden shadow-2xl print:shadow-none">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 print:bg-gray-100 border-b border-gray-800 print:border-black">
                <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider">Data e Ora</th>
                <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider">Nominativo</th>
                <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider">Dettaglio</th>
                <th className="p-4 text-gray-500 print:text-black text-xs font-black uppercase tracking-wider text-right">Importo</th>
                <th className="p-4 text-gray-500 text-xs font-black uppercase tracking-wider text-center print:hidden">Azione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50 print:divide-gray-300">
              {sospesi.map((debito) => (
                <tr key={debito.id} className="hover:bg-white/5 print:hover:bg-transparent transition-colors">
                  <td className="p-4 text-gray-400 print:text-black text-sm font-mono">{formattaData(debito.created_at)}</td>
                  <td className="p-4 text-white print:text-black font-bold uppercase">{debito.nominativo}</td>
                  <td className="p-4 text-gray-500 print:text-gray-700 text-sm">{debito.descrizione || "Nessuna nota"}</td>
                  <td className="p-4 text-yellow-500 print:text-black font-black text-lg text-right">€ {Number(debito.importo).toFixed(2)}</td>
                  <td className="p-4 text-center print:hidden">
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