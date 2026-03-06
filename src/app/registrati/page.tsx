"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterSala() {
  const router = useRouter();

  // Stato del modulo
  const [formData, setFormData] = useState({
    nomeSala: "",
    citta: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Registrazione Utente su Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. Creazione del record nella tabella 'sale'
      const { error: dbError } = await supabase.from("sale").insert([
        {
          name: formData.nomeSala,
          city: formData.citta,
          manager_email: formData.email,
          tariffa_oraria: 10.0,
          is_active: true,
        },
      ]);

      if (dbError) throw dbError;

      alert("Registrazione completata con successo!");
      router.push("/"); 
      
    } catch (err: any) {
      setError(err.message || "Si è verificato un errore");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden border-t-[12px] border-green-500">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight italic">BILIARDI PRO</h1>
            <p className="text-green-600 font-bold mt-2 uppercase text-xs tracking-[0.2em]">🚀 Fase 1: Attivazione Nuova Sala</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Nome Sala (Insegna)</label>
              <input 
                required 
                type="text" 
                placeholder="es. Il Panno Verde" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-700"
                onChange={(e) => setFormData({ ...formData, nomeSala: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Città</label>
              <input 
                required 
                type="text" 
                placeholder="es. Milano" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-700"
                onChange={(e) => setFormData({ ...formData, citta: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Email Gestore</label>
              <input 
                required 
                type="email" 
                placeholder="tua@email.com" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-700"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Password</label>
              <input 
                required 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-700"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-[11px]">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-lg text-sm font-black text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? "Creazione in corso..." : "Completa Registrazione"}
            </button>
          </form>
        </div>

        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-mono italic">Documento interno formazione staff - v2.4</p>
        </div>
      </div>
    </div>
  );
}