// ==========================================
// FILE: src/app/login/page.tsx
// OBIETTIVO: Maschera di accesso unica e smistamento post-login
// ==========================================
"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase"; // <-- Percorso relativo corretto (torna indietro di una cartella)
import { useRouter } from "next/navigation";

const SUPER_ADMIN = "donatorzz1946@gmail.com";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Convalida delle credenziali sul server di autenticazione Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) {
      alert("Errore di accesso: Credenziali errate o account inesistente.");
      setLoading(false);
      return;
    }

    // 2. INGRESSO UNICO: APPLICAZIONE DEI DUE CONTROLLI ESCLUSIVI
    if (cleanEmail === SUPER_ADMIN) {
      
      // ROTTA A: È il Super Admin -> Va dritto alla Torre di Controllo
      router.push("/admin");
      
    } else {
      
      // ROTTA B: È un Manager -> Cerca la sala associata alla sua email
      try {
        const { data: salaData, error: salaError } = await supabase
          .from("sale")
          .select("id")
          .eq("manager_email", cleanEmail)
          .single();

        if (salaError || !salaData) {
          alert("Nessuna sala biliardo associata a questa email nel database. Contatta l'Amministratore.");
          await supabase.auth.signOut(); // Forza la disconnessione se c'è un'anomalia
          setLoading(false);
          return;
        }

        // Trovata la sala, lo reindirizza alla sua cartella dinamica
        router.push(`/dashboard/${salaData.id}`);
      } catch (err) {
        console.error("Errore smistamento sala:", err);
        alert("Errore meccanico nel recupero della sala.");
        await supabase.auth.signOut();
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-sans p-4 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[100vh] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black -z-10"></div>

      <div className="bg-[#11131a] border border-gray-800 p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl z-10">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-widest text-cyan-400 italic drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            Il Campione
          </h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-2">
            Terminale di Rete Unificato
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
              Email di Accesso
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-700" 
              placeholder="Inserisci email..."
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
              Password Security
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-700" 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:shadow-none text-black font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all mt-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            {loading ? "VERIFICA IN CORSO..." : "ACCEDI ALLA PLANCIA"}
          </button>
        </form>
      </div>
    </div>
  );
}