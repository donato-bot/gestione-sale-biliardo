"use client";

import { useEffect, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function TorreDiControllo() {
  const [sale, setSale] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchSale() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email!);

      // Se sei l'admin, vedi tutte le sale. Se sei un gestore, vedi solo la tua.
      const { data } = await supabase.from("sale").select("*");
      if (data) setSale(data);
      setLoading(false);
    }
    fetchSale();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 animate-pulse font-black">CARICAMENTO TORRE DI CONTROLLO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b-2 border-green-900 pb-8">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter text-green-500">TORRE DI CONTROLLO</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2">Bentornato, {userEmail}</p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
            className="bg-red-950 text-red-500 px-6 py-2 rounded-xl font-black border border-red-900 hover:bg-red-500 hover:text-white transition-all"
          >
            LOGOUT
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sale.map((sala) => (
            <div 
              key={sala.id} 
              className={`relative group bg-gray-900 rounded-[2.5rem] p-8 border-2 transition-all cursor-pointer overflow-hidden ${sala.is_active ? 'border-gray-800 hover:border-green-500' : 'border-red-900 opacity-60'}`}
              onClick={() => sala.is_active && router.push(`/dashboard/${sala.id}`)}
            >
              {!sala.is_active && (
                <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center z-10">
                  <span className="bg-red-600 text-white px-4 py-1 rounded-full font-black text-xs uppercase tracking-tighter">Account Sospeso</span>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div className="text-5xl">🏢</div>
                <div className={`h-3 w-3 rounded-full ${sala.is_active ? 'bg-green-500' : 'bg-red-600 shadow-[0_0_10px_red]'}`}></div>
              </div>

              <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">{sala.name}</h2>
              <p className="text-gray-500 text-xs font-bold uppercase mb-6">{sala.manager_email}</p>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-black/50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Tariffa Std</p>
                  <p className="text-xl font-black text-green-500">€{sala.tariffa_standard}</p>
                </div>
                <div className="flex-1 bg-black/50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Tariffa Soci</p>
                  <p className="text-xl font-black text-yellow-500">€{sala.tariffa_soci}</p>
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center">
                <span className="text-green-500 font-black group-hover:translate-x-2 transition-transform">ENTRA →</span>
                {userEmail === 'donatorzz1946@gmail.com' && (
                   <span className="text-[10px] bg-gray-800 px-3 py-1 rounded-full text-gray-400 font-black">ID: {sala.id.slice(0,8)}</span>
                )}
              </div>
            </div>
          ))}

          {/* BOX AGGIUNGI SALA (Solo per te) */}
          {userEmail === 'donatorzz1946@gmail.com' && (
            <button 
              onClick={() => alert("Funzionalità Creazione Sala: In arrivo nel prossimo modulo!")}
              className="bg-black border-4 border-dashed border-gray-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-gray-600 hover:border-green-900 hover:text-green-900 transition-all"
            >
              <span className="text-6xl mb-4">+</span>
              <span className="font-black uppercase italic text-xl">Nuova Affiliazione</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}