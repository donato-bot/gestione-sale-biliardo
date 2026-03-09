"use client";

import React, { useState } from "react";
// Usiamo la nostra bussola sicura per trovare il file Supabase
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";

export default function PaginaLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [caricamento, setCaricamento] = useState(false);
  const router = useRouter();

  const gestisciAccesso = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrore("");
    setCaricamento(true);

    // Il sistema bussa alla porta di Supabase con le tue chiavi
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrore("Accesso negato. Controlla email e password.");
      setCaricamento(false);
    } else {
      // REGOLA DEL PROTOCOLLO: Smistamento automatico
      if (email === "donatorzz1946@gmail.com") {
        // Se sei tu, ti apre la Torre di Controllo
        router.push("/admin/dashboard");
      } else {
        // Se è un manager, lo manda alla sua sala
        router.push("/dashboard/sala-esempio");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
      <div className="bg-[#1e293b] p-8 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-md relative overflow-hidden">
        
        {/* Effetto luce decorativo */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-400"></div>

        <div className="text-center mb-10 mt-4">
          <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Accesso di Sicurezza</h1>
          <p className="text-slate-400 text-sm">Inserisci le credenziali per entrare nel sistema</p>
        </div>

        {errore && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm text-center font-bold animate-pulse">
            {errore}
          </div>
        )}

        <form onSubmit={gestisciAccesso} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-[10px] font-black mb-2 uppercase tracking-widest">Email Operatore</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0f172a] border border-slate-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              placeholder="es. donatorzz1946@gmail.com"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-[10px] font-black mb-2 uppercase tracking-widest">Codice Segreto (Password)</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0f172a] border border-slate-600 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={caricamento}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest py-4 px-4 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 mt-4 shadow-lg shadow-emerald-900/20"
          >
            {caricamento ? "AUTENTICAZIONE IN CORSO..." : "SBLOCCA E ACCEDI"}
          </button>
        </form>

      </div>
    </div>
  );
}