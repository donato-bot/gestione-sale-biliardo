"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js'; 
import { useRouter } from "next/navigation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TorreDiControllo() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sale, setSale] = useState<any[]>([]);
  
  // Stati Modale Nuova Sala
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nomeSala, setNomeSala] = useState("");
  const [managerEmail, setManagerEmail] = useState("");

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      // Controllo di Sicurezza Assoluto: Solo tu puoi stare qui
      if (!session || session.user.email !== 'donatorzz1946@gmail.com') {
        router.push('/login');
        return;
      }
      
      setUserEmail(session.user.email);
      await caricaSale();
      setLoading(false);
    }
    init();
  }, [router]);

  async function caricaSale() {
    const { data, error } = await supabase
      .from('sale')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setSale(data);
    if (error) console.error("Errore nel caricamento sale:", error);
  }

  const handleCreaSala = async () => {
    if (!nomeSala || !managerEmail) return;

    const { error } = await supabase
      .from('sale')
      .insert([
        { 
          name: nomeSala, 
          manager_email: managerEmail, 
          scadenza_contributo: '2026-12-31', // Data fittizia di default
          is_active: true 
        }
      ]);

    if (!error) {
      await caricaSale();
      setIsModalOpen(false);
      setNomeSala("");
      setManagerEmail("");
    } else {
      alert("Errore durante la creazione: " + error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-black text-2xl uppercase tracking-widest">Accesso Rete Globale...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans tracking-tighter">
      
      {/* HEADER SUPER ADMIN */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 bg-red-950/30 p-8 rounded-[3rem] border-4 border-red-900 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
        <div className="text-center md:text-left mb-6 md:mb-0">
          <h1 className="text-5xl font-black text-red-500 uppercase italic tracking-tighter mb-2">Torre di Controllo</h1>
          <p className="text-gray-400 font-mono text-sm uppercase tracking-widest">Autorizzazione di Livello Massimo: <span className="text-white">{userEmail}</span></p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-red-600 hover:bg-red-500 text-white font-black px-8 py-6 rounded-3xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-lg">
            + VARA NUOVA SALA
          </button>
          <button onClick={logout} className="bg-gray-900 border-2 border-red-900 text-red-500 font-black px-8 py-6 rounded-3xl hover:bg-red-950 transition-all active:scale-95 uppercase">
            Esci
          </button>
        </div>
      </div>

      {/* GRIGLIA DELLE SALE GESTITE */}
      <h2 className="text-2xl font-black text-gray-500 uppercase tracking-[0.2em] mb-8 ml-4">Flotta Attiva ({sale.length})</h2>
      
      {sale.length === 0 ? (
        <div className="text-center p-20 border-4 border-dashed border-gray-800 rounded-[3rem]">
          <p className="text-gray-500 font-black text-2xl uppercase">Nessuna sala attiva.</p>
          <p className="text-gray-600 mt-4 font-bold">Inizia varando la tua prima sala biliardo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sale.map((s) => (
            <div key={s.id} className="bg-gray-900 p-10 rounded-[3rem] border-2 border-gray-800 hover:border-red-600 transition-colors relative overflow-hidden">
              <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-xs font-black tracking-widest uppercase ${s.is_active ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                {s.is_active ? 'ONLINE' : 'OFFLINE'}
              </div>
              
              <h3 className="text-4xl font-black text-white italic mb-4 mt-4">{s.name}</h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Gestore (Manager)</p>
                  <p className="text-xl font-bold text-blue-400 truncate">{s.manager_email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Codice Sala (ID)</p>
                  <p className="text-sm font-mono text-gray-400 truncate">{s.id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALE NUOVA SALA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50 backdrop-blur-xl">
          <div className="bg-gray-950 border-4 border-red-600 p-12 rounded-[3rem] w-full max-w-xl shadow-[0_0_100px_rgba(220,38,38,0.2)]">
            <h3 className="text-4xl font-black text-red-500 mb-8 uppercase italic tracking-tighter">Vara Nuova Sala</h3>
            
            <div className="space-y-8 mb-12">
              <div>
                <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Nome della Struttura</label>
                <input 
                  value={nomeSala} 
                  onChange={(e) => setNomeSala(e.target.value)} 
                  placeholder="Es. Biliardo Club Roma" 
                  className="w-full bg-black border-2 border-gray-800 p-6 rounded-3xl text-2xl text-white outline-none focus:border-red-500 transition-colors" 
                />
              </div>
              
              <div>
                <label className="text-gray-500 font-black uppercase text-xs tracking-widest ml-4 mb-2 block">Email del Gestore</label>
                <input 
                  type="email"
                  value={managerEmail} 
                  onChange={(e) => setManagerEmail(e.target.value)} 
                  placeholder="manager@email.it" 
                  className="w-full bg-black border-2 border-gray-800 p-6 rounded-3xl text-2xl text-white outline-none focus:border-red-500 transition-colors" 
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-6 text-gray-500 font-black uppercase text-lg hover:text-white transition-colors">
                Annulla
              </button>
              <button onClick={handleCreaSala} className="flex-[2] py-8 bg-red-600 rounded-3xl font-black uppercase tracking-widest text-2xl shadow-xl shadow-red-900/40 active:scale-95 transition-all">
                CREA E ATTIVA
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}