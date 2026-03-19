import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function AccessoSocio({ params }) {
  // 1. Estrapola il token dall'URL
  const token = params.token;

  // 2. Inizializza Supabase lato server
  const supabase = createServerComponentClient({ cookies });

  // 3. Cerca il socio con questo token esatto
  const { data: socio, error } = await supabase
    .from('soci')
    .select('nome, cognome, codice_tessera, credito, sala_id')
    .eq('token', token)
    .single();

  // 4. Se il token non esiste o c'è un errore, mostra la pagina 404
  if (error || !socio) {
    return notFound(); 
  }

  // 5. Se il token è valido, renderizza la "Tessera Digitale"
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      
      {/* Card del Socio */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl text-center">
        
        <h1 className="text-3xl font-bold text-green-400 mb-2">
          BILIARDO ROYAL
        </h1>
        <p className="text-gray-400 text-sm mb-8">Tessera Digitale</p>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold uppercase">
            {socio.nome} {socio.cognome !== 'EMPTY' ? socio.cognome : ''}
          </h2>
          <p className="text-gray-500 mt-1">
            Tessera N°: {socio.codice_tessera || 'N/D'}
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-400 uppercase tracking-wide">Credito Disponibile</p>
          <p className="text-4xl font-bold text-blue-400 mt-2">
            € {Number(socio.credito).toFixed(2)}
          </p>
        </div>

        {/* Qui potrai aggiungere in futuro un QR Code o uno storico consumazioni */}
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition duration-200">
          Mostra QR Code in Cassa
        </button>

      </div>
      
    </div>
  );
}