"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useRouter } from "next/navigation";

// MODULI CABLATI E ATTIVI (SETTE MOTORI ACCESI)
import Plancia from "../../../components/Plancia";
import Cassa from "../../../components/Cassa"; 
import Magazzino from "../../../components/Magazzino"; 
import Soci from "../../../components/Soci"; 
import Staff from "../../../components/Staff"; 
import Tariffe from "../../../components/Tariffe"; 
import Prenotazioni from "../../../components/Prenotazioni"; // <-- COLLEGAMENTO PRENOTAZIONI ATTIVATO

// Moduli in attesa di collaudo futuro
// import Tornei from "../../../components/Tornei";
// import Bacheca from "../../../components/Bacheca";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function DashboardSala() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("menu");
  const [sala, setSala] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      
      const { data: salaData } = await supabase
        .from("sale")
        .select("*")
        .eq("manager_email", session.user.email)
        .single();
        
      if (salaData) {
        setSala(salaData);
        setUserRole(salaData.manager_email === session.user.email ? 'gestore' : 'staff');
      }
      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-emerald-500 font-black text-2xl animate-pulse">CARICAMENTO TORRE DI CONTROLLO...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* TASTO INDIETRO */}
      {activeView !== "menu" && (
        <button onClick={() => setActiveView("menu")} className="mb-6 bg-red-900/50 hover:bg-red-800 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-all">
          ← TORNA AL MENU PRINCIPALE
        </button>
      )}

      {/* MENU PRINCIPALE */}
      {activeView === "menu" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <MenuButton icon="🎱" label="Plancia" onClick={() => setActiveView("plancia")} />
          <MenuButton icon="📦" label="Magazzino" onClick={() => setActiveView("magazzino")} />
          <MenuButton icon="👥" label="Soci" onClick={() => setActiveView("soci")} />
          <MenuButton icon="💰" label="Cassa" onClick={() => setActiveView("cassa")} />
          <MenuButton icon="🧑‍🍳" label="Staff" onClick={() => setActiveView("staff")} />
          <MenuButton icon="⚙️" label="Tariffe" onClick={() => setActiveView("tariffe")} />
          <MenuButton icon="📅" label="Prenotazioni" onClick={() => setActiveView("prenotazioni")} />
          <MenuButton icon="🏆" label="Tornei" onClick={() => setActiveView("tornei")} />
          <MenuButton icon="📢" label="Bacheca" onClick={() => setActiveView("bacheca")} />
          <button onClick={() => router.push('/login')} className="col-span-1 md:col-span-4 h-20 bg-red-950 border border-red-700 rounded-3xl flex items-center justify-center text-red-500 font-black uppercase tracking-widest hover:bg-red-900 transition-all">
            ESCI DAL SISTEMA
          </button>
        </div>
      )}

      {/* MODULI ATTIVI E COLLAUDATI */}
      {activeView === "plancia" && sala && <Plancia salaId={sala.id} userRole={userRole} />}
      {activeView === "cassa" && sala && <Cassa salaId={sala.id} />}
      {activeView === "magazzino" && sala && <Magazzino salaId={sala.id} />}
      {activeView === "soci" && sala && <Soci salaId={sala.id} />}
      {activeView === "staff" && sala && <Staff salaId={sala.id} />} 
      {activeView === "tariffe" && sala && <Tariffe salaId={sala.id} />} 
      {activeView === "prenotazioni" && sala && <Prenotazioni salaId={sala.id} />} 
      
      {/* Avviso per i moduli non ancora attivati */}
      {activeView !== "menu" && activeView !== "plancia" && activeView !== "cassa" && activeView !== "magazzino" && activeView !== "soci" && activeView !== "staff" && activeView !== "tariffe" && activeView !== "prenotazioni" && (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-800 rounded-3xl text-gray-500 font-black uppercase tracking-widest">
          MODULO IN FASE DI COLLAUDO...
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="h-40 bg-[#11131a] border border-gray-800 rounded-3xl flex flex-col items-center justify-center hover:border-cyan-500 transition-all hover:scale-105">
      <span className="text-4xl mb-3">{icon}</span>
      <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}