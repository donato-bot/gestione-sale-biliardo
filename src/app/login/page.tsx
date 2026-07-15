"use client";

import { useState } from "react";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Convalida delle credenziali sul server di autenticazione
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError) {
      alert("Errore di accesso: " + authError.message);
      setLoading(false);
      return;
    }

    // 2. INGRESSO UNICO: APPLICAZIONE DEI DUE CONTROLLI ESCLUSIVI
    if (cleanEmail === "donatorzz1946@gmail.com") {
      
      // CONTROLLO A: È il Super Admin -> Va dritto alla Torre di Controllo
      router.push("/admin");
      
    } else {
      
      // CONTROLLO B: È un Manager -> Cerca la sala associata alla sua email
      try {
        const { data: salaData, error: salaError } = await supabase
          .from("sale")
          .select("id")
          .eq("manager_email", cleanEmail)
          .single();

        if (salaError || !salaData) {
          alert("Nessuna sala biliardo associata a questa email nel database. Contatta il Super Admin.");
          setLoading(false);
          return;
        }

        // Trovata la sala, lo reindirizza alla sua cartella dinamica con tutti i menù
        router.push(`/dashboard/${salaData.id}`);
      } catch (err) {
        console.error("Errore smistamento sala:", err);
        alert("Errore meccanico nel recupero della sala.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans p-4">
      <div className="bg-[#11131a] border border-gray-800 p-8 rounded-[2rem] w-full max-w-md shadow-2xl">
        <h1 className="text-2xl font-black uppercase tracking-widest text-cyan-500 mb-6 text-center">
          Il Campione
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
              Email di Accesso
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500" 
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1.5">
              Password Security
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-black border border-gray-800 p-4 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 text-white font-black uppercase tracking-widest py-4 rounded-xl text-xs transition-all mt-2"
          >
            {loading ? "VERIFICA CREDENZIALI IN CORSO..." : "ACCEDI ALLA PLANCIA"}
          </button>
        </form>
      </div>
    </div>
  );
}