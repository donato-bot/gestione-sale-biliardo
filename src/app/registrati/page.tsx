'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function RegistratiPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert('Controlla la tua email per confermare la registrazione!');
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Registrazione Radar Nucleare</h1>
      <form onSubmit={handleSignUp} className="flex flex-col gap-4 border p-8 rounded-lg">
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded text-black"
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded text-black"
          required 
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Caricamento...' : 'Registrati'}
        </button>
      </form>
    </div>
  );
}