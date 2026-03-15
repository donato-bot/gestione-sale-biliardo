'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import Link from 'next/link';

export default function RegistratiPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [messaggio, setMessaggio] = useState({ tipo: '', testo: '' });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessaggio({ tipo: '', testo: '' });

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nome,
          },
        },
      });

      if (error) throw error;

      setMessaggio({ 
        tipo: 'successo', 
        testo: 'Registrazione effettuata! Controlla la tua email per confermare l\'account.' 
      });
    } catch (error: any) {
      setMessaggio({ 
        tipo: 'errore', 
        testo: error.message || 'Si è verificato un errore durante la registrazione.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-400">Radar Nucleare!</h1>
        <p className="text-gray-400 text-center mb-8">Crea il tuo account gestore</p>

        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Nome Completo" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)}
            className="w-full border border-gray-600 bg-gray-700 p-3 rounded text-white outline-none focus:ring-2 focus:ring-blue-500"
            required 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-600 bg-gray-700 p-3 rounded text-white outline-none focus:ring-2 focus:ring-blue-500"
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-600 bg-gray-700 p-3 rounded text-white outline-none focus:ring-2 focus:ring-blue-500"
            required 
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-blue-600 p-3 rounded font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-600"
          >
            {loading ? 'Elaborazione...' : 'Registrati ora'}
          </button>
        </form>

        {messaggio.testo && (
          <div className={`mt-6 p-4 rounded text-center text-sm ${
            messaggio.tipo === 'successo' ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'
          }`}>
            {messaggio.testo}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-400">
          Hai già un account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Accedi</Link>
        </div>
      </div>
    </div>
  );

  // test sblocco
}