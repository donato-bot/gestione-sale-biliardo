"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [sale, setSale] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Stati per il Varo (Onboarding Automatico)
  const [nomeSalaNuova, setNomeSalaNuova] = useState("");
  const [emailNuova, setEmailNuova] = useState("");
  const [passwordNuova, setPasswordNuova] = useState("");
  const [loadingVaro, setLoadingVaro] = useState(false);
  const [messaggioVaro, setMessaggioVaro] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== 'donatorzz1946@gmail.com') {
        router.push('/');
        return;
      }
      caricaSale();
    }
    checkAdmin();
  }, []);

  async function caricaSale() {
    const { data } = await supabase.from("sale").select("*");
    if (data) setSale(data);
    setLoading(false);
  }

  const toggleSala = async (id: string, currentState: boolean) => {
    const { error } = await supabase.from("sale").update({ is_active: !currentState }).eq("id", id);
    if (!error) {
        caricaSale();
    } else {
        alert("Errore nel cambio stato: " + error.message);
    }
  };

  const avviaOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingVaro(true);
    setMessaggioVaro("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomeSala: nomeSalaNuova, email: emailNuova, password: passwordNuova }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessaggioVaro("✅ VARO COMPLETATO! Sala creata ed email inviata.");
        setNomeSalaNuova("");
        setEmailNuova("");
        setPasswordNuova("");
        caricaSale(); // Aggiorna automaticamente la lista delle sale sotto
      } else {
        setMessaggioVaro(`❌ Errore durante il varo: ${data.error}`);
      }
    } catch (error) {
      setMessaggioVaro("❌ Errore di connessione al motore server.");
    } finally {
      setLoadingVaro(false);
    }
  };

  // Logica di filtraggio live
  const filteredSale = sale.filter((sala) => 
    sala.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-black text-white p-8">Caricamento Torre di Controllo...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">TORRE DI CONTROLLO</h1>
            <button onClick={() => router.push('/dashboard')} className="bg-gray-800 px-6 py-2 rounded-xl font-bold hover:bg-gray-700 transition">TORNA DASHBOARD</button>
        </div>

        {/* MODULO ONBOARDING (VARO NUOVO CLUB) */}
        <div className="bg-gray-900 p-8 rounded-3xl border border-gray-800 mb-8 shadow-xl">
          <h2 className="text-2xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase italic">Varo Nuovo Club</h2>
          <form onSubmit={avviaOnboarding} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Nome Sala</label>
              <input required type="text" value={nomeSalaNuova} onChange={e => setNomeSalaNuova(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-gray-700 text-white outline-none focus:border-emerald-500 transition-colors" placeholder="es. Green Table" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Email Manager</label>
              <input required type="email" value={emailNuova} onChange={e => setEmailNuova(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-gray-700 text-white outline-none focus:border-emerald-500 transition-colors" placeholder="manager@email.it" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">Password</label>
              <input required type="text" value={passwordNuova} onChange={e => setPasswordNuova(e.target.value)} className="w-full bg-black p-3 rounded-xl border border-gray-700 text-white outline-none focus:border-emerald-500 transition-colors" placeholder="Pass provvisoria" />
            </div>
            <button type="submit" disabled={loadingVaro} className="bg-emerald-600 p-3 rounded-xl font-black text-white hover:bg-emerald-500 transition-all uppercase tracking-widest h-[50px] disabled:opacity-50">
              {loadingVaro ? "VARO IN CORSO..." : "⚡ Esegui Varo"}
            </button>
          </form>
          {messaggioVaro && (
            <div className={`mt-4 p-3 rounded-xl font-bold text-sm ${messaggioVaro.includes("✅") ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800" : "bg-red-900/50 text-red-400 border border-red-800"}`}>
              {messaggioVaro}
            </div>
          )}
        </div>

        {/* Barra di ricerca */}
        <div className="mb-8">
            <input 
                type="text" 
                placeholder="🔍 Cerca sala per nome..." 
                className="w-full bg-gray-900 p-4 rounded-2xl border border-gray-700 text-white placeholder-gray-500 focus:border-pink-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>

        <div className="grid gap-4">
            {filteredSale.map((sala) => (
                <div key={sala.id} className="bg-gray-900 p-6 rounded-3xl border border-gray-800 flex justify-between items-center hover:border-gray-600 transition-all">
                    <div>
                        <h3 className="text-xl font-black">{sala.name}</h3>
                        <p className="text-gray-500 text-sm">{sala.manager_email}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <span className={`px-4 py-1 rounded-full text-xs font-black ${sala.is_active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                            {sala.is_active ? 'ATTIVA' : 'SOSPESA'}
                        </span>
                        <button 
                            onClick={() => toggleSala(sala.id, sala.is_active)}
                            className={`px-6 py-2 rounded-xl font-black ${sala.is_active ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}
                        >
                            {sala.is_active ? 'SOSPENDI' : 'ATTIVA'}
                        </button>
                    </div>
                </div>
            ))}
            
            {filteredSale.length === 0 && (
                <div className="text-center text-gray-500 py-10 font-bold">Nessuna sala trovata.</div>
            )}
        </div>
      </div>
    </div>
  );
}