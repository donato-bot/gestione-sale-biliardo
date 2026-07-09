"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useParams } from "next/navigation";
import PlanciaCassaManager from "../../../components/PlanciaCassaManager";
import TabelloneTavoliManager from "../../../components/TabelloneTavoliManager";

export default function DashboardPage() {
  const router = useRouter();
  const urlParams = useParams();
  
  const salaId = (urlParams?.sala || Object.values(urlParams)[0]) as string | undefined;

  const [nomeSala, setNomeSala] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [chiaveRinfrescoCassa, setChiaveRinfrescoCassa] = useState(0);

  const forzaRinfrescoCassa = () => {
    setChiaveRinfrescoCassa(prev => prev + 1);
  };

  useEffect(() => {
    async function inizializzaDashboard() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const email = session.user.email || "";
        setUserEmail(email.toLowerCase());

        if (!salaId) {
          setLoading(false);
          return;
        }

        const { data: salaData, error: salaError } = await supabase
          .from("sale")
          .select("name")
          .eq("id", salaId)
          .single();

        if (!salaError && salaData) {
          setNomeSala(salaData.name);
        }
      } catch (err) {
        console.error("Errore di inizializzazione:", err);
      } finally {
        setLoading(false);
      }
    }

    inizializzaDashboard();
  }, [salaId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-cyan-500 font-black animate-pulse tracking-widest uppercase text-xs">
          Sincronizzazione Plancia...
        </p>
      </div>
    );
  }

  if (!salaId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase text-xs tracking-widest p-4 text-center">
        🛑 ID Sala non valido.
      </div>
    );
  }

  const isSuperAdmin = userEmail === "donatorzz1946@gmail.com";

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 sm:p-8 md:p-12 font-sans">
      <div className="w-full max-w-[1400px] mx-auto space-y-12">
        
        {/* INTESTAZIONE */}
        <div className="flex justify-between items-center border-b border-gray-800 pb-6">
          <div>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider">
              {isSuperAdmin ? "Sala Campione (Super Admin)" : "Plancia Gestore"}
            </span>
            <h1 className="text-4xl font-black uppercase tracking-tight text-white italic mt-2">
              {nomeSala || "PLANCIA DI COMANDO"}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="bg-cyan-600 hover:bg-cyan-500 text-black font-black px-6 py-2.5 rounded-xl uppercase tracking-widest text-xs transition-all"
              >
                🚀 Torre di Controllo
              </button>
            )}
            
            <button 
              type="button" 
              onClick={() => supabase.auth.signOut().then(() => router.push("/login"))} 
              className="bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-white font-black px-6 py-2.5 rounded-xl uppercase tracking-widest text-xs transition-all"
            >
              Esci
            </button>
          </div>
        </div>

        {/* TABELLONE TAVOLI */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
            🎱 CONTROLLO UTENZE E TAVOLI DA GIOCO
          </h2>
          <TabelloneTavoliManager salaId={salaId} onMovimentoRegistrato={forzaRinfrescoCassa} />
        </div>

        {/* LIBRO MASTRO */}
        <div className="border-t border-gray-900 pt-8 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500">
            📊 RENDICONTAZIONE E LIBRO MASTRO
          </h2>
          <PlanciaCassaManager key={chiaveRinfrescoCassa} salaId={salaId} />
        </div>

      </div>
    </div>
  );
}