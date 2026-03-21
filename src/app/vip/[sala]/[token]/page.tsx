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
  
  // Usiamo solo il token (che è l'ID del socio) per un accesso infallibile
  const tokenSocio = params.token as string;

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
      try {
        // 1. Trova DIRETTAMENTE il Socio tramite il suo ID univoco (infallibile)
        const { data: dataSocio, error: errSocio } = await supabase
          .from('soci')
          .select('*')
          .eq('id', tokenSocio)
          .single();

        if (errSocio || !dataSocio) throw new Error("Socio non trovato");
        setSocio(dataSocio);

        // 2. Ora che abbiamo il socio, carichiamo la sua Sala con certezza matematica
        const { data: dataSala, error: errSala } = await supabase
          .from('sale')
          .select('id, name')
          .eq('id', dataSocio.sala_id)
          .single();

        if (errSala || !dataSala) throw new Error("Sala non trovata");
        setSala(dataSala);

        // 3. Trova i Tornei attivi per questa sala
        const { data: dataTornei } = await supabase
          .from('tornei')
          .select('*')
          .eq('sala_id', dataSala.id)
          .order('data_inizio', { ascending: false });

        if (dataTornei) setTornei(dataTornei);

        // 4. Trova i Post della Bacheca
        const { data: dataBacheca } = await supabase
          .from('bacheca')
          .select('*, reazioni_bacheca(*)')
          .eq('sala_id', dataSala.id)
          .order('created_at', { ascending: false });

        if (dataBacheca) setBacheca(dataBacheca);

      } catch (err) {
        console.error("Errore Accesso VIP:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (tokenSocio) {
      fetchData();
    }
  }, [tokenSocio]);

  // --- GESTIONE REAZIONI BACHECA ---
  const gestisciReazione = async (postId: string, emoji: string) => {
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
      console.error("Errore salvataggio reazione:", error);
    }
  };

  // --- LOGICA PRENOTAZIONE ---
  const inviaPrenotazione = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sala || !socio || !dataOra) {
      alert("Inserisci la data e l'ora di arrivo!");
      return;
    }

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
      console.error(error);
      alert("Errore durante la prenotazione.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGICA ISCRIZIONE TORNEO ---
  const richiediIscrizione = async (torneo: any) => {
    const giaIscritto = (torneo.iscritti || []).find((i: any) => i.id === socio.id);
    if (giaIscritto) {
      alert("Sei già nella lista degli iscritti per questo torneo!");
      return;
    }

    const conferma = confirm(`Vuoi inviare la richiesta di iscrizione per il torneo "${torneo.nome}"?`);
    if (!conferma) return;

    const nuovoIscritto = {
      id: socio.id,
      tipo: 'socio',
      nome: `${socio.cognome} ${socio.nome}`,
      confermato: false
    };

    const iscrittiAggiornati = [...(torneo.iscritti || []), nuovoIscritto];

    try {
      const { error } = await supabase
        .from('tornei')
        .update({ iscritti: iscrittiAggiornati })
        .eq('id', torneo.id);

      if (error) throw error;
      
      alert("✅ Richiesta di iscrizione inviata! Il gestore dovrà confermarla.");
      setTornei(tornei.map(t => t.id === torneo.id ? { ...t, iscritti: iscrittiAggiornati } : t));
    } catch (error) {
      console.error(error);
      alert("Errore durante l'iscrizione.");
    }
  };

  // --- SCHERMATE DI ERRORE O CARICAMENTO ---
  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-purple-500 font-black text-xl animate-pulse tracking-widest uppercase">Accesso VIP in corso...</div>;
  }

  if (!sala || !socio) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h1 className="text-3xl font-black text-white uppercase mb-2">Accesso Negato</h1>
        <p className="text-gray-400">Il link non è valido, è scaduto o la tessera è stata bloccata.</p>
      </div>
    );
  }

  // --- APP PRINCIPALE ---
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans tracking-tighter pb-24 relative overflow-x-hidden selection:bg-purple-500/30">
      
      {/* Sfondo Astratto */}
      <div className="fixed top-[-20%] left-[-10%] w-[70%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none"></div>

      {/* HEADER */}
      <div className="pt-8 px-6 pb-4 relative z-10 flex justify-between items-end">
        <div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-1">{sala.name}</p>
          <h1 className="text-3xl font-black italic uppercase text-white">Ciao, {socio.nome}!</h1>
        </div>
        <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(147,51,234,0.4)] border-2 border-purple-400/50">
          <span className="text-xl font-black">{socio.nome.charAt(0)}{socio.cognome.charAt(0)}</span>
        </div>
      </div>

      <div className="px-6 relative z-10">
        
        {/* TAB 1: HOME (Tessera) */}
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* TESSERA DIGITALE */}
            <div className="mt-4 bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-600/20 rounded-full blur-xl"></div>
              
              <div className="flex justify-between items-start mb-8">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tessera VIP</p>
                <p className="text-purple-400 font-mono text-[10px] tracking-widest">ID: {socio.id.split('-')[0]}</p>
              </div>

              <div className="mb-2">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Credito Disponibile</p>
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 italic drop-shadow-sm">
                  € {parseFloat(socio.credito || 0).toFixed(2)}
                </h2>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              <button onClick={() => setActiveTab('bacheca')} className="bg-orange-950/40 border border-orange-900/50 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-orange-900/40 transition-all active:scale-95 shadow-lg">
                <span className="text-2xl">📢</span>
                <span className="font-black uppercase text-[10px] tracking-widest text-orange-400">News</span>
              </button>
              <button onClick={() => setActiveTab('prenota')} className="bg-gray-900 border border-gray-800 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg">
                <span className="text-2xl">📅</span>
                <span className="font-black uppercase text-[10px] tracking-widest text-gray-300">Prenota</span>
              </button>
              <button onClick={() => setActiveTab('tornei')} className="bg-gray-900 border border-gray-800 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg">
                <span className="text-2xl">🏆</span>
                <span className="font-black uppercase text-[10px] tracking-widest text-gray-300">Tornei</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: BACHECA / NEWS */}
        {activeTab === 'bacheca' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-xl font-black uppercase text-orange-500 mb-6 tracking-widest italic">Avvisi in Sala</h2>
            
            {bacheca.length === 0 ? (
              <div className="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 text-center shadow-lg">
                <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Nessuna comunicazione al momento.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {bacheca.map((post) => {
                  const reazioni = post.reazioni_bacheca || [];
                  const miaReazione = reazioni.find((r: any) => r.socio_id === socio.id)?.tipo;
                  
                  const conteggio = reazioni.reduce((acc: any, curr: any) => { 
                    acc[curr.tipo] = (acc[curr.tipo] || 0) + 1; 
                    return acc; 
                  }, {});

                  return (
                    <div key={post.id} className="bg-gray-900 border border-gray-800 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">
                        🗓️ {new Date(post.created_at).toLocaleDateString()} - {new Date(post.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                      
                      <p className="text-lg text-white whitespace-pre-wrap mb-6 font-medium leading-relaxed">
                        {post.testo}
                      </p>
                      
                      {/* BARRA DELLE REAZIONI */}
                      <div className="flex flex-wrap gap-3 border-t border-gray-800 pt-4">
                        {['👍', '❤️', '🔥', '👏', '😂'].map(emoji => {
                          const isSelected = miaReazione === emoji;
                          return (
                            <button 
                              key={emoji}
                              onClick={() => gestisciReazione(post.id, emoji)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all active:scale-90 border-2 ${isSelected ? 'bg-orange-900/30 border-orange-500 text-white' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}`}
                            >
                              <span className={isSelected ? 'scale-110 transition-transform' : ''}>{emoji}</span>
                              <span className={`font-black ${isSelected ? 'text-orange-400' : ''}`}>{conteggio[emoji] || 0}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-950/95 backdrop-blur-md border-t border-gray-800 px-2 py-4 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${activeTab === 'home' ? 'text-purple-400' : 'text-gray-600 hover:text-gray-300'}`}>
          <span className="text-2xl">💳</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('bacheca')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${activeTab === 'bacheca' ? 'text-orange-500' : 'text-gray-600 hover:text-gray-300'}`}>
          <span className="text-2xl">📢</span>
          <span className="text-[9px] font-black uppercase tracking-widest">News</span>
        </button>
        <button onClick={() => setActiveTab('tornei')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${activeTab === 'tornei' ? 'text-purple-400' : 'text-gray-600 hover:text-gray-300'}`}>
          <span className="text-2xl">🏆</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Tornei</span>
        </button>
        <button onClick={() => setActiveTab('prenota')} className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${activeTab === 'prenota' ? 'text-purple-400' : 'text-gray-600 hover:text-gray-300'}`}>
          <span className="text-2xl">📅</span>
          <span className="text-[9px] font-black uppercase tracking-widest">Prenota</span>
        </button>
      </div>

    </div>
  );
}