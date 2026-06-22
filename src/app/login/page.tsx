"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Importiamo l'istanza centralizzata che abbiamo ripulito prima
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();

  // Controlla se c'è già una sessione attiva appena si apre la pagina
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSessionUser(session.user);
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  // Funzione centralizzata per smistare l'utente alla sua dashboard
  const eseguiAccesso = async (userEmail: string) => {
    setLoading(true);
    
    // Bypass per l'amministratore (La Torre di Controllo)
    if (userEmail === 'donatorzz1946@gmail.com') {
      router.push('/admin/dashboard');
      return; 
    } 
    
    // Ricerca della sala assegnata al manager
    const { data: salaData, error: salaError } = await supabase
      .from('sale')
      .select('id')
      .eq('manager_email', userEmail)
      .single();

    if (salaError || !salaData) {
      await supabase.auth.signOut();
      setSessionUser(null);
      setError('Accesso negato: nessuna sala associata a questa email.');
      setLoading(false);
    } else {
      router.push(`/dashboard/${salaData.id}`);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const pulisciEmail = email.toLowerCase().trim();
    const pulisciPassword = password.trim();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: pulisciEmail,
        password: pulisciPassword,
      });

      if (authError) {
        // DIAGNOSTICA AI RAGGI X
        const errorMessage = authError.message.toLowerCase();
        
        if (errorMessage.includes('confirm')) {
          setError("❌ UTENTE NON CONFERMATO: Su Supabase elimina l'utente e ricrealo ricordandoti di SPUNTARE 'Auto Confirm User'.");
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorMessage.includes('security')) {
          setError("⏳ BLOCCO DI SICUREZZA: Troppi tentativi ravvicinati. Supabase ha congelato l'accesso per 5 minuti. Attendi.");
        } else {
          setError(`🛠 DIAGNOSTICA MOTORE: ${authError.message}`);
        }
        
        setLoading(false);
        return;
      }

      // Se il login manuale va a buon fine, avvia la procedura di instradamento
      eseguiAccesso(pulisciEmail);
      
    } catch (err) {
      setError('Errore di connessione al motore server.');
      setLoading(false);
    }
  };

  // Mostra una schermata neutra mentre controlla se l'utente esiste già
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-500 font-bold tracking-widest uppercase animate-pulse">
          Verifica credenziali in corso...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#11131a] p-8 rounded-3xl border border-gray-800 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-cyan-400 tracking-wider mb-2">IL CAMPIONE</h1>
          <p className="text-gray-500 text-xs font-bold tracking-widest uppercase">
            Ingresso Centralizzato
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 text-sm font-bold text-center p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* SE L'UTENTE È GIÀ RICONOSCIUTO */}
        {sessionUser ? (
          <div className="space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-cyan-900/20 border border-cyan-800 p-4 rounded-xl">
              <p className="text-cyan-400 font-bold tracking-widest text-xs uppercase mb-1">Sessione Attiva</p>
              <p className="text-white font-medium">{sessionUser.email}</p>
            </div>
            
            <button
              onClick={() => eseguiAccesso(sessionUser.email)}
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black tracking-widest uppercase rounded-xl p-4 transition-all disabled:opacity-50"
            >
              {loading ? 'Entrata in corso...' : 'Accedi alla Dashboard'}
            </button>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                setSessionUser(null);
              }}
              className="w-full bg-transparent border border-gray-800 hover:border-gray-600 text-gray-500 font-bold text-xs tracking-widest uppercase rounded-xl p-4 transition-all"
            >
              Cambia Account (Logout)
            </button>
          </div>
        ) : (
          /* SE L'UTENTE NON È LOGGATO (FORM CLASSICO) */
          <form onSubmit={handleLogin} className="space-y-6 animate-in fade-in duration-300" autoComplete="off">
            <div>
              <label className="block text-gray-500 text-xs font-bold tracking-widest uppercase mb-2">
                Email Utente
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0c10] border border-gray-700 rounded-xl p-4 text-white font-medium focus:outline-none focus:border-cyan-500"
                required
                autoComplete="off"
                data-lpignore="true"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-bold tracking-widest uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0c10] border border-gray-700 rounded-xl p-4 text-white font-bold tracking-widest focus:outline-none focus:border-cyan-500"
                required
                autoComplete="new-password"
                data-lpignore="true"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black tracking-widest uppercase rounded-xl p-4 mt-4 transition-all disabled:opacity-50"
            >
              {loading ? 'Analisi credenziali...' : 'Entra nel Sistema'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}