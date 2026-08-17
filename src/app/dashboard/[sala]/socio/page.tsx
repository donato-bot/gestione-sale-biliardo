// ==========================================
// FILE: src/app/dashboard/[sala]/socio/page.tsx
// OBIETTIVO: App Web per i Giocatori (Flusso di prenotazione ultra-rapido)
// ==========================================
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase"; 
import { useParams } from 'next/navigation';
import BachecaSocio from "../../../../components/BachecaSocio"; 

export default function SocioPage() {
  const params = useParams();
  const salaId = (params?.sala || Object.values(params)[0]) as string;

  const [nomeSala, setNomeSala] = useState("CARICAMENTO...");
  const [email, setEmail] = useState("");
  const [socio, setSocio] = useState<any>(null);
  const [miePrenotazioni, setMiePrenotazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "dashboard" | "prenota">("login");
  
  // Stati per la prenotazione semplificata
  const [bookingTime, setBookingTime] = useState("");
  const [noteCliente, setNoteCliente] = useState("");

  useEffect(() => {
    async function fetchDatiIniziali() {
      if (!salaId) return; 

      const { data: salaData, error: salaError } = await supabase
        .from('sale')
        .select('name')
        .eq('id', salaId)
        .single();
        
      if (!salaError && salaData) {
        setNomeSala(salaData.name.toUpperCase());
      } else {
        setNomeSala("IL TUO CLUB");
      }
    }
    
    fetchDatiIniziali();
  }, [salaId]);

  const caricaLeMiePrenotazioni = async (socioData: any) => {
    const nomeCompleto = `${socioData.cognome} ${socioData.nome}`;
    const { data, error } = await supabase
      .from('prenotazioni')
      .select('*')
      .eq('sala_id', socioData.sala_id)
      .eq('nome_cliente', nomeCompleto)
      .order('data_ora', { ascending: false })
      .limit(5); 
      
    if (data) {
      setMiePrenotazioni(data);
    }
  };

  const loginSocio = async () => {
    if (!email.trim()) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('soci')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error || !data) {
      alert("❌ Email non trovata. Assicurati di essere registrato al Club.");
    } else {
      setSocio(data);
      await caricaLeMiePrenotazioni(data); 
      setView("dashboard");
    }
    setLoading(false);
  };

  const confermaPrenotazione = async () => {
    if (!bookingTime) { 
      alert("Seleziona la Data e l'Ora della prenotazione!"); 
      return; 
    }
    setLoading(true);
    
    // Il tavolo è sempre "Qualsiasi" di default. Gestore e id li prendiamo dal socio
    const nomeTavoloScelto = "Qualsiasi Tavolo";
    const emailGestore = socio.manager_email;

    const notaFinale = noteCliente.trim() 
      ? `[APP SOCI] Nota Cliente: ${noteCliente.trim()}` 
      : "[APP SOCI] Prenotazione rapida da smartphone.";

    const { error } = await supabase
      .from('prenotazioni')
      .insert([{
        sala_id: socio.sala_id,
        manager_email: emailGestore, 
        nome_cliente: `${socio.cognome} ${socio.nome}`,
        tavolo_numero: nomeTavoloScelto,
        data_ora: new Date(bookingTime).toISOString(),
        note: notaFinale
      }]);

    if (error) {
      alert("ERRORE DATABASE (Prenotazione): " + error.message);
    } else {
      alert("✅ Prenotazione confermata con successo!");
      await caricaLeMiePrenotazioni(socio); 
      setView("dashboard");
      
      setBookingTime(""); 
      setNoteCliente("");
    }
    setLoading(false);
  };

  if (view === "login") return (
    <div className="min-h-screen bg-neutral-950 sm:p-8 md:p-12 flex justify-center items-center">
      <div className="w-full max-w-md bg-black sm:border-2 border-gray-800 sm:rounded-[3rem] sm:shadow-[0_0_60px_rgba(34,197,94,0.15)] min-h-screen sm:min-h-[800px] flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="w-full text-center">
          <h1 className="text-4xl md:text-5xl font-black text-green-500 mb-10 italic drop-shadow-[0_0_15px_rgba(34,197,94,0.4)] leading-tight">
            {nomeSala}
          </h1>
          
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="La tua Email" className="w-full bg-gray-900 border border-gray-700 p-5 rounded-2xl mb-6 text-center outline-none focus:border-green-500 font-bold text-white shadow-inner" />
          <button onClick={loginSocio} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 py-5 rounded-2xl font-black text-black transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            {loading ? "VERIFICA IN CORSO..." : "ACCEDI ALLA PLANCIA"}
          </button>
        </div>
      </div>
    </div>
  );

  if (view === "dashboard") return (
    <div className="min-h-screen bg-neutral-950 sm:p-8 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-md bg-black sm:border-2 border-gray-800 sm:rounded-[3rem] sm:shadow-[0_0_60px_rgba(34,197,94,0.15)] min-h-screen sm:min-h-[850px] flex flex-col p-6 relative overflow-hidden">
        
        <div className="flex justify-between items-center mb-8 pt-4">
            <h2 className="text-3xl font-black italic text-white">Ciao, <span className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">{socio.nome}</span>!</h2>
            <button onClick={() => {setView("login"); setEmail("");}} className="text-[10px] font-black uppercase text-gray-500 hover:text-white bg-gray-900 px-3 py-2 rounded-lg">Esci</button>
        </div>
        
        <div className="bg-gray-900 rounded-[2rem] p-8 border border-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">Il tuo Credito</p>
            <p className="text-6xl font-black text-white relative z-10 drop-shadow-md">€ {parseFloat(socio.credito || 0).toFixed(2)}</p>
        </div>

        {/* SEZIONE: LE MIE PRENOTAZIONI */}
        <div className="bg-gray-900 rounded-[2rem] p-6 border border-gray-700 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-6">
          <h3 className="text-xs font-black text-white uppercase tracking-widest mb-5 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]"></span>
            Le Mie Prenotazioni
          </h3>
          
          {miePrenotazioni.length === 0 ? (
            <div className="text-center py-6 bg-black/30 rounded-xl border border-gray-800">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Nessuna prenotazione recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {miePrenotazioni.map((p) => {
                 const dataPrenotazione = new Date(p.data_ora);
                 const isPassata = dataPrenotazione < new Date();
                 
                 return (
                   <div key={p.id} className="bg-black border border-gray-700 p-4 rounded-2xl flex justify-between items-center shadow-md">
                     <div>
                       <p className="text-white font-black uppercase text-sm">Sessione Biliardo</p>
                       <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">
                         {dataPrenotazione.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                       </p>
                     </div>
                     <div>
                       {isPassata ? (
                         <span className="bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">Conclusa</span>
                       ) : (
                         <span className="bg-green-600/20 text-green-400 border border-green-600/30 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.1)]">Confermata</span>
                       )}
                     </div>
                   </div>
                 )
              })}
            </div>
          )}
        </div>

        {/* COMPONENTE BACHECA */}
        {socio && <BachecaSocio salaId={socio.sala_id} socioId={socio.id} />}

        <div className="mt-auto pt-6">
          <button onClick={() => setView("prenota")} className="w-full bg-white text-black hover:bg-gray-200 transition-all font-black py-5 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] uppercase tracking-widest text-sm flex justify-center items-center gap-2">
            <span className="text-lg">📅</span> PRENOTA TAVOLO
          </button>
        </div>
      </div>
    </div>
  );

  if (view === "prenota") return (
    <div className="min-h-screen bg-neutral-950 sm:p-8 md:p-12 flex justify-center items-start">
      <div className="w-full max-w-md bg-black sm:border-2 border-gray-800 sm:rounded-[3rem] sm:shadow-[0_0_60px_rgba(34,197,94,0.15)] min-h-screen sm:min-h-[850px] flex flex-col p-6 relative overflow-hidden">
            <button onClick={() => setView("dashboard")} className="mb-6 self-start text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-lg">← Torna alla Plancia</button>
            <h2 className="text-4xl font-black uppercase mb-8 italic text-white drop-shadow-md">Scegli sessione</h2>
            
            <div className="mb-6 mt-4">
              <label className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-3 block">1. Data e Ora d'arrivo</label>
              <input 
                type="datetime-local" 
                value={bookingTime} 
                onChange={(e) => setBookingTime(e.target.value)} 
                className="w-full bg-gray-900 text-white font-bold p-5 rounded-2xl outline-none border border-gray-700 focus:border-green-500 cursor-pointer shadow-inner" 
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div className="mb-8">
              <label className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-3 block">2. Note (Opzionale)</label>
              <textarea 
                value={noteCliente} 
                onChange={(e) => setNoteCliente(e.target.value)} 
                placeholder="Es. Preferirei il Tavolo 3, arriviamo in 4 persone..."
                rows={3}
                className="w-full bg-gray-900 text-white font-bold p-5 rounded-2xl outline-none border border-gray-700 focus:border-green-500 shadow-inner resize-none text-sm placeholder-gray-600"
              />
            </div>
            
            <div className="mt-auto pt-2">
              <button onClick={confermaPrenotazione} disabled={loading || !bookingTime} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:border-gray-800 disabled:text-gray-500 border border-green-400 py-6 rounded-2xl font-black text-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                {loading ? "ELABORAZIONE..." : "CONFERMA PRENOTAZIONE"}
              </button>
            </div>
        </div>
    </div>
  );

  return null;
}