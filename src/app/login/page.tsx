"use client";

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenziali non valide. Riprova.");
      setLoading(false);
      return;
    }

    if (data?.user) {
      const { data: salaData, error: salaError } = await supabase
        .from('sale')
        .select('id')
        .eq('manager_email', data.user.email)
        .single();

      if (salaError || !salaData) {
        setError("Nessuna sala associata a questo account.");
        setLoading(false);
        return;
      }

      router.push(`/dashboard/${salaData.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-[#11131a] p-10 rounded-[40px] border border-gray-800 shadow-2xl">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-cyan-500 uppercase tracking-widest mb-2">Login</h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">Accesso Torre di Controllo</p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-400 p-4 rounded-2xl text-xs text-center font-bold mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Email Amministratore</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-bold text-sm text-white focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="admin@sala.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black p-5 rounded-2xl border border-gray-800 font-black text-lg tracking-[0.3em] text-white focus:outline-none focus:border-cyan-500 transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg mt-4"
          >
            {loading ? 'Autenticazione...' : 'Accedi al Sistema'}
          </button>
        </form>
        
      </div>
    </div>
  );
}