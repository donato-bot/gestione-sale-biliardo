"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase";

export default function PlanciaCassaManager({ salaId }: { salaId: string }) {
  const [soci, setSoci] = useState<any[]>([]);
  const [ricerca, setRicerca] = useState("");
  const [socioSelezionato, setSocioSelezionato] = useState<any>(null);
  const [importo, setImporto] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Carica tutti i soci della sala all'avvio
  useEffect(() => {
    if (salaId) caricaSoci();
  }, [salaId]);

  const caricaSoci = async () => {
    const { data, error } = await supabase
      .from('soci')
      .select('*')
      .eq('sala_id', salaId)
      .order('cognome', { ascending: true });

    if (error) {
      console.error("Errore caricamento soci:", error.message);
    } else if (data) {
      setSoci(data);
    }
  };

  // Filtra i soci in base alla barra di ricerca
  const sociFiltrati = soci.filter(s => 
    `${s.cognome} ${s.nome}`.toLowerCase().includes(ricerca.toLowerCase())
  );

  // Funzione unificata per aggiornare il credito (sia ricarica che addebito)
  const aggiornaCredito = async (operazione: 'ricarica' | 'addebito') => {
    if (!socioSelezionato) return;
    
    const valore = parseFloat(importo);
    if (isNaN(valore) || valore <= 0) {
      alert("Inserisci un importo valido e maggiore di zero.");
      return;
    }

    setLoading(true);

    // Calcoliamo il nuovo saldo
    const saldoAttuale = parseFloat(socioSelezionato.credito || 0);
    let nuovoSaldo = operazione === 'ricarica' ? saldoAttuale + valore : saldoAttuale - valore;

    // Aggiorniamo il database
    const { error } = await supabase
      .from('soci')
      .update({ credito: nuovoSaldo })
      .eq('id', socioSelezionato.id);

    if (error) {
      alert("ERRORE DURANTE L'OPERAZIONE: " + error.message);
      setLoading(false);
      return;
    }

    // Se tutto va bene, aggiorniamo l'interfaccia e resettiamo l'input
    alert(`✅ Operazione completata! Nuovo saldo di ${socioSelezionato.nome}: €${nuovoSaldo.toFixed(2)}`);
    setImporto("");
    
    // Ricarichiamo i dati dal server per avere la certezza assoluta
    await caricaSoci();
    
    // Aggiorniamo il socio selezionato per mostrare il saldo aggiornato a schermo
    setSocioSelezionato((prev: any) => ({ ...prev, credito: nuovoSaldo }));
    
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto bg-[#0B0D14] rounded-[2rem] border border-[#1E222B] p-8 shadow-2xl">
      
      <div className="mb-10 border-b border-[#1E222B] pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
            <span className="text-[#00E676]">💶</span> CASSA ELETTRONICA
          </h1>
          <p className="text-gray-400 text-sm font-bold mt-2 uppercase tracking-widest">Gestione Portafoglio Soci</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNA SINISTRA: RICERCA SOCIO */}
        <div className="lg:col-span-5 bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-6 h-fit">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Trova Socio</h3>
          
          <input 
            type="text" 
            placeholder="Cerca per cognome o nome..." 
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            className="w-full bg-black text-white font-bold p-4 rounded-xl border border-[#2A2E39] focus:outline-none focus:border-[#00E676] mb-4"
          />

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {sociFiltrati.length === 0 ? (
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest text-center py-4">Nessun socio trovato</p>
            ) : (
              sociFiltrati.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setSocioSelezionato(s); setImporto(""); }}
                  className={`w-full text-left p-4 rounded-xl transition-all border ${
                    socioSelezionato?.id === s.id 
                      ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676]' 
                      : 'bg-black border-[#2A2E39] text-white hover:border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black uppercase text-sm">{s.cognome} {s.nome}</span>
                    <span className="text-xs font-bold font-mono">€ {parseFloat(s.credito || 0).toFixed(2)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* COLONNA DESTRA: TERMINALE OPERATIVO */}
        <div className="lg:col-span-7">
          {!socioSelezionato ? (
            <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] h-full flex flex-col items-center justify-center p-10 text-center opacity-50">
              <span className="text-6xl mb-4">💳</span>
              <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Terminale in Attesa</h3>
              <p className="text-gray-400 font-bold">Seleziona un socio dalla lista per operare sul suo portafoglio virtuale.</p>
            </div>
          ) : (
            <div className="bg-[#1A1D24] border border-[#2A2E39] rounded-[2rem] p-8 relative overflow-hidden shadow-2xl">
              {/* Effetto luce di sfondo */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00E676] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="mb-8 border-b border-[#2A2E39] pb-6">
                <p className="text-[#00E676] text-xs font-black uppercase tracking-widest mb-1">Conto Attivo</p>
                <h2 className="text-3xl font-black text-white uppercase">{socioSelezionato.cognome} {socioSelezionato.nome}</h2>
              </div>

              <div className="bg-black border border-[#2A2E39] rounded-2xl p-8 mb-8 text-center">
                <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-2">Saldo Attuale</p>
                <p className={`text-6xl font-black font-mono tracking-tighter ${parseFloat(socioSelezionato.credito) < 0 ? 'text-red-500' : 'text-white'}`}>
                  € {parseFloat(socioSelezionato.credito || 0).toFixed(2)}
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2 block text-center">Importo Operazione (€)</label>
                  <input 
                    type="number" 
                    step="0.50"
                    placeholder="0.00" 
                    value={importo}
                    onChange={(e) => setImporto(e.target.value)}
                    className="w-full bg-black text-white text-center text-3xl font-black p-6 rounded-xl border-2 border-[#2A2E39] focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button 
                    onClick={() => aggiornaCredito('ricarica')}
                    disabled={loading || !importo}
                    className="bg-[#00E676] hover:bg-[#00C853] disabled:bg-gray-800 disabled:text-gray-500 text-black py-5 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? "..." : "➕ RICARICA"}
                  </button>
                  
                  <button 
                    onClick={() => aggiornaCredito('addebito')}
                    disabled={loading || !importo}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 text-white py-5 rounded-xl font-black uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? "..." : "➖ ADDEBITA"}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}