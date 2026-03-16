import { createClient } from '@supabase/supabase-js';

// Usiamo la chiave pubblica configurata su Vercel per sbloccare il caricamento
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey);

export default async function IspezionePage() {
  // Peschiamo tutte le sale senza filtri
  const { data: sale, error } = await supabaseAdmin.from('sale').select('*');

  return (
    <div className="p-10 min-h-screen bg-black text-white font-sans">
      <h1 className="text-3xl font-bold text-purple-500 mb-6 flex items-center gap-3">
        📡 RADAR INTERNO: ISPEZIONE DATABASE
      </h1>
      
      {error && (
        <div className="bg-red-900/50 p-4 rounded text-red-400 border border-red-700">
          Errore di lettura dal database: {error.message}
        </div>
      )}

      {!error && sale && sale.length === 0 && (
        <p className="text-gray-400 italic">Il database risponde, ma non ci sono sale registrate.</p>
      )}

      {!error && sale && sale.length > 0 && (
        <div className="grid gap-4">
          {sale.map((sala) => (
            <div key={sala.id} className="bg-gray-900 p-5 rounded-lg border border-gray-700 shadow-lg">
              <p className="text-xl font-semibold text-white mb-2">{sala.name || 'Nome mancante'}</p>
              <p className="text-gray-300"><strong>Email Manager:</strong> <span className="text-blue-400">{sala.manager_email}</span></p>
              <p className="text-gray-300 mt-1">
                <strong>Stato Sala:</strong> {sala.is_active ? '🟢 ATTIVA' : '🔴 SOSPESA'}
              </p>
              <p className="text-xs text-gray-600 mt-4 font-mono">ID di sistema: {sala.id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}