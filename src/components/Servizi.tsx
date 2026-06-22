"use client";

import { useState, useEffect } from "react";
// Importazione centralizzata del motore database
import { supabase } from "../app/lib/supabase";

export default function Servizi({ salaId }: { salaId: string }) {
  // Logica per recuperare i sospesi
  const [debiti, setDebiti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDebiti() {
    try {
      const { data, error } = await supabase
        .from('debiti_clienti')
        .select('*')
        .eq('stato', 'aperto')
        .eq('sala_id', salaId);
      
      if (error) {
        console.error("Errore durante il recupero dei sospesi:", error);
      } else if (data) {
        setDebiti(data);
      }
    } catch (err) {
      console.error("Errore di connessione al server:", err);
    } finally {
      setLoading(false);
    }
  }

  // Esegue il caricamento automatico dei dati all'apertura del modulo
  useEffect(() => {
    if (salaId) {
      fetchDebiti();
    }
  }, [salaId]);

  return (
    <div className="p-6">
      {/* Intestazione di Sezione */}
      <div className="mb-6">
        <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mb-1">Modulo Operativo</p>
        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Servizi al Banco</h2>
        <p className="text-gray-500 text-xs mt-1 uppercase font-bold tracking-wider">
          Incasso Bar, Biliardi e annotazione sospesi
        </p>
      </div>

      {/* Contenitore Registro Sospesi */}
      <div className="bg-black/40 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          🛒 Registro Sospesi / Debiti Clienti
        </h3>
        
        {loading ? (
          <p className="text-gray-500 font-mono text-sm uppercase animate-pulse">
            Lettura registri in corso...
          </p>
        ) : debiti.length === 0 ? (
          <p className="text-gray-500 font-mono text-sm uppercase">
            Nessun sospeso aperto in questa sala.
          </p>
        ) : (
          <div className="space-y-3">
            {debiti.map((debito) => (
              <div key={debito.id} className="flex justify-between items-center bg-[#11131a] border border-gray-800 p-4 rounded-xl">
                <div>
                  <p className="text-white font-bold uppercase">{debito.note || "Sospeso Generico"}</p>
                  <p className="text-gray-500 text-[10px] font-mono">
                    {debito.created_at ? new Date(debito.created_at).toLocaleString() : ""}
                  </p>
                </div>
                <span className="text-xl font-black text-orange-400">
                  € {debito.importo ? debito.importo.toFixed(2) : "0.00"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}