"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useParams } from 'next/navigation';
import BachecaSocio from "../../../../components/BachecaSocio"; 

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SocioPage() {
  const params = useParams();
  const salaId = (params?.sala || Object.values(params)[0]) as string;

  const [email, setEmail] = useState("");
  const [socio, setSocio] = useState<any>(null);
  const [tavoli, setTavoli] = useState<any[]>([]);
  const [miePrenotazioni, setMiePrenotazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"login" | "dashboard" | "prenota">("login");
  const [selectedTable, setSelectedTable] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  useEffect(() => {
    async function fetchTavoli() {
      if (!salaId) return; 

      const { data, error } = await supabase
        .from('tavoli')
        .select('*')
        .eq('sala_id', salaId) 
        .order('numero_tavolo', { ascending: true });
        
      if (error) console.error("Errore lettura tavoli AppWeb:", error.message);
      if (data) setTavoli(data);
    }
    fetchTavoli();
  }, [salaId]);

  // Nuova funzione per caricare lo storico prenotazioni del socio
  const caricaLeMiePrenotazioni = async (socioData: any) => {
    const nomeCompleto = `${socioData.cognome} ${socioData.nome}`;
    const { data, error } = await supabase
      .from('prenotazioni')
      .select('*')
      .eq('sala_id', socioData.sala_id)
      .eq('nome_cliente', nomeCompleto)
      .order('data_ora', { ascending: false })
      .limit(5); // Mostriamo le ultime 5
      
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
      await caricaLeMiePrenotazioni(data); // Carichiamo le prenotazioni appena fatto il login
      setView("dashboard");
    }
    setLoading(false);
  };

  const confermaPrenotazione = async () => {
    if (!selectedTable || !bookingTime) { 
      alert("Seleziona tavolo e orario (Giorno e Ora)!"); 
      return; 
    }
    setLoading(true);
    
    const tavoloObj = tavoli.find(t => t.id === selectedTable);
    const nomeTavoloScelto = tavoloObj ? `Tavolo ${tavoloObj.numero_tavolo || tavoloObj.nome_tavolo || ''}` : "Tavolo Generico";

    const emailGestore = socio.manager_email || (tavoloObj ? tavoloObj.manager_email : null);

    const { error } = await supabase
      .from('prenotazioni')
      .insert([{
        sala_id: socio.sala_id,
        manager_email: emailGestore, 
        nome_cliente: `${socio.cognome} ${socio.nome}`,
        tavolo_numero: nomeTavoloScelto,
        data_ora: new Date(bookingTime).toISOString(),
        note: "[APP SOCI] Prenotazione inviata automaticamente da smartphone."
      }]);

    if (error) {
      alert("ERRORE DATABASE (Prenotazione): " + error.message);
    } else {
      alert("✅ Prenotazione confermata!");
      await caricaLeMiePrenotazioni(socio); // Aggiorniamo la lista in tempo reale
      setView("dashboard");
      setBookingTime(""); 
      setSelectedTable(""); 
    }
    setLoading(false);
  };

  if (view === "login") return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-black text-green-500 mb-8 italic">Biliardo Royal</h1>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="La tua Email" className="w-full bg-gray-900 p-5 rounded-2xl mb-4 text-center outline-none focus:border focus:border-green-500 font-bold" />
        <button onClick={loginSocio} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 py-5 rounded-2xl font-black transition-colors">
          {loading ? "VERIFICA IN CORSO..." : "ACCEDI"}
        </button>
      </div>
    </div>
  );

  if (view === "dashboard") return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic text-white">Ciao, <span className="text-green-500">{socio.nome}</span>!</h2>
            <button onClick={() => {setView("login"); setEmail("");}} className="text-xs font-bold uppercase text-gray-500 hover:text-white">Esci</button>
        </div>
        
        <div className="bg-gray-900 rounded-[2.5rem] p-8 border-2 border-green-600/30 shadow-[0_0_30px_rgba(34,197,94,0.1)] mb-8">
            <p className="text-green-500 text-xs font-bold uppercase tracking-widest mb-2">Il tuo Credito</p>
            <p className="text-6xl font-black text-white">€ {parseFloat(socio.credito || 0).toFixed(2)}</p>
        </div>

        {/* SEZIONE: LE MIE PRENOTAZIONI */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-[2rem] p-6 mb-8 shadow-inner">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8B5CF6]"></span>
            Le Mie Prenotazioni
          </h3>
          
          {miePrenotazioni.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Nessuna prenotazione recente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {miePrenotazioni.map((p) => {
                 const dataPrenotazione = new Date(p.data_ora);
                 const isPassata = dataPrenotazione < new Date();
                 
                 return (
                   <div key={p.id} className="bg-black border border-gray-800 p-4 rounded-2xl flex justify-between items-center">
                     <div>
                       <p className="text-white font-black uppercase text-xs">{p.tavolo_numero}</p>
                       <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">
                         {dataPrenotazione.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                       </p>
                     </div>
                     <div>
                       {isPassata ? (
                         <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Conclusa</span>
                       ) : (
                         <span className="bg-green-600/20 text-green-500 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">Confermata</span>
                       )}
                     </div>
                   </div>
                 )
              })}
            </div>
          )}
        </div>

        {socio && <BachecaSocio salaId={socio.sala_id} socioId={socio.id} />}

        <button onClick={() => setView("prenota")} className="w-full bg-white text-black hover:bg-gray-200 transition-colors font-black py-6 rounded-3xl mt-8 shadow-lg uppercase tracking-widest text-sm">
          📅 PRENOTA TAVOLO
        </button>
      </div>
    </div>
  );

  if (view === "prenota") return (
    <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-sm mx-auto">
            <button onClick={() => setView("dashboard")} className="mb-8 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest">← Indietro</button>
            <h2 className="text-3xl font-black uppercase mb-8 italic">Scegli sessione</h2>
            
            <div className="mb-6">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-3 block">Seleziona il Tavolo</label>
              <div className="grid grid-cols-2 gap-3">
                {tavoli.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTable(t.id)}
                    disabled={t.stato === 'manutenzione'}
                    className={`p-4 rounded-2xl font-black uppercase text-xs transition-all border-2 ${
                      selectedTable === t.id
                        ? 'bg-green-600 border-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                        : t.stato === 'manutenzione'
                        ? 'bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-900 border-gray-800 text-white hover:border-gray-600'
                    }`}
                  >
                    Tavolo {t.numero_tavolo || t.nome_tavolo}
                    {t.stato === 'manutenzione' && <span className="block text-[9px] mt-1 text-red-500 tracking-widest">Manutenzione</span>}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-8">
              <label className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-3 block">Data e Ora</label>
              <input 
                type="datetime-local" 
                value={bookingTime} 
                onChange={(e) => setBookingTime(e.target.value)} 
                className="w-full bg-gray-900 text-white font-bold p-5 rounded-2xl outline-none border-2 border-gray-800 focus:border-green-500 cursor-pointer" 
                style={{ colorScheme: 'dark' }}
              />
            </div>
            
            <button onClick={confermaPrenotazione} disabled={loading || !selectedTable || !bookingTime} className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-500 py-6 rounded-3xl font-black uppercase tracking-widest transition-colors shadow-lg">
              {loading ? "ELABORAZIONE..." : "CONFERMA"}
            </button>
        </div>
    </div>
  );

  return null;
}