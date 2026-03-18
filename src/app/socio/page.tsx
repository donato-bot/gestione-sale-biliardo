"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AppSocio() {
  const [email, setEmail] = useState("");
  const [socio, setSocio] = useState<any>(null);
  const [tavoli, setTavoli] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "dashboard" | "prenota">("login");

  // Stato per la prenotazione
  const [selectedTable, setSelectedTable] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  // Carica i tavoli disponibili
  useEffect(() => {
    async function fetchTavoli() {
      const { data } = await supabase.from('tavoli').select('*').order('numero', { ascending: true });
      if (data) setTavoli(data);
    }
    fetchTavoli();
  }, []);

  const loginSocio = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('soci')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !data) {
      alert("❌ Email non trovata. Assicurati che il gestore l'abbia registrata correttamente.");
    } else {
      setSocio(data);
      setView("dashboard");
    }
    setLoading(false);
  };

  const confermaPrenotazione = async () => {
    if (!selectedTable || !bookingTime) {
      alert("Seleziona tavolo e orario!");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('tavoli')
      .update({
        stato: 'prenotato',
        prenotato_da: `${socio.nome} ${socio.cognome}`,
        prenotato_alle: bookingTime
      })
      .eq('id', selectedTable);

    if (error) {
      alert("Errore: " + error.message);
    } else {
      alert("✅ Prenotazione inviata! Ti aspettiamo in sala.");
      setView("dashboard");
      // Aggiorna lista tavoli locale
      const { data } = await supabase.from('tavoli').select('*').order('numero', { ascending: true });
      if (data) setTavoli(data);
    }
    setLoading(false);
  };

  // --- SCHERMATA LOGIN ---
  if (view === "login") {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm text-center">
          <div className="text-6xl mb-6">🎱</div>
          <h1 className="text-4xl font-black text-green-500 mb-2 uppercase italic">Biliardo Royal</h1>
          <p className="text-gray-400 mb-8 uppercase text-xs font-bold tracking-widest text-white/50">Area Esclusiva Soci</p>
          
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="La tua Email"
            className="w-full bg-gray-900 border-2 border-gray-800 p-5 rounded-2xl text-lg text-center mb-4 outline-none focus:border-green-500 transition-all"
          />
          
          <button 
            onClick={loginSocio}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 text-black font-black py-5 rounded-2xl text-xl uppercase transition-all active:scale-95 shadow-lg shadow-green-900/20"
          >
            {loading ? "VERIFICA..." : "ACCEDI AL CLUB"}
          </button>
        </div>
      </div>
    );
  }

  // --- SCHERMATA DASHBOARD ---
  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-black text-white p-6 font-sans">
        <div className="max-w-sm mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic uppercase">Ciao, {socio.nome}!</h2>
            <button onClick={() => setView("login")} className="text-gray-500 text-xs font-bold uppercase">Esci</button>
          </div>

          {/* Borsellino Elettronico */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 border-2 border-green-600 shadow-2xl mb-8 relative overflow-hidden">
            <p className="text-green-500 font-black uppercase text-xs tracking-widest mb-1">Il tuo Credito</p>
            <p className="text-6xl font-black text-white italic">€ {parseFloat(socio.credito || 0).toFixed(2)}</p>
            <div className="absolute -bottom-6 -right-6 text-8xl opacity-10 font-black italic">💰</div>
          </div>

          <button 
            onClick={() => setView("prenota")}
            className="w-full bg-white text-black font-black py-6 rounded-3xl text-xl uppercase mb-4 shadow-xl active:scale-95 transition-all"
          >
            📅 PRENOTA UN TAVOLO
          </button>
          
          <p className="text-center text-gray-600 text-[10px] uppercase font-bold tracking-widest mt-8">
            Mostra la tua email in cassa per ricaricare il credito.
          </p>
        </div>
      </div>
    );
  }

  // --- SCHERMATA PRENOTA ---
  if (view === "prenota") {
    return (
      <div className="min-h-screen bg-black text-white p-6 font-sans animate-in slide-in-from-right duration-300">
        <div className="max-w-sm mx-auto">
          <button onClick={() => setView("dashboard")} className="text-gray-500 font-bold uppercase text-xs mb-8">← Torna Indietro</button>
          
          <h2 className="text-3xl font-black uppercase italic mb-8">Scegli la tua sessione</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-gray-500 font-black text-xs uppercase mb-3">1. Quale Tavolo preferisci?</label>
              <select 
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full bg-gray-900 border-2 border-gray-800 p-5 rounded-2xl text-lg outline-none focus:border-green-500"
              >
                <option value="">Seleziona Tavolo...</option>
                {tavoli.map(t => (
                  <option key={t.id} value={t.id} disabled={t.stato !== 'libero'}>
                    Tavolo {t.numero} {t.stato !== 'libero' ? '(Occupato)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-500 font-black text-xs uppercase mb-3">2. A che ora arrivi?</label>
              <input 
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className="w-full bg-gray-900 border-2 border-gray-800 p-5 rounded-2xl text-2xl font-mono text-center outline-none focus:border-green-500"
              />
            </div>

            <button 
              onClick={confermaPrenotazione}
              disabled={loading}
              className="w-full bg-green-600 text-black font-black py-6 rounded-3xl text-xl uppercase shadow-xl mt-8 active:scale-95 transition-all"
            >
              {loading ? "INVIO..." : "CONFERMA PRENOTAZIONE"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}