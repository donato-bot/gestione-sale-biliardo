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

  // STATO SPECIALE PER CAPIRE L'ERRORE
  const [debugMsg, setDebugMsg] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      if (!tokenSocio) {
        setDebugMsg("Token mancante nell'URL.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);

        // 1. Trova il Socio con la nuova funzione JSON super-stabile (con .trim() per sicurezza)
        const { data: dataSocio, error: errSocio } = await (supabase as any)
          .rpc('ottieni_profilo_vip', { id_segreto: tokenSocio.trim() });

        if (errSocio) {
          setDebugMsg("Errore del database. Dettaglio: " + errSocio.message);
          throw new Error("Socio error");
        }
        
        if (!dataSocio) {
          // ECCO IL TRUCCO: STAMPIAMO L'ID ESATTO CHE STIAMO CERCANDO!
          setDebugMsg("Il Socio non esiste nel database. L'ID che ho cercato è esattamente questo: [" + tokenSocio + "]");
          throw new Error("Socio missing");
        }
        setSocio(dataSocio);

        // 2. Trova la Sala collegata
        const { data: dataSala, error: errSala } = await supabase
          .from('sale')
          .select('id, name')
          .eq('id', dataSocio.sala_id)
          .single();

        if (errSala) {
          setDebugMsg("Il DB ha bloccato la lettura della Sala. Dettaglio: " + errSala.message);
          throw new Error("Sala error");
        }
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
        console.error("Fetch Data Interrotto.");
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

  // SCHERMATA DI ERRORE CON DIAGNOSTICA
  if (!socio || !sala) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-black text-white uppercase mb-4">Accesso Negato</h1>
        <p className="text-gray-500 mb-6">Il link non è valido o la sessione è scaduta.</p>
        
        {/* IL NOSTRO VISORE NOTTURNO PER GLI ERRORI */}
        {debugMsg && (
          <div className="bg-red-950/40 border border-red-800 p-6 rounded-2xl max-w-lg text-left break-all">
            <p className="text-red-400 font-black uppercase text-xs tracking-widest mb-2 border-b border-red-900 pb-2">Diagnostica di Sistema</p>
            <p className="text-red-300 font-mono text-sm">{debugMsg}</p>
          </div>
        )}
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

        {/* TAB 3: TORNEI */}
        {activeTab === 'tornei' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-black uppercase text-purple-400 mb-4 tracking-widest italic">Tornei in Sala</h2>
            
            {tornei.length === 0 ? (
              <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 text-center shadow-lg">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Nessun torneo attivo.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {tornei.map((tr) => {
                  const mioStatus = (tr.iscritti || []).find((i: any) => i.id === socio.id);
                  
                  return (
                    <div key={tr.id} className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest ${tr.stato === 'iscrizioni' ? 'bg-yellow-500 text-black' : tr.stato === 'in_corso' ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white'}`}>
                        {tr.stato === 'iscrizioni' ? 'Iscrizioni Aperte' : tr.stato === 'in_corso' ? 'Live' : 'Concluso'}
                      </div>

                      <h3 className="text-2xl font-black italic uppercase text-white mt-2 mb-1">{tr.nome}</h3>
                      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-4">📅 {new Date(tr.data_inizio).toLocaleDateString()}</p>
                      
                      <div className="flex justify-between items-center bg-black p-4 rounded-2xl mb-4 border border-gray-800">
                        <div>
                          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Quota</p>
                          <p className="text-green-400 font-black">€ {parseFloat(tr.quota_iscrizione).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Il tuo stato</p>
                          {mioStatus ? (
                            <p className={`font-black uppercase text-xs tracking-widest ${mioStatus.confermato ? 'text-green-500' : 'text-yellow-500 animate-pulse'}`}>
                              {mioStatus.confermato ? '✓ Iscritto' : '⌛ In Attesa'}
                            </p>
                          ) : (
                            <p className="text-gray-600 font-black uppercase text-xs tracking-widest">Non Iscritto</p>
                          )}
                        </div>
                      </div>

                      {tr.stato === 'iscrizioni' && !mioStatus && (
                        <button onClick={() => richiediIscrizione(tr)} className="w-full bg-purple-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-transform">
                          Richiedi Iscrizione
                        </button>
                      )}

                      {(tr.stato === 'in_corso' || tr.stato === 'completato') && (
                        <button onClick={() => window.open(`/bacheca/${params.sala}/${tr.id}`, '_blank')} className="w-full bg-blue-600/20 border border-blue-500 text-blue-400 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2">
                          🏆 Visualizza Tabellone
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRENOTA */}
        {activeTab === 'prenota' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-black uppercase text-purple-400 mb-4 tracking-widest italic">Prenota il tuo Tavolo</h2>
            
            {prenotazioneSuccess ? (
              <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-8 text-center shadow-xl">
                <div className="w-16 h-16 bg-green-900/50 text-green-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-2 border-green-500">✓</div>
                <h3 className="text-2xl font-black text-white uppercase italic mb-2">Richiesta Inviata</h3>
                <p className="text-gray-400 text-sm mb-6">Il gestore confermerà la tua prenotazione a breve.</p>
                <button onClick={() => { setPrenotazioneSuccess(false); setActiveTab('home'); }} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest">Torna alla Home</button>
              </div>
            ) : (
              <form onSubmit={inviaPrenotazione} className="bg-gray-900 border border-gray-800 p-6 rounded-[2rem] shadow-xl flex flex-col gap-5">
                
                <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-1">Prenotazione a nome di</p>
                  <p className="text-white font-black uppercase italic">{socio.cognome} {socio.nome}</p>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold uppercase text-xs tracking-widest ml-2 mb-2">Data e Ora di Arrivo *</label>
                  <input required type="datetime-local" value={dataOra} onChange={(e) => setDataOra(e.target.value)} className="w-full bg-black border border-gray-700 focus:border-purple-500 p-4 rounded-xl text-lg font-mono text-purple-400 outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold uppercase text-xs tracking-widest ml-2 mb-2">Recapito (Opzionale)</label>
                  <input type="tel" value={telefono || socio.telefono || ""} onChange={(e) => setTelefono(e.target.value)} placeholder="Es. 333 1234567" className="w-full bg-black border border-gray-700 focus:border-purple-500 p-4 rounded-xl text-md text-white outline-none transition-all" />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold uppercase text-xs tracking-widest ml-2 mb-2">Note (Opzionale)</label>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Preferenze tavolo..." className="w-full bg-black border border-gray-700 focus:border-purple-500 p-4 rounded-xl text-sm text-white outline-none transition-all resize-none min-h-[80px]"></textarea>
                </div>

                <button type="submit" disabled={isSubmitting} className={`w-full py-5 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl transition-all mt-2 ${isSubmitting ? 'bg-purple-900 text-purple-700' : 'bg-purple-600 text-white active:scale-95'}`}>
                  {isSubmitting ? 'INVIO...' : 'INVIA RICHIESTA'}
                </button>
              </form>
            )}
          </div>
        )}

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