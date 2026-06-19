"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";
import Plancia from "../../../components/Plancia";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DashboardSala() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("hub"); // hub, plancia, configurazione
  const [sala, setSala] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      const { data: salaData } = await supabase
        .from("sale")
        .select("*")
        .eq("manager_email", session.user.email)
        .single();
        
      if (salaData) {
        setSala(salaData);
      }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500 font-black text-2xl animate-pulse">CARICAMENTO TORRE DI CONTROLLO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header Strategico */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 uppercase">
          {sala?.name || "IL CAMPIONE"}
        </h1>
        {activeView !== "hub" && (
          <button onClick={() => setActiveView("hub")} className="bg-gray-800 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-700 transition-all">
            ← TORNA ALL'HUB
          </button>
        )}
      </div>

      {/* HUB OPERATIVO (Torre di Controllo) */}
      {activeView === "hub" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-20">
          <button onClick={() => setActiveView("plancia")} className="h-40 bg-[#11131a] border border-green-600 rounded-3xl flex flex-col items-center justify-center hover:bg-gray-900 transition-all">
            <span className="text-4xl mb-2">🎱</span>
            <span className="text-xs font-black uppercase tracking-widest">Plancia Operativa</span>
          </button>
          
          <button onClick={() => setActiveView("configurazione")} className="h-40 bg-[#11131a] border border-cyan-500 rounded-3xl flex flex-col items-center justify-center hover:bg-gray-900 transition-all">
            <span className="text-4xl mb-2">🛠️</span>
            <span className="text-xs font-black uppercase tracking-widest">Configurazione</span>
          </button>

          <button onClick={() => router.push('/login')} className="h-40 bg-red-950/30 border border-red-700 rounded-3xl flex flex-col items-center justify-center hover:bg-red-900 transition-all">
            <span className="text-xs font-black uppercase tracking-widest text-red-500">Esci</span>
          </button>
        </div>
      )}

      {/* VISTE ATTIVE: La Plancia cambia "faccia" in base alla vista */}
      {activeView === "plancia" && sala && (
        <Plancia salaId={sala.id} viewMode="operativa" />
      )}
      
      {activeView === "configurazione" && sala && (
        <Plancia salaId={sala.id} viewMode="configurazione" />
      )}
    </div>
  );
}