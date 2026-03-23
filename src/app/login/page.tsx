"use client";

import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

// Inizializzazione Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Tenta l'accesso con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Credenziali errate. Riprova.");
        setLoading(false);
        return;
      }

      const userEmail = authData.user?.email;

      // 2. Controllo: È il Super Admin (Tu)?
      if (userEmail === 'donatorzz1946@gmail.com') {
        router.push('/admin/dashboard'); // Sostituisci con l'URL esatto della tua Torre di Controllo
        return;
      }

      // 3. Controllo: È un Gestore di Sala?
      if (userEmail) {
        const { data: salaData, error: salaError } = await supabase
          .from('sale')
          .select('id, name') // MODIFICA 1: Ho aggiunto 'id' per recuperare l'ID univoco dal database
          .eq('manager_email', userEmail)
          .single();

        if (salaData) {
          // MODIFICA 2: Invece di usare uno "slug" testuale, usiamo l'ID reale della sala.
          // Così la dashboard troverà la sala corretta nel database!
          router.push(`/dashboard/${salaData.id}`);
        } else {
          // Se l'utente esiste ma non ha una sala assegnata
          setError("Nessuna sala assegnata a questo account. Contatta l'amministratore.");
          await supabase.auth.signOut(); // Lo scolleghiamo per sicurezza
        }
      }

    } catch (err) {
      setError("Si è verificato un errore di connessione.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-gray-900 border-2 border-green-600 rounded-[3rem] p-10 shadow-[0_0_40px_rgba(22,163,74,0.15)]">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">Accesso</h1>
          <h2 className="text-2xl font-black text-green-500 uppercase tracking-widest">Sistema Gestionale</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-2">Email Operativa</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-green-500 transition-colors"
              placeholder="es. manager@sala.it"
              required
            />
          </div>

          <div>
            <label className="block text-gray-500 text-xs font-bold uppercase tracking-widest mb-2 ml-2">Codice di Sicurezza</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-800 p-5 rounded-2xl text-white outline-none focus:border-green-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-400 p-4 rounded-2xl text-sm font-bold text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-6 mt-4 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:text-gray-500 rounded-3xl font-black uppercase tracking-widest text-lg shadow-xl shadow-green-900/40 transition-all active:scale-95"
          >
            {loading ? "Verifica in corso..." : "Richiedi Accesso"}
          </button>
        </form>

      </div>
    </div>
  );
}