"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; 
import { useParams, useRouter } from "next/navigation";

// Inizializza Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AppVIP() {
  const params = useParams();
  const router = useRouter();
  
  // Il token è l'ID univoco del socio
  const tokenSocio = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [sala, setSala] = useState<any>(null);
  const [socio, setSocio] = useState<any>(null);
  const [tornei, setTornei] = useState<any[]>([]);
  const [bacheca, setBacheca] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<"home" | "tornei" | "prenota" | "bacheca">("home");

  const [telefono, setTelefono] = useState("");
  const [dataOra, setDataOra] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prenotazioneSuccess, setPrenotazioneSuccess] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!tokenSocio) return;
      
      try {
        setLoading(true);

        // 1. Usa la funzione di sicurezza RPC (Cast a 'any' per evitare errori TS)
        const { data: dataSocio, error: errSocio } = await (supabase as any)
          .rpc('ottieni_profilo_vip', { id_segreto: tokenSocio })
          .single();

        if (errSocio || !dataSocio) {
          console.error("Errore recupero socio:", errSocio);
          throw new Error("Socio non trovato");
        }
        setSocio(dataSocio);

        // 2. Trova la Sala collegata al Socio
        const { data: dataSala, error: errSala } = await supabase
          .from('sale')
          .select('id, name')
          .eq('id', dataSocio.sala_id)
          .single();

        if (errSala || !dataSala) throw new Error("Sala non trovata");
        setSala(dataSala);

        // 3. Carica i Tornei
        const { data: dataTornei } = await supabase
          .from('tornei')
          .select('*')
          .eq('sala_id', dataSala.id)
          .order('data_inizio', { ascending: false });
        if (dataTornei) setTornei(dataTornei);

        // 4. Carica la Bacheca
        const { data: dataBacheca } = await supabase
          .from('bacheca')
          .select('*, reazioni_bacheca(*)')
          .eq('sala_id', dataSala.id)
          .order('created_at', { ascending: false });
        if (dataBacheca) setBacheca(dataBacheca);

      } catch (err) {
        console.error("Errore nel caricamento dati VIP:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [tokenSocio]);

  // --- REAZIONI BACHECA ---
  const gestisciReazione = async (postId: string, emoji: string) => {
    if (!socio || !sala) return;
    const post = bacheca.find(p => p.id === postId);
    const reazioneEsistente = post.reazioni_bacheca?.find((r: any) => r.socio_id === socio.id);

    try {
      if (reazioneEsistente) {
        if (reazioneEsistente.tipo === emoji) {
          await supabase.from('reazioni_bacheca').delete().eq('id', reazioneEsistente.id);
        } else {
          await supabase.from('reazioni_bacheca').update({ tipo: emoji }).eq('id', reazioneEsistente.id);
        }
      } else {
        await supabase.from('reazioni_bacheca').insert([{ post_id: postId, socio_id: socio.id, tipo: emoji }]);
      }

      const { data: dataBachecaAggiornata } = await supabase
        .from('bacheca')
        .select('*, reazioni_bacheca(*)')
        .eq('sala_id', sala.id)
        .order('created_at', { ascending: false });
      
      if (dataBachecaAggiornata) setBacheca(dataBachecaAggiornata);
    } catch (error) {
      console.error("Errore reazione:", error);
    }
  };

  // --- PRENOTAZIONE ---
  const inviaPrenotazione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sala || !socio || !dataOra) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('prenotazioni').insert([{
        sala_id: sala.id,
        nome_cliente: `${socio.cognome} ${socio.nome}`,
        telefono: telefono || socio.telefono || "Non fornito",
        data_ora: dataOra,
        note: note,
        stato: 'in_attesa'
      }]);
      if (error) throw error;
      setPrenotazioneSuccess(true);
    } catch (error) {
      alert("Errore durante la prenotazione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-bold animate-pulse">ACCESSO VIP...</div>;

  if (!socio || !sala) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-black text-white uppercase mb-4">Accesso Negato</h1>
        <p className="text-gray-500">Il link non è valido o la sessione è scaduta.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="pt-10 px-6 pb-6 relative z-10 flex justify-between items-end">
        <div>
          <p className="text-purple-500 font-bold uppercase tracking-widest text-[10px] mb-1">{sala.name}</p>
          <h1 className="text-3xl font-black italic uppercase">Ciao, {socio.nome}!</h1>
        </div>
        <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full flex items-center justify-center border-2 border-purple-400/30">
          <span className="text-xl font-black">{socio.nome[0]}{socio.cognome[0]}</span>
        </div>
      </div>

      <div className="px-6 relative z-10">
        
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="mt-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-[2rem] p-8 shadow-2xl">
              <div className="mb-4">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-1">Credito Attuale</p>
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 italic">
                  € {parseFloat(socio.credito || 0).toFixed(2)}
                </h2>
              </div>
              <p className="text-gray-600 font-mono text-[10px] uppercase">Codice Socio: {socio.id.slice(0,8)}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <button onClick={() => setActiveTab('bacheca')} className="bg-gray-900 border border-gray-800 p-5 rounded-3xl flex flex-col items-center gap-2">
                <span className="text-2xl">📢</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">News</span>
              </button>
              <button onClick={() => setActiveTab('prenota')} className="bg-gray-900 border border-gray-800 p-5 rounded-3xl flex flex-col items-center gap-2">
                <span className="text-2xl">📅</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">Prenota</span>
              </button>
              <button onClick={() => setActiveTab('tornei')} className="bg-gray-900 border border-gray-800 p-5 rounded-3xl flex flex-col items-center gap-2">
                <span className="text-2xl">🏆</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">Tornei</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'bacheca' && (
          <div className="flex flex-col gap-6 animate-in fade-in">
            {bacheca.map((post) => (
              <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <p className="text-gray-500 text-[10px] font-bold mb-3 uppercase">{new Date(post.created_at).toLocaleDateString()}</p>
                <p className="text-white leading-relaxed mb-4">{post.testo}</p>
                <div className="flex gap-2">
                  {['👍', '❤️', '🔥'].map(emoji => (
                    <button key={emoji} onClick={() => gestisciReazione(post.id, emoji)} className="bg-black px-3 py-1.5 rounded-full border border-gray-800 text-sm">
                      {emoji} {post.reazioni_bacheca?.filter((r:any) => r.tipo === emoji).length || 0}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Altri tab (tornei, prenota) seguono la stessa logica UI... */}

      </div>

      {/* Navigazione */}
      <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-lg border-t border-gray-800 py-4 flex justify-around items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`text-xs font-bold uppercase ${activeTab === 'home' ? 'text-purple-500' : 'text-gray-600'}`}>Home</button>
        <button onClick={() => setActiveTab('bacheca')} className={`text-xs font-bold uppercase ${activeTab === 'bacheca' ? 'text-purple-500' : 'text-gray-600'}`}>News</button>
        <button onClick={() => setActiveTab('tornei')} className={`text-xs font-bold uppercase ${activeTab === 'tornei' ? 'text-purple-500' : 'text-gray-600'}`}>Tornei</button>
        <button onClick={() => setActiveTab('prenota')} className={`text-xs font-bold uppercase ${activeTab === 'prenota' ? 'text-purple-500' : 'text-gray-600'}`}>Prenota</button>
      </div>

    </div>
  );
}