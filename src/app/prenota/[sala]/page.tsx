"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; 
import { useParams } from "next/navigation";

// Inizializza Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function PrenotazionePubblica() {
  const params = useParams();
  
  // Decodifica l'URL e pulisce eventuali trattini o underscore
  const nomeSalaUrl = params.sala as string;
  const nomeSalaDecoded = decodeURIComponent(nomeSalaUrl).replace(/[-_]/g, ' ').trim();

  const [loading, setLoading] = useState(true);
  const [salaId, setSalaId] = useState<string | null>(null);
  
  // Stati del Form
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [dataOra, setDataOra] = useState("");
  const [note, setNote] = useState("");
  
  // Stato invio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSala() {
      try {
        // Cerca la sala ignorando maiuscole/minuscole e spaziature extra
        const { data, error } = await supabase
          .from('sale')
          .select('id, name')
          .ilike('name', `%${nomeSalaDecoded}%`)
          .single();

        if (error) {
          console.error("Errore Supabase:", error);
          setDebugError(error.message);
          return;
        }

        if (data) {
          setSalaId(data.id);
        }
      } catch (err) {
        console.error("Eccezione durante la ricerca sala:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSala();
  }, [nomeSalaDecoded]);

  const inviaPrenotazione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaId || !nomeCliente || !dataOra) {
      alert("Compila tutti i campi obbligatori!");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('prenotazioni').insert([{
        sala_id: salaId,
        nome_cliente: nomeCliente,
        telefono: telefono,
        data_ora: dataOra,
        note: note,
        stato: 'in_attesa'
      }]);

      if (error) throw error;

      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SCHERMATA DI CARICAMENTO
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-teal-500 font-black text-xl animate-pulse tracking-widest">Caricamento sala...</div>;
  }

  // SCHERMATA ERRORE (SALA NON TROVATA)
  if (!salaId) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-red-500 font-black p-4 text-center">
        <h1 className="text-4xl mb-4 uppercase">Sala non trovata</h1>
        <p className="text-gray-400 mb-2">Verifica che il link della sala sia corretto.</p>
        <p className="text-gray-600 text-xs uppercase tracking-widest">Hai cercato: "{nomeSalaDecoded}"</p>
        {/* Mostra l'errore SQL a schermo per aiutarti a fare debug se serve */}
        {debugError && <p className="text-red-900 text-xs mt-4">Debug: {debugError}</p>}
      </div>
    );
  }

  // SCHERMATA DI SUCCESSO
  if (success) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-teal-900/50 text-teal-400 rounded-full flex items-center justify-center text-5xl mb-8 border-4 border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.4)]">
          ✓
        </div>
        <h1 className="text-4xl font-black text-white uppercase italic mb-4">Richiesta Inviata!</h1>
        <p className="text-gray-400 text-lg mb-8 max-w-md">Abbiamo inviato la tua richiesta alla cassa della sala. Ti aspettiamo!</p>
        <button onClick={() => window.location.reload()} className="bg-gray-900 border-2 border-gray-700 text-white font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-gray-800 transition-colors">
          Nuova Prenotazione
        </button>
      </div>
    );
  }

  // SCHERMATA PRINCIPALE DEL FORM
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans tracking-tighter flex justify-center items-start pt-12 md:pt-24 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        <div className="text-center mb-10">
          <p className="text-teal-500 font-bold uppercase tracking-widest text-sm mb-2">Prenota un tavolo da</p>
          <h1 className="text-5xl font-black text-white uppercase italic leading-none">{nomeSalaDecoded}</h1>
        </div>

        <form onSubmit={inviaPrenotazione} className="bg-gray-900/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl flex flex-col gap-6">
          
          <div className="space-y-2">
            <label className="text-gray-400 font-bold uppercase text-xs tracking-widest ml-2">Nome e Cognome *</label>
            <input 
              required 
              type="text" 
              value={nomeCliente} 
              onChange={(e) => setNomeCliente(e.target.value)} 
              className="w-full bg-black border border-gray-700 focus:border-teal-500 p-4 rounded-2xl text-lg text-white outline-none transition-all" 
              placeholder="Es. Mario Rossi"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 font-bold uppercase text-xs tracking-widest ml-2">Telefono *</label>
            <input 
              required 
              type="tel" 
              value={telefono} 
              onChange={(e) => setTelefono(e.target.value)} 
              className="w-full bg-black border border-gray-700 focus:border-teal-500 p-4 rounded-2xl text-lg text-white outline-none transition-all" 
              placeholder="Per eventuali comunicazioni"
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 font-bold uppercase text-xs tracking-widest ml-2">Data e Ora di Arrivo *</label>
            <input 
              required 
              type="datetime-local" 
              value={dataOra} 
              onChange={(e) => setDataOra(e.target.value)} 
              className="w-full bg-black border border-gray-700 focus:border-teal-500 p-4 rounded-2xl text-xl font-mono text-teal-400 outline-none transition-all" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-gray-400 font-bold uppercase text-xs tracking-widest ml-2">Note Aggiuntive (Opzionale)</label>
            <textarea 
              value={note} 
              onChange={(e) => setNote(e.target.value)} 
              className="w-full bg-black border border-gray-700 focus:border-teal-500 p-4 rounded-2xl text-white outline-none transition-all resize-none min-h-[100px]" 
              placeholder="Es. Vorrei il tavolo riscaldato..."
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full py-6 mt-4 rounded-3xl font-black uppercase tracking-widest text-xl shadow-xl transition-all ${isSubmitting ? 'bg-teal-900 text-teal-700 cursor-not-allowed' : 'bg-teal-600 text-black hover:bg-teal-500 active:scale-95'}`}
          >
            {isSubmitting ? 'INVIO IN CORSO...' : 'INVIA RICHIESTA'}
          </button>
        </form>

      </div>
    </div>
  );
}