"use client";

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AreaSocio() {
  const [codice, setCodice] = useState("");
  const [socio, setSocio] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cercaSocio = async () => {
    if (!codice) return;
    setLoading(true);
    setError("");
    
    const { data, error: dbError } = await supabase
      .from('soci')
      .select('*')
      .eq('codice_tessera', codice.trim())
      .single();

    if (dbError || !data) {
      setError("❌ Tessera non trovata. Riprova o chiedi in cassa.");
      setSocio(null);
    } else {
      setSocio(data);
    }
    setLoading(false);
  };

  if (!socio) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-4xl font-black text-green-500 mb-2 italic uppercase">Area Socio</h1>
          <p className="text-gray-400 mb-8 uppercase text-xs font-bold tracking-widest">Inserisci il numero della tua tessera</p>
          
          <input 
            type="text" 
            value={codice}
            onChange={(e) => setCodice(e.target.value)}
            placeholder="ES. 001"
            className="w-full bg-gray-900 border-2 border-gray-800 p-5 rounded-2xl text-2xl text-center font-black mb-4 focus:border-green-500 outline-none transition-all"
          />
          
          <button 
            onClick={cercaSocio}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-5 rounded-2xl text-xl uppercase transition-all active:scale-95"
          >
            {loading ? "CONTROLLO..." : "ENTRA NEL CLUB"}
          </button>
          
          {error && <p className="mt-4 text-red-500 font-bold text-sm uppercase italic">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-sm mx-auto">
        <button onClick={() => setSocio(null)} className="text-gray-500 font-bold uppercase text-xs mb-8">← Esci</button>
        
        <div className="bg-gray-900 rounded-[2.5rem] p-8 border-2 border-green-600 shadow-2xl mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-green-500 font-black uppercase text-xs tracking-[0.2em] mb-1">Benvenuto nel Club</p>
            <h2 className="text-3xl font-black uppercase italic mb-6">{socio.nome} {socio.cognome}</h2>
            
            <div className="bg-black/40 rounded-3xl p-6 border border-white/5">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Credito Disponibile</p>
              <p className="text-5xl font-black text-white italic">€ {parseFloat(socio.credito || 0).toFixed(2)}</p>
            </div>
          </div>
          {/* Decorazione estetica */}
          <div className="absolute -bottom-10 -right-10 text-9xl opacity-10 italic font-black">🎱</div>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-3xl p-6">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">La tua tessera</h3>
          <div className="flex justify-between items-center">
            <span className="text-xl font-mono font-bold text-gray-300">{socio.codice_tessera}</span>
            <span className="bg-green-900/30 text-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">Attiva</span>
          </div>
        </div>

        <p className="text-center text-gray-600 text-[10px] mt-12 uppercase font-bold tracking-tighter">
          Per ricariche o problemi rivolgiti al personale della sala.
        </p>
      </div>
    </div>
  );
}
