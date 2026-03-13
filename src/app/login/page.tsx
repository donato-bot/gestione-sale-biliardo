'use client'
import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Sfondamento: Autenticazione diretta con Password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(`Errore: ${error.message}`)
    } else {
      setMessage("Infiltrazione completata! Salto nell'iperspazio...")
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Accesso <span className="text-green-500">Torre di Controllo</span></h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Operativa</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-green-500"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Codice di Sicurezza (Password)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded text-white focus:outline-none focus:border-green-500"
              placeholder="Inserisci la password"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Richiedi Accesso
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-slate-700 rounded text-green-400 text-center text-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}