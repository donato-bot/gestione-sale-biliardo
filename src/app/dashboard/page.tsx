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

  const SUPER_ADMIN = "donatorzz1946@gmail.com";

  useEffect(() => {
    async function fetchSale() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email!);

      const { data } = await supabase.from("sale").select("*");
      if (data) setSale(data);
      setLoading(false);
    }
    fetchSale();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-black animate-pulse uppercase italic">Inizializzazione Sistemi...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-12 border-b-2 border-green-900/30 pb-8">
          <div>
            <h1 className="text-6xl font-black italic tracking-tighter text-green-500">TORRE DI CONTROLLO</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mt-2 italic">
              Operatore: {userEmail === SUPER_ADMIN ? "SUPER VISORE" : "GESTORE SALA"}
            </p>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push("/login"))}
            className="bg-red-950 text-red-500 px-6 py-2 rounded-xl font-black border border-red-900 hover:bg-red-500 hover:text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            LOGOUT
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {sale.map((sala) => {
            const isOwner = userEmail === sala.manager_email;
            // Regola di accesso: sei il proprietario OPPURE sei l'admin e l'assistenza è attiva
            const canAccess = isOwner || (userEmail === SUPER_ADMIN && sala.support_active);

            return (
              <div 
                key={sala.id} 
                className={`relative group bg-gray-900 rounded-[2.5rem] p-8 border-2 transition-all overflow-hidden ${canAccess ? 'border-gray-800 hover:border-green-500 cursor-pointer shadow-lg' : 'border-red-900/50 opacity-80 cursor-not-allowed'}`}
                onClick={() => canAccess && router.push(`/dashboard/${sala.id}`)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="text-5xl">{sala.is_active ? '🏢' : '🚫'}</div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`h-3 w-3 rounded-full ${sala.is_active ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-600 shadow-[0_0_10px_#dc2626]'}`}></div>
                    {userEmail === SUPER_ADMIN && !isOwner && (
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full ${sala.support_active ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                        {sala.support_active ? "🔓 ACCESSO OK" : "🔒 PROTETTO"}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-3xl font-black uppercase italic mb-1 tracking-tighter">{sala.name}</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase mb-6 truncate max-w-[200px]">{sala.manager_email}</p>
                
                <div className="mt-8 flex justify-between items-center">
                  <span className={`font-black uppercase italic text-sm transition-transform ${canAccess ? 'text-green-500 group-hover:translate-x-2' : 'text-red-900'}`}>
                    {canAccess ? "Entra nel sistema →" : "Accesso Riservato"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}