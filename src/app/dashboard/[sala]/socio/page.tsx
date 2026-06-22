"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
// Correzione: Percorso relativo esatto per i server Vercel
import BachecaSocio from "../../../../components/BachecaSocio"; 

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SocioPage() {
  const [email, setEmail] = useState("");
  const [socio, setSocio] = useState<any>(null);
  const [tavoli, setTavoli] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "dashboard" | "prenota">("login");
  const [selectedTable, setSelectedTable] = useState("");
  const [bookingTime, setBookingTime] = useState("");

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
      alert("❌ Email non trovata.");
    } else {
      setSocio(data);
      setView("dashboard");
    }
    setLoading(false);
  };

  const confermaPrenotazione = async () => {
    if (!selectedTable || !bookingTime) { alert("Seleziona tavolo e orario!"); return; }
    setLoading(true);
    const { error } = await supabase
      .from('tavoli')
      .update({ stato: 'prenotato', prenotato_da: `${socio.nome} ${socio.cognome}`, prenotato_alle: bookingTime })
      .eq('id', selectedTable);

    if (error) alert("Errore: " + error.message);
    else {
      alert("✅ Prenotazione inviata!");
      setView("dashboard");
      const { data } = await supabase.from('tavoli').select('*').order('numero', { ascending: true });
      if (data) setTavoli(data);
    }
    setLoading(false);
  };

  if (view === "login") return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-black text-green-500 mb-8 italic">Biliardo Royal</h1>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="La tua Email" className="w-full bg-gray-900 p-5 rounded-2xl mb-4 text-center" />
        <button onClick={loginSocio} className="w-full bg-green-600 py-5 rounded-2xl font-black">ACCEDI</button>
      </div>
    </div>
  );

  if (view === "dashboard") return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-sm mx-auto">
        <div className="flex justify-between mb-8">
            <h2 className="text-2xl font-black italic">Ciao, {socio.nome}!</h2>
            <button onClick={() => setView("login")} className="text-xs font-bold uppercase">Esci</button>
        </div>
        
        <div className="bg-gray-900 rounded-[2.5rem] p-8 border-2 border-green-600 mb-8">
            <p className="text-green-500 text-xs font-bold uppercase">Il tuo Credito</p>
            <p className="text-6xl font-black">€ {parseFloat(socio.credito || 0).toFixed(2)}</p>
        </div>

        {/* INTEGRAZIONE BACHECA */}
        {socio && <BachecaSocio salaId={socio.sala_id} socioId={socio.id} />}

        <button onClick={() => setView("prenota")} className="w-full bg-white text-black font-black py-6 rounded-3xl mt-8">📅 PRENOTA TAVOLO</button>
      </div>
    </div>
  );

  if (view === "prenota") return (
    <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-sm mx-auto">
            <button onClick={() => setView("dashboard")} className="mb-8">← Indietro</button>
            <h2 className="text-3xl font-black uppercase mb-8">Scegli la tua sessione</h2>
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} className="w-full bg-gray-900 p-5 rounded-2xl mb-4">
                <option value="">Seleziona Tavolo...</option>
                {tavoli.map(t => <option key={t.id} value={t.id} disabled={t.stato !== 'libero'}>Tavolo {t.numero}</option>)}
            </select>
            <input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} className="w-full bg-gray-900 p-5 rounded-2xl mb-4" />
            <button onClick={confermaPrenotazione} className="w-full bg-green-600 py-6 rounded-3xl font-black">CONFERMA</button>
        </div>
    </div>
  );

  return null;
}